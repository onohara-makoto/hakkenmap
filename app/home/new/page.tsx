'use client'

export const dynamic = 'force-dynamic'

import { useId, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import PhotoUploader from '@/app/components/PhotoUploader'
import { BulkDraftList, type Draft } from '@/app/components/BulkDraftList'
import { getObservations } from '@/app/lib/observations'
import { createClient } from '@/app/lib/supabase/client'
import { saveObservation, saveObservations, supabaseSubmitDeps, SubmitError, type SubmitItem } from '@/app/lib/submit'
import { requestIdentify, shrinkForIdentify } from '@/app/lib/identify/client'
import { extractExif } from '@/app/lib/exif'
import { CATEGORIES, CATEGORY_COLORS } from '@/app/lib/categories'
import { thisMonthProgress, currentStreakDays } from '@/app/lib/stats'
import { Button } from '@/app/components/ui'
import { CaptureSuccess } from '@/app/components/capture/CaptureSuccess'
import { IdentifyCandidates } from '@/app/components/capture/IdentifyCandidates'
import type { ExifData } from '@/app/lib/exif'
import type { Category, Observation } from '@/app/types/observation'
import type { IdentifyResult } from '@/app/lib/identify/handler'

const MONTH_GOAL = 10

const newDraft = (file: File): Draft => ({
  // 記録IDを兼ねる。再試行でも同じIDで保存するので二重登録にならない
  id: crypto.randomUUID(),
  file,
  previewUrl: URL.createObjectURL(file),
  exif: null,
  exifLoading: true,
  category: 'きのこ',
  name: '',
  status: 'idle',
})

const SUBMIT_ERROR_MESSAGES: Record<SubmitError['stage'], string> = {
  photo: '写真の保存に失敗しました',
  record: '記録の保存に失敗しました',
}

const submitErrorMessage = (e: unknown) =>
  e instanceof SubmitError ? SUBMIT_ERROR_MESSAGES[e.stage] : '保存に失敗しました'

export default function NewObservationPage() {
  const router = useRouter()
  const nameId = useId()
  const memoId = useId()
  const addMoreRef = useRef<HTMLInputElement>(null)

  // 単数モード
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  // 単数モードの記録ID。写真を選び直すまで再試行でも同じIDを使う
  const [singleId, setSingleId] = useState<string | null>(null)
  const [exifData, setExifData] = useState<ExifData | null>(null)
  const [category, setCategory] = useState<Category>('きのこ')
  const [name, setName] = useState('')
  const [memo, setMemo] = useState('')
  const [isIdentifying, setIsIdentifying] = useState(false)
  const [identifyResults, setIdentifyResults] = useState<IdentifyResult[] | null>(null)
  const [selectedResultIndex, setSelectedResultIndex] = useState<number | null>(null)

  // 一括モード（drafts が非 null なら一括）
  const [drafts, setDrafts] = useState<Draft[] | null>(null)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState<{
    observations: Observation[]
    monthCount: number
    streakDays: number
  } | null>(null)

  const bulk = drafts !== null

  // ---- ファイル選択 ----
  const loadExifInto = (list: Draft[]) => {
    for (const d of list) {
      extractExif(d.file).then((exif) => {
        setDrafts((cur) =>
          cur ? cur.map((x) => (x.id === d.id ? { ...x, exif, exifLoading: false } : x)) : cur
        )
      })
    }
  }

  const handleFilesSelected = (files: File[], firstExif: ExifData) => {
    setError('')
    if (files.length <= 1) {
      setDrafts(null)
      setSelectedFile(files[0])
      setSingleId(crypto.randomUUID())
      setExifData(firstExif)
      setIdentifyResults(null)
      setSelectedResultIndex(null)
    } else {
      setSelectedFile(null)
      const list = files.map(newDraft)
      setDrafts(list)
      loadExifInto(list)
    }
  }

  const handleAddMore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (files.length === 0) return
    const list = files.map(newDraft)
    setDrafts((cur) => (cur ? [...cur, ...list] : list))
    loadExifInto(list)
  }

  const patchDraft = (id: string, patch: Partial<Pick<Draft, 'category' | 'name'>>) =>
    setDrafts((cur) => (cur ? cur.map((d) => (d.id === id ? { ...d, ...patch } : d)) : cur))

  const removeDraft = (id: string) =>
    setDrafts((cur) => {
      const next = (cur ?? []).filter((d) => d.id !== id)
      return next.length === 0 ? null : next
    })

  // ---- AI 識別（単数のみ）----
  const handleIdentify = async () => {
    if (!selectedFile) return
    setIsIdentifying(true)
    setIdentifyResults(null)
    setSelectedResultIndex(null)
    setError('')
    try {
      const outcome = await requestIdentify(await shrinkForIdentify(selectedFile))
      if (outcome.ok) {
        setIdentifyResults(outcome.results)
      } else {
        // 結果欄は出さずにエラーだけ表示し、ボタンから再試行できるようにする
        setError(outcome.message)
      }
    } finally {
      setIsIdentifying(false)
    }
  }

  const finishWithStats = async (observations: Observation[]) => {
    const all = await getObservations()
    setSaved({
      observations,
      monthCount: thisMonthProgress(all, MONTH_GOAL).count,
      streakDays: currentStreakDays(all),
    })
    router.refresh()
  }

  // ---- 送信（単数）----
  const handleSubmitSingle = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile) { setError('写真を選択してください'); return }
    setIsSubmitting(true)
    setError('')
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('ログインが切れています。再度ログインしてください。')
      const result = await saveObservation(supabaseSubmitDeps(supabase, user.id), user.id, {
        id: singleId ?? crypto.randomUUID(),
        file: selectedFile,
        fields: {
          category,
          name: name || null,
          memo,
          latitude: exifData?.latitude ?? null,
          longitude: exifData?.longitude ?? null,
          observed_at: exifData?.takenAt?.toISOString() ?? null,
        },
      })
      await finishWithStats([result])
    } catch (err) {
      setError(
        err instanceof SubmitError
          ? `${submitErrorMessage(err)}。もう一度「記録する」を押すと再試行できます。`
          : err instanceof Error ? err.message : '予期しないエラー'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  // ---- 送信（一括）----
  // drafts の status='idle'|'failed' なものだけを対象にする。成功した draft はリストから
  // 取り除くため、同じ draft を再送信して重複登録することはない。
  const [savedResults, setSavedResults] = useState<Observation[]>([])

  const runBulkSubmit = async (targets: Draft[]) => {
    if (targets.length === 0) return
    setIsSubmitting(true)
    setError('')
    setProgress({ done: 0, total: targets.length })

    const targetIds = new Set(targets.map((t) => t.id))
    const markTargets = (patch: Partial<Draft>) =>
      setDrafts((cur) => (cur ? cur.map((d) => (targetIds.has(d.id) ? { ...d, ...patch } : d)) : cur))
    markTargets({ status: 'uploading', errorMessage: undefined })

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      markTargets({ status: 'failed', errorMessage: 'ログインが切れています' })
      setError('ログインが切れています。再度ログインしてから再試行してください。')
      setIsSubmitting(false)
      setProgress(null)
      return
    }

    const items: SubmitItem[] = targets.map((d) => ({
      id: d.id,
      file: d.file,
      fields: {
        category: d.category,
        name: d.name || null,
        memo: '',
        latitude: d.exif?.latitude ?? null,
        longitude: d.exif?.longitude ?? null,
        observed_at: d.exif?.takenAt?.toISOString() ?? null,
      },
    }))
    const { saved: newlySaved, failed } = await saveObservations(
      supabaseSubmitDeps(supabase, user.id),
      user.id,
      items,
      (done, total) => setProgress({ done, total })
    )

    // 成功分はリストから外す（同じ写真を再送信しない）。失敗分は理由を付けて残す
    const succeededIds = new Set(newlySaved.map((s) => s.id))
    const failedById = new Map(failed.map((f) => [f.id, submitErrorMessage(f.error)]))
    setDrafts((cur) => {
      if (!cur) return cur
      const remaining = cur
        .filter((d) => !succeededIds.has(d.id))
        .map((d) =>
          failedById.has(d.id) ? { ...d, status: 'failed' as const, errorMessage: failedById.get(d.id) } : d
        )
      return remaining.length === 0 ? null : remaining
    })

    const allSaved = [...savedResults, ...newlySaved.map((s) => s.observation)]
    setIsSubmitting(false)
    setProgress(null)

    if (failed.length === 0) {
      setSavedResults([])
      await finishWithStats(allSaved)
      return
    }
    setSavedResults(allSaved)
    setError(
      newlySaved.length === 0
        ? `${failed.length}件すべて保存に失敗しました。下のボタンから失敗分だけ再試行できます。`
        : `${newlySaved.length}件を記録しました。${failed.length}件は失敗したため、下のボタンから失敗分だけ再試行できます。`
    )
  }

  const handleSubmitBulk = () => {
    if (!drafts) return
    runBulkSubmit(drafts.filter((d) => d.status !== 'uploading'))
  }

  const resetForm = () => {
    setSaved(null)
    setSelectedFile(null)
    setExifData(null)
    setName('')
    setMemo('')
    setIdentifyResults(null)
    setSelectedResultIndex(null)
    setDrafts(null)
    setProgress(null)
    setSavedResults([])
    setError('')
  }

  if (saved) {
    return (
      <CaptureSuccess
        observations={saved.observations}
        monthCount={saved.monthCount}
        monthGoal={MONTH_GOAL}
        streakDays={saved.streakDays}
        onContinue={resetForm}
      />
    )
  }

  return (
    <div className="bg-bg" style={{ minHeight: '100vh' }}>
      <div className="mx-auto" style={{ maxWidth: 760 }}>
        {/* ヘッダー（スマホは AppHeader が担うため PC のみ表示） */}
        <div className="hidden lg:flex items-center gap-3 px-8 pt-5 pb-4">
          <button
            onClick={() => router.back()}
            aria-label="戻る"
            className="rounded-full border border-line bg-surface flex-shrink-0 flex items-center justify-center cursor-pointer text-base text-ink focus-ring"
            style={{ width: 34, height: 34 }}
          >
            ←
          </button>
          <h1 className="text-lg font-bold text-ink">{bulk ? 'まとめて記録' : '新しい発見'}</h1>
        </div>

        {bulk ? (
          /* ================= 一括モード ================= */
          <div className="px-5 lg:px-8 pt-4 lg:pt-0 pb-24 flex flex-col gap-4">
            <p className="text-sm text-ink-sub">
              {drafts!.length}枚を一括で記録します。位置・日付は写真から自動でセットされます。
            </p>

            <BulkDraftList drafts={drafts!} onPatch={patchDraft} onRemove={removeDraft} />

            <input
              ref={addMoreRef}
              type="file"
              accept="image/jpeg,image/png,image/heic"
              multiple
              onChange={handleAddMore}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => addMoreRef.current?.click()}
              className="rounded-lg text-sm font-medium border border-line bg-surface text-ink-sub py-2.5 focus-ring"
            >
              ＋ 写真を追加
            </button>

            {error && <p role="alert" className="text-sm text-danger">{error}</p>}

            <Button
              type="button"
              variant="primary"
              size="lg"
              fullWidth
              loading={isSubmitting}
              onClick={handleSubmitBulk}
            >
              {progress
                ? `記録中… ${progress.done} / ${progress.total}`
                : drafts!.every((d) => d.status === 'failed')
                  ? `失敗した${drafts!.length}件を再試行`
                  : `${drafts!.length}件まとめて記録する`}
            </Button>
            <button
              type="button"
              onClick={resetForm}
              disabled={isSubmitting}
              className="text-sm text-ink-muted bg-transparent border-none cursor-pointer focus-ring rounded-md py-1 disabled:opacity-50"
            >
              選び直す
            </button>
          </div>
        ) : (
          /* ================= 単数モード ================= */
          <form onSubmit={handleSubmitSingle}>
            <div
              className="lg:grid px-5 lg:px-8 pt-4 lg:pt-0 pb-8 gap-7"
              style={{ gridTemplateColumns: '300px 1fr' }}
            >
              {/* 左カラム: 写真 + AI */}
              <div className="flex flex-col gap-3 mb-6 lg:mb-0">
                <PhotoUploader multiple onFilesSelected={handleFilesSelected} />

                {selectedFile && (
                  <button
                    type="button"
                    onClick={handleIdentify}
                    disabled={isIdentifying}
                    aria-busy={isIdentifying}
                    className={[
                      'rounded-lg text-sm font-medium border-none transition-opacity focus-ring',
                      isIdentifying ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
                    ].join(' ')}
                    style={{ padding: '10px 0', background: 'var(--secondary-soft)', color: 'var(--secondary-ink)' }}
                  >
                    {isIdentifying ? '識別中...' : '✨ AIで名前を調べる'}
                  </button>
                )}

                {identifyResults !== null && (
                  <IdentifyCandidates
                    results={identifyResults}
                    selectedIndex={selectedResultIndex}
                    onSelect={(r, i) => { setName(r.commonName ?? r.name); setSelectedResultIndex(i) }}
                  />
                )}
              </div>

              {/* 右カラム: フォーム */}
              <div className="flex flex-col gap-5">
                <div>
                  <span className="text-sm font-medium text-ink-sub block mb-2">カテゴリ</span>
                  <div className="flex flex-wrap gap-2" role="group" aria-label="カテゴリを選択">
                    {CATEGORIES.map((cat) => {
                      const c = CATEGORY_COLORS[cat]
                      const isSelected = category === cat
                      return (
                        <button
                          key={cat}
                          type="button"
                          aria-pressed={isSelected}
                          onClick={() => setCategory(cat)}
                          className={[
                            'rounded-full text-sm border-none cursor-pointer transition-all focus-ring',
                            isSelected ? 'font-bold' : 'font-normal',
                          ].join(' ')}
                          style={{
                            padding: '8px 15px',
                            background: isSelected ? 'var(--primary)' : 'var(--surface)',
                            color: isSelected ? 'var(--on-primary)' : c.ink,
                            boxShadow: isSelected ? '0 4px 12px -6px rgba(206,113,80,.6)' : 'none',
                            outline: isSelected ? 'none' : '1px solid var(--line)',
                          }}
                        >
                          {cat}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <label htmlFor={nameId} className="text-sm font-medium text-ink-sub block mb-1.5">
                    名前 <span className="font-normal text-ink-muted text-xs">（任意）</span>
                  </label>
                  <input
                    id={nameId}
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="例: オオイヌノフグリ"
                    className="w-full box-border rounded-lg text-sm bg-surface text-ink border border-line focus-ring"
                    style={{ padding: '13px 14px' }}
                  />
                </div>

                <div>
                  <label htmlFor={memoId} className="text-sm font-medium text-ink-sub block mb-1.5">
                    メモ <span className="font-normal text-ink-muted text-xs">（任意）</span>
                  </label>
                  <textarea
                    id={memoId}
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    placeholder="発見した場所の特徴、状態など..."
                    rows={4}
                    className="w-full box-border rounded-lg text-sm bg-surface text-ink border border-line resize-none focus-ring"
                    style={{ padding: '13px 14px', lineHeight: 1.7 }}
                  />
                </div>

                {error && <p role="alert" className="text-sm text-danger">{error}</p>}

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={isSubmitting}
                  disabled={!selectedFile}
                >
                  {isSubmitting ? '保存中...' : '記録する'}
                </Button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
