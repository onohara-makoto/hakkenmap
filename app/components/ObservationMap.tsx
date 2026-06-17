'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Observation } from '@/app/types/observation'

const fixLeafletIcon = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  })
}

export default function ObservationMap({ observations }: { observations: Observation[] }) {
  useEffect(() => { fixLeafletIcon() }, [])

  const mapped = observations.filter((o) => o.latitude !== null && o.longitude !== null)
  const center: [number, number] = mapped.length > 0
    ? [mapped[0].latitude!, mapped[0].longitude!]
    : [36.2048, 138.2529]

  return (
    <MapContainer center={center} zoom={mapped.length > 0 ? 13 : 5} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {mapped.map((obs) => (
        <Marker key={obs.id} position={[obs.latitude!, obs.longitude!]}>
          <Popup>
            <div className="space-y-2 min-w-[160px]">
              {obs.photo_url && (
                <img src={obs.photo_url} alt="観察写真" className="w-full h-24 object-cover rounded" />
              )}
              <p className="font-medium text-sm">{obs.name || obs.category}</p>
              <p className="text-xs text-gray-500">{obs.category}</p>
              {obs.memo && <p className="text-xs text-gray-600">{obs.memo}</p>}
              {obs.observed_at && (
                <p className="text-xs text-gray-400">
                  {new Date(obs.observed_at).toLocaleDateString('ja-JP')}
                </p>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
