'use client'

import { CATEGORIES } from '@/app/lib/categories'
import type { Category } from '@/app/types/observation'
import type { ExifData } from '@/app/lib/exif'

export type Draft = {
  id: string
  file: File
  previewUrl: string
  exif: ExifData | null
  exifLoading: boolean
  category: Category
  name: string
}

function ExifBadge({ exif, loading }: { exif: ExifData | null; loading: boolean }) {
  if (loading) return <span className="text-xs text-ink-muted">読み込み中…</span>
  const hasGeo = exif?.latitude != null && exif?.longitude != null
  const date = exif?.takenAt
    ? exif.takenAt.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })
    : null
  return (
    <span className="text-xs text-ink-muted inline-flex items-center gap-2">
      <span className={hasGeo ? 'text-secondary-ink' : 'text-ink-muted'}>
        {hasGeo ? '📍 位置あり' : '📍 位置なし'}
      </span>
      <span>{date ? `${date}` : '日付なし'}</span>
    </span>
  )
}

export function BulkDraftList({
  drafts,
  onPatch,
  onRemove,
}: {
  drafts: Draft[]
  onPatch: (id: string, patch: Partial<Pick<Draft, 'category' | 'name'>>) => void
  onRemove: (id: string) => void
}) {
  return (
    <ul role="list" className="flex flex-col gap-3 list-none p-0 m-0">
      {drafts.map((d) => (
        <li key={d.id} className="rounded-xl bg-surface shadow-md p-3">
          <div className="flex gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={d.previewUrl}
              alt=""
              className="flex-shrink-0 rounded-lg object-cover"
              style={{ width: 64, height: 64 }}
            />
            <div className="flex-1 min-w-0 flex flex-col gap-1.5">
              <input
                type="text"
                value={d.name}
                onChange={(e) => onPatch(d.id, { name: e.target.value })}
                placeholder="名前（任意）"
                aria-label="名前"
                className="w-full box-border rounded-md text-sm bg-bg text-ink border border-line focus-ring"
                style={{ padding: '7px 10px' }}
              />
              <ExifBadge exif={d.exif} loading={d.exifLoading} />
            </div>
            <button
              type="button"
              onClick={() => onRemove(d.id)}
              aria-label="この写真を外す"
              className="w-7 h-7 flex-shrink-0 rounded-full flex items-center justify-center text-ink-muted bg-bg border border-line focus-ring"
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
