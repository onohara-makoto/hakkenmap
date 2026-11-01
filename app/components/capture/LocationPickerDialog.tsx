'use client'

import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer } from 'react-leaflet'
import type L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { FLY_OPTIONS, JAPAN_CENTER } from '@/app/lib/geo'
import { TILE_URL, TILE_ATTRIBUTION } from '@/app/lib/map'
import { getCurrentPosition, type LatLng } from '@/app/lib/location'
import { getLatestGeoObservation } from '@/app/lib/observations'
import { Button, Icon, Spinner } from '@/app/components/ui'

// 中央固定ピンの見た目（buildPinIcon と同じ涙型）。先端が地図の中心に来るよう配置する
const PIN_SIZE = 36
const PIN_TIP_OFFSET = PIN_SIZE / 2 + (PIN_SIZE / 2) * Math.SQRT2

// 初期中心が日本全体（元の値も過去の記録も無い）なら isDefault。一度動かすまで確定させない
type View = { center: [number, number]; zoom: number; isDefault?: boolean }

/**
 * 地図を動かして中央のピンに合わせる位置ピッカー（全画面）。
 * 初期中心: initial → 最後に記録した位置 → 日本全体。勝手に現在地は取りにいかない。
 * Leaflet を含むため、呼び出し側から next/dynamic(ssr:false) で読む。
 * returnFocus: 閉じたとき、開いた要素が消えている（確定で表示が変わった）・aria-hidden のときのフォーカス先。
 */
