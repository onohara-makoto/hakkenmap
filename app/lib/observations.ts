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
