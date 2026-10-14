import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createFakeSupabase } from './fake-supabase'
import { AppModeProvider } from '@/app/lib/app-mode'
import { SheetList } from '@/app/components/explore/SheetList'
import { DetailBody } from '@/app/components/observation/DetailBody'
import { DetailView } from '@/app/components/observation/DetailView'
import { buildDemoObservations } from '@/app/lib/demo/fixtures'
import { clearSignedUrlCacheForTest } from '@/app/lib/storage'

// ---- Next.js / Supabase のモック ----
const router = { push: vi.fn(), refresh: vi.fn(), back: vi.fn() }
let params: Record<string, string> = {}
vi.mock('next/navigation', () => ({
  useRouter: () => router,
  useParams: () => params,
  usePathname: () => '/home/new',
  useSearchParams: () => new URLSearchParams(),
  notFound: () => { throw new Error('NEXT_NOT_FOUND') },
}))

let fake = createFakeSupabase()
const USER_ID = '22222222-2222-4222-8222-222222222222'
vi.mock('@/app/lib/supabase/client', () => ({
  createClient: () =>
    Object.assign(fake.client, {
      auth: { getUser: async () => ({ data: { user: { id: USER_ID } } }) },
    }),
}))

beforeEach(() => {
  fake = createFakeSupabase()
  clearSignedUrlCacheForTest()
  vi.clearAllMocks()
  URL.createObjectURL = vi.fn(() => 'blob:preview')
})

const demo = buildDemoObservations(new Date('2026-10-14T12:00:00'))

describe('category filter', () => {
  it('shows only the selected category and can be cleared', async () => {
    const user = userEvent.setup()
    render(
      <AppModeProvider kind="demo">
        <SheetList observations={demo} isLoading={false} selectedId={null} onSelect={() => {}} />
      </AppModeProvider>
    )
    expect(screen.getByText(`${demo.length} finds`)).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Fungi' }))
    const fungi = demo.filter((o) => o.category === 'きのこ')
    expect(screen.getByText(`${fungi.length} finds`)).toBeTruthy()
    const list = screen.getByRole('list')
    expect(within(list).getAllByRole('button').map((b) => b.textContent)).toEqual(
      fungi.map((o) => expect.stringContaining(o.name!))
    )

    await user.click(screen.getByRole('button', { name: 'All' }))
    expect(screen.getByText(`${demo.length} finds`)).toBeTruthy()
  })

  it('starts filtered when opened from a collection plate (?category=)', () => {
    render(<SheetList observations={demo} isLoading={false} selectedId={null} onSelect={() => {}} initialCategory="虫" />)
    expect(screen.getByText(`${demo.filter((o) => o.category === '虫').length}件のはっけん`)).toBeTruthy()
  })
})

describe('photos without GPS', () => {
  it('shows the find without a map link', () => {
    const noGps = demo.find((o) => o.latitude === null)!
    render(<DetailBody obs={noGps} />)
    expect(screen.getByText(noGps.name!)).toBeTruthy()
    expect(screen.queryByText(/地図で見る/)).toBeNull()
  })

  it('shows a map link when the photo has coordinates', () => {
    const withGps = demo.find((o) => o.latitude !== null)!
    render(<DetailBody obs={withGps} />)
    expect(screen.getByRole('link', { name: /地図で見る/ }).getAttribute('href')).toBe(`/home?focus=${withGps.id}`)
  })
})

describe('demo detail', () => {
  it('is read-only: no delete button, explains why', async () => {
    params = { id: 'demo-01' }
    render(
      <AppModeProvider kind="demo">
        <DetailView />
      </AppModeProvider>
    )
    expect(await screen.findByText('Fly agaric')).toBeTruthy()
    expect(screen.queryByRole('button', { name: /delete/i })).toBeNull()
    expect(screen.getByText('Deleting is disabled in the demo.')).toBeTruthy()
  })
})

