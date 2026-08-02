'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import PhotoUploader from '@/app/components/PhotoUploader'
import { uploadPhoto } from '@/app/lib/storage'
import { createObservation } from '@/app/lib/observations'
import { createClient } from '@/app/lib/supabase/client'
import { CATEGORIES, CATEGORY_COLORS } from '@/app/lib/categories'
import type { ExifData } from '@/app/lib/exif'
import type { Category } from '@/app/types/observation'
import type { IdentifyResult } from '@/app/api/identify/route'

export default function NewObservationPage() {
  const router = useRouter()
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
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <div className="mx-auto" style={{ maxWidth: 760 }}>

        {/* ヘッダー */}
        <div className="flex items-center gap-3 px-5 lg:px-8 pt-5 pb-4">
          <button onClick={() => router.back()} style={{
            width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
            background: 'var(--surface)', border: '1px solid var(--line)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontSize: 16, color: 'var(--ink)',
          }}>←</button>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}>新しい発見</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="lg:grid px-5 lg:px-8 pb-8 gap-7" style={{ gridTemplateColumns: '300px 1fr' }}>

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
                <button type="button" onClick={handleIdentify} disabled={isIdentifying}
                  style={{
                    padding: '10px 0', borderRadius: 14, fontSize: 14, fontWeight: 500,
                    background: 'var(--secondary-soft)', color: 'var(--secondary-ink)',
                    border: 'none', cursor: isIdentifying ? 'not-allowed' : 'pointer',
                    opacity: isIdentifying ? 0.6 : 1, transition: 'opacity 0.15s',
                  }}>
                  {isIdentifying ? '識別中...' : '✨ AIで名前を調べる'}
                </button>
              )}

              {/* 識別結果 */}
              {identifyResults !== null && (
                <div style={{ background: 'var(--surface)', borderRadius: 16, padding: '12px 14px' }}>
                  <p style={{ fontSize: 11, color: 'var(--ink-muted)', marginBottom: 8 }}>識別結果（タップで名前を入力）</p>
                  {identifyResults.length === 0 ? (
                    <p style={{ fontSize: 12, color: 'var(--ink-muted)' }}>識別できませんでした</p>
                  ) : (
                    <div className="flex flex-col gap-1">
                      {identifyResults.map((r, i) => {
                        const isSelected = selectedResultIndex === i
                        return (
                          <button key={i} type="button" onClick={() => { setName(r.commonName ?? r.name); setSelectedResultIndex(i) }}
                            style={{
                              textAlign: 'left', padding: '8px 12px', borderRadius: 10,
                              border: 'none', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8,
                              background: isSelected ? 'var(--primary)' : 'var(--bg)',
                              color: isSelected ? 'var(--on-primary)' : 'var(--ink)',
                              transition: 'background 0.15s',
                            }}>
                            <span className="flex-1 font-medium">{r.commonName ?? r.name}</span>
                            <span style={{ fontSize: 11, opacity: 0.7 }}>
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
                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-sub)', display: 'block', marginBottom: 8 }}>カテゴリ</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => {
                    const c = CATEGORY_COLORS[cat]
                    const isSelected = category === cat
                    return (
                      <button key={cat} type="button" onClick={() => setCategory(cat)}
                        style={{
                          padding: '8px 15px', borderRadius: 22, fontSize: 13, fontWeight: isSelected ? 700 : 400,
                          border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                          background: isSelected ? 'var(--primary)' : 'var(--surface)',
                          color: isSelected ? 'var(--on-primary)' : c.ink,
                          boxShadow: isSelected ? '0 4px 12px -6px rgba(206,113,80,.6)' : 'none',
                          outline: isSelected ? 'none' : `1px solid var(--line)`,
                        }}>
                        {cat}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* 名前 */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-sub)', display: 'block', marginBottom: 6 }}>
                  名前 <span style={{ fontWeight: 400, color: 'var(--ink-muted)', fontSize: 11 }}>（任意）</span>
                </label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="例: オオイヌノフグリ"
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    border: '1px solid var(--line)', borderRadius: 14, padding: '13px 14px',
                    fontSize: 14, background: 'var(--surface)', color: 'var(--ink)',
                    outline: 'none',
                  }} />
              </div>

              {/* メモ */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-sub)', display: 'block', marginBottom: 6 }}>
                  メモ <span style={{ fontWeight: 400, color: 'var(--ink-muted)', fontSize: 11 }}>（任意）</span>
                </label>
                <textarea value={memo} onChange={(e) => setMemo(e.target.value)}
                  placeholder="発見した場所の特徴、状態など..."
                  rows={4}
                  style={{
                    width: '100%', boxSizing: 'border-box', resize: 'none',
                    border: '1px solid var(--line)', borderRadius: 14, padding: '13px 14px',
                    fontSize: 14, background: 'var(--surface)', color: 'var(--ink)',
                    lineHeight: 1.7, outline: 'none',
                  }} />
              </div>

              {error && <p style={{ fontSize: 13, color: 'var(--danger)' }}>{error}</p>}

              {/* 送信ボタン */}
              <button type="submit" disabled={isSubmitting || !selectedFile}
                style={{
                  padding: '16px 0', borderRadius: 18, fontSize: 15, fontWeight: 600,
                  background: 'var(--primary)', color: 'var(--on-primary)',
                  border: 'none', cursor: isSubmitting || !selectedFile ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting || !selectedFile ? 0.5 : 1,
                  boxShadow: '0 10px 22px -10px rgba(206,113,80,.8)',
                  transition: 'opacity 0.15s',
                }}>
                {isSubmitting ? '保存中...' : '記録する'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
