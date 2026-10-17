import type { SupabaseClient } from '@supabase/supabase-js'
import { buildPhotoPath } from '@/app/lib/photo-path'
import { uploadPhoto, deletePhoto } from '@/app/lib/storage'
import { createObservation, findObservation } from '@/app/lib/observations'
import type { Observation, ObservationInsert } from '@/app/types/observation'

/**
 * 写真付きの記録を保存する処理。UI から切り離して、失敗・再試行の振る舞いをテストできるようにしている。
 *
 * 二重登録を防ぐ仕組み:
 *  - 記録ID（UUID）は写真を選んだ時点でクライアントが決め、再試行でも同じIDを使う
 *  - 写真のパスも記録IDから決まるので、再試行で別の写真ファイルが増えない
 *  - DB は主キーの一意制約で同じIDの2件目を拒否し、createObservation は既存の記録を返す
 */

export type SubmitStage = 'photo' | 'record'

export class SubmitError extends Error {
  constructor(readonly stage: SubmitStage, cause?: unknown) {
    super(stage === 'photo' ? '写真の保存に失敗しました' : '記録の保存に失敗しました', { cause })
  }
}

export type SubmitDeps = {
  upload: (path: string, file: File) => Promise<void>
  insert: (row: ObservationInsert & { id: string }) => Promise<Observation>
  /** 保存済みかの確認。insert が失敗しても実際には保存されていた場合を見分ける */
  find: (id: string) => Promise<Observation | null>
  removePhoto: (path: string) => Promise<void>
}

export type SubmitItem = {
  /** 記録ID（UUID）。同じ下書きの再試行では同じ値を渡す */
  id: string
  file: File
  fields: Omit<ObservationInsert, 'photo_path'>
}

export function supabaseSubmitDeps(client: SupabaseClient, userId: string): SubmitDeps {
  return {
    upload: (path, file) => uploadPhoto(path, file, client),
    insert: (row) => createObservation(row, userId, client),
    find: (id) => findObservation(id, client),
    removePhoto: (path) => deletePhoto(path, client),
  }
}

/** 1件保存する。写真・記録のどちらかが失敗したら SubmitError を投げる（成功扱いにしない） */
export async function saveObservation(deps: SubmitDeps, userId: string, item: SubmitItem): Promise<Observation> {
  const path = buildPhotoPath(userId, item.id, item.file)

  try {
    await deps.upload(path, item.file)
  } catch (e) {
    throw new SubmitError('photo', e)
  }

  try {
    return await deps.insert({ ...item.fields, id: item.id, photo_path: path })
  } catch (insertError) {
    // 応答が失われただけで保存済みの可能性がある。確認できたらそれを成功とする
    let existing: Observation | null = null
    let confirmedAbsent = false
    try {
      existing = await deps.find(item.id)
      confirmedAbsent = existing === null
    } catch {}
    if (existing) return existing

    // 記録が無いと確認できたときだけ写真を消す（確認できないときは消すと記録の写真を失う恐れがある）。
    // 消せなかった写真は再試行で再利用されるか、孤立画像の掃除スクリプトで回収される
    if (confirmedAbsent) {
      try {
        await deps.removePhoto(path)
      } catch (e) {
        console.error('孤立した写真の削除に失敗:', e)
      }
    }
    throw new SubmitError('record', insertError)
  }
}

export type BulkResult = {
  saved: { id: string; observation: Observation }[]
  failed: { id: string; error: SubmitError }[]
}

/** 複数件を順に保存する。1件の失敗で止めず、成功・失敗を件ごとに返す */
export async function saveObservations(
  deps: SubmitDeps,
  userId: string,
  items: SubmitItem[],
  onProgress?: (done: number, total: number) => void
): Promise<BulkResult> {
  const result: BulkResult = { saved: [], failed: [] }
  for (const [i, item] of items.entries()) {
    try {
      result.saved.push({ id: item.id, observation: await saveObservation(deps, userId, item) })
    } catch (e) {
      result.failed.push({ id: item.id, error: e instanceof SubmitError ? e : new SubmitError('record', e) })
    }
    onProgress?.(i + 1, items.length)
  }
  return result
}
