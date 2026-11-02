import { createClient } from '@/app/lib/supabase/client'
import type { ObservationInsert, Observation } from '@/app/types/observation'

export async function createObservation(
  data: ObservationInsert,
  userId: string
): Promise<Observation | null> {
  const supabase = createClient()
  const { data: result, error } = await supabase
    .from('observations')
    .insert({ ...data, user_id: userId })
    .select()
    .single()

  if (error) { console.error('DB保存エラー:', error.message); return null }
  return result
}

export async function getObservations(): Promise<Observation[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('observations')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) { console.error('取得エラー:', error.message); return [] }
  return data ?? []
}

export async function getObservation(id: string): Promise<Observation | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('observations')
    .select('*')
    .eq('id', id)
    .single()

  if (error) { console.error('取得エラー:', error.message); return null }
  return data
}

export async function deleteObservation(id: string): Promise<boolean> {
  const supabase = createClient()
  const { error } = await supabase
    .from('observations')
    .delete()
    .eq('id', id)

  if (error) { console.error('削除エラー:', error.message); return false }
  return true
}

/** 位置つきで最後に記録した地点（位置ピッカーの初期中心用） */
export async function getLatestGeoObservation(): Promise<{ lat: number; lng: number } | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('observations')
    .select('latitude,longitude')
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) { console.error('取得エラー:', error.message); return null }
  if (!data || data.latitude == null || data.longitude == null) return null
  return { lat: data.latitude, lng: data.longitude }
}

/** 保存済みの記録の位置（座標と場所名）だけを更新する。RLS で更新できなければ null */
export async function updateObservationLocation(
  id: string,
  fields: Pick<ObservationInsert, 'latitude' | 'longitude' | 'location_name'>
): Promise<Observation | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('observations')
    .update({
      latitude: fields.latitude,
      longitude: fields.longitude,
      location_name: fields.location_name,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) { console.error('更新エラー:', error.message); return null }
  return data
}
