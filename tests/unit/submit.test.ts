import { beforeEach, describe, expect, it } from 'vitest'
import { createFakeSupabase } from './fake-supabase'
import { saveObservation, saveObservations, supabaseSubmitDeps, SubmitError, type SubmitItem } from '@/app/lib/submit'
import { getObservations, getObservation, deleteObservation } from '@/app/lib/observations'
import { clearSignedUrlCacheForTest } from '@/app/lib/storage'

const USER = '11111111-1111-4111-8111-111111111111'

function item(n: number, gps = true): SubmitItem {
  return {
    id: `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`,
    file: new File([`photo-${n}`], `IMG_${n}.JPG`, { type: 'image/jpeg' }),
    fields: {
      category: n % 2 ? '花' : 'きのこ',
      name: `find ${n}`,
      memo: '',
      latitude: gps ? 35.7 + n / 1000 : null,
      longitude: gps ? 139.57 : null,
      observed_at: null,
    },
  }
}

beforeEach(() => clearSignedUrlCacheForTest())

describe('single save', () => {
  it('saves the photo under <user>/<observation id> and the record with photo_path', async () => {
    const fake = createFakeSupabase()
    const obs = await saveObservation(supabaseSubmitDeps(fake.client, USER), USER, item(1))
    expect(obs.photo_path).toBe(`${USER}/${item(1).id}.jpg`)
    expect(fake.objects.has(obs.photo_path!)).toBe(true)
    expect(fake.rows).toHaveLength(1)
  })

  it('does not create a record when the photo upload fails', async () => {
    const fake = createFakeSupabase({ uploadFailures: 1 })
    const err = await saveObservation(supabaseSubmitDeps(fake.client, USER), USER, item(1)).catch((e) => e)
    expect(err).toBeInstanceOf(SubmitError)
    expect(err.stage).toBe('photo')
    expect(fake.calls.insert).toBe(0)
    expect(fake.rows).toHaveLength(0)
  })

  it('removes the uploaded photo when the record could not be saved', async () => {
    const fake = createFakeSupabase({ insertFailures: 1 })
    const err = await saveObservation(supabaseSubmitDeps(fake.client, USER), USER, item(1)).catch((e) => e)
    expect(err.stage).toBe('record')
    expect(fake.rows).toHaveLength(0)
    expect(fake.objects.size).toBe(0)
  })

  it('keeps the photo when it cannot confirm whether the record exists', async () => {
    const fake = createFakeSupabase({ insertFailures: 1, findFails: true })
    await expect(saveObservation(supabaseSubmitDeps(fake.client, USER), USER, item(1))).rejects.toThrow(SubmitError)
    // 確認できないまま消すと、実は保存されていた記録の写真を失う恐れがある
    expect(fake.objects.size).toBe(1)
  })

  it('succeeds on retry after a failure', async () => {
    const fake = createFakeSupabase({ insertFailures: 1 })
    const deps = supabaseSubmitDeps(fake.client, USER)
    await expect(saveObservation(deps, USER, item(1))).rejects.toThrow()
    const obs = await saveObservation(deps, USER, item(1))
    expect(obs.id).toBe(item(1).id)
    expect(fake.rows).toHaveLength(1)
    expect(fake.objects.size).toBe(1)
  })

  it('treats a saved-but-lost response as success instead of failing', async () => {
    const fake = createFakeSupabase({ insertLostResponses: 1 })
    const obs = await saveObservation(supabaseSubmitDeps(fake.client, USER), USER, item(1))
    expect(obs.id).toBe(item(1).id)
    expect(fake.rows).toHaveLength(1)
    expect(fake.objects.size).toBe(1)
  })

  it('never creates a duplicate when the same item is submitted twice', async () => {
    const fake = createFakeSupabase()
    const deps = supabaseSubmitDeps(fake.client, USER)
    await saveObservation(deps, USER, item(1))
    await saveObservation(deps, USER, item(1))
    expect(fake.rows).toHaveLength(1)
    expect(fake.objects.size).toBe(1)
  })

  it('saves photos without GPS with null coordinates', async () => {
    const fake = createFakeSupabase()
    const obs = await saveObservation(supabaseSubmitDeps(fake.client, USER), USER, item(1, false))
    expect(obs.latitude).toBeNull()
    expect(obs.longitude).toBeNull()
  })
})

