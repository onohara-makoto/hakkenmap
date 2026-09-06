'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useParams, notFound } from 'next/navigation'
import { getObservation, deleteObservation } from '@/app/lib/observations'
import { CATEGORY_COLORS } from '@/app/lib/categories'
import type { Observation } from '@/app/types/observation'
import { Badge, Card } from '@/app/components/ui'

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
    // ルートレベルの app/home/[id]/loading.tsx がナビゲーション中の表示を担うため、
    // マウント後の再フェッチ待ちはここでは何も描画しない。
    return null
  }

  if (!obs) {
    notFound()
  }

  const date = new Date(obs.observed_at ?? obs.created_at)
  const color = CATEGORY_COLORS[obs.category] ?? CATEGORY_COLORS['その他']
  const altText = `${obs.name || obs.category}${obs.location_name ? ` (${obs.location_name})` : ''}`

  return (
    <div className="bg-bg" style={{ minHeight: '100vh' }}>
      <div className="mx-auto" style={{ maxWidth: 680 }}>

        {/* PC: 2カラムレイアウト */}
        <div className="hidden lg:block p-8">
          <button
            onClick={() => router.back()}
            className="bg-transparent border-none cursor-pointer text-ink-sub text-sm mb-6 focus-ring rounded-md px-1"
          >
            ← 一覧に戻る
          </button>
          <div className="flex gap-7">
            {/* 左: 写真 */}
            <div style={{ flex: '0 0 300px' }}>
              {obs.photo_url ? (
                <div className="relative rounded-[22px] shadow-md overflow-hidden" style={{ width: '100%', aspectRatio: '1' }}>
                  <Image src={obs.photo_url} alt={altText} fill sizes="300px" className="object-cover" />
                </div>
              ) : (
                <div
                  className="flex items-center justify-center text-6xl rounded-[22px]"
                  style={{ width: '100%', aspectRatio: '1', background: color.bg }}
                  aria-hidden="true"
                >
                  🌿
                </div>
              )}
            </div>
            {/* 右: 詳細 */}
            <div className="flex flex-col gap-4 flex-1">
              <div>
                <Badge category={obs.category} size="md" />
                <h1 className="text-3xl font-bold text-ink mt-2">
                  {obs.name || obs.category}
                </h1>
              </div>
              <InfoCards obs={obs} date={date} />
              {obs.memo && <MemoCard memo={obs.memo} />}
              {obs.latitude && obs.longitude && <LocationBar obs={obs} />}
              <DeleteButton confirmDelete={confirmDelete} isDeleting={isDeleting} onDelete={handleDelete} onCancel={() => setConfirmDelete(false)} />
            </div>
          </div>
        </div>

        {/* スマホレイアウト */}
        <div className="lg:hidden">
          {/* 写真 */}
          <div className="relative" style={{ height: 270, overflow: 'hidden', margin: '12px 0 12px 0', borderRadius: '20px 20px 0 0' }}>
            {obs.photo_url ? (
              <Image src={obs.photo_url} alt={altText} fill sizes="100vw" className="object-cover" priority />
            ) : (
              <div className="flex items-center justify-center text-6xl" style={{ width: '100%', height: '100%', background: color.bg }} aria-hidden="true">
                🌿
              </div>
            )}
            <button
              onClick={() => router.back()}
              aria-label="一覧に戻る"
              className="absolute top-4 left-4 rounded-full border-none cursor-pointer flex items-center justify-center text-base text-ink shadow-md focus-ring"
              style={{ width: 38, height: 38, background: 'rgba(255,255,255,0.9)' }}
            >
              ←
            </button>
          </div>

          {/* 本文シート */}
          <div className="bg-bg" style={{ borderRadius: '26px 26px 0 0', marginTop: -26, padding: '24px 20px 40px', minHeight: 'calc(100vh - 244px)' }}>
            <div className="flex flex-col gap-4">
              <div>
                <Badge category={obs.category} size="md" />
                <h1 className="text-2xl font-bold text-ink mt-2">
                  {obs.name || obs.category}
                </h1>
              </div>
              <InfoCards obs={obs} date={date} />
              {obs.memo && <MemoCard memo={obs.memo} />}
              {obs.latitude && obs.longitude && <LocationBar obs={obs} />}
              <DeleteButton confirmDelete={confirmDelete} isDeleting={isDeleting} onDelete={handleDelete} onCancel={() => setConfirmDelete(false)} />
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

function InfoCards({ obs, date }: { obs: Observation; date: Date }) {
  return (
    <div className="flex gap-3">
      <div className="flex-1 flex flex-col items-center gap-1 py-3 px-2 rounded-lg bg-surface text-center">
        <span className="text-xs text-ink-muted font-medium">みつけた日</span>
        <span className="text-sm font-semibold text-ink">
          {date.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })}
        </span>
        <span className="text-xs text-ink-sub">
          {date.toLocaleDateString('ja-JP', { year: 'numeric' })}
        </span>
      </div>
      {obs.location_name && (
        <div className="flex-1 flex flex-col items-center gap-1 py-3 px-2 rounded-lg bg-surface text-center">
          <span className="text-xs text-ink-muted font-medium">ばしょ</span>
          <span className="text-sm font-semibold text-ink" style={{ wordBreak: 'break-all' }}>
            {obs.location_name}
          </span>
        </div>
      )}
    </div>
  )
}

function MemoCard({ memo }: { memo: string }) {
  return (
    <Card padding="md">
      <p className="text-xs text-ink-muted font-medium mb-1.5">メモ</p>
      <p className="text-sm text-ink-sub" style={{ lineHeight: 1.85, whiteSpace: 'pre-wrap' }}>{memo}</p>
    </Card>
  )
}

function LocationBar({ obs }: { obs: Observation }) {
  return (
    <Link
      href={`/home/map?focus=${obs.id}`}
      className="flex items-center gap-2 px-4 py-3 rounded-lg no-underline focus-ring"
      style={{ background: 'var(--secondary-soft)' }}
    >
      <div className="rounded-full flex-shrink-0" style={{ width: 8, height: 8, background: 'var(--secondary)' }} aria-hidden="true" />
      <span className="text-xs" style={{ color: 'var(--secondary-ink)' }}>
        {obs.latitude!.toFixed(5)}, {obs.longitude!.toFixed(5)} — 地図で見る
      </span>
    </Link>
  )
}

function DeleteButton({ confirmDelete, isDeleting, onDelete, onCancel }: {
  confirmDelete: boolean; isDeleting: boolean; onDelete: () => void; onCancel: () => void
}) {
  return (
    <div className="pt-2">
      <button
        onClick={onDelete}
        disabled={isDeleting}
        aria-live="polite"
        className={[
          'w-full py-3 rounded-lg text-sm font-medium transition-all focus-ring',
          isDeleting ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
          confirmDelete
            ? 'bg-danger text-white border-none'
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
