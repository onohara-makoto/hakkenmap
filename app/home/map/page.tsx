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
      <div className="h-full flex items-center justify-center bg-gray-100 text-gray-500">
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
    <div className="flex flex-col h-screen">
      <div className="flex items-center gap-3 p-4 bg-white border-b">
        <Link href="/home" className="text-gray-500 hover:text-gray-700">← 戻る</Link>
        <h1 className="font-bold">発見マップ</h1>
        {!isLoading && (
          <span className="ml-auto text-sm text-gray-500">{mappedCount} 件のピン</span>
        )}
      </div>
      <div className="flex-1 relative">
        {isLoading ? (
          <div className="h-full flex items-center justify-center text-gray-500">読み込み中...</div>
        ) : (
          <ObservationMap observations={observations} />
        )}
      </div>
      {!isLoading && mappedCount === 0 && (
        <div className="p-4 bg-amber-50 text-sm text-amber-700 text-center">
          GPS情報付きの観察記録がありません。スマホで撮影した写真を登録してみましょう。
        </div>
      )}
    </div>
  )
}
