import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/app/lib/supabase/client'
import { PHOTO_BUCKET, SIGNED_URL_TTL_SECONDS, photoPathOf } from '@/app/lib/photo-path'

const TYPE_BY_EXT: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', heic: 'image/heic', heif: 'image/heif',
}

/**
 * アップロード時の Content-Type。HEIC は端末・ブラウザによって file.type が空になるため拡張子で補う
 * （バケットは画像形式のみ受け付ける設定なので、空のままだと拒否される）。
 */
export function photoContentType(file: { type: string }, path: string): string {
  if (file.type) return file.type
  return TYPE_BY_EXT[path.split('.').pop()?.toLowerCase() ?? ''] ?? 'image/jpeg'
}

/**
 * 写真をアップロードする。失敗時は例外を投げる。
 * 同じパスが既にある（前回の試行でアップロード済み）場合は成功として扱う。
 */
export async function uploadPhoto(
  path: string,
  file: File,
  client: SupabaseClient = createClient()
): Promise<void> {
  const { error } = await client.storage
    .from(PHOTO_BUCKET)
    .upload(path, file, { contentType: photoContentType(file, path), upsert: false })
  if (!error) return
  const status = (error as { statusCode?: string; status?: number }).statusCode
  if (status === '409' || /already exists|duplicate/i.test(error.message)) return
  throw new Error(`写真のアップロードに失敗: ${error.message}`)
}

/** 写真を削除する。失敗時は例外を投げる（呼び出し側でベストエフォートにするか決める） */
export async function deletePhoto(path: string, client: SupabaseClient = createClient()): Promise<void> {
  const { error } = await client.storage.from(PHOTO_BUCKET).remove([path])
  if (error) throw new Error(`写真の削除に失敗: ${error.message}`)
}

// ---- 表示用の署名URL ----
// 署名URLは発行のたびに変わる。同じ写真に毎回別URLを渡すと画像最適化・ブラウザの
// キャッシュが効かないため、期限に余裕があるうちは発行済みのURLを使い回す。

type CachedUrl = { url: string; expiresAt: number }
const REUSE_MARGIN_MS = 60 * 60 * 1000
const STORAGE_KEY = 'hakkenmap:signed-photo-urls'
const memoryCache = new Map<string, CachedUrl>()
let restored = false

function restoreCache() {
  if (restored) return
  restored = true
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    for (const [path, v] of Object.entries(JSON.parse(raw) as Record<string, CachedUrl>)) {
      memoryCache.set(path, v)
    }
  } catch {}
}

function persistCache() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Object.fromEntries(memoryCache)))
  } catch {}
}

function cachedUrl(path: string, now: number): string | null {
  const hit = memoryCache.get(path)
  return hit && hit.expiresAt - REUSE_MARGIN_MS > now ? hit.url : null
}

/** 表示に失敗した（期限切れ等）URLを捨て、次回の取得で発行し直させる */
export function forgetSignedPhotoUrl(path: string) {
  memoryCache.delete(path)
  if (typeof window !== 'undefined') persistCache()
}

/**
 * 記録の photo_url を、photo_path から発行した表示用の署名URLに差し替える。
 * photo_path 未移行の記録は旧署名URLからパスを復元するので、旧URLの期限が切れても表示が戻る。
 */
export async function withSignedPhotoUrls<T extends { photo_path?: string | null; photo_url: string | null }>(
  rows: T[],
  client: SupabaseClient = createClient(),
  now = Date.now()
): Promise<(T & { photo_path: string | null })[]> {
  if (typeof window !== 'undefined') restoreCache()

  const paths = rows.map((r) => photoPathOf(r))
  const missing = Array.from(new Set(paths.filter((p): p is string => !!p && !cachedUrl(p, now))))

  if (missing.length > 0) {
    const { data, error } = await client.storage
      .from(PHOTO_BUCKET)
      .createSignedUrls(missing, SIGNED_URL_TTL_SECONDS)
    if (error) console.error('署名URLの発行に失敗:', error.message)
    for (const item of data ?? []) {
      if (item.path && item.signedUrl && !item.error) {
        memoryCache.set(item.path, { url: item.signedUrl, expiresAt: now + SIGNED_URL_TTL_SECONDS * 1000 })
      }
    }
    if (typeof window !== 'undefined') persistCache()
  }

  return rows.map((row, i) => {
    const path = paths[i]
    // パスを復元できない旧URLはそのまま使う（期限内なら表示できる）
    const url = path ? cachedUrl(path, now) : row.photo_url
    return { ...row, photo_path: path, photo_url: url ?? null }
  })
}

/** テスト用: モジュール内キャッシュを空にする */
export function clearSignedUrlCacheForTest() {
  memoryCache.clear()
  restored = false
}
