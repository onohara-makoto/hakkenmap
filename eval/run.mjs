// 使い方: IDENTIFY_COOKIE='<ログイン済みCookie>' node eval/run.mjs <baseline|A|AB> [runs=2]
// サーバー側は条件に応じて起動: baseline/A は IDENTIFY_INAT=off、AB は未設定。
// baseline はヒントを送らない。日次上限(20回/ユーザー)を消費するので注意。
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'

const [cond = 'baseline', runsArg = '2'] = process.argv.slice(2)
const base = process.env.IDENTIFY_URL ?? 'http://localhost:3000'
const cookie = process.env.IDENTIFY_COOKIE ?? ''
const expected = JSON.parse(readFileSync(new URL('./expected.json', import.meta.url)))
const rows = []

for (const [file, exp] of Object.entries(expected)) {
  const buf = readFileSync(new URL(`./${file}`, import.meta.url))
  for (let i = 0; i < Number(runsArg); i++) {
    const form = new FormData()
    form.append('image', new Blob([buf], { type: 'image/png' }), file)
    if (cond !== 'baseline') {
      if (exp.lat != null && exp.lng != null) { form.append('lat', String(exp.lat)); form.append('lng', String(exp.lng)) }
      if (exp.month != null) form.append('month', String(exp.month))
    }
    const t = Date.now()
    const res = await fetch(`${base}/api/identify`, { method: 'POST', body: form, headers: { cookie } })
    const ms = Date.now() - t
    const json = await res.json().catch(() => ({}))
    const names = (json.results ?? []).map((r) => r.name.toLowerCase())
    const want = (exp.scientificName ?? '').toLowerCase()
    rows.push({
      file, run: i + 1, status: res.status, ms,
      top1: !!want && names[0] === want,
      top3: !!want && names.slice(0, 3).includes(want),
      genus: !!exp.acceptGenus && names.some((n) => n.startsWith(exp.acceptGenus.toLowerCase() + ' ')),
      hasCommonName: (json.results ?? []).every((r) => r.commonName && r.commonName !== r.name),
      results: json.results ?? json,
    })
  }
}
mkdirSync(new URL('./results/', import.meta.url), { recursive: true })
writeFileSync(new URL(`./results/${cond}.json`, import.meta.url), JSON.stringify(rows, null, 2))
console.table(rows.map((r) => Object.fromEntries(Object.entries(r).filter(([k]) => k !== 'results'))))
