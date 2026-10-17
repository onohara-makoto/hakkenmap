'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useRouter, useParams, notFound } from 'next/navigation'
import { CATEGORY_COLORS } from '@/app/lib/categories'
import { useAppMode } from '@/app/lib/app-mode'
import { forgetSignedPhotoUrl } from '@/app/lib/storage'
import { DetailBody } from '@/app/components/observation/DetailBody'
import type { Observation } from '@/app/types/observation'

/** 記録の詳細画面。/home/[id]（本人の記録）と /demo/[id]（閲覧専用サンプル）で共用する */
export function DetailView() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const { source, base, t } = useAppMode()
  const [obs, setObs] = useState<Observation | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    source.get(id).then((data) => { setObs(data); setIsLoading(false) })
  }, [id, source])

  const remove = source.remove
  const handleDelete = async () => {
    if (!obs || !remove) return
    if (!confirmDelete) { setConfirmDelete(true); return }
    setIsDeleting(true)
    setDeleteError('')
    const ok = await remove(obs)
    if (ok) {
      router.push(base)
      router.refresh()
    } else {
      setIsDeleting(false)
      setConfirmDelete(false)
      setDeleteError(t.detail.deleteFailed)
    }
  }

  // マウント後の再フェッチ待ちは app/home/[id]/loading.tsx が担う
  if (isLoading) return null
  if (!obs) notFound()

  const color = CATEGORY_COLORS[obs.category] ?? CATEGORY_COLORS['その他']
  const altText = `${obs.name || t.categoryLabel(obs.category)}${obs.location_name ? ` (${obs.location_name})` : ''}`

  return (
    <div className="bg-bg" style={{ minHeight: '100vh' }}>
      <div className="mx-auto" style={{ maxWidth: 680 }}>
        <button
          onClick={() => router.back()}
          className="hidden lg:block bg-transparent border-none cursor-pointer text-ink-sub text-sm mt-6 ml-8 focus-ring rounded-md px-1"
        >
          {t.detail.backToList}
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
                  onError={() => obs.photo_path && forgetSignedPhotoUrl(obs.photo_path)}
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
              {remove ? (
                <>
                  <DeleteButton
                    confirmDelete={confirmDelete}
                    isDeleting={isDeleting}
                    onDelete={handleDelete}
                    onCancel={() => setConfirmDelete(false)}
                  />
                  {deleteError && <p role="alert" className="text-sm text-danger mt-2">{deleteError}</p>}
                </>
              ) : (
                <p className="text-xs text-ink-muted text-center">{t.detail.deleteDisabled}</p>
              )}
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
  const { t } = useAppMode()
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
        {isDeleting ? t.detail.deleting : confirmDelete ? t.detail.confirmDelete : t.detail.delete}
      </button>
      {confirmDelete && (
        <button
          onClick={onCancel}
          className="w-full mt-2 py-2 text-sm text-ink-muted bg-transparent border-none cursor-pointer focus-ring rounded-md"
        >
          {t.detail.cancel}
        </button>
      )}
    </div>
  )
}
