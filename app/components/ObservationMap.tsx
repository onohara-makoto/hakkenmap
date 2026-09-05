'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { CATEGORY_COLORS } from '@/app/lib/categories'
import type { Observation } from '@/app/types/observation'

function createTearDrop(color: string): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:26px;height:26px;
      background:${color};
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      box-shadow:0 3px 10px rgba(0,0,0,.25);
      display:flex;align-items:center;justify-content:center;
    "><div style="
      width:9px;height:9px;border-radius:50%;background:#fff;
      transform:rotate(45deg);
    "></div></div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 26],
    popupAnchor: [0, -28],
  })
}

function MapClickHandler({ onMapClick }: { onMapClick: () => void }) {
  useMapEvents({ click: onMapClick })
  return null
}

function MapFocusHandler({ target }: { target: Observation | null }) {
  const map = useMap()
  useEffect(() => {
    if (target?.latitude && target.longitude) {
      map.setView([target.latitude, target.longitude], 15)
    }
  }, [target, map])
  return null
}

export default function ObservationMap({ observations, focusId }: { observations: Observation[], focusId: string | null }) {
  const [selected, setSelected] = useState<Observation | null>(null)
  const focusTarget = focusId ? observations.find((o) => o.id === focusId) || null : null

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (L.Icon.Default.prototype as any)._getIconUrl
  }, [])

  const mapped = observations.filter((o) => o.latitude !== null && o.longitude !== null)
  const center: [number, number] = mapped.length > 0
    ? [mapped[0].latitude!, mapped[0].longitude!]
    : [36.2048, 138.2529]

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative' }}>
      <MapContainer center={center} zoom={mapped.length > 0 ? 13 : 5} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickHandler onMapClick={() => setSelected(null)} />
        <MapFocusHandler target={focusTarget} />
        {mapped.map((obs) => {
          const color = CATEGORY_COLORS[obs.category]?.dot ?? '#B4A992'
          return (
            <Marker
              key={obs.id}
              position={[obs.latitude!, obs.longitude!]}
              icon={createTearDrop(color)}
              eventHandlers={{ click: () => setSelected(obs) }}
            />
          )
        })}
      </MapContainer>

      {/* 選択時フローティングカード */}
      {selected && (
        <div style={{
          position: 'absolute', bottom: 24, left: 16, right: 16, zIndex: 1000,
          background: '#fff', borderRadius: 18, padding: '12px 14px',
          boxShadow: '0 8px 24px rgba(60,45,30,.2)',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          {selected.photo_url && (
            <img src={selected.photo_url} alt="" style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 12, flexShrink: 0 }} />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }} className="truncate">
              {selected.name || selected.category}
            </p>
            <p style={{ fontSize: 11, color: 'var(--ink-muted)' }}>
              {selected.location_name ? `${selected.location_name} · ` : ''}
              {new Date(selected.observed_at ?? selected.created_at).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })}
            </p>
          </div>
          <a href={`/home/${selected.id}`} style={{
            fontSize: 18, color: 'var(--ink-sub)', textDecoration: 'none', flexShrink: 0,
          }}>›</a>
        </div>
      )}
    </div>
  )
}
