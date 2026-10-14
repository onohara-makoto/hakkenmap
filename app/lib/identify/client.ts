import { IDENTIFY_MAX_BYTES } from './image'
import type { IdentifyErrorCode, IdentifyResult } from './handler'

export const IDENTIFY_ERROR_MESSAGES: Record<IdentifyErrorCode | 'network', string> = {
  server_misconfigured: 'AI識別は現在利用できません。名前は手入力で記録できます。',
  unauthenticated: 'ログインが切れているようです。再度ログインしてからお試しください。',
  invalid_image: '画像を確認してください（JPEG・PNG・HEIC・WebPのみ対応）。',
  image_too_large: '画像サイズが大きすぎます（8MBまで）。',
  rate_limited: '本日のAI識別の利用上限に達しました。明日また利用できます。',
  ai_unavailable: 'AI識別サービスが混み合っています。しばらくしてから再試行してください。',
  ai_error: '識別に失敗しました。もう一度お試しください。',
  network: '通信に失敗しました。電波の良い場所でもう一度お試しください。',
}

export type IdentifyOutcome =
  | { ok: true; results: IdentifyResult[] }
  | { ok: false; code: IdentifyErrorCode | 'network'; message: string }

const CODE_BY_STATUS: Record<number, IdentifyErrorCode> = {
  400: 'invalid_image',
  401: 'unauthenticated',
  413: 'image_too_large',
  429: 'rate_limited',
  502: 'ai_error',
  503: 'ai_unavailable',
  504: 'ai_unavailable',
}

const failure = (code: IdentifyErrorCode | 'network'): IdentifyOutcome => ({
  ok: false,
  code,
  message: IDENTIFY_ERROR_MESSAGES[code],
})

/**
 * /api/identify を呼ぶ。通信断やプロキシが返す HTML のエラー（例: Nginx の 413）でも
 * 例外にせず、画面に出せるメッセージに変換して返す。
 */
export async function requestIdentify(image: Blob, fetchImpl: typeof fetch = fetch): Promise<IdentifyOutcome> {
  if (image.size > IDENTIFY_MAX_BYTES) return failure('image_too_large')

  const form = new FormData()
  form.append('image', image, 'photo')
  let res: Response
  try {
    res = await fetchImpl('/api/identify', { method: 'POST', body: form })
  } catch {
    return failure('network')
  }

  let body: { results?: IdentifyResult[]; code?: IdentifyErrorCode } | null = null
  try {
    body = await res.json()
  } catch {}

  if (res.ok && Array.isArray(body?.results)) return { ok: true, results: body.results }
  const code = body?.code && body.code in IDENTIFY_ERROR_MESSAGES ? body.code : CODE_BY_STATUS[res.status]
  return failure(code ?? 'ai_error')
}

const MAX_EDGE = 1600

/**
 * 識別用に画像を縮小する（送信量と Gemini の入力トークンを減らす）。
 * ブラウザが画像を読めない場合（例: Chrome の HEIC）は元のファイルをそのまま使う。
 */
export async function shrinkForIdentify(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))
    if (scale === 1 && file.size < 1024 * 1024) return file
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85))
    return blob ?? file
  } catch {
    return file
  }
}
