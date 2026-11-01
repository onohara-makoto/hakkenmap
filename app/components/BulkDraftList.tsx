'use client'

import { CATEGORIES } from '@/app/lib/categories'
import { Icon } from '@/app/components/ui'
import type { Category } from '@/app/types/observation'
import type { ExifData } from '@/app/lib/exif'
import type { PickedLocation } from '@/app/lib/location'

/** 一括モードの位置バッジの id（ピッカーを閉じたあとのフォーカス先に使う） */
export const draftLocationBadgeId = (draftId: string) => `draft-location-${draftId}`

export type DraftStatus = 'idle' | 'uploading' | 'failed'

export type Draft = {
  id: string
  file: File
  previewUrl: string
  exif: ExifData | null
  exifLoading: boolean
  location: PickedLocation
  category: Category
  name: string
  status: DraftStatus
  errorMessage?: string
}

function ExifBadge({
  badgeId,
  exif,
  location,
  loading,
  disabled,
  onPickLocation,
}: {
  badgeId: string
  exif: ExifData | null
  location: PickedLocation
  loading: boolean
  disabled: boolean
  onPickLocation: () => void
}) {
  if (loading) return <span className="text-xs text-ink-muted">読み込み中…</span>
  const date = exif?.takenAt
    ? exif.takenAt.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })
    : null
  const pinBtn =
    'inline-flex items-center gap-1 rounded-md bg-transparent border-none cursor-pointer focus-ring px-1 -mx-1 py-0.5 disabled:opacity-50 disabled:cursor-not-allowed'
  return (
    <span className="text-xs text-ink-muted inline-flex flex-wrap items-center gap-x-2 gap-y-1">
      {location.kind === 'set' && (
        <button
          id={badgeId}
          type="button"
          onClick={onPickLocation}
          disabled={disabled}
          aria-label={`場所: ${location.name ?? '位置あり'}（タップで変更）`}
          className={`${pinBtn} text-secondary-ink`}
        >
          <Icon name="pin" size={14} />
          <span style={{ wordBreak: 'break-all' }}>{location.name ?? '位置あり'}</span>
        </button>
      )}
      {location.kind === 'unset' && (
        <button
          id={badgeId}
          type="button"
          onClick={onPickLocation}
          disabled={disabled}
          className={`${pinBtn} font-medium underline`}
          style={{ color: 'var(--tag-warm-ink)' }}
        >
          <Icon name="pin" size={14} />
          位置なし・地図で指定
        </button>
      )}
      {location.kind === 'none' && <span>場所なし</span>}
      <span>{date ? `${date}` : '日付なし'}</span>
    </span>
  )
}

export function BulkDraftList({
  drafts,
  onPatch,
  onRemove,
  onPickLocation,
}: {
  drafts: Draft[]
  onPatch: (id: string, patch: Partial<Pick<Draft, 'category' | 'name'>>) => void
  onRemove: (id: string) => void
  onPickLocation: (id: string) => void
}) {
  return (
    <ul role="list" className="flex flex-col gap-3 list-none p-0 m-0">
      {drafts.map((d) => (
        <li
          key={d.id}
          className="rounded-xl bg-surface shadow-md p-3"
          style={d.status === 'failed' ? { outline: '1px solid var(--danger-line)' } : undefined}
        >
          <div className="flex gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={d.previewUrl}
              alt=""
              className="flex-shrink-0 rounded-lg object-cover"
              style={{ width: 64, height: 64, opacity: d.status === 'uploading' ? 0.5 : 1 }}
            />
            <div className="flex-1 min-w-0 flex flex-col gap-1.5">
              <input
                type="text"
                value={d.name}
                onChange={(e) => onPatch(d.id, { name: e.target.value })}
                placeholder="名前（任意）"
                aria-label="名前"
                disabled={d.status === 'uploading'}
                className="w-full box-border rounded-md text-sm bg-bg text-ink border border-line focus-ring"
                style={{ padding: '7px 10px' }}
              />
              <ExifBadge
                badgeId={draftLocationBadgeId(d.id)}
                exif={d.exif}
                location={d.location}
                loading={d.exifLoading}
                disabled={d.status === 'uploading'}
                onPickLocation={() => onPickLocation(d.id)}
              />
              {d.status === 'uploading' && (
                <span className="text-xs text-ink-muted">アップロード中…</span>
              )}
              {d.status === 'failed' && (
                <span role="alert" className="text-xs text-danger">
                  失敗: {d.errorMessage ?? '保存に失敗しました'}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => onRemove(d.id)}
              disabled={d.status === 'uploading'}
              aria-label="この写真を外す"
              className="w-7 h-7 flex-shrink-0 rounded-full flex items-center justify-center text-ink-muted bg-bg border border-line focus-ring disabled:opacity-50"
            >
              ×
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5 mt-2.5" role="group" aria-label="カテゴリ">
            {CATEGORIES.map((cat) => {
              const active = d.category === cat
              return (
                <button
                  key={cat}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onPatch(d.id, { category: cat })}
                  className={[
                    'rounded-full text-xs px-3 py-1 border transition-colors focus-ring',
                    active
                      ? 'bg-primary text-on-primary border-transparent font-bold'
                      : 'bg-surface text-ink-sub border-line',
                  ].join(' ')}
                >
                  {cat}
                </button>
              )
            })}
          </div>
        </li>
      ))}
    </ul>
  )
}
