'use client'

import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet.markercluster'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import { CATEGORY_META } from '@/app/lib/categories'
import { buildPinIcon } from '@/app/lib/map'
import type { GeoObservation } from '@/app/lib/geo'

function clusterIcon(cluster: L.MarkerCluster): L.DivIcon {
  const count = cluster.getChildCount()
  const scale = count < 10 ? 40 : count < 50 ? 48 : 56
  return L.divIcon({
    html: `<div style="
      width:${scale}px;height:${scale}px;border-radius:50%;
      background:var(--color-secondary,#8A9A5B);color:#fff;
      display:flex;align-items:center;justify-content:center;
      font-weight:700;font-size:14px;
      border:3px solid rgba(255,255,255,.9);box-shadow:0 4px 12px rgba(0,0,0,.3);
    ">${count}</div>`,
    className: '',
    iconSize: [scale, scale],
  })
}

type Props = {
  observations: GeoObservation[]
  selectedId: string | null
  onSelect: (id: string) => void
}

export default function ClusterLayer({ observations, selectedId, onSelect }: Props) {
  const map = useMap()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const groupRef = useRef<any>(null)
  const markersRef = useRef<Map<string, L.Marker>>(new Map())

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const group = (L as any).markerClusterGroup({
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      maxClusterRadius: 48,
      iconCreateFunction: clusterIcon,
    })
    groupRef.current = group
    map.addLayer(group)
    return () => {
      map.removeLayer(group)
      groupRef.current = null
    }
  }, [map])

  useEffect(() => {
    const group = groupRef.current
    if (!group) return
    group.clearLayers()
    markersRef.current.clear()
    for (const o of observations) {
      const marker = L.marker([o.latitude, o.longitude], {
        icon: buildPinIcon(o.category, o.id === selectedId),
        keyboard: true,
        title: o.name || o.category,
        alt: `${o.name || o.category}（${CATEGORY_META[o.category]?.label ?? o.category}）`,
      })
      marker.on('click', () => onSelect(o.id))
      marker.on('keydown', (e) => {
        const ke = (e as unknown as { originalEvent: KeyboardEvent }).originalEvent
        if (ke.key === 'Enter' || ke.key === ' ') onSelect(o.id)
      })
      markersRef.current.set(o.id, marker)
      group.addLayer(marker)
    }
    // selectedId は別 effect でアイコン更新するため依存に含めない
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [observations, onSelect])

  useEffect(() => {
    markersRef.current.forEach((marker, id) => {
      const o = observations.find((x) => x.id === id)
      if (o) marker.setIcon(buildPinIcon(o.category, id === selectedId))
    })
  }, [selectedId, observations])

  return null
}
