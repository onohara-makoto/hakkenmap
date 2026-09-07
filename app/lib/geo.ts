import type { Observation } from '@/app/types/observation'

export type Bbox = { north: number; south: number; east: number; west: number }

/** 緯度経度を持つ観察記録だけを取り出す（型も絞る） */
export type GeoObservation = Observation & { latitude: number; longitude: number }

export function mappedObservations(obs: Observation[]): GeoObservation[] {
  return obs.filter(
    (o): o is GeoObservation => o.latitude != null && o.longitude != null
  )
}

/** flyTo のイージング設定（瞬間移動ではなく滑らかに） */
export const FLY_OPTIONS = { duration: 0.8, easeLinearity: 0.25 } as const

/** 日本の中心（ジオ情報が無いときのフォールバック） */
export const JAPAN_CENTER: [number, number] = [36.2048, 138.2529]

/** 2つの表示範囲がおおむね同じか（パン判定用、度単位のゆるい閾値） */
export function boundsRoughlyEqual(a: Bbox | null, b: Bbox | null, eps = 0.0005): boolean {
  if (!a || !b) return false
  return (
    Math.abs(a.north - b.north) < eps &&
    Math.abs(a.south - b.south) < eps &&
    Math.abs(a.east - b.east) < eps &&
    Math.abs(a.west - b.west) < eps
  )
}
