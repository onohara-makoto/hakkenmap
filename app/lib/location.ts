import type { ExifData } from '@/app/lib/exif'

// 記録時の位置の状態（単数・一括モード共通）

export type LocationSource = 'exif' | 'current' | 'map'

export type PickedLocation =
  /** GPS なし・まだ決めていない */
  | { kind: 'unset' }
  /** 「場所なしで記録」を選んだ */
  | { kind: 'none' }
  | {
      kind: 'set'
      lat: number
      lng: number
      source: LocationSource
      name: string | null
      nameStatus: 'loading' | 'ok' | 'failed'
    }

export type LatLng = { lat: number; lng: number }

export const LOCATION_SOURCE_LABELS: Record<LocationSource, string> = {
  exif: '写真の位置情報',
  current: '現在地',
  map: '地図で指定',
}

/** 座標をセットした状態を作る（場所名はこれから取得） */
export function locationAt(lat: number, lng: number, source: LocationSource): PickedLocation {
  return { kind: 'set', lat, lng, source, name: null, nameStatus: 'loading' }
}

/** EXIF に座標があれば set/exif、無ければ unset */
export function fromExif(exif: ExifData | null): PickedLocation {
  if (exif?.latitude != null && exif?.longitude != null) {
    return locationAt(exif.latitude, exif.longitude, 'exif')
  }
  return { kind: 'unset' }
}

/** 保存用のフィールド。set 以外はすべて null（unset の扱いは呼び出し側で決める） */
export function toInsertFields(loc: PickedLocation): {
  latitude: number | null
  longitude: number | null
  location_name: string | null
} {
  if (loc.kind !== 'set') return { latitude: null, longitude: null, location_name: null }
  return { latitude: loc.lat, longitude: loc.lng, location_name: loc.name }
}

/** navigator.geolocation の Promise 版。非対応・拒否・タイムアウトは reject */
export function getCurrentPosition(): Promise<LatLng> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      reject(new Error('geolocation unavailable'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    )
  })
}

// 送る座標は小数 3 桁（約 100m）に丸める。生の座標をアクセスログ（クエリ）に残さないため
const round3 = (v: number) => Math.round(v * 1000) / 1000

/** 自前の /api/reverse-geocode から場所名を取る。取れない・失敗はすべて null */
export async function fetchPlaceName(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(`/api/reverse-geocode?lat=${round3(lat)}&lng=${round3(lng)}`)
    if (!res.ok) return null
    const json = (await res.json()) as { name?: string | null }
    return typeof json.name === 'string' && json.name ? json.name : null
  } catch {
    return null
  }
}

/**
 * 複数地点の場所名をまとめて取る。サーバーのキャッシュは応答後に入るため、同じ約 100m 四方は
 * ここで1回にまとめ、同時に送るのは 4 件までにする（外部 API とレート制限への負荷を抑える）
 */
export async function fetchPlaceNames(points: { lat: number; lng: number }[]): Promise<(string | null)[]> {
  const keys = points.map((p) => `${round3(p.lat)},${round3(p.lng)}`)
  const unique = [...new Set(keys)]
  const names = new Map<string, string | null>()
  let next = 0
  const worker = async () => {
    while (next < unique.length) {
      const key = unique[next++]
      const [lat, lng] = key.split(',').map(Number)
      names.set(key, await fetchPlaceName(lat, lng))
    }
  }
  await Promise.all(Array.from({ length: Math.min(4, unique.length) }, worker))
  return keys.map((k) => names.get(k) ?? null)
}
