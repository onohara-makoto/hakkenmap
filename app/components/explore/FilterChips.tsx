'use client'

import { CATEGORIES } from '@/app/lib/categories'
import { Chip } from '@/app/components/ui'
import type { ObservationFilter } from './useObservationFilter'

/** 月・カテゴリの絞り込みチップ列（横スクロール） */
export function FilterChips({ filter }: { filter: ObservationFilter }) {
  const { month, setMonth, category, setCategory, activeMonths, reset } = filter
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
      <Chip label="すべて" selected={month === null && category === null} onToggle={reset} />
      {activeMonths.map((m) => (
        <Chip key={m} label={`${m}月`} selected={month === m} onToggle={() => setMonth(month === m ? null : m)} />
      ))}
      {CATEGORIES.map((c) => (
        <Chip key={c} label={c} selected={category === c} onToggle={() => setCategory(category === c ? null : c)} />
      ))}
    </div>
  )
}
