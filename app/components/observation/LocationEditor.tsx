'use client'

import nextDynamic from 'next/dynamic'
import { useEffect, useId, useRef, useState } from 'react'
import { fetchPlaceName } from '@/app/lib/location'
import { updateObservationLocation } from '@/app/lib/observations'
import { Button, Icon } from '@/app/components/ui'
import type { Observation } from '@/app/types/observation'

const LocationMiniMap = nextDynamic(() => import('@/app/components/capture/LocationMiniMap'), {
  ssr: false,
  loading: () => <div aria-hidden="true" className="rounded-lg bg-line" style={{ height: 120 }} />,
})

const LocationPickerDialog = nextDynamic(() => import('@/app/components/capture/LocationPickerDialog'), {
  ssr: false,
})

/**
 * 詳細ページ用の位置編集部。保存済みの記録の位置を地図で選び直す。
 * 場所名は再取得し、取れなければ null で保存する（古い場所名を残さない）。
 */
export function LocationEditor({
  obs,
  onUpdated,
}: {
  obs: Observation
  onUpdated: (next: Observation) => void
}) {
  const labelId = useId()
  const groupRef = useRef<HTMLDivElement | null>(null)
  const mountedRef = useRef(true)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  const hasLocation = obs.latitude != null && obs.longitude != null

  const openPicker = () => {
    if (saving) return
    setPickerOpen(true)
  }

  const handleConfirm = async (pos: { lat: number; lng: number }) => {
    setPickerOpen(false)
    setSaving(true)
    setError(false)
    try {
      // 地図を横に回し込んだ経度を -180〜180 に、緯度を ±90 に収める
      const lat = Math.max(-90, Math.min(90, pos.lat))
      const lng = ((((pos.lng + 180) % 360) + 360) % 360) - 180
      const name = await fetchPlaceName(lat, lng)
      const row = await updateObservationLocation(obs.id, {
        latitude: lat,
        longitude: lng,
        location_name: name,
      })
      if (!mountedRef.current) return
      if (row) onUpdated(row)
      else setError(true)
    } catch {
      if (mountedRef.current) setError(true)
    } finally {
      if (mountedRef.current) setSaving(false)
    }
  }

  return (
    <div
      ref={groupRef}
      tabIndex={-1}
      role="group"
      aria-labelledby={labelId}
      className="flex flex-col gap-2 pt-6 outline-none"
    >
      <span id={labelId} className="text-sm font-medium text-ink-sub">
        場所
      </span>

      <div className="rounded-lg bg-surface p-3 flex flex-col gap-2.5">
        {hasLocation ? (
          <div className="relative">
            <LocationMiniMap lat={obs.latitude!} lng={obs.longitude!} category={obs.category} />
            {/* ミニ地図のタップでもピッカーを開く（キーボードは「場所を変更」ボタンを使う） */}
            <button
              type="button"
              tabIndex={-1}
              aria-hidden="true"
              onClick={openPicker}
              className="absolute inset-0 z-10 cursor-pointer bg-transparent border-none rounded-lg"
            />
          </div>
        ) : (
          <p className="text-xs text-ink-sub">場所が未設定です（地図には表示されません）</p>
        )}

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={openPicker}
            disabled={saving}
            loading={saving}
            iconLeft={<Icon name="map" size={16} />}
          >
            {saving ? '更新中…' : hasLocation ? '場所を変更' : '場所を追加'}
          </Button>
        </div>

        {error && (
          <p role="alert" className="text-sm font-medium text-danger">
            場所を更新できませんでした。もう一度お試しください
          </p>
        )}
      </div>

      {pickerOpen && (
        <LocationPickerDialog
          initial={hasLocation ? { lat: obs.latitude!, lng: obs.longitude! } : null}
          onConfirm={handleConfirm}
          onClose={() => setPickerOpen(false)}
          returnFocus={() => groupRef.current}
        />
      )}
    </div>
  )
}
