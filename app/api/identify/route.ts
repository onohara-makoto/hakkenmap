import { ApiError, GoogleGenAI } from '@google/genai'
import { createClient } from '@/app/lib/supabase/server'
import {
  handleIdentify,
  IdentifyUpstreamError,
  IDENTIFY_DAILY_LIMIT,
} from '@/app/lib/identify/handler'

export type { IdentifyResult } from '@/app/lib/identify/handler'

const GEMINI_MODEL = 'gemini-3.8-flash'
const GEMINI_TIMEOUT_MS = 20_000

const PROMPT = `この写真に写っている植物・きのこ・生き物を識別してください。
候補を最大5件、以下のJSON形式のみで返してください。余計な説明は不要です。

[
  {
    "commonName": "日本語の一般名（例: ヒマワリ、ベニテングタケ）",
    "scientificName": "学名",
    "confidence": 0.0〜1.0の信頼度
  }
]

日本語名が不明な場合は学名をcommonNameに入れてください。`

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY
  const supabase = await createClient()

  return handleIdentify(request, {
    apiKeyConfigured: !!apiKey,
    getUserId: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      return user?.id ?? null
    },
    consumeQuota: async (userId) => {
      const { error } = await supabase.rpc('increment_identify_usage', {
        p_user_id: userId,
        p_daily_limit: IDENTIFY_DAILY_LIMIT,
      })
      if (!error) return 'ok'
      if (error.message.includes('rate_limit_exceeded')) return 'limited'
      throw new Error(error.message)
    },
    identify: async ({ mimeType, base64 }) => {
      const genAI = new GoogleGenAI({ apiKey: apiKey! })
      try {
        const result = await genAI.models.generateContent({
          model: GEMINI_MODEL,
          config: {
            responseMimeType: 'application/json',
            httpOptions: { timeout: GEMINI_TIMEOUT_MS },
          },
          contents: [
            { role: 'user', parts: [{ text: PROMPT }, { inlineData: { mimeType, data: base64 } }] },
          ],
        })
        return result.text ?? ''
      } catch (e) {
        throw new IdentifyUpstreamError(
          e instanceof Error ? e.message : String(e),
          e instanceof ApiError ? e.status : null
        )
      }
    },
  })
}
