import { expect, test, type Page } from '@playwright/test'

/** デモ中に Supabase・識別 API へ通信していないことを確認するための記録 */
function trackBackendCalls(page: Page) {
  const calls: string[] = []
  page.on('request', (req) => {
    const url = req.url()
    if (url.includes('supabase.co') || url.includes('/api/identify')) calls.push(url)
  })
  return calls
}

test.describe('demo (no sign-in)', () => {
  test('map + list: browse, filter by category and open a find', async ({ page, isMobile }) => {
    const calls = trackBackendCalls(page)
    await page.goto('/demo')
    await expect(page.getByText('DEMO', { exact: true }).filter({ visible: true }).first()).toBeVisible()
    await expect(page.locator('.leaflet-container')).toBeVisible()

    if (isMobile) {
      await expect(page.getByText(/14 finds · swipe up/)).toBeVisible()
      await page.getByRole('button', { name: 'Set sheet to full' }).click()
    }
    // モバイルはボトムシート、デスクトップは左パネルに一覧が出る
    const scope = isMobile
      ? page.getByRole('dialog', { name: 'Observation list' })
      : page.getByRole('complementary', { name: 'Observation list' })

    await expect(scope.getByText('14 finds').first()).toBeVisible()
    await scope.getByRole('button', { name: 'Fungi', exact: true }).click()
    await expect(scope.getByText('2 finds', { exact: true })).toBeVisible()
    await expect(scope.getByRole('button', { name: /Fly agaric/ })).toBeVisible()
    await expect(scope.getByRole('button', { name: /Cosmos/ })).toHaveCount(0)

    await scope.getByRole('button', { name: /Fly agaric/ }).click()
    // 選択するとシートは半分の高さになる。利用者と同じく上に広げてから詳細へ
    if (isMobile) await page.getByRole('button', { name: 'Set sheet to full' }).click()
    await scope.getByRole('link', { name: 'Open details' }).click()
    await expect(page).toHaveURL(/\/demo\/demo-01$/)
    await expect(page.getByRole('heading', { name: 'Fly agaric' })).toBeVisible()
    await expect(page.getByText('Deleting is disabled in the demo.')).toBeVisible()
    await expect(page.getByRole('button', { name: /delete/i })).toHaveCount(0)

    expect(calls).toEqual([])
  })

  test('find without GPS appears in the detail view without a map link', async ({ page }) => {
    await page.goto('/demo/demo-06')
    await expect(page.getByRole('heading', { name: 'Moss on a wall' })).toBeVisible()
    await expect(page.getByText(/View on map/)).toHaveCount(0)
  })

  test('walk log: monthly progress, collection shelf and plate link to a filtered list', async ({ page }) => {
    const calls = trackBackendCalls(page)
    await page.goto('/demo/log')
    await expect(page.getByRole('heading', { name: 'Walk Log' })).toBeVisible()
    await expect(page.getByText('Collection shelf')).toBeVisible()
    await expect(page.getByText('Places visited')).toBeVisible()
    await expect(page.getByText('Field journal').first()).toBeVisible()

    await page.getByRole('link', { name: /Insects/ }).click()
    await expect(page).toHaveURL(/\/demo\?category=/)
    expect(calls).toEqual([])
  })

  test('record preview: sample AI suggestions fill the name, saving is disabled', async ({ page }) => {
    const calls = trackBackendCalls(page)
    await page.goto('/demo/new')
    await page.getByRole('button', { name: '✨ Suggest names with AI' }).click()
    await page.getByRole('button', { name: /Garden cosmos/ }).click()
    await expect(page.getByPlaceholder('e.g. Garden cosmos')).toHaveValue('Garden cosmos')
    await expect(page.getByRole('button', { name: 'Save (disabled in demo)' })).toBeDisabled()
    expect(calls).toEqual([])
  })

  test('unknown sample shows a not-found page', async ({ page }) => {
    await page.goto('/demo/not-a-sample')
    await expect(page.getByText('This sample find does not exist')).toBeVisible()
  })
})

test.describe('protected app', () => {
  test('signed-out visitors are sent to the login page, which links to the demo', async ({ page }) => {
    await page.goto('/home')
    await expect(page).toHaveURL(/\/login$/)
    await page.getByRole('link', { name: /デモを見る/ }).click()
    await expect(page).toHaveURL(/\/demo$/)
  })

  test('AI identification API rejects unauthenticated requests', async ({ request }) => {
    const res = await request.post('/api/identify', { multipart: { image: { name: 'a.jpg', mimeType: 'image/jpeg', buffer: Buffer.from([0xff, 0xd8, 0xff]) } } })
    expect(res.status()).toBe(401)
    expect((await res.json()).code).toBe('unauthenticated')
  })
})
