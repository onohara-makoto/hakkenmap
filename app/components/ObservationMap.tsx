'use client'

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react'
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Observation } from '@/app/types/observation'
import { mappedObservations, FLY_OPTIONS, JAPAN_CENTER, type Bbox } from '@/app/lib/geo'
import ClusterLayer from '@/app/components/explore/ClusterLayer'
import MapControls from '@/app/components/explore/MapControls'

export type ObservationMapHandle = {
  flyTo: (lat: number, lng: number, zoom?: number) => void
  fitAll: () => void
  fitBounds: (b: Bbox) => void
  getBounds: () => Bbox | null
}

type Props = {
  observations: Observation[]
  selectedId: string | null
  onSelectPin: (id: string) => void
  onBoundsChange?: (b: Bbox) => void
  onMapClick?: () => void
}

function toBbox(b: L.LatLngBounds): Bbox {
  return { north: b.getNorth(), south: b.getSouth(), east: b.getEast(), west: b.getWest() }
}

function BoundsWatcher({ onChange }: { onChange?: (b: Bbox) => void }) {
  useMapEvents({
    moveend: (e) => onChange?.(toBbox(e.target.getBounds())),
  })
  return null
}

function MapClick({ onClick }: { onClick?: () => void }) {
  useMapEvents({ click: () => onClick?.() })
  return null
}

/** MapContainer の子として地図インスタンスを親へ渡す */
function MapBridge({ onReady }: { onReady: (m: L.Map) => void }) {
  const map = useMap()
  useEffect(() => {
    onReady(map)
    setTimeout(() => map.invalidateSize(), 0)
  }, [map, onReady])
  return null
}

const ObservationMap = forwardRef<ObservationMapHandle, Props>(function ObservationMap(
  { observations, selectedId, onSelectPin, onBoundsChange, onMapClick },
  ref
) {
  const mapRef = useRef<L.Map | null>(null)
  const mapped = mappedObservations(observations)

  const fitAll = useCallback(() => {
    const map = mapRef.current
    if (!map || mapped.length === 0) return
    const bounds = L.latLngBounds(
      mapped.map((o) => [o.latitude, o.longitude] as [number, number])
    )
    map.flyToBounds(bounds, { padding: [48, 48], maxZoom: 15, ...FLY_OPTIONS })
  }, [mapped])

  useImperativeHandle(
    ref,
    () => ({
      flyTo: (lat, lng, zoom = 15) => {
        mapRef.current?.flyTo([lat, lng], zoom, FLY_OPTIONS)
      },
      fitAll,
      fitBounds: (b) => {
        mapRef.current?.flyToBounds(
          L.latLngBounds([b.south, b.west], [b.north, b.east]),
          { ...FLY_OPTIONS }
        )
      },
      getBounds: () => {
        const b = mapRef.current?.getBounds()
        return b ? toBbox(b) : null
      },
    }),
    [fitAll]
  )

  const center: [number, number] =
    mapped.length > 0 ? [mapped[0].latitude, mapped[0].longitude] : JAPAN_CENTER

  return (
    <MapContainer
      center={center}
      zoom={mapped.length > 0 ? 13 : 5}
      zoomControl={false}
      style={{ height: '100%', width: '100%' }}
    >
      <MapBridge onReady={(m) => { mapRef.current = m }} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapClick onClick={onMapClick} />
      <BoundsWatcher onChange={onBoundsChange} />
      <ClusterLayer observations={mapped} selectedId={selectedId} onSelect={onSelectPin} />
      <MapControls onFitAll={fitAll} />
    </MapContainer>
  )
})

export default ObservationMap
