// ユーザーA/Bの記録・写真が互いに見えない・操作できないことを検証するスクリプト。
// 実行には .env.local に SUPABASE_SERVICE_ROLE_KEY が必要（テストユーザーの作成・削除用）。
// 使い方: node scripts/verify-rls.mjs

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

function loadEnvLocal() {
  try {
    const text = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    for (const line of text.split('\n')) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim()
    }
  } catch {}
}
loadEnvLocal()

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !ANON_KEY) {
  console.error('NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY が必要です')
  process.exit(1)
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

let failures = 0
function check(label, ok) {
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${label}`)
  if (!ok) failures++
}

async function createTestUser(tag) {
  const email = `rls-test-${tag}-${Date.now()}@example.com`
  const password = `Test-${Math.random().toString(36).slice(2)}!`
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (error) throw new Error(`createUser(${tag}) failed: ${error.message}`)
  const client = createClient(SUPABASE_URL, ANON_KEY)
  const { error: signInError } = await client.auth.signInWithPassword({ email, password })
  if (signInError) throw new Error(`signIn(${tag}) failed: ${signInError.message}`)
  return { id: data.user.id, client }
}

async function main() {
  const userA = await createTestUser('a')
  const userB = await createTestUser('b')

  try {
    // Aの記録を1件作成
    const { data: obsA, error: insertErr } = await userA.client
      .from('observations')
      .insert({ category: 'きのこ', memo: 'rls-test', latitude: null, longitude: null, observed_at: null, photo_url: null, user_id: userA.id })
      .select()
      .single()
    if (insertErr) throw new Error(`A insert failed: ${insertErr.message}`)
    check('A は自分の記録を作成できる', !!obsA)

    // Aのストレージに1ファイルアップロード
    const path = `${userA.id}/rls-test.txt`
    const { error: uploadErr } = await userA.client.storage.from('photos').upload(path, new Blob(['test']), { upsert: true })
    check('A は自分のStorageフォルダにアップロードできる', !uploadErr)

    // --- B から A のデータへアクセス ---
    const { data: bSeesA } = await userB.client.from('observations').select('*').eq('id', obsA.id)
    check('B は A の記録をSELECTで見えない', (bSeesA ?? []).length === 0)

    const { data: bUpdateA, error: bUpdateErr } = await userB.client
      .from('observations')
      .update({ memo: 'hacked' })
      .eq('id', obsA.id)
      .select()
    check('B は A の記録をUPDATEできない', !bUpdateErr && (bUpdateA ?? []).length === 0)

    const { data: bDeleteA, error: bDeleteErr } = await userB.client
      .from('observations')
      .delete()
      .eq('id', obsA.id)
      .select()
    check('B は A の記録をDELETEできない', !bDeleteErr && (bDeleteA ?? []).length === 0)

    const { data: bListA } = await userB.client.storage.from('photos').list(userA.id)
    check('B は A のStorageフォルダを一覧できない', (bListA ?? []).length === 0)

    await userB.client.storage.from('photos').remove([path])
    const { data: stillThere } = await userA.client.storage.from('photos').list(userA.id)
    check('B は A の写真を削除できない', (stillThere ?? []).some((f) => f.name === 'rls-test.txt'))

    // A自身は引き続き見える・消せることの確認（過剰制限になっていないか）
    const { data: aSeesOwn } = await userA.client.from('observations').select('*').eq('id', obsA.id)
    check('A は自分の記録を引き続きSELECTできる', (aSeesOwn ?? []).length === 1)
  } finally {
    await admin.auth.admin.deleteUser(userA.id)
    await admin.auth.admin.deleteUser(userB.id)
    console.log('テストユーザーを削除しました')
  }

  console.log(failures === 0 ? '\n全チェック成功' : `\n${failures}件失敗`)
  process.exit(failures === 0 ? 0 : 1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
