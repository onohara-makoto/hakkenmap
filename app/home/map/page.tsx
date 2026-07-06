'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getObservations } from '@/app/lib/observations'
import type { Observation } from '@/app/types/observation'

const ObservationMap = dynamic(
  () => import('@/app/components/ObservationMap'),
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center" style={{ background: 'var(--bg)', color: 'var(--ink-muted)' }}>
        地図を読み込み中...
      </div>
    ),
  }
)

export default function MapPage() {
  const [observations, setObservations] = useState<Observation[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getObservations().then((data) => { setObservations(data); setIsLoading(false) })
  }, [])

  const mappedCount = observations.filter((o) => o.latitude && o.longitude).length

  return (
    <div className="flex flex-col h-screen" style={{ background: 'var(--bg)' }}>

      {/* ヘッダー */}
      <div className="flex items-center gap-3 px-5 py-3 flex-shrink-0" style={{ background: 'var(--bg)' }}>
        <Link href="/home" style={{
          width: 34, height: 34, borderRadius: '50%',
          background: 'var(--surface)', border: '1px solid var(--line)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, color: 'var(--ink)', textDecoration: 'none', flexShrink: 0,
          boxShadow: '0 2px 8px rgba(60,45,30,.08)',
        }}>←</Link>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)', flex: 1 }}>発見マップ</h1>
        {!isLoading && (
          <span style={{
            fontSize: 12, fontWeight: 500, padding: '4px 10px', borderRadius: 22,
            background: 'var(--secondary-soft)', color: 'var(--secondary-ink)',
          }}>
            {mappedCount} ピン
          </span>
        )}
      </div>

      {/* GPS無し警告 */}
      {!isLoading && mappedCount === 0 && (
        <div className="px-5 pb-2">
          <div style={{
            padding: '10px 14px', borderRadius: 12, fontSize: 13,
            background: 'var(--tag-warm-bg)', color: 'var(--tag-warm-ink)',
          }}>
            GPS情報付きの観察記録がありません。スマホで撮影した写真を登録してみましょう。
          </div>
        </div>
      )}

      {/* 地図 */}
      <div className="flex-1 relative" style={{ borderRadius: '16px 16px 0 0', overflow: 'hidden' }}>
        {isLoading ? (
          <div className="h-full flex items-center justify-center" style={{ color: 'var(--ink-muted)' }}>読み込み中...</div>
        ) : (
          <ObservationMap observations={observations} />
        )}
      </div>
    </div>
  )
}
