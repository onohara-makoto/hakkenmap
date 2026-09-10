'use client'

import nextDynamic from 'next/dynamic'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { getObservations } from '@/app/lib/observations'
import { Spinner } from '@/app/components/ui'
import { useExploreState } from './useExploreState'
import { BottomSheet } from './BottomSheet'
import { SheetList } from './SheetList'
import { SheetDetail } from './SheetDetail'
import type { ObservationMapHandle } from '@/app/components/ObservationMap'
import type { Observation } from '@/app/types/observation'

const DESKTOP_PANEL = 384

const ObservationMap = nextDynamic(() => import('@/app/components/ObservationMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex flex-col items-center justify-center gap-3 bg-bg text-ink-muted">
      <Spinner />
      <span className="text-sm">地図を読み込み中…</span>
    </div>
  ),
})

export default function ExploreShell() {
  const [observations, setObservations] = useState<Observation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [state, dispatch] = useExploreState()
  const mapRef = useRef<ObservationMapHandle>(null)
  const params = useSearchParams()
  const focusId = params.get('focus')

  const didFitRef = useRef(false)

  useEffect(() => {
    getObservations().then((d) => { setObservations(d); setIsLoading(false) })
  }, [])

  const leftInset = () =>
    typeof window !== 'undefined' && window.innerWidth >= 1024 ? DESKTOP_PANEL : 0

  useEffect(() => {
    if (isLoading || didFitRef.current || focusId) return
    didFitRef.current = true
    const t = setTimeout(() => mapRef.current?.fitAll(leftInset()), 250)
    return () => clearTimeout(t)
  }, [isLoading, focusId])

  const selected = observations.find((o) => o.id === state.selectedId) ?? null
  const idx = selected ? observations.findIndex((o) => o.id === selected.id) : -1

  const selectPin = useCallback(
    (id: string) => {
      dispatch({ type: 'selectPin', id, bounds: mapRef.current?.getBounds() ?? null })
    },
    [dispatch]
  )

  const selectRow = useCallback(
    (id: string) => {
      const o = observations.find((x) => x.id === id)
      dispatch({ type: 'selectRow', id, bounds: mapRef.current?.getBounds() ?? null })
      if (o?.latitude != null && o?.longitude != null) {
        mapRef.current?.flyTo(o.latitude, o.longitude, 15)
      }
    },
    [dispatch, observations]
  )

  const closeDetail = useCallback(() => {
    if (state.savedBounds) mapRef.current?.fitBounds(state.savedBounds, leftInset())
    dispatch({ type: 'closeDetail' })
    dispatch({ type: 'clearSaved' })
  }, [dispatch, state.savedBounds])

  useEffect(() => {
    if (!focusId || isLoading) return
    const o = observations.find((x) => x.id === focusId)
    if (o?.latitude == null || o?.longitude == null) return
    dispatch({ type: 'selectRow', id: o.id, bounds: null })
    const t = setTimeout(() => mapRef.current?.flyTo(o.latitude!, o.longitude!, 15), 350)
    return () => clearTimeout(t)
  }, [focusId, isLoading, observations, dispatch])

  const body = selected ? (
    <SheetDetail
      obs={selected}
      onClose={closeDetail}
      onPrev={() => idx > 0 && selectRow(observations[idx - 1].id)}
      onNext={() => idx >= 0 && idx < observations.length - 1 && selectRow(observations[idx + 1].id)}
      hasPrev={idx > 0}
      hasNext={idx >= 0 && idx < observations.length - 1}
    />
  ) : (
    <SheetList
      observations={observations}
      isLoading={isLoading}
      selectedId={state.selectedId}
      onSelect={selectRow}
    />
  )

  return (
    <div className="fixed inset-0 z-0">
      {/* isolate で Leaflet 内部の高い z-index を閉じ込め、シート/パネルが前面に出るようにする */}
      <div className="absolute inset-0 isolate z-0">
        <ObservationMap
          ref={mapRef}
          observations={observations}
          selectedId={state.selectedId}
          onSelectPin={selectPin}
          onMapClick={() => { if (state.selectedId) closeDetail() }}
        />
      </div>

      {/* デスクトップ: 左ドックパネル（常設） */}
      <aside
        className="hidden lg:flex flex-col absolute left-0 bottom-0 z-20 bg-surface border-r border-line shadow-lg"
        style={{ top: 56, width: DESKTOP_PANEL }}
        aria-label="観察記録リスト"
      >
        <div className="px-5 py-3 border-b border-line flex items-center justify-between">
          <span className="text-sm font-bold text-ink">
            {selected ? '発見の詳細' : 'わたしの発見'}
          </span>
          {!isLoading && !selected && (
            <span className="text-xs text-ink-muted">{observations.length}件</span>
          )}
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{body}</div>
      </aside>

      {/* モバイル: ボトムシート */}
      <div className="lg:hidden">
        <BottomSheet
          detent={state.detent}
          onDetentChange={(d) => dispatch({ type: 'setDetent', detent: d })}
          ariaLabel="観察記録リスト"
          peekContent={
            <p className="text-sm text-ink-sub text-center pt-1">
              {isLoading ? '読み込み中…' : `${observations.length}件の発見`}
              <span className="text-ink-muted"> ・ 上にスワイプで一覧</span>
            </p>
          }
        >
          {body}
        </BottomSheet>
      </div>
    </div>
  )
}
