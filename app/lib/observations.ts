import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/app/lib/supabase/client'
import { deletePhoto, withSignedPhotoUrls } from '@/app/lib/storage'
import type { ObservationInsert, Observation } from '@/app/types/observation'

// Postgres の一意制約違反
const UNIQUE_VIOLATION = '23505'

/**
 * 記録を作成する。id はクライアントで決めた UUID を使う。
 * 前回の試行で実は保存済みだった（応答だけ失われた）場合は、一意制約違反を受けて
 * 既存の記録を返す。再試行しても記録が二重にならない。
 * 失敗時は例外を投げる。
 */
export async function createObservation(
  data: ObservationInsert & { id: string },
  userId: string,
  client: SupabaseClient = createClient()
): Promise<Observation> {
  const { data: row, error } = await client
    .from('observations')
    .insert({ ...data, user_id: userId, photo_url: null })
    .select()
    .single()

  if (!error) return row as Observation
  if (error.code === UNIQUE_VIOLATION) {
    const existing = await findObservation(data.id, client)
    if (existing) return existing
  }
  throw new Error(`記録の保存に失敗: ${error.message}`)
}

/** 署名URLを付けずに記録を1件引く（存在確認用）。見つからなければ null */
export async function findObservation(
  id: string,
  client: SupabaseClient = createClient()
): Promise<Observation | null> {
  const { data, error } = await client.from('observations').select('*').eq('id', id).maybeSingle()
  if (error) throw new Error(`記録の取得に失敗: ${error.message}`)
  return (data as Observation | null) ?? null
}

export async function getObservations(client: SupabaseClient = createClient()): Promise<Observation[]> {
  const { data, error } = await client
    .from('observations')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) { console.error('取得エラー:', error.message); return [] }
  return withSignedPhotoUrls((data ?? []) as Observation[], client)
}

export async function getObservation(
  id: string,
  client: SupabaseClient = createClient()
): Promise<Observation | null> {
  const { data, error } = await client
    .from('observations')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) { console.error('取得エラー:', error.message); return null }
  if (!data) return null
  const [signed] = await withSignedPhotoUrls([data as Observation], client)
  return signed
}

/**
 * 記録と写真を削除する。記録の削除に成功すれば true。
 * 写真の削除に失敗しても記録は消えているので成功扱いにし、残った写真は
 * scripts/cleanup-orphan-photos.mjs で後から回収する。
 */
export async function deleteObservation(
  obs: Pick<Observation, 'id' | 'photo_path'>,
  client: SupabaseClient = createClient()
): Promise<boolean> {
  const { data, error } = await client
    .from('observations')
    .delete()
    .eq('id', obs.id)
    .select('id')

  if (error) { console.error('削除エラー:', error.message); return false }
  // RLS で弾かれた場合はエラーにならず 0 件になる
  if (!data || data.length === 0) return false

  if (obs.photo_path) {
    try {
      await deletePhoto(obs.photo_path, client)
    } catch (e) {
      console.error(e)
    }
  }
  return true
}
