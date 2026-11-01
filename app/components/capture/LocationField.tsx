'use client'

import nextDynamic from 'next/dynamic'
import { useId, useRef, useState, type Ref } from 'react'
import {
  LOCATION_SOURCE_LABELS,
  getCurrentPosition,
  locationAt,
  type LocationSource,
  type PickedLocation,
} from '@/app/lib/location'
import { Button, Icon, Spinner } from '@/app/components/ui'

const LocationMiniMap = nextDynamic(() => import('./LocationMiniMap'), {
  ssr: false,
  loading: () => <div aria-hidden="true" className="rounded-lg bg-line" style={{ height: 120 }} />,
})

const LocationPickerDialog = nextDynamic(() => import('./LocationPickerDialog'), { ssr: false })

// 場所名が取れなかったときの表示（座標は出さない）
const FALLBACK_NAMES: Record<LocationSource, string> = {
  exif: '写真の撮影場所',
  // 出どころの行（「現在地」）と同じ語が2行続かないようにする
  current: 'いまいる場所',
  map: '地図で選んだ場所',
}

/**
 * 記録の位置欄。状態（set / unset / none）ごとに表示を切り替える。
 * - set: 場所名 + 出どころ + ミニ地図 +「場所を変更」「場所なしにする」
 * - unset: 位置が無いことを知らせ「地図で指定」「現在地を使う」「場所なしで記録」
 * - none: 場所なしで記録する旨 +「場所を追加」
 * prompt=true のときは、未選択のまま送信しようとしたことを知らせる。
 */
export function LocationField({
  value,
  onChange,
  category,
  prompt = false,
  ref,
}: {
  value: PickedLocation
  onChange: (next: PickedLocation) => void
  category: string
  prompt?: boolean
  ref?: Ref<HTMLDivElement>
}) {
  const labelId = useId()
  // ピッカーを開いたボタンが確定で消えたときのフォーカスの戻り先（このグループ自身）
  const groupRef = useRef<HTMLDivElement | null>(null)
  const setGroupRef = (el: HTMLDivElement | null) => {
    groupRef.current = el
    if (typeof ref === 'function') ref(el)
    else if (ref) ref.current = el
  }
  const [pickerOpen, setPickerOpen] = useState(false)
  const [locating, setLocating] = useState(false)
  const [geoError, setGeoError] = useState(false)

  const applyCurrentPosition = async () => {
    setLocating(true)
    setGeoError(false)
    try {
      const pos = await getCurrentPosition()
      onChange(locationAt(pos.lat, pos.lng, 'current'))
    } catch {
      setGeoError(true)
    } finally {
      setLocating(false)
    }
  }

  const openPicker = () => setPickerOpen(true)

  return (
    <div
      ref={setGroupRef}
      tabIndex={-1}
      role="group"
      aria-labelledby={labelId}
      className="flex flex-col gap-2 outline-none"
    >
      <span id={labelId} className="text-sm font-medium text-ink-sub">
        場所
      </span>

      {value.kind === 'set' && (
        <div className="rounded-lg bg-surface p-3 flex flex-col gap-2.5">
          <div className="flex items-start gap-2">
            <span className="text-secondary-ink flex mt-0.5">
              <Icon name="pin" size={18} />
            </span>
            <div className="flex-1 min-w-0">
              <p aria-live="polite" className="text-sm font-semibold text-ink" style={{ wordBreak: 'break-all' }}>
                {value.nameStatus === 'loading'
                  ? '場所を調べています…'
                  : value.name ?? FALLBACK_NAMES[value.source]}
              </p>
              <p className="text-xs text-ink-muted">{LOCATION_SOURCE_LABELS[value.source]}</p>
            </div>
          </div>

          <div className="relative">
            <LocationMiniMap lat={value.lat} lng={value.lng} category={category} />
            {/* ミニ地図のタップでもピッカーを開く（キーボードは「場所を変更」ボタンを使う） */}
            <button
              type="button"
              tabIndex={-1}
              aria-hidden="true"
              onClick={openPicker}
              className="absolute inset-0 z-10 cursor-pointer bg-transparent border-none rounded-lg"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={openPicker}>
              場所を変更
            </Button>
            <button
              type="button"
              onClick={() => onChange({ kind: 'none' })}
              className="text-sm text-ink-muted bg-transparent border-none cursor-pointer focus-ring rounded-md px-2 py-1.5"
            >
              場所なしにする
            </button>
          </div>
        </div>
      )}

      {value.kind === 'unset' && (
        <div className="rounded-lg p-3 flex flex-col gap-2.5" style={{ background: 'var(--tag-warm-bg)' }}>
          <p className="text-sm text-ink flex items-start gap-2">
            <span className="flex mt-0.5" style={{ color: 'var(--tag-warm-ink)' }}>
              <Icon name="pin" size={18} />
            </span>
            <span>この写真には位置情報がありません。地図に出すには場所を指定してください</span>
          </p>
          {prompt && (
            <p role="alert" className="text-sm font-medium text-danger">
              場所を指定するか「場所なしで記録」を選んでください
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" size="sm" onClick={openPicker} iconLeft={<Icon name="map" size={16} />}>
              地図で指定
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={applyCurrentPosition}
              loading={locating}
              iconLeft={
                locating ? <Spinner size={14} label="現在地を取得中" /> : <Icon name="locate" size={16} />
              }
            >
              現在地を使う
            </Button>
          </div>
          <p className="text-xs text-ink-sub">
            「現在地を使う」は、いまいる場所が入ります（撮影した場所と違うことがあります）
          </p>
          {geoError && (
            <p role="status" className="text-xs text-danger">
              現在地を取得できませんでした。地図で指定してください
            </p>
          )}
          <button
            type="button"
            onClick={() => onChange({ kind: 'none' })}
            className="self-start text-sm text-ink-sub underline bg-transparent border-none cursor-pointer focus-ring rounded-md px-1 py-1"
          >
            場所なしで記録
          </button>
        </div>
      )}

      {value.kind === 'none' && (
        <div className="rounded-lg bg-surface flex items-center gap-2 px-3 py-2.5">
          <p className="flex-1 text-xs text-ink-sub">場所なしで記録します（地図には表示されません）</p>
          <button
            type="button"
            onClick={openPicker}
            className="flex-shrink-0 text-sm font-medium text-secondary-ink bg-transparent border-none cursor-pointer focus-ring rounded-md px-2 py-1"
          >
            場所を追加
          </button>
        </div>
      )}

      {pickerOpen && (
        <LocationPickerDialog
          initial={value.kind === 'set' ? { lat: value.lat, lng: value.lng } : null}
          onConfirm={(pos) => {
            setPickerOpen(false)
            onChange(locationAt(pos.lat, pos.lng, 'map'))
          }}
          onClose={() => setPickerOpen(false)}
          returnFocus={() => groupRef.current}
        />
      )}
    </div>
  )
}