describe('bulk save', () => {
  it('reports per-item success and failure and keeps going after a failure', async () => {
    // 2件目のアップロードと3件目の保存が失敗する
    const fake = createFakeSupabase()
    const deps = supabaseSubmitDeps(fake.client, USER)
    const items = [item(1), item(2), item(3), item(4)]
    const upload = deps.upload
    let n = 0
    deps.upload = async (p, f) => { if (++n === 2) throw new Error('offline'); return upload(p, f) }
    const insert = deps.insert
    let m = 0
    deps.insert = async (row) => { if (++m === 2) throw new Error('db down'); return insert(row) }

    const progress: number[] = []
    const result = await saveObservations(deps, USER, items, (done) => progress.push(done))

    expect(result.saved.map((s) => s.id)).toEqual([items[0].id, items[3].id])
    expect(result.failed.map((f) => [f.id, f.error.stage])).toEqual([
      [items[1].id, 'photo'],
      [items[2].id, 'record'],
    ])
    expect(progress).toEqual([1, 2, 3, 4])
    // 失敗した保存の写真は片付けられている
    expect(fake.objects.has(`${USER}/${items[2].id}.jpg`)).toBe(false)
  })

  it('retrying only the failed items does not duplicate the successful ones', async () => {
    const fake = createFakeSupabase()
    const deps = supabaseSubmitDeps(fake.client, USER)
    const items = [item(1), item(2), item(3)]
    // 1回目: 2件目だけ失敗
    const insert = deps.insert
    let first = true
    deps.insert = async (row) => {
      if (row.id === items[1].id && first) { first = false; throw new Error('timeout') }
      return insert(row)
    }
    const r1 = await saveObservations(deps, USER, items)
    expect(r1.saved).toHaveLength(2)
    expect(r1.failed).toHaveLength(1)

    const retryTargets = items.filter((i) => r1.failed.some((f) => f.id === i.id))
    const r2 = await saveObservations(deps, USER, retryTargets)
    expect(r2.failed).toHaveLength(0)
    expect(fake.rows).toHaveLength(3)
    expect(new Set(fake.rows.map((r) => r.id)).size).toBe(3)
    expect(fake.objects.size).toBe(3)
  })
})

describe('record → list → detail → delete', () => {
  it('runs the full lifecycle and cleans up the photo', async () => {
    const fake = createFakeSupabase()
    const deps = supabaseSubmitDeps(fake.client, USER)
    await saveObservation(deps, USER, item(1))
    await saveObservation(deps, USER, item(2, false))

    const list = await getObservations(fake.client)
    expect(list.map((o) => o.name)).toEqual(['find 2', 'find 1'])
    expect(list.every((o) => o.photo_url?.includes('/object/sign/photos/'))).toBe(true)

    const detail = await getObservation(item(1).id, fake.client)
    expect(detail?.name).toBe('find 1')
    expect(detail?.photo_path).toBe(`${USER}/${item(1).id}.jpg`)

    expect(await deleteObservation(detail!, fake.client)).toBe(true)
    expect(await getObservation(item(1).id, fake.client)).toBeNull()
    expect(fake.objects.has(detail!.photo_path!)).toBe(false)
    expect((await getObservations(fake.client)).map((o) => o.name)).toEqual(['find 2'])
  })

  it('still deletes the record when the photo removal fails (left for the orphan cleanup)', async () => {
    const fake = createFakeSupabase()
    const obs = await saveObservation(supabaseSubmitDeps(fake.client, USER), USER, item(1))
    fake.faults.removeFailures = 1
    expect(await deleteObservation(obs, fake.client)).toBe(true)
    expect(fake.rows).toHaveLength(0)
    expect(fake.objects.size).toBe(1)
  })

  it('reports failure when nothing was deleted (e.g. another user\'s record hidden by RLS)', async () => {
    const fake = createFakeSupabase()
    expect(await deleteObservation({ id: 'not-mine', photo_path: null }, fake.client)).toBe(false)
  })
})
