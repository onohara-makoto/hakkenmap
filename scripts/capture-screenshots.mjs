// README 用の画面写真を /demo から撮影し、docs/screenshots/ に保存する。
// デモは架空のサンプルだけを表示するので、実ユーザーのデータは写らない。
//
// 使い方:
//   npm run build && npx next start -p 43200 &
//   node scripts/capture-screenshots.mjs [http://localhost:43200]

import { chromium, devices } from '@playwright/test'
import { mkdirSync } from 'node:fs'

const BASE = process.argv[2] ?? 'http://localhost:43200'
const OUT = 'docs/screenshots'
mkdirSync(OUT, { recursive: true })

const settle = (page) => page.waitForLoadState('networkidle').then(() => page.waitForTimeout(800))

const browser = await chromium.launch()
try {
  const desktop = await browser.newContext({ viewport: { width: 1366, height: 820 }, deviceScaleFactor: 1 })
  const page = await desktop.newPage()

  await page.goto(`${BASE}/demo`)
  await settle(page)
  await page.screenshot({ path: `${OUT}/map-desktop.png` })

  await page.goto(`${BASE}/demo/new`)
  await page.getByRole('button', { name: '✨ Suggest names with AI' }).click()
  await page.getByRole('button', { name: /Garden cosmos/ }).click()
  await settle(page)
  await page.screenshot({ path: `${OUT}/ai-suggestions-desktop.png` })

  await page.goto(`${BASE}/demo/log`)
  await settle(page)
  await page.screenshot({ path: `${OUT}/walk-log-desktop.png` })

  const mobile = await browser.newContext({ ...devices['Pixel 7'] })
  const m = await mobile.newPage()
  await m.goto(`${BASE}/demo`)
  await m.getByRole('button', { name: 'Set sheet to half' }).click()
  await settle(m)
  await m.screenshot({ path: `${OUT}/map-mobile.png` })

  await m.goto(`${BASE}/demo/log`)
  await settle(m)
  await m.screenshot({ path: `${OUT}/walk-log-mobile.png` })

  await m.goto(`${BASE}/demo/demo-03`)
  await settle(m)
  await m.screenshot({ path: `${OUT}/detail-mobile.png` })

  console.log(`saved screenshots to ${OUT}/`)
} finally {
  await browser.close()
}
