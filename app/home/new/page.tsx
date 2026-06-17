'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import PhotoUploader from '@/app/components/PhotoUploader'
import { uploadPhoto } from '@/app/lib/storage'
import { createObservation } from '@/app/lib/observations'
import { createClient } from '@/app/lib/supabase/client'
import type { ExifData } from '@/app/lib/exif'
import type { Category } from '@/app/types/observation'
import type { IdentifyResult } from '@/app/api/identify/route'

const CATEGORIES: Category[] = ['木', '草', '花', 'きのこ', '虫', 'その他']


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
      router.push('/home')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : '予期しないエラー')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-gray-500">← 戻る</button>
        <h1 className="text-xl font-bold">新しい発見を記録</h1>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <section>
          <h2 className="font-medium mb-2">写真 *</h2>
          <PhotoUploader onFileSelect={(file, exif) => {
            setSelectedFile(file)
            setExifData(exif)
            setIdentifyResults(null)
            setSelectedResultIndex(null)
          }} />

          {/* 識別ボタン */}
          {selectedFile && (
            <div className="mt-3">
              <button
                type="button"
                onClick={handleIdentify}
                disabled={isIdentifying}
                className="w-full border border-green-600 text-green-600 py-2 rounded-lg text-sm
                           hover:bg-green-50 transition-colors disabled:opacity-50"
              >
                {isIdentifying ? '識別中...' : '🔍 植物・きのこを識別する'}
              </button>
            </div>
          )}

          {/* 識別結果 */}
          {identifyResults !== null && (
            <div className="mt-3 bg-green-50 rounded-lg p-3">
              <p className="text-xs font-medium text-green-800 mb-2">識別結果（タップで名前を入力）</p>
              {identifyResults.length === 0 ? (
                <p className="text-xs text-gray-500">識別できませんでした</p>
              ) : (
                <div className="space-y-1">
                  {identifyResults.map((r, i) => {
                    const isSelected = selectedResultIndex === i
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setName(r.commonName ?? r.name)
                          setSelectedResultIndex(i)
                        }}
                        className={`w-full text-left px-3 py-2 rounded border transition-colors text-sm flex items-center gap-2 ${
                          isSelected
                            ? 'bg-green-600 text-white border-green-600'
                            : 'bg-white text-gray-900 border-green-200 hover:border-green-500'
                        }`}
                      >
                        <span className="flex-1">
                          <span className="font-medium">{r.commonName ?? r.name}</span>
                          {r.commonName && (
                            <span className={`text-xs ml-1 ${isSelected ? 'text-green-100' : 'text-gray-400'}`}>
                              ({r.name})
                            </span>
                          )}
                        </span>
                        <span className={`text-xs flex-shrink-0 ${isSelected ? 'text-green-100' : 'text-gray-400'}`}>
                          {isSelected ? '✓ 選択中' : `${Math.round(r.score * 100)}%`}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </section>

        <section>
          <h2 className="font-medium mb-2">カテゴリ</h2>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => { setCategory(cat); setOrgan('habit') }}
                className={`py-2 px-3 rounded-lg border text-sm ${
                  category === cat
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-white text-gray-700 border-gray-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-medium mb-2">名前（任意）</h2>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例: オオイヌノフグリ"
            className="w-full border border-gray-300 rounded-lg p-3 text-sm bg-white text-gray-900 placeholder-gray-400"
          />
        </section>

        <section>
          <h2 className="font-medium mb-2">メモ（任意）</h2>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="発見した場所の特徴、状態など..."
            rows={3}
            className="w-full border border-gray-300 rounded-lg p-3 text-sm resize-none bg-white text-gray-900 placeholder-gray-400"
          />
        </section>

        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={isSubmitting || !selectedFile}
          className="w-full bg-green-600 text-white py-3 rounded-lg font-medium
                     disabled:opacity-50 hover:bg-green-700 transition-colors"
        >
          {isSubmitting ? '保存中...' : '記録する'}
        </button>
      </form>
    </div>
  )
}
