import { beforeEach, describe, expect, it } from 'vitest'
import { createFakeSupabase } from './fake-supabase'
import { buildPhotoPath, photoPathFromLegacyUrl, photoPathOf } from '@/app/lib/photo-path'
import { clearSignedUrlCacheForTest, photoContentType, withSignedPhotoUrls } from '@/app/lib/storage'

const LEGACY =
  'https://qwugcgoqyfgpmlxnjbpk.supabase.co/storage/v1/object/sign/photos/9b2f/1718000000000_ab12cd.jpg?token=eyJexpired'

beforeEach(() => {
  clearSignedUrlCacheForTest()
  localStorage.clear()
})

describe('photo paths', () => {
  it('recovers the storage path from a legacy 365-day signed URL', () => {
    expect(photoPathFromLegacyUrl(LEGACY)).toBe('9b2f/1718000000000_ab12cd.jpg')
    expect(photoPathFromLegacyUrl('https://example.com/a.jpg')).toBeNull()
  })

  it('prefers photo_path and falls back to the legacy URL', () => {
    expect(photoPathOf({ photo_path: 'u/new.jpg', photo_url: LEGACY })).toBe('u/new.jpg')
    expect(photoPathOf({ photo_path: null, photo_url: LEGACY })).toBe('9b2f/1718000000000_ab12cd.jpg')
    expect(photoPathOf({ photo_path: null, photo_url: null })).toBeNull()
  })

  it('builds a deterministic path in the owner folder', () => {
    expect(buildPhotoPath('u1', 'obs1', { name: 'IMG_1.HEIC', type: '' })).toBe('u1/obs1.heic')
    expect(buildPhotoPath('u1', 'obs1', { name: 'blob', type: 'image/png' })).toBe('u1/obs1.png')
  })

  it('fills in the content type when the browser leaves it empty (HEIC)', () => {
    expect(photoContentType({ type: '' }, 'u/x.heic')).toBe('image/heic')
    expect(photoContentType({ type: 'image/png' }, 'u/x.heic')).toBe('image/png')
  })
})

describe('withSignedPhotoUrls', () => {
  it('replaces an expired legacy URL with a freshly signed one', async () => {
    const fake = createFakeSupabase()
    fake.objects.set('9b2f/1718000000000_ab12cd.jpg', new Blob(['x']))
    const [row] = await withSignedPhotoUrls([{ photo_path: null, photo_url: LEGACY }], fake.client)
    expect(row.photo_path).toBe('9b2f/1718000000000_ab12cd.jpg')
    expect(row.photo_url).toMatch(/\/object\/sign\/photos\/9b2f\/1718000000000_ab12cd\.jpg\?token=t\d+$/)
    expect(row.photo_url).not.toBe(LEGACY)
  })

  it('reuses a cached URL until it nears expiry, then signs again', async () => {
    const fake = createFakeSupabase()
    fake.objects.set('u/a.jpg', new Blob(['x']))
    const rows = [{ photo_path: 'u/a.jpg', photo_url: null }]
    const now = Date.now()
    const [first] = await withSignedPhotoUrls(rows, fake.client, now)
    const [second] = await withSignedPhotoUrls(rows, fake.client, now + 60_000)
    expect(second.photo_url).toBe(first.photo_url)
    expect(fake.calls.sign).toBe(1)

    const [later] = await withSignedPhotoUrls(rows, fake.client, now + 24 * 3600 * 1000)
    expect(later.photo_url).not.toBe(first.photo_url)
    expect(fake.calls.sign).toBe(2)
  })

  it('signs many photos in one request and leaves missing ones empty', async () => {
    const fake = createFakeSupabase()
    fake.objects.set('u/a.jpg', new Blob(['x']))
    const out = await withSignedPhotoUrls(
      [{ photo_path: 'u/a.jpg', photo_url: null }, { photo_path: 'u/gone.jpg', photo_url: null }, { photo_path: null, photo_url: null }],
      fake.client
    )
    expect(fake.calls.sign).toBe(1)
    expect(out.map((r) => !!r.photo_url)).toEqual([true, false, false])
  })
})
