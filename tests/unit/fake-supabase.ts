import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * テスト用のメモリ内 Supabase。app/lib で使っている API だけを実装し、
 * 障害（アップロード失敗・DB保存失敗・保存後に応答が失われる 等）を注入できる。
 * RLS の検証には使わない（そちらは supabase/tests/rls_test.sql で本物の Postgres に対して行う）。
 */

type Row = Record<string, unknown> & { id: string; created_at: string }
type Result<T> = { data: T; error: null } | { data: null; error: { message: string; code?: string; statusCode?: string } }

export type Faults = {
  /** 次の n 回のアップロードを失敗させる */
  uploadFailures?: number
  /** 次の n 回の insert を、保存せずに失敗させる */
  insertFailures?: number
  /** 次の n 回の insert を、保存はしたうえで失敗として返す（応答が失われたケース） */
  insertLostResponses?: number
  /** 次の n 回の写真削除を失敗させる */
  removeFailures?: number
  /** 存在確認（maybeSingle）を失敗させる */
  findFails?: boolean
}

export function createFakeSupabase(faults: Faults = {}) {
  const rows: Row[] = []
  const objects = new Map<string, Blob>()
  let clock = Date.parse('2026-10-01T00:00:00Z')
  let signCount = 0
  const calls = { upload: 0, insert: 0, remove: 0, sign: 0 }

  class Query<T> implements PromiseLike<Result<T>> {
    private filters: [string, unknown][] = []
    private mode: 'select' | 'insert' | 'delete' = 'select'
    private payload: Record<string, unknown> | null = null
    private singleMode: 'single' | 'maybe' | null = null
    private orderDesc = false

    select() { return this }
    insert(p: Record<string, unknown>) { this.mode = 'insert'; this.payload = p; return this }
    delete() { this.mode = 'delete'; return this }
    eq(col: string, val: unknown) { this.filters.push([col, val]); return this }
    order(_col: string, opts?: { ascending?: boolean }) { this.orderDesc = opts?.ascending === false; return this }
    maybeSingle() { this.singleMode = 'maybe'; return this }
    single() { this.singleMode = 'single'; return this }

    private match = (r: Row) => this.filters.every(([c, v]) => r[c] === v)

    private run(): Result<unknown> {
      if (this.mode === 'insert') {
        calls.insert++
        if (faults.insertFailures) { faults.insertFailures--; return { data: null, error: { message: 'connection reset' } } }
        const row = { ...this.payload, created_at: new Date((clock += 1000)).toISOString() } as Row
        if (rows.some((r) => r.id === row.id)) {
          return { data: null, error: { message: 'duplicate key value violates unique constraint', code: '23505' } }
        }
        rows.push(row)
        if (faults.insertLostResponses) { faults.insertLostResponses--; return { data: null, error: { message: 'network timeout' } } }
        return { data: { ...row }, error: null }
      }
      if (this.mode === 'delete') {
        const hit = rows.filter(this.match)
        for (const r of hit) rows.splice(rows.indexOf(r), 1)
        return { data: hit.map((r) => ({ id: r.id })), error: null }
      }
      if (this.singleMode === 'maybe' && faults.findFails) return { data: null, error: { message: 'find failed' } }
      let out = rows.filter(this.match).map((r) => ({ ...r }))
      if (this.orderDesc) out = out.sort((a, b) => b.created_at.localeCompare(a.created_at))
      if (this.singleMode) return { data: out[0] ?? null, error: null }
      return { data: out, error: null }
    }

    then<R1 = Result<T>, R2 = never>(
      ok?: ((v: Result<T>) => R1 | PromiseLike<R1>) | null,
      ng?: ((e: unknown) => R2 | PromiseLike<R2>) | null
    ) {
      return Promise.resolve(this.run() as Result<T>).then(ok, ng)
    }
  }

  const bucket = {
    async upload(path: string, file: Blob) {
      calls.upload++
      if (faults.uploadFailures) { faults.uploadFailures--; return { data: null, error: { message: 'upload failed' } } }
      if (objects.has(path)) return { data: null, error: { message: 'The resource already exists', statusCode: '409' } }
      objects.set(path, file)
      return { data: { path }, error: null }
    },
    async remove(paths: string[]) {
      calls.remove++
      if (faults.removeFailures) { faults.removeFailures--; return { data: null, error: { message: 'remove failed' } } }
      paths.forEach((p) => objects.delete(p))
      return { data: paths.map((name) => ({ name })), error: null }
    },
    async createSignedUrls(paths: string[]) {
      calls.sign++
      return {
        data: paths.map((p) =>
          objects.has(p)
            ? { path: p, error: null, signedUrl: `http://supabase.test/storage/v1/object/sign/photos/${p}?token=t${++signCount}` }
            : { path: p, error: 'Object not found', signedUrl: null }
        ),
        error: null,
      }
    },
  }

  const client = {
    from: () => new Query(),
    storage: { from: () => bucket },
  } as unknown as SupabaseClient

  return { client, rows, objects, calls, faults }
}
