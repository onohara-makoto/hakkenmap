export type IdentifyHints = {
  /** 約10km精度 (小数1桁) に丸めた座標 */
  lat: number | null
  lng: number | null
  /** 1..12 */
  month: number | null
}

function num(v: FormDataEntryValue | null): number | null {
  if (typeof v !== 'string' || v.trim() === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

const round1 = (n: number) => Math.round(n * 10) / 10

/** 範囲外・非数は無し扱い。座標は lat/lng が両方揃うときだけ採用 */
export function parseHints(formData: FormData): IdentifyHints {
  const lat = num(formData.get('lat'))
  const lng = num(formData.get('lng'))
  const month = num(formData.get('month'))
  const validLoc = lat != null && lng != null && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
  const validMonth = month != null && Number.isInteger(month) && month >= 1 && month <= 12
  return {
    lat: validLoc ? round1(lat) : null,
    lng: validLoc ? round1(lng) : null,
    month: validMonth ? month : null,
  }
}

const BASE_PROMPT = `この写真に写っている植物・きのこ・生き物を識別してください。
候補を最大5件、以下のJSON形式のみで返してください。余計な説明は不要です。

[
  {
    "commonName": "日本語の一般名（例: ヒマワリ、ベニテングタケ）",
    "scientificName": "学名",
    "confidence": 0.0〜1.0の信頼度
  }
]

日本語名が不明な場合は学名をcommonNameに入れてください。`

/** ヒント無しなら従来のプロンプトと同一 */
export function buildPrompt(hints: IdentifyHints): string {
  const lines: string[] = []
  if (hints.lat != null && hints.lng != null) {
    lines.push(`撮影場所: 緯度${hints.lat}, 経度${hints.lng}（約10km精度）`)
  }
  if (hints.month != null) lines.push(`撮影月: ${hints.month}月`)
  if (lines.length === 0) return BASE_PROMPT
  return `${BASE_PROMPT}

【参考情報】
${lines.join('\n')}
この地域・季節の分布や発生時期を考慮してください。ただし場所や月は不正確なことがあるため、写真に写っている特徴を最優先してください。`
}
