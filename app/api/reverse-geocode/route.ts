import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/app/lib/supabase/server'
import { reverseGsi } from '@/app/lib/geocode/gsi'

// 座標 → 場所名（例: 千代田区丸の内一丁目）。
// ブラウザから外部ジオコーダを直接呼ばず、ここを経由させる（IP・Cookie・Referer を外部に渡さない /
// 座標を丸める / キャッシュ / 停止スイッチ）。座標はログに出さない。

type ErrorCode = 'unauthenticated' | 'invalid_params' | 'rate_limited'

// 小数 3 桁（約 100m）。町丁目の判定には十分
const ROUND_DIGITS = 3
const CACHE_MAX = 2000
const RATE_LIMIT_PER_MIN = 60
// 日本のおおよその範囲。外は外部に問い合わせない
const JAPAN_BOUNDS = { south: 20, north: 46, west: 122, east: 154 }

// メモリキャッシュ（Map の挿入順を使った LRU）。EC2 1台構成前提
const cache = new Map<string, string | null>()
// ユーザー別の簡易レート制限（1分の固定窓）
const usage = new Map<string, { windowStart: number; count: number }>()

function fail(error: string, code: ErrorCode, status: number) {
  return NextResponse.json({ error, code }, { status })
}

function cacheGet(key: string): string | null | undefined {
  if (!cache.has(key)) return undefined
  const v = cache.get(key) as string | null
  cache.delete(key)
  cache.set(key, v)
  return v
}

function cacheSet(key: string, value: string | null) {
  cache.delete(key)
  cache.set(key, value)
  while (cache.size > CACHE_MAX) {
    const oldest = cache.keys().next().value
    if (oldest === undefined) break
    cache.delete(oldest)
  }
}

function overRateLimit(userId: string): boolean {
  const now = Date.now()
  const u = usage.get(userId)
  if (!u || now - u.windowStart >= 60_000) {
    usage.set(userId, { windowStart: now, count: 1 })
    // 古い窓を掃除してメモリが増え続けないようにする
    if (usage.size > 1000) {
      for (const [id, v] of usage) if (now - v.windowStart >= 60_000) usage.delete(id)
    }
    return false
  }
  u.count += 1
  return u.count > RATE_LIMIT_PER_MIN
}

function parseCoord(raw: string | null, min: number, max: number): number | null {
  if (raw === null || raw.trim() === '') return null
  const n = Number(raw)
  return Number.isFinite(n) && n >= min && n <= max ? n : null
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return fail('ログインが必要です', 'unauthenticated', 401)

  const params = request.nextUrl.searchParams
  const lat = parseCoord(params.get('lat'), -90, 90)
  const lng = parseCoord(params.get('lng'), -180, 180)
  if (lat === null || lng === null) return fail('座標が正しくありません', 'invalid_params', 400)

  // 既定は gsi。off（またはそれ以外の値）なら外部に問い合わせない
  const provider = process.env.REVERSE_GEOCODER ?? 'gsi'
  if (provider !== 'gsi') return NextResponse.json({ name: null })

  if (
    lat < JAPAN_BOUNDS.south || lat > JAPAN_BOUNDS.north ||
    lng < JAPAN_BOUNDS.west || lng > JAPAN_BOUNDS.east
  ) {
    return NextResponse.json({ name: null })
  }

  const rLat = Number(lat.toFixed(ROUND_DIGITS))
  const rLng = Number(lng.toFixed(ROUND_DIGITS))
  const key = `${rLat},${rLng}`

  const cached = cacheGet(key)
  if (cached !== undefined) return NextResponse.json({ name: cached })

  if (overRateLimit(user.id)) {
    return fail('しばらくしてから再試行してください', 'rate_limited', 429)
  }

  try {
    const name = await reverseGsi(rLat, rLng)
    cacheSet(key, name)
    return NextResponse.json({ name })
  } catch (e) {
    // 外部の失敗は保存を妨げないよう 200 で name: null を返す（キャッシュはしない）
    // 例外メッセージに URL（=座標）が含まれ得るため、ステータスか例外名だけ出す
    const reason =
      e instanceof Error ? (e.message.startsWith('gsi status') ? e.message : e.name) : 'error'
    console.error('[reverse-geocode] 外部呼び出し失敗:', reason)
    return NextResponse.json({ name: null })
  }
}
