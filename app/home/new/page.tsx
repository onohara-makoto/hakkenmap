'use client'

export const dynamic = 'force-dynamic'

import { useId, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import PhotoUploader from '@/app/components/PhotoUploader'
import { BulkDraftList, type Draft } from '@/app/components/BulkDraftList'
import { uploadPhoto } from '@/app/lib/storage'
import { createObservation, getObservations } from '@/app/lib/observations'
import { createClient } from '@/app/lib/supabase/client'
import { extractExif } from '@/app/lib/exif'
import { CATEGORIES, CATEGORY_COLORS } from '@/app/lib/categories'
import { thisMonthProgress, currentStreakDays } from '@/app/lib/stats'
import { Button } from '@/app/components/ui'
import { CaptureSuccess } from '@/app/components/capture/CaptureSuccess'
import type { ExifData } from '@/app/lib/exif'
import type { Category, Observation } from '@/app/types/observation'
import type { IdentifyResult } from '@/app/api/identify/route'

const MONTH_GOAL = 10

let draftSeq = 0
const newDraft = (file: File): Draft => ({
  id: `d${++draftSeq}`,
  file,
  previewUrl: URL.createObjectURL(file),
  exif: null,
  exifLoading: true,
  category: 'きのこ',
  name: '',
})

export default function NewObservationPage() {
  const router = useRouter()
  const nameId = useId()
  const memoId = useId()
  const addMoreRef = useRef<HTMLInputElement>(null)

  // 単数モード
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
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
      const form = new FormData()
      form.append('image', selectedFile)
      const res = await fetch('/api/identify', { method: 'POST', body: form })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? '識別に失敗しました')
      setIdentifyResults(json.results ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : '識別に失敗しました')
      setIdentifyResults([])
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
      if (!user) throw new Error('ログインしていません')
      const photoUrl = await uploadPhoto(selectedFile, user.id)
      const result = await createObservation(
        {
          category,
          name: name || null,
          memo,
          latitude: exifData?.latitude ?? null,
          longitude: exifData?.longitude ?? null,
          observed_at: exifData?.takenAt?.toISOString() ?? null,
          photo_url: photoUrl,
        },
        user.id
      )
      if (!result) throw new Error('保存に失敗しました')
      await finishWithStats([result])
    } catch (err) {
      setError(err instanceof Error ? err.message : '予期しないエラー')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ---- 送信（一括）----
  const handleSubmitBulk = async () => {
    if (!drafts || drafts.length === 0) return
    setIsSubmitting(true)
    setError('')
    setProgress({ done: 0, total: drafts.length })
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('ログインしていません')

      const results: Observation[] = []
      let failed = 0
      for (const d of drafts) {
        const photoUrl = await uploadPhoto(d.file, user.id)
        if (photoUrl) {
          const r = await createObservation(
            {
              category: d.category,
              name: d.name || null,
              memo: '',
              latitude: d.exif?.latitude ?? null,
              longitude: d.exif?.longitude ?? null,
              observed_at: d.exif?.takenAt?.toISOString() ?? null,
              photo_url: photoUrl,
            },
            user.id
          )
          if (r) results.push(r)
          else failed++
        } else {
          failed++
        }
        setProgress((p) => (p ? { ...p, done: p.done + 1 } : p))
      }

      if (results.length === 0) throw new Error('保存に失敗しました')
      if (failed > 0) {
        // 一部失敗でも成功分は登録済み。演出に進む前に軽く知らせる
        console.warn(`${failed}件の保存に失敗しました`)
      }
      await finishWithStats(results)
    } catch (err) {
      setError(err instanceof Error ? err.message : '予期しないエラー')
    } finally {
      setIsSubmitting(false)
      setProgress(null)
    }
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
                  <div className="rounded-lg bg-surface" style={{ padding: '12px 14px' }}>
                    <p className="text-xs text-ink-muted mb-2">識別結果（タップで名前を入力）</p>
                    {identifyResults.length === 0 ? (
                      <p className="text-xs text-ink-muted">識別できませんでした</p>
                    ) : (
                      <div className="flex flex-col gap-1">
                        {identifyResults.map((r, i) => {
                          const isSelected = selectedResultIndex === i
                          return (
                            <button
                              key={i}
                              type="button"
                              aria-pressed={isSelected}
                              onClick={() => { setName(r.commonName ?? r.name); setSelectedResultIndex(i) }}
                              className="text-left rounded-md border-none cursor-pointer text-sm flex items-center gap-2 transition-colors focus-ring"
                              style={{
                                padding: '8px 12px',
                                background: isSelected ? 'var(--primary)' : 'var(--bg)',
                                color: isSelected ? 'var(--on-primary)' : 'var(--ink)',
                              }}
                            >
                              <span className="flex-1 font-medium">{r.commonName ?? r.name}</span>
                              <span className="text-xs opacity-70">
                                {isSelected ? '✓ 選択中' : `${Math.round(r.score * 100)}%`}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
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
