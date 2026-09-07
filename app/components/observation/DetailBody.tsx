import Link from 'next/link'
import { Badge, Card } from '@/app/components/ui'
import type { Observation } from '@/app/types/observation'

/**
 * 観察記録の本文（バッジ・タイトル・日付/場所カード・メモ・位置バー）。
 * 詳細ページ（/home/[id]）と Explore のシート詳細で共用する。
 */
export function DetailBody({
  obs,
  compact = false,
}: {
  obs: Observation
  compact?: boolean
}) {
  const date = new Date(obs.observed_at ?? obs.created_at)
  return (
    <div className="flex flex-col gap-4">
      <div>
        <Badge category={obs.category} size="md" />
        <h1 className={`${compact ? 'text-xl' : 'text-2xl lg:text-3xl'} font-bold text-ink mt-2`}>
          {obs.name || obs.category}
        </h1>
      </div>

      <div className="flex gap-3">
        <div className="flex-1 flex flex-col items-center gap-1 py-3 px-2 rounded-lg bg-surface text-center">
          <span className="text-xs text-ink-muted font-medium">みつけた日</span>
          <span className="text-sm font-semibold text-ink">
            {date.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })}
          </span>
          <span className="text-xs text-ink-sub">
            {date.toLocaleDateString('ja-JP', { year: 'numeric' })}
          </span>
        </div>
        {obs.location_name && (
          <div className="flex-1 flex flex-col items-center gap-1 py-3 px-2 rounded-lg bg-surface text-center">
            <span className="text-xs text-ink-muted font-medium">ばしょ</span>
            <span className="text-sm font-semibold text-ink" style={{ wordBreak: 'break-all' }}>
              {obs.location_name}
            </span>
          </div>
        )}
      </div>

      {obs.memo && (
        <Card padding="md">
          <p className="text-xs text-ink-muted font-medium mb-1.5">メモ</p>
          <p className="text-sm text-ink-sub" style={{ lineHeight: 1.85, whiteSpace: 'pre-wrap' }}>
            {obs.memo}
          </p>
        </Card>
      )}

      {obs.latitude != null && obs.longitude != null && (
        <Link
          href={`/home?focus=${obs.id}`}
          className="flex items-center gap-2 px-4 py-3 rounded-lg no-underline focus-ring"
          style={{ background: 'var(--secondary-soft)' }}
        >
          <span
            className="rounded-full flex-shrink-0"
            style={{ width: 8, height: 8, background: 'var(--secondary)' }}
            aria-hidden="true"
          />
          <span className="text-xs" style={{ color: 'var(--secondary-ink)' }}>
            {obs.latitude.toFixed(5)}, {obs.longitude.toFixed(5)} — 地図で見る
          </span>
        </Link>
      )}
    </div>
  )
}
