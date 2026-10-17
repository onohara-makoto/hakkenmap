// どの記録からも参照されていない写真（孤立画像）を探し、必要なら削除する。
// 孤立画像ができるのは、写真のアップロード後に記録の保存が失敗して後片付けもできなかった場合や、
// 記録の削除後に写真の削除だけ失敗した場合。
//
// 使い方（既定は一覧表示のみで、何も消さない）:
//   node scripts/cleanup-orphan-photos.mjs            # 一覧
//   node scripts/cleanup-orphan-photos.mjs --delete   # 削除
//
// 必要な環境変数（.env.local でも可）:
//   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY（RLS を越えて全ユーザー分を見るため）
//
// アップロード直後で記録の保存を待っている写真を消さないよう、MIN_AGE_HOURS より新しいものは対象外。

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const MIN_AGE_HOURS = 24
const BUCKET = 'photos'

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

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceKey) {
  console.error('NEXT_PUBLIC_SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY が必要です')
  process.exit(1)
}
const shouldDelete = process.argv.includes('--delete')
const admin = createClient(url, serviceKey, { auth: { persistSession: false } })

/** app/lib/photo-path.ts の photoPathOf と同じ規則 */
function photoPathOf(row) {
  if (row.photo_path) return row.photo_path
  const m = row.photo_url?.match(/\/storage\/v1\/object\/sign\/photos\/([^?#]+)/)
  return m ? decodeURIComponent(m[1]) : null
}

async function listAll(prefix) {
  const out = []
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await admin.storage.from(BUCKET).list(prefix, { limit: 1000, offset })
    if (error) throw new Error(`list(${prefix}) failed: ${error.message}`)
    out.push(...data)
    if (data.length < 1000) return out
  }
}

async function main() {
  const { data: rows, error } = await admin.from('observations').select('photo_path, photo_url')
  if (error) throw new Error(`observations の取得に失敗: ${error.message}`)
  const referenced = new Set(rows.map(photoPathOf).filter(Boolean))

  // 保存パスは <user_id>/<file> の2階層
  const folders = (await listAll('')).filter((e) => e.id === null).map((e) => e.name)
  const cutoff = Date.now() - MIN_AGE_HOURS * 3600 * 1000
  const orphans = []
  for (const folder of folders) {
    for (const f of await listAll(folder)) {
      if (f.id === null) continue
      const path = `${folder}/${f.name}`
      if (!referenced.has(path) && new Date(f.created_at).getTime() < cutoff) {
        orphans.push({ path, size: f.metadata?.size ?? 0, created_at: f.created_at })
      }
    }
  }

  console.log(`記録 ${rows.length} 件 / 参照中の写真 ${referenced.size} 件 / 孤立画像 ${orphans.length} 件`)
  for (const o of orphans) console.log(`  ${o.created_at}  ${(o.size / 1024).toFixed(0).padStart(6)} KB  ${o.path}`)

  if (!shouldDelete || orphans.length === 0) {
    if (orphans.length > 0) console.log('\n削除するには --delete を付けて実行してください')
    return
  }
  for (let i = 0; i < orphans.length; i += 100) {
    const batch = orphans.slice(i, i + 100).map((o) => o.path)
    const { error: removeError } = await admin.storage.from(BUCKET).remove(batch)
    if (removeError) throw new Error(`削除に失敗: ${removeError.message}`)
  }
  console.log(`${orphans.length} 件を削除しました`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
