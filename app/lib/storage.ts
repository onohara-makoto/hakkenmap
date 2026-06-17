import { createClient } from '@/app/lib/supabase/client'

export async function uploadPhoto(file: File, userId: string): Promise<string | null> {
  const supabase = createClient()
  const timestamp = Date.now()
  const ext = file.name.split('.').pop()
  const fileName = `${userId}/${timestamp}.${ext}`

  const { data, error } = await supabase.storage
    .from('photos')
    .upload(fileName, file, { cacheControl: '3600', upsert: false })

  if (error) { console.error('アップロードエラー:', error.message); return null }

  const { data: urlData } = await supabase.storage
    .from('photos')
    .createSignedUrl(data.path, 60 * 60 * 24 * 365)

  return urlData?.signedUrl ?? null
}
