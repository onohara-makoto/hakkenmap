import L from 'leaflet'
import { CATEGORY_COLORS, CATEGORY_META } from '@/app/lib/categories'

// Leaflet を使う地図（探索マップ・ミニ地図・位置ピッカー）で共有する定数とピン。
// ClusterLayer から import すると markercluster まで読まれるため、ここに分けている。

// キー不要の OSM タイル。ダークは CSS フィルタで対応（.dark .leaflet-tile-pane）
export const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
export const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

export function buildPinIcon(category: string, selected: boolean): L.DivIcon {
  const color = CATEGORY_COLORS[category]?.dot ?? '#B4A992'
  const icon = CATEGORY_META[category]?.icon ?? CATEGORY_META['その他'].icon
  const size = selected ? 52 : 44
  const iconSize = selected ? 24 : 20
  return L.divIcon({
    className: '',
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:50% 50% 50% 0;
      background:${color};transform:rotate(-45deg);
      display:flex;align-items:center;justify-content:center;
      box-shadow:${selected ? '0 6px 18px rgba(0,0,0,.35)' : '0 3px 10px rgba(0,0,0,.25)'};
      border:${selected ? '3px solid #FFF6EF' : '2px solid rgba(255,255,255,.85)'};
      transition:width .15s,height .15s;
    "><img src="${icon}" alt="" style="transform:rotate(45deg);width:${iconSize}px;height:${iconSize}px;display:block" /></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
  })
}
