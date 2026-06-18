'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getObservation, deleteObservation } from '@/app/lib/observations'
import type { Observation } from '@/app/types/observation'

export default function ObservationDetailPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [obs, setObs] = useState<Observation | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    getObservation(id).then((data) => { setObs(data); setIsLoading(false) })
  }, [id])

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setIsDeleting(true)
    const ok = await deleteObservation(id)
    if (ok) {
      router.push('/home')
      router.refresh()
    } else {
      setIsDeleting(false)
      setConfirmDelete(false)
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto p-6">
        <p className="text-gray-400 text-center mt-12">読み込み中...</p>
      </div>
    )
  }

  if (!obs) {
    return (
      <div className="max-w-md mx-auto p-6">
        <button onClick={() => router.back()} className="text-gray-500 mb-4">← 戻る</button>
        <p className="text-gray-500 text-center mt-12">記録が見つかりません</p>
      </div>
    )
  }

  const date = new Date(obs.observed_at ?? obs.created_at)

  return (
    <div className="max-w-md mx-auto">
      {/* 写真 */}
      {obs.photo_url ? (
        <div className="relative">
          <img src={obs.photo_url} alt="観察写真" className="w-full aspect-square object-cover" />
          <button
            onClick={() => router.back()}
            className="absolute top-4 left-4 bg-black/40 text-white rounded-full w-9 h-9 flex items-center justify-center text-lg"
          >
            ←
          </button>
        </div>
      ) : (
        <div className="p-6 pb-0">
          <button onClick={() => router.back()} className="text-gray-500">← 戻る</button>
        </div>
      )}

      <div className="p-6 space-y-4">
        {/* 名前・カテゴリ */}
        <div>
          <h1 className="text-2xl font-bold">{obs.name || obs.category}</h1>
          {obs.name && <p className="text-sm text-gray-500 mt-1">{obs.category}</p>}
        </div>

        {/* 日時・位置 */}
        <div className="bg-gray-50 text-gray-700 rounded-lg p-4 space-y-2 text-sm">
          <div className="flex gap-2">
            <span className="text-gray-400 w-16 flex-shrink-0">日時</span>
            <span>{date.toLocaleString('ja-JP')}</span>
          </div>
          {obs.latitude && obs.longitude && (
            <div className="flex gap-2">
              <span className="text-gray-400 w-16 flex-shrink-0">位置</span>
              <span>{obs.latitude.toFixed(5)}, {obs.longitude.toFixed(5)}</span>
            </div>
          )}
        </div>

        {/* メモ */}
        {obs.memo && (
          <div>
            <p className="text-xs text-gray-400 mb-1">メモ</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{obs.memo}</p>
          </div>
        )}

        {/* 削除ボタン */}
        <div className="pt-4">
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className={`w-full py-3 rounded-lg text-sm font-medium transition-colors ${
              confirmDelete
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'border border-red-400 text-red-500 hover:bg-red-50'
            } disabled:opacity-50`}
          >
            {isDeleting ? '削除中...' : confirmDelete ? 'もう一度タップで削除' : '削除する'}
          </button>
          {confirmDelete && (
            <button
              onClick={() => setConfirmDelete(false)}
              className="w-full mt-2 py-2 text-sm text-gray-500"
            >
              キャンセル
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
