import { IDENTIFY_MAX_BYTES, sniffImageType, type SupportedImageType } from './image'

export type IdentifyResult = {
  name: string
  commonName: string | null
  score: number
}

export type IdentifyErrorCode =
  | 'server_misconfigured'
  | 'unauthenticated'
  | 'invalid_image'
  | 'image_too_large'
  | 'rate_limited'
  | 'ai_unavailable'
  | 'ai_error'

export const IDENTIFY_DAILY_LIMIT = 20

/** Gemini 呼び出しの失敗。status は上流の HTTP ステータス（タイムアウト等で不明なら null） */
export class IdentifyUpstreamError extends Error {
  constructor(message: string, readonly status: number | null) {
    super(message)
  }
}

/**
 * ルートハンドラが使う外部依存。本番では Supabase と Gemini を、テストではスタブを渡す。
 * テストから有料の Gemini API を呼ばないための境界でもある。
 */
export type IdentifyDeps = {
  apiKeyConfigured: boolean
  getUserId: () => Promise<string | null>
  /** 利用回数を1つ消費する。上限超過なら 'limited' */
  consumeQuota: (userId: string) => Promise<'ok' | 'limited'>
  /** 画像を識別してモデルの生テキストを返す。失敗時は IdentifyUpstreamError を投げる */
  identify: (image: { mimeType: SupportedImageType; base64: string }) => Promise<string>
}

// multipart の境界やヘッダー分の余白
const MULTIPART_OVERHEAD = 64 * 1024

function fail(code: IdentifyErrorCode, error: string, status: number, headers?: HeadersInit) {
  return Response.json({ error, code }, { status, headers })
}

export async function handleIdentify(request: Request, deps: IdentifyDeps): Promise<Response> {
  if (!deps.apiKeyConfigured) {
    return fail('server_misconfigured', 'AI識別は現在利用できません', 500)
  }

  // 本文を読む前に認証する（未認証のアップロードを受け取らない）
  const userId = await deps.getUserId()
  if (!userId) return fail('unauthenticated', 'ログインが必要です', 401)

  const declaredLength = Number(request.headers.get('content-length') ?? 0)
  if (declaredLength > IDENTIFY_MAX_BYTES + MULTIPART_OVERHEAD) {
    return fail('image_too_large', '画像サイズが大きすぎます（8MBまで）', 413)
  }

  let file: FormDataEntryValue | null
  try {
    file = (await request.formData()).get('image')
  } catch {
    return fail('invalid_image', '画像を送信してください', 400)
  }
  if (!(file instanceof Blob) || file.size === 0) {
    return fail('invalid_image', '画像が指定されていません', 400)
  }
  if (file.size > IDENTIFY_MAX_BYTES) {
    return fail('image_too_large', '画像サイズが大きすぎます（8MBまで）', 413)
  }

  const bytes = new Uint8Array(await file.arrayBuffer())
  const mimeType = sniffImageType(bytes)
  if (!mimeType) {
    return fail('invalid_image', '対応していない画像形式です（JPEG・PNG・HEIC・WebPのみ）', 400)
  }

  // 検証を通った画像だけを回数に数える
  let quota: 'ok' | 'limited'
  try {
    quota = await deps.consumeQuota(userId)
  } catch (e) {
    console.error('[identify] 利用回数の記録に失敗:', e)
    return fail('ai_error', '識別に失敗しました。もう一度お試しください。', 500)
  }
  if (quota === 'limited') {
    return fail(
      'rate_limited',
      `本日のAI識別の利用上限（${IDENTIFY_DAILY_LIMIT}回）に達しました。明日また利用できます。`,
      429,
      { 'Retry-After': '3600' }
    )
  }

  let text: string
  try {
    text = await deps.identify({ mimeType, base64: Buffer.from(bytes).toString('base64') })
  } catch (e) {
    const status = e instanceof IdentifyUpstreamError ? e.status : null
    console.error('[identify] Gemini 呼び出しエラー:', status, e instanceof Error ? e.message : e)
    // 混雑・タイムアウトは時間をおけば成功しうる。それ以外も利用者には再試行を促す
    const transient = status === null || status === 429 || status >= 500
    return transient
      ? fail('ai_unavailable', 'AI識別サービスが混み合っています。しばらくしてから再試行してください。', 503)
      : fail('ai_error', 'AI識別に失敗しました。もう一度お試しください。', 502)
  }

  const results = parseIdentifyResults(text)
  if (!results) {
    console.error('[identify] 応答の解析に失敗:', text.slice(0, 200))
    return fail('ai_error', '識別結果の解析に失敗しました。もう一度お試しください。', 502)
  }
  return Response.json({ results })
}

/** モデルの応答テキストから候補配列を取り出す。形が不正なら null */
export function parseIdentifyResults(text: string): IdentifyResult[] | null {
  const match = text.match(/\[[\s\S]*\]/)
  if (!match) return null
  let parsed: unknown
  try {
    parsed = JSON.parse(match[0])
  } catch {
    return null
  }
  if (!Array.isArray(parsed)) return null
  return parsed
    .filter((r): r is Record<string, unknown> => typeof r === 'object' && r !== null)
    .slice(0, 5)
    .map((r) => ({
      name: typeof r.scientificName === 'string' ? r.scientificName : '',
      commonName: typeof r.commonName === 'string' ? r.commonName : null,
      score: typeof r.confidence === 'number' ? Math.min(1, Math.max(0, r.confidence)) : 0,
    }))
    .filter((r) => r.name || r.commonName)
}
