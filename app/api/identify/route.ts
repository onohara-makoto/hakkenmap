import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'

export type IdentifyResult = {
  name: string
  commonName: string | null
  score: number
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'API key not configured' }, { status: 500 })

  const formData = await request.formData()
  const file = formData.get('image') as File | null
  if (!file) return NextResponse.json({ error: 'No image provided' }, { status: 400 })

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
      model: 'gemini-flash-latest',
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
    return NextResponse.json({ error: `Gemini APIエラー: ${e}` }, { status: 500 })
  }
  console.log('[Gemini] レスポンス:', text)

  let parsed: { commonName: string; scientificName: string; confidence: number }[] = []
  try {
    const match = text.match(/\[[\s\S]*\]/)
    if (match) parsed = JSON.parse(match[0])
  } catch (e) {
    console.error('[Gemini] JSON解析エラー:', text)
    return NextResponse.json({ error: '識別結果の解析に失敗しました' }, { status: 500 })
  }

  const results: IdentifyResult[] = parsed.map((r) => ({
    name: r.scientificName ?? '',
    commonName: r.commonName ?? null,
    score: r.confidence ?? 0,
  }))

  return NextResponse.json({ results })
}
