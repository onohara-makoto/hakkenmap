import muni from './muni.json'

// 国土地理院の逆ジオコーダ（キー不要）。サーバー側（/api/reverse-geocode）からのみ使う。
// 返り値は { results: { muniCd, lv01Nm } }。muniCd は市区町村コードなので muni.json で名前に変換する。
// muni.json は https://maps.gsi.go.jp/js/muni.js から生成（.claude/_docs/plans/issue-20.md 参照）。
const ENDPOINT = 'https://mreversegeocoder.gsi.go.jp/reverse-geocoder/LonLatToAddress'
const TIMEOUT_MS = 5000

const MUNI_NAMES = muni as Record<string, string>

type GsiResponse = { results?: { muniCd?: string; lv01Nm?: string } }

/**
 * 座標から「市区町村名 + 町丁目」を返す（例: 千代田区丸の内一丁目）。
 * 該当なし（海上など）は null。通信・応答の異常は例外を投げる（呼び出し側でキャッシュしないため）。
 */
export async function reverseGsi(lat: number, lng: number): Promise<string | null> {
  const url = `${ENDPOINT}?lat=${lat}&lon=${lng}`
  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS), cache: 'no-store' })
  if (!res.ok) throw new Error(`gsi status ${res.status}`)
  const json = (await res.json()) as GsiResponse
  const r = json.results
  if (!r) return null

  const muniName = r.muniCd ? MUNI_NAMES[String(Number(r.muniCd))] ?? '' : ''
  const lv01 = (r.lv01Nm ?? '').trim()
  const town = lv01 === '－' || lv01 === '-' ? '' : lv01
  const name = `${muniName}${town}`
  return name || null
}