describe('app detail delete', () => {
  it('deletes the record and returns to the map', async () => {
    const user = userEvent.setup()
    const id = '00000000-0000-4000-8000-000000000001'
    fake.rows.push({ id, user_id: USER_ID, category: '花', name: 'ヒマワリ', memo: '', latitude: null, longitude: null,
      observed_at: null, photo_path: `${USER_ID}/${id}.jpg`, photo_url: null, created_at: '2026-10-01T00:00:00Z' })
    fake.objects.set(`${USER_ID}/${id}.jpg`, new Blob(['x']))
    params = { id }
    render(<DetailView />)

    await user.click(await screen.findByRole('button', { name: '削除する' }))
    await user.click(screen.getByRole('button', { name: 'もう一度タップで削除' }))
    await waitFor(() => expect(router.push).toHaveBeenCalledWith('/home'))
    expect(fake.rows).toHaveLength(0)
    expect(fake.objects.size).toBe(0)
  })
})

describe('AI identification failure', () => {
  it('shows a clear message on outage and lets the user retry', async () => {
    const { default: NewObservationPage } = await import('@/app/home/new/page')
    const user = userEvent.setup()
    vi.mocked(fetch)
      .mockResolvedValueOnce(Response.json({ code: 'ai_unavailable', error: 'x' }, { status: 503 }))
      .mockResolvedValueOnce(Response.json({ results: [{ name: 'Helianthus annuus', commonName: 'ヒマワリ', score: 0.9 }] }))

    render(<NewObservationPage />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(input, new File(['a'], 'a.jpg', { type: 'image/jpeg' }))

    await user.click(await screen.findByRole('button', { name: '✨ AIで名前を調べる' }))
    expect(await screen.findByRole('alert')).toHaveProperty('textContent', expect.stringContaining('混み合っています'))

    await user.click(screen.getByRole('button', { name: '✨ AIで名前を調べる' }))
    await user.click(await screen.findByRole('button', { name: /ヒマワリ/ }))
    expect((screen.getByPlaceholderText('例: オオイヌノフグリ') as HTMLInputElement).value).toBe('ヒマワリ')
    expect(fake.rows).toHaveLength(0) // 識別だけでは保存しない
  })
})

describe('bulk upload with partial failure', () => {
  it('shows counts and the failed item, then retries only the failed one', async () => {
    const { default: NewObservationPage } = await import('@/app/home/new/page')
    const user = userEvent.setup()
    fake.faults.uploadFailures = 1 // 1枚目だけアップロードに失敗

    render(<NewObservationPage />)
    const files = [
      new File(['a'], 'a.jpg', { type: 'image/jpeg' }),
      new File(['b'], 'b.jpg', { type: 'image/jpeg' }),
    ]
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(input, files)

    await user.click(await screen.findByRole('button', { name: '2件まとめて記録する' }))

    expect(await screen.findByText(/1件を記録しました。1件は失敗/)).toBeTruthy()
    expect(screen.getByText('失敗: 写真の保存に失敗しました')).toBeTruthy()
    expect(fake.rows).toHaveLength(1)
    // 成功した1枚はリストから外れ、失敗した1枚だけが残る
    expect(screen.getAllByRole('listitem')).toHaveLength(1)

    await user.click(screen.getByRole('button', { name: '失敗した1件を再試行' }))

    expect(await screen.findByText('＋2 発見！')).toBeTruthy()
    expect(fake.rows).toHaveLength(2)
    expect(fake.objects.size).toBe(2)
  })

  it('shows an error and keeps the form when a single save fails, then succeeds on retry', async () => {
    const { default: NewObservationPage } = await import('@/app/home/new/page')
    const user = userEvent.setup()
    fake.faults.insertFailures = 1

    render(<NewObservationPage />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(input, new File(['a'], 'a.jpg', { type: 'image/jpeg' }))

    const submit = await screen.findByRole('button', { name: '記録する' })
    await waitFor(() => expect((submit as HTMLButtonElement).disabled).toBe(false))
    await user.click(submit)
    expect(await screen.findByText(/記録の保存に失敗しました。もう一度「記録する」を押すと再試行できます/)).toBeTruthy()
    expect(fake.rows).toHaveLength(0)
    expect(fake.objects.size).toBe(0)

    await user.click(screen.getByRole('button', { name: '記録する' }))
    expect(await screen.findByText('＋1 発見！')).toBeTruthy()
    expect(fake.rows).toHaveLength(1)
  })
})
