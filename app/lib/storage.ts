import { createClient } from '@/app/lib/supabase/client'

export async function uploadPhoto(file: File, userId: string): Promise<string | null> {
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

  const { data: urlData } = await supabase.storage
    .from('photos')
    .createSignedUrl(data.path, 60 * 60 * 24 * 365)

  return urlData?.signedUrl ?? null
}
