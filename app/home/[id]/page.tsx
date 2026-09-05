'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getObservation, deleteObservation } from '@/app/lib/observations'
import { CATEGORY_COLORS } from '@/app/lib/categories'
import type { Observation } from '@/app/types/observation'
import Link from 'next/link'

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
      <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--bg)' }}>
        <p style={{ color: 'var(--ink-muted)' }}>読み込み中...</p>
      </div>
    )
  }

  if (!obs) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4" style={{ background: 'var(--bg)' }}>
        <button onClick={() => router.back()} style={{ color: 'var(--ink-sub)', background: 'none', border: 'none', cursor: 'pointer' }}>← 戻る</button>
        <p style={{ color: 'var(--ink-muted)' }}>記録が見つかりません</p>
      </div>
    )
  }

  const date = new Date(obs.observed_at ?? obs.created_at)
  const color = CATEGORY_COLORS[obs.category] ?? CATEGORY_COLORS['その他']

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <div className="mx-auto" style={{ maxWidth: 680 }}>

        {/* PC: 2カラムレイアウト */}
        <div className="hidden lg:block p-8">
          <button onClick={() => router.back()} style={{ color: 'var(--ink-sub)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, marginBottom: 24 }}>
            ← 一覧に戻る
          </button>
          <div className="flex gap-7">
            {/* 左: 写真 */}
            <div style={{ flex: '0 0 300px' }}>
              {obs.photo_url ? (
                <img src={obs.photo_url} alt="観察写真" style={{
                  width: '100%', aspectRatio: '1', objectFit: 'cover',
                  borderRadius: 22, boxShadow: '0 6px 16px -12px rgba(60,45,30,.3)',
                }} />
              ) : (
                <div style={{
                  width: '100%', aspectRatio: '1', borderRadius: 22,
                  background: color.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64,
                }}>🌿</div>
              )}
            </div>
            {/* 右: 詳細 */}
            <div className="flex flex-col gap-4 flex-1">
              <div>
                <span style={{ fontSize: 12, fontWeight: 500, background: color.bg, color: color.ink, borderRadius: 22, padding: '3px 10px' }}>
                  {obs.category}
                </span>
                <h1 style={{ fontSize: 30, fontWeight: 700, color: 'var(--ink)', marginTop: 8, lineHeight: 1.3 }}>
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
              <img src={obs.photo_url} alt="観察写真" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', background: color.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64 }}>🌿</div>
            )}
            <button onClick={() => router.back()} style={{
              position: 'absolute', top: 16, left: 16,
              width: 38, height: 38, borderRadius: '50%',
              background: 'rgba(255,255,255,0.9)', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(60,45,30,.2)', fontSize: 16, color: 'var(--ink)',
            }}>
              ←
            </button>
          </div>

          {/* 本文シート */}
          <div style={{
            background: 'var(--bg)', borderRadius: '26px 26px 0 0',
            marginTop: -26, padding: '24px 20px 40px', minHeight: 'calc(100vh - 244px)',
          }}>
            <div className="flex flex-col gap-4">
              <div>
                <span style={{ fontSize: 12, fontWeight: 500, background: color.bg, color: color.ink, borderRadius: 22, padding: '3px 10px' }}>
                  {obs.category}
                </span>
                <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--ink)', marginTop: 8, lineHeight: 1.3 }}>
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
      <div className="flex-1 flex flex-col items-center gap-1 py-3 px-2" style={{
        background: 'var(--surface)', borderRadius: 16, textAlign: 'center',
      }}>
        <span style={{ fontSize: 10, color: 'var(--ink-muted)', fontWeight: 500 }}>みつけた日</span>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>
          {date.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })}
        </span>
        <span style={{ fontSize: 11, color: 'var(--ink-sub)' }}>
          {date.toLocaleDateString('ja-JP', { year: 'numeric' })}
        </span>
      </div>
      {obs.location_name && (
        <div className="flex-1 flex flex-col items-center gap-1 py-3 px-2" style={{
          background: 'var(--surface)', borderRadius: 16, textAlign: 'center',
        }}>
          <span style={{ fontSize: 10, color: 'var(--ink-muted)', fontWeight: 500 }}>ばしょ</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', wordBreak: 'break-all' }}>
            {obs.location_name}
          </span>
        </div>
      )}
    </div>
  )
}

function MemoCard({ memo }: { memo: string }) {
  return (
    <div style={{ background: 'var(--surface)', borderRadius: 16, padding: '14px 16px' }}>
      <p style={{ fontSize: 10, color: 'var(--ink-muted)', fontWeight: 500, marginBottom: 6 }}>メモ</p>
      <p style={{ fontSize: 13, color: 'var(--ink-sub)', lineHeight: 1.85, whiteSpace: 'pre-wrap' }}>{memo}</p>
    </div>
  )
}

function LocationBar({ obs }: { obs: Observation }) {
  return (
    <Link href={`/home/map?focus=${obs.id}`} style={{ textDecoration: 'none'}}>
      <div className="flex items-center gap-2 px-4 py-3" style={{ background: 'var(--secondary-soft)', borderRadius: 16 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--secondary)', flexShrink: 0 }} />
        <span style={{ fontSize: 12, color: 'var(--secondary-ink)' }}>
          {obs.latitude!.toFixed(5)}, {obs.longitude!.toFixed(5)} — 地図で見る
        </span>
      </div>
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
        style={{
          width: '100%', padding: '12px 0', borderRadius: 14, fontSize: 14, fontWeight: 500,
          cursor: isDeleting ? 'not-allowed' : 'pointer', opacity: isDeleting ? 0.5 : 1,
          background: confirmDelete ? 'var(--danger)' : 'transparent',
          border: confirmDelete ? 'none' : '1px solid var(--danger-line)',
          color: confirmDelete ? '#fff' : 'var(--danger)',
          transition: 'all 0.15s',
        }}
      >
        {isDeleting ? '削除中...' : confirmDelete ? 'もう一度タップで削除' : '削除する'}
      </button>
      {confirmDelete && (
        <button onClick={onCancel} style={{
          width: '100%', marginTop: 8, padding: '8px 0', fontSize: 13,
          color: 'var(--ink-muted)', background: 'none', border: 'none', cursor: 'pointer',
        }}>
          キャンセル
        </button>
      )}
    </div>
  )
}
