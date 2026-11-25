import type { NearbyMap, TaxaMap, TaxonInfo, Candidate } from './rerank'
import { rerank } from './rerank'
import type { IdentifyHints } from './hints'

const BASE = 'https://api.inaturalist.org/v1'
const UA = 'hakkenmap/1.0'
const MIN_INTERVAL_MS = 1000
// 周辺種の取得に約1.6〜2秒かかるため、実在確認 (taxa) まで終えるには 3秒では足りない (eval 2026-11-23)
const TOTAL_TIMEOUT_MS = 5000
// taxa 確認の件数は残り時間で決まる (キャッシュ無しだと間隔の都合で約2件)。これは暴走防止の上限だけ
const MAX_TAXA_LOOKUPS = 5
// 残り時間がこれ未満なら新しい taxa 確認を始めない (間隔待ち + 応答時間の見込み)
const MIN_REMAINING_FOR_LOOKUP_MS = 1300
// リミッタの待ち行列上限 (実行中を含む)。超えたら iNat をスキップ
const MAX_QUEUE = 3
const MAX_NAME_LEN = 100

const DAY = 24 * 60 * 60 * 1000
const NEAR_TTL = DAY
const TAXA_TTL = 7 * DAY
const TAXA_NEG_TTL = 60 * 60 * 1000
// 上限根拠: nearby は1件あたり 100種 × (学名+和名+count) で約 20KB 程度 → 300件でも数MB。
// taxa は1件数百バイト。位置・月ごとにキーが増えるため、無制限にせず FIFO で上限だけ設ける。
// 注意: キャッシュとリミッタはプロセス内メモリ。単一プロセス前提 (複数インスタンス/サーバレスでは共有されない)
const MAX_CACHE = 300

type Entry<T> = { v: T; exp: number }
function cacheGet<T>(m: Map<string, Entry<T>>, k: string): Entry<T> | undefined {
  const e = m.get(k)
  if (!e) return undefined
  if (e.exp < Date.now()) {
    m.delete(k)
    return undefined
  }
  return e
}
function cacheSet<T>(m: Map<string, Entry<T>>, k: string, v: T, ttl: number) {
  if (m.size >= MAX_CACHE) {
    const first = m.keys().next().value
    if (first !== undefined) m.delete(first)
  }
  m.set(k, { v, exp: Date.now() + ttl })
}

const nearCache = new Map<string, Entry<NearbyMap>>()
const taxaCache = new Map<string, Entry<TaxonInfo | null>>()

// 直列キュー: 前回リクエスト完了から MIN_INTERVAL_MS 以上あける
let chain: Promise<unknown> = Promise.resolve()
let lastDone = 0
let pending = 0

class QueueFull extends Error {}

function limited<T>(fn: () => Promise<T>, signal: AbortSignal): Promise<T> {
  // 待ちが多いときは並ばず即スキップ (全ユーザー共有のため、遅延の連鎖を防ぐ)
  if (pending >= MAX_QUEUE) return Promise.reject(new QueueFull('queue full'))
  pending++
  const run = chain.then(async () => {
    try {
      signal.throwIfAborted()
      const wait = lastDone + MIN_INTERVAL_MS - Date.now()
      if (wait > 0) {
        await new Promise<void>((res, rej) => {
          if (signal.aborted) return rej(signal.reason)
          const onAbort = () => { clearTimeout(t); rej(signal.reason) }
          const t = setTimeout(() => {
            signal.removeEventListener('abort', onAbort)
            res()
          }, wait)
          signal.addEventListener('abort', onAbort, { once: true })
        })
      }
      signal.throwIfAborted()
      try {
        return await fn()
      } finally {
        lastDone = Date.now()
      }
    } finally {
      pending--
    }
  })
  chain = run.catch(() => undefined)
  return run
}

