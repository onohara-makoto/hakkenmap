'use client'

import { Icon, type IconName } from '@/app/components/ui'

export type ExploreView = 'map' | 'zukan'

const OPTIONS: { value: ExploreView; label: string; icon: IconName }[] = [
  { value: 'map', label: '地図', icon: 'map' },
  { value: 'zukan', label: '図鑑', icon: 'grid' },
]

/** 地図／図鑑のセグメントボタン。選択色は Chip と揃える */
export function ViewToggle({
  view,
  onChange,
}: {
  view: ExploreView
  onChange: (v: ExploreView) => void
}) {
  return (
    <div
      role="group"
      aria-label="表示の切り替え"
      className="flex bg-surface border border-line shadow-md rounded-full p-1"
    >
      {OPTIONS.map((o) => {
        const selected = view === o.value
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            aria-pressed={selected}
            className={[
              'inline-flex items-center gap-1.5 min-h-9 px-4 rounded-full text-sm transition-colors focus-ring',
              selected ? 'bg-ink text-bg font-semibold' : 'text-ink-sub font-normal',
            ].join(' ')}
          >
            <Icon name={o.icon} size={18} />
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
