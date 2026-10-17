'use client'

import { useAppMode } from '@/app/lib/app-mode'

export function StreakBadge({ days }: { days: number }) {
  const { t } = useAppMode()
  if (days < 2) return null
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full text-xs font-semibold px-2.5 py-1"
      style={{ background: 'var(--color-tag-warm-bg)', color: 'var(--color-tag-warm-ink)' }}
    >
      <span aria-hidden="true">🔥</span>
      {t.log.streak(days)}
    </span>
  )
}
