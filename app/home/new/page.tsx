'use client'

export const dynamic = 'force-dynamic'

import { useId, useState } from 'react'
import { useRouter } from 'next/navigation'
import PhotoUploader from '@/app/components/PhotoUploader'
import { uploadPhoto } from '@/app/lib/storage'
import { createObservation } from '@/app/lib/observations'
import { createClient } from '@/app/lib/supabase/client'
import { CATEGORIES, CATEGORY_COLORS } from '@/app/lib/categories'
import { Button } from '@/app/components/ui'
import type { ExifData } from '@/app/lib/exif'
import type { Category } from '@/app/types/observation'
import type { IdentifyResult } from '@/app/api/identify/route'

export default function NewObservationPage() {
  const router = useRouter()
  const nameId = useId()
  const memoId = useId()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [exifData, setExifData] = useState<ExifData | null>(null)
  const [category, setCategory] = useState<Category>('きのこ')
  const [name, setName] = useState('')
  const [memo, setMemo] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [isIdentifying, setIsIdentifying] = useState(false)
  const [identifyResults, setIdentifyResults] = useState<IdentifyResult[] | null>(null)
  const [selectedResultIndex, setSelectedResultIndex] = useState<number | null>(null)

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

  const handleSubmit = async (e: React.FormEvent) => {
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
          category, name: name || null, memo,
          latitude: exifData?.latitude ?? null,
          longitude: exifData?.longitude ?? null,
          observed_at: exifData?.takenAt?.toISOString() ?? null,
          photo_url: photoUrl,
        },
        user.id
      )
      if (!result) throw new Error('保存に失敗しました')
      router.push('/home')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : '予期しないエラー')
    } finally {
      setIsSubmitting(false)
    }
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
          <h1 className="text-lg font-bold text-ink">新しい発見</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="lg:grid px-5 lg:px-8 pt-4 lg:pt-0 pb-8 gap-7" style={{ gridTemplateColumns: '300px 1fr' }}>

            {/* 左カラム: 写真 + AI */}
            <div className="flex flex-col gap-3 mb-6 lg:mb-0">

              {/* 写真エリア */}
              <PhotoUploader onFileSelect={(file, exif) => {
                setSelectedFile(file)
                setExifData(exif)
                setIdentifyResults(null)
                setSelectedResultIndex(null)
              }} />

              {/* AI識別ボタン */}
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

              {/* 識別結果 */}
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

              {/* カテゴリ */}
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

              {/* 名前 */}
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

              {/* メモ */}
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

              {error && (
                <p role="alert" className="text-sm text-danger">{error}</p>
              )}

              {/* 送信ボタン */}
              <Button type="submit" variant="primary" size="lg" fullWidth loading={isSubmitting} disabled={!selectedFile}>
                {isSubmitting ? '保存中...' : '記録する'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
