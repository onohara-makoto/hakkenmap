'use client'

import { useEffect, useRef, useState } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import { FLY_OPTIONS } from '@/app/lib/geo'

/**
 * 地図右下のコントロール群（現在地 / 全体表示）。
 * MapContainer の子として useMap() で地図インスタンスを取得する。
 * シートの peek 高さ + セーフエリアの上に配置する。
 */
export default function MapControls({ onFitAll }: { onFitAll: () => void }) {
  const map = useMap()
  const [locating, setLocating] = useState(false)
  const [denied, setDenied] = useState(false)
  const [panned, setPanned] = useState(false)
  const circleRef = useRef<L.Circle | null>(null)
  const dotRef = useRef<L.CircleMarker | null>(null)

  useEffect(() => {
    const onUserMove = () => setPanned(true)
    map.on('dragstart', onUserMove)
    map.on('zoomstart', onUserMove)
    return () => {
      map.off('dragstart', onUserMove)
      map.off('zoomstart', onUserMove)
      circleRef.current?.remove()
      dotRef.current?.remove()
    }
  }, [map])

  const locate = () => {
    if (!('geolocation' in navigator)) { setDenied(true); return }
    setLocating(true)
    setDenied(false)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords
        circleRef.current?.remove()
        dotRef.current?.remove()
        circleRef.current = L.circle([latitude, longitude], {
          radius: accuracy,
          color: '#4285F4',
          weight: 1,
          fillColor: '#4285F4',
          fillOpacity: 0.12,
        }).addTo(map)
        dotRef.current = L.circleMarker([latitude, longitude], {
          radius: 6,
          color: '#fff',
          weight: 2,
          fillColor: '#4285F4',
          fillOpacity: 1,
        }).addTo(map)
        map.flyTo([latitude, longitude], Math.max(map.getZoom(), 15), FLY_OPTIONS)
        setLocating(false)
        setPanned(false)
      },
      () => {
        setLocating(false)
        setDenied(true)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    )
  }

  const btn =
    'w-11 h-11 rounded-full bg-surface border border-line shadow-md flex items-center justify-center text-lg text-ink focus-ring disabled:opacity-50'

  return (
    <div
      className="absolute right-3 z-[500] flex flex-col gap-2"
      style={{ bottom: 'calc(56px + env(safe-area-inset-bottom) + 124px)' }}
    >
      {panned && (
        <button
          type="button"
          onClick={() => { onFitAll(); setPanned(false) }}
          aria-label="すべての発見を表示"
          className={btn}
        >
          ⤢
        </button>
      )}
      <button
        type="button"
        onClick={locate}
        disabled={locating}
        aria-label={denied ? '現在地を取得できませんでした' : '現在地へ移動'}
        aria-live="polite"
        className={btn}
      >
        {locating ? '…' : denied ? '⚠' : '◎'}
      </button>
    </div>
  )
}