/** 429/5xx/timeout/不正JSON は null */
async function getJson(path: string, signal: AbortSignal): Promise<unknown | null> {
  try {
    const res = await limited(
      () => fetch(`${BASE}${path}`, { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal }),
      signal
    )
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

type Rec = Record<string, unknown>
const isRec = (v: unknown): v is Rec => typeof v === 'object' && v !== null
const str = (v: unknown) => (typeof v === 'string' && v ? v : null)

function monthWindow(m: number) {
  const prev = m === 1 ? 12 : m - 1
  const next = m === 12 ? 1 : m + 1
  return `${prev},${m},${next}`
}

async function fetchNearby(h: IdentifyHints, signal: AbortSignal): Promise<NearbyMap | null> {
  if (h.lat == null || h.lng == null) return null
  const k = `${h.lat},${h.lng},${h.month ?? ''}`
  const hit = cacheGet(nearCache, k)
  if (hit) return hit.v
  const q = new URLSearchParams({
    lat: String(h.lat),
    lng: String(h.lng),
    radius: '50',
    quality_grade: 'research',
    locale: 'ja',
    per_page: '100',
  })
  if (h.month != null) q.set('month', monthWindow(h.month))
  const json = await getJson(`/observations/species_counts?${q}`, signal)
  if (!isRec(json) || !Array.isArray(json.results)) return null
  const map: NearbyMap = new Map()
  for (const r of json.results) {
    if (!isRec(r) || !isRec(r.taxon)) continue
    const name = str(r.taxon.name)
    if (!name || typeof r.count !== 'number') continue
    map.set(name.toLowerCase(), { count: r.count, commonName: str(r.taxon.preferred_common_name) })
  }
  cacheSet(nearCache, k, map, NEAR_TTL)
  return map
}

/** 見つかれば TaxonInfo、iNat に無ければ null、取得失敗は undefined */
async function lookupTaxon(name: string, signal: AbortSignal): Promise<TaxonInfo | null | undefined> {
  // Gemini 由来の文字列なので長さを制限 (q とキャッシュキー)
  const k = name.trim().toLowerCase().slice(0, MAX_NAME_LEN)
  const hit = cacheGet(taxaCache, k)
  if (hit) return hit.v
  const q = new URLSearchParams({ q: name.trim().slice(0, MAX_NAME_LEN), locale: 'ja', per_page: '3' })
  const json = await getJson(`/taxa?${q}`, signal)
  if (!isRec(json) || !Array.isArray(json.results)) return undefined
  let found: TaxonInfo | null = null
  for (const r of json.results) {
    if (!isRec(r) || r.is_active === false) continue
    const n = str(r.name)
    if (!n) continue
    // 学名一致、または同義名として検索語にヒット (matched_term) したものだけ採用
    const matched = str(r.matched_term)?.toLowerCase()
    if (n.toLowerCase() === k || matched === k) {
      found = { name: n, commonName: str(r.preferred_common_name) }
      break
    }
  }
  cacheSet(taxaCache, k, found, found ? TAXA_TTL : TAXA_NEG_TTL)
  return found
}

/** iNat で検証・再ランク。失敗時は入力をそのまま返す (例外は投げない) */
export async function enrichWithInat(
  candidates: Candidate[],
  hints: IdentifyHints
): Promise<Candidate[]> {
  const started = Date.now()
  try {
    const signal = AbortSignal.timeout(TOTAL_TIMEOUT_MS)
    const nearby = await fetchNearby(hints, signal)
    const taxa: TaxaMap = new Map()
    const targets = candidates.filter((c) => c.name && !nearby?.has(c.name.toLowerCase()))
    let lookups = 0
    for (const c of targets) {
      if (signal.aborted) break
      if (lookups >= MAX_TAXA_LOOKUPS) break
      if (TOTAL_TIMEOUT_MS - (Date.now() - started) < MIN_REMAINING_FOR_LOOKUP_MS) break
      lookups++
      const t = await lookupTaxon(c.name, signal)
      if (t !== undefined) taxa.set(c.name.trim().toLowerCase(), t)
    }
    // 全対象を確認できたときだけ減点を適用する
    const complete = taxa.size >= targets.length
    const out = rerank(candidates, nearby, taxa, complete)
    console.log(`[iNat] 使用 nearby=${nearby ? 'ok' : 'none'} taxa=${taxa.size}/${targets.length} complete=${complete} ${Date.now() - started}ms`)
    return out
  } catch (e) {
    console.log(`[iNat] スキップ (${e instanceof Error ? e.message : 'error'}) ${Date.now() - started}ms`)
    return candidates
  }
}
