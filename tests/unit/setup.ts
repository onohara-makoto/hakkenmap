import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// テストでは Supabase の実URLを使わない（ネットワークに出たら失敗させる）
process.env.NEXT_PUBLIC_SUPABASE_URL ??= 'http://supabase.test'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= 'test-anon-key'

vi.stubGlobal('fetch', vi.fn(async (input: unknown) => {
  throw new Error(`unexpected network call in test: ${String(input)}`)
}))

afterEach(() => {
  cleanup()
})
