import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import { createClient } from '@/app/lib/supabase/server'

export type IdentifyResult = {
  name: string
  commonName: string | null
  score: number
}

type ErrorCode =
  | 'server_misconfigured'
  | 'unauthenticated'
  | 'invalid_image'
  | 'image_too_large'
  | 'rate_limited'
  | 'ai_unavailable'
  | 'ai_error'

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/heic', 'image/webp'])
const MAX_SIZE_BYTES = 8 * 1024 * 1024
const DAILY_LIMIT = 20

function fail(error: string, code: ErrorCode, status: number) {
  return NextResponse.json({ error, code }, { status })
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return fail('API key not configured', 'server_misconfigured', 500)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return fail('ログインが必要です', 'unauthenticated', 401)

  const formData = await request.formData()
  const file = formData.get('image') as File | null
  if (!file || file.size === 0) {
    return fail('画像が指定されていません', 'invalid_image', 400)
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return fail('対応していない画像形式です（JPEG・PNG・HEIC・WebPのみ）', 'invalid_image', 400)
  }
  if (file.size > MAX_SIZE_BYTES) {
    return fail('画像サイズが大きすぎます（8MBまで）', 'image_too_large', 413)
  }

  const { error: usageError } = await supabase.rpc('increment_identify_usage', {
    p_user_id: user.id,
    p_daily_limit: DAILY_LIMIT,
  })
  if (usageError) {
    if (usageError.message.includes('rate_limit_exceeded')) {
      return fail(
        `本日のAI識別の利用上限（${DAILY_LIMIT}回）に達しました。日付が変わるとリセットされます。`,
        'rate_limited',
        429
      )
    }
    console.error('[identify] 利用回数カウントエラー:', usageError.message)
    return fail('識別に失敗しました', 'ai_error', 500)
  }

  const bytes = await file.arrayBuffer()
  const base64 = Buffer.from(bytes).toString('base64')

  const genAI = new GoogleGenAI({ apiKey })

  const prompt = `この写真に写っている植物・きのこ・生き物を識別してください。
候補を最大5件、以下のJSON形式のみで返してください。余計な説明は不要です。

[
  {
    "commonName": "日本語の一般名（例: ヒマワリ、ベニテングタケ）",
    "scientificName": "学名",
    "confidence": 0.0〜1.0の信頼度
  }
]

日本語名が不明な場合は学名をcommonNameに入れてください。`

  let text: string
  try {
    const result = await genAI.models.generateContent({
      model: 'gemini-3.8-flash',
      config: { responseMimeType: 'application/json' },
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            { inlineData: { mimeType: file.type || 'image/jpeg', data: base64 } },
          ],
        },
      ],
    })
    text = result.text ?? ''
  } catch (e) {
    console.error('[Gemini] API呼び出しエラー:', e)
    const message = e instanceof Error ? e.message : String(e)
    const isTransient = /503|429|UNAVAILABLE|RESOURCE_EXHAUSTED/i.test(message)
    return fail(
      isTransient
        ? 'AI識別サービスが混み合っています。しばらくしてから再試行してください。'
        : 'AI識別に失敗しました',
      isTransient ? 'ai_unavailable' : 'ai_error',
      isTransient ? 503 : 500
    )
  }
  console.log('[Gemini] レスポンス:', text)

  let parsed: { commonName: string; scientificName: string; confidence: number }[] = []
  try {
    const match = text.match(/\[[\s\S]*\]/)
    if (match) parsed = JSON.parse(match[0])
  } catch {
    console.error('[Gemini] JSON解析エラー:', text)
    return fail('識別結果の解析に失敗しました', 'ai_error', 500)
  }

  const results: IdentifyResult[] = parsed.map((r) => ({
    name: r.scientificName ?? '',
    commonName: r.commonName ?? null,
    score: r.confidence ?? 0,
  }))

  return NextResponse.json({ results })
}
