'use client'

import { CATEGORY_COLORS } from '@/app/lib/categories'
import { useAppMode } from '@/app/lib/app-mode'

type Size = 'sm' | 'md'

const sizes: Record<Size, string> = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
}

export function Badge({ category, size = 'sm' }: { category: string; size?: Size }) {
  const { t } = useAppMode()
  const color = CATEGORY_COLORS[category] ?? CATEGORY_COLORS['その他']
  return (
    <span
      className={`inline-block rounded-full font-medium ${sizes[size]}`}
      style={{ background: color.bg, color: color.ink }}
    >
      {t.categoryLabel(category)}
    </span>
  )
}
