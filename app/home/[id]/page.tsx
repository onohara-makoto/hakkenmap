'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useRouter, useParams, notFound } from 'next/navigation'
import { getObservation, deleteObservation } from '@/app/lib/observations'
import { CATEGORY_COLORS } from '@/app/lib/categories'
import { DetailBody } from '@/app/components/observation/DetailBody'
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

  // マウント後の再フェッチ待ちは app/home/[id]/loading.tsx が担う
  if (isLoading) return null
  if (!obs) notFound()

  const color = CATEGORY_COLORS[obs.category] ?? CATEGORY_COLORS['その他']
  const altText = `${obs.name || obs.category}${obs.location_name ? ` (${obs.location_name})` : ''}`

  return (
    <div className="bg-bg" style={{ minHeight: '100vh' }}>
      <div className="mx-auto" style={{ maxWidth: 680 }}>
        <button
          onClick={() => router.back()}
          className="hidden lg:block bg-transparent border-none cursor-pointer text-ink-sub text-sm mt-6 ml-8 focus-ring rounded-md px-1"
        >
          ← 一覧に戻る
        </button>

        <div className="lg:flex lg:gap-7 lg:p-8">
          {/* 写真 */}
          <div className="lg:w-[300px] lg:flex-shrink-0">
            {obs.photo_url ? (
              <div
                className="relative overflow-hidden lg:rounded-[22px] lg:shadow-md"
                style={{ width: '100%', aspectRatio: '1' }}
              >
                <Image
                  src={obs.photo_url}
                  alt={altText}
                  fill
                  sizes="(min-width:1024px) 300px, 100vw"
                  className="object-cover"
                  priority
                />
              </div>
            ) : (
              <div
                className="flex items-center justify-center text-6xl lg:rounded-[22px]"
                style={{ width: '100%', aspectRatio: '1', background: color.bg }}
                aria-hidden="true"
              >
                🌿
              </div>
            )}
          </div>

          {/* 本文 */}
          <div className="flex-1 px-5 lg:px-0 pt-5 lg:pt-0 pb-10">
            <DetailBody obs={obs} />
            <div className="pt-6">
              <DeleteButton
                confirmDelete={confirmDelete}
                isDeleting={isDeleting}
                onDelete={handleDelete}
                onCancel={() => setConfirmDelete(false)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function DeleteButton({
  confirmDelete,
  isDeleting,
  onDelete,
  onCancel,
}: {
  confirmDelete: boolean
  isDeleting: boolean
  onDelete: () => void
  onCancel: () => void
}) {
  return (
    <div>
      <button
        onClick={onDelete}
        disabled={isDeleting}
        aria-live="polite"
        className={[
          'w-full py-3 rounded-lg text-sm font-medium transition-all focus-ring',
          isDeleting ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
          confirmDelete
            ? 'bg-danger text-on-primary border-none'
            : 'bg-transparent text-danger border border-danger-line',
        ].join(' ')}
      >
        {isDeleting ? '削除中...' : confirmDelete ? 'もう一度タップで削除' : '削除する'}
      </button>
      {confirmDelete && (
        <button
          onClick={onCancel}
          className="w-full mt-2 py-2 text-sm text-ink-muted bg-transparent border-none cursor-pointer focus-ring rounded-md"
        >
          キャンセル
        </button>
      )}
    </div>
  )
}
