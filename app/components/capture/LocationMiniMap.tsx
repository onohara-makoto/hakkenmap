'use client'

import { useEffect } from 'react'
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { TILE_URL, TILE_ATTRIBUTION, buildPinIcon } from '@/app/lib/map'

const ZOOM = 15

/** center が変わったら表示位置を追従させる（MapContainer の center は初回しか効かない） */
function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView([lat, lng], ZOOM, { animate: false })
  }, [map, lat, lng])
  return null
}

/**
 * 記録フォームの操作できないミニ地図（ピン1本）。場所名テキストが情報を担うため、
 * 読み上げ・フォーカス対象から外す（inert。帰属表示のリンクにも Tab が止まらないように）。
 * LocationField から next/dynamic(ssr:false) で読む。
 */
export default function LocationMiniMap({
  lat,
  lng,
  category,
}: {
  lat: number
  lng: number
  category: string
}) {
  return (
    <div aria-hidden="true" inert className="isolate rounded-lg overflow-hidden" style={{ height: 120 }}>
      <MapContainer
        center={[lat, lng]}
        zoom={ZOOM}
        zoomControl={false}
        dragging={false}
        touchZoom={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        boxZoom={false}
        keyboard={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer attribution={TILE_ATTRIBUTION} url={TILE_URL} maxZoom={19} />
        <Marker
          position={[lat, lng]}
          icon={buildPinIcon(category, false)}
          interactive={false}
          keyboard={false}
        />
        <Recenter lat={lat} lng={lng} />
      </MapContainer>
    </div>
  )
}
