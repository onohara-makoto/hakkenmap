export const PHOTO_BUCKET = 'photos'

/** 表示用署名URLの有効期間。表示のたびに発行し直すので長くする必要はない */
export const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24

const LEGACY_SIGNED_URL = /\/storage\/v1\/object\/sign\/photos\/([^?#]+)/

/** 旧方式で DB に保存されていた署名URLから Storage のパスを取り出す */
export function photoPathFromLegacyUrl(url: string): string | null {
  const m = url.match(LEGACY_SIGNED_URL)
  if (!m) return null
  try {
    return decodeURIComponent(m[1])
  } catch {
    return null
  }
}

/** 記録の写真パス。photo_path 未移行の記録は旧URLから復元する */
export function photoPathOf(row: { photo_path?: string | null; photo_url?: string | null }): string | null {
  if (row.photo_path) return row.photo_path
  return row.photo_url ? photoPathFromLegacyUrl(row.photo_url) : null
}

const EXT_BY_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/heic': 'heic',
  'image/webp': 'webp',
}

/**
 * 写真の保存先。記録IDをファイル名にすることで、再試行しても同じパスになり
 * 二重アップロードにならない。先頭フォルダはユーザーID（Storage RLS の所有者判定に使う）。
 */
export function buildPhotoPath(userId: string, observationId: string, file: { name: string; type: string }): string {
  const fromName = file.name.includes('.') ? file.name.split('.').pop()!.toLowerCase() : ''
  const ext = /^[a-z0-9]{1,5}$/.test(fromName) ? fromName : (EXT_BY_TYPE[file.type] ?? 'jpg')
  return `${userId}/${observationId}.${ext}`
}
