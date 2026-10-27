import { createClient } from '@/app/lib/supabase/client'

export type UploadedPhoto = { path: string; url: string }

export async function uploadPhoto(file: File, userId: string): Promise<UploadedPhoto | null> {
  const supabase = createClient()
  const timestamp = Date.now()
  const rand = Math.random().toString(36).slice(2, 8)
  const ext = file.name.split('.').pop()
  // 一括アップロードで同一ミリ秒に複数保存してもぶつからないよう乱数を付与
  const fileName = `${userId}/${timestamp}-${rand}.${ext}`

  const { data, error } = await supabase.storage
    .from('photos')
    .upload(fileName, file, { cacheControl: '3600', upsert: false })

  if (error) { console.error('アップロードエラー:', error.message); return null }

  const { data: urlData, error: urlError } = await supabase.storage
    .from('photos')
    .createSignedUrl(data.path, 60 * 60 * 24 * 365)

  if (urlError || !urlData) {
    console.error('署名付きURL生成エラー:', urlError?.message)
    await deletePhotoByPath(data.path)
    return null
  }

  return { path: data.path, url: urlData.signedUrl }
}

/** DB登録に失敗した等の理由でアップロード済みの写真を孤立させないための削除処理 */
export async function deletePhotoByPath(path: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.storage.from('photos').remove([path])
  if (error) console.error('孤立画像の削除エラー:', error.message)
}