export default function LocationPickerDialog({
  initial,
  onConfirm,
  onClose,
  returnFocus,
}: {
  initial?: LatLng | null
  onConfirm: (pos: LatLng) => void
  onClose: () => void
  returnFocus?: () => HTMLElement | null
}) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const [map, setMap] = useState<L.Map | null>(null)
  const [view, setView] = useState<View | null>(
    initial ? { center: [initial.lat, initial.lng], zoom: 16 } : null
  )
  const [locating, setLocating] = useState(false)
  const [denied, setDenied] = useState(false)
  // 一度でも地図が動いたか / いま動いている途中か（flyTo・慣性スクロール中は確定させない）
  const [moved, setMoved] = useState(false)
  const [moving, setMoving] = useState(false)
  // 閉じるときに最新の returnFocus を使う（マウント時の effect から参照するため ref に入れる）
  const returnFocusRef = useRef(returnFocus)
  useEffect(() => {
    returnFocusRef.current = returnFocus
  })

  // 初期値が無いときだけ、最後に記録した位置を1回取りにいく
  useEffect(() => {
    if (initial) return
    let cancelled = false
    getLatestGeoObservation().then((latest) => {
      if (cancelled) return
      setView(
        latest
          ? { center: [latest.lat, latest.lng], zoom: 15 }
          : { center: JAPAN_CENTER, zoom: 5, isDefault: true }
      )
    })
    return () => { cancelled = true }
  }, [initial])

  // 開いたら閉じるボタンにフォーカス・背面スクロール停止。閉じたら元の要素へフォーカスを戻す。
  // 元の要素が消えた・aria-hidden の中にあるときは returnFocus の要素へ
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => {
      document.body.style.overflow = prevOverflow
      const openerUsable =
        opener && opener !== document.body && opener.isConnected && !opener.closest('[aria-hidden="true"]')
      const target = openerUsable ? opener : returnFocusRef.current?.()
      target?.focus?.()
    }
  }, [])

  // Esc で閉じる / Tab をダイアログ内に閉じ込める
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key !== 'Tab' || !dialogRef.current) return
      const focusables = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
        )
      )
      if (focusables.length === 0) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      const active = document.activeElement
      if (e.shiftKey && (active === first || !dialogRef.current.contains(active))) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && (active === last || !dialogRef.current.contains(active))) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  useEffect(() => {
    if (!map) return
    const onMoveStart = () => {
      setMoved(true)
      setMoving(true)
    }
    const onMoveEnd = () => setMoving(false)
    // サイズ補正で動いた分は「動かした」に数えないよう、補正のあとで購読する
    const t = setTimeout(() => {
      map.invalidateSize()
      map.on('movestart', onMoveStart)
      map.on('moveend', onMoveEnd)
    }, 0)
    return () => {
      clearTimeout(t)
      map.off('movestart', onMoveStart)
      map.off('moveend', onMoveEnd)
    }
  }, [map])

  const locate = async () => {
    setLocating(true)
    setDenied(false)
    try {
      const pos = await getCurrentPosition()
      map?.flyTo([pos.lat, pos.lng], 16, FLY_OPTIONS)
    } catch {
      setDenied(true)
    } finally {
      setLocating(false)
    }
  }

  const canConfirm = !!map && !moving && !(view?.isDefault && !moved)

  const confirm = () => {
    if (!map || !canConfirm) return
    const c = map.getCenter()
    onConfirm({ lat: c.lat, lng: c.lng })
  }

  // z-[110]: PCHeader（sticky, z-index 100）より上に出す
  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="location-picker-title"
      className="fixed inset-0 z-[110] flex flex-col bg-bg"
    >
      <div className="flex items-center gap-3 px-4 py-3 border-b border-line bg-surface">
        <div className="flex-1 min-w-0">
          <h2 id="location-picker-title" className="text-base font-bold text-ink">
            場所を選ぶ
          </h2>
          <p className="text-xs text-ink-muted">地図を動かして、中央のピンを見つけた場所に合わせてください</p>
        </div>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="閉じる"
          className="w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center text-ink bg-bg border border-line focus-ring"
        >
          <Icon name="close" size={20} />
        </button>
      </div>

      <div className="relative flex-1 isolate">
        {view ? (
          <MapContainer
            ref={setMap}
            center={view.center}
            zoom={view.zoom}
            zoomControl={false}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer attribution={TILE_ATTRIBUTION} url={TILE_URL} maxZoom={19} />
          </MapContainer>
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center gap-3 text-ink-muted">
            <Spinner />
            <span className="text-sm">地図を読み込み中…</span>
          </div>
        )}

        {view && (
          <>
            {/* 中央固定ピン（操作は地図側に通す） */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute z-[500]"
              style={{ left: '50%', top: '50%', width: 0, height: 0 }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: -PIN_SIZE / 2,
                  top: -PIN_TIP_OFFSET,
                  width: PIN_SIZE,
                  height: PIN_SIZE,
                  borderRadius: '50% 50% 50% 0',
                  background: 'var(--primary)',
                  transform: 'rotate(-45deg)',
                  border: '2px solid rgba(255,255,255,.9)',
                  boxShadow: '0 4px 12px rgba(0,0,0,.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span
                  style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--on-primary)' }}
                />
              </div>
              <span
                style={{
                  position: 'absolute',
                  left: -3,
                  top: -3,
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: 'rgba(0,0,0,.35)',
                }}
              />
            </div>

            <button
              type="button"
              onClick={locate}
              disabled={locating || !map}
              aria-label={denied ? '現在地を取得できませんでした' : '現在地へ移動'}
              className="absolute right-3 bottom-8 z-[500] w-11 h-11 rounded-full bg-surface border border-line shadow-md flex items-center justify-center text-ink focus-ring disabled:opacity-50"
            >
              {locating ? (
                <span aria-hidden="true" className="flex">
                  <Spinner size={18} />
                </span>
              ) : (
                <Icon name={denied ? 'alert' : 'locate'} size={20} />
              )}
            </button>
            <span role="status" className="sr-only">
              {locating ? '現在地を取得中' : denied ? '現在地を取得できませんでした' : ''}
            </span>
          </>
        )}
      </div>

      <div
        className="px-4 pt-3 bg-surface border-t border-line"
        style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}
      >
        <Button variant="primary" size="lg" fullWidth onClick={confirm} disabled={!canConfirm}>
          この場所にする
        </Button>
      </div>
    </div>
  )
}
