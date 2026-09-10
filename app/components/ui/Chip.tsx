'use client'

export function Chip({
  label,
  selected,
  onToggle,
  count,
}: {
  label: string
  selected: boolean
  onToggle: () => void
  count?: number
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      className={[
        'flex-shrink-0 rounded-full text-sm px-4 py-1.5 transition-colors focus-ring',
        selected
          ? 'bg-ink text-bg font-semibold border border-transparent'
          : 'bg-surface text-ink-sub border border-line font-normal',
      ].join(' ')}
    >
      {label}
      {typeof count === 'number' && (
        <span className="ml-1 opacity-70">({count})</span>
      )}
    </button>
  )
}
