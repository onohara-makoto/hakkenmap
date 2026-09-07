export function StreakBadge({ days }: { days: number }) {
  if (days < 2) return null
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full text-xs font-semibold px-2.5 py-1"
      style={{ background: 'var(--color-tag-warm-bg)', color: 'var(--color-tag-warm-ink)' }}
    >
      <span aria-hidden="true">🔥</span>
      {days}日連続
    </span>
  )
}
