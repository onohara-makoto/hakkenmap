'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { CATEGORIES } from '@/app/lib/categories'
import { Chip, Badge, EmptyState, Skeleton } from '@/app/components/ui'
import { SeededEmptyState } from '@/app/components/onboarding/SeededEmptyState'
import type { Observation, Category } from '@/app/types/observation'

export function SheetList({
  observations,
  isLoading,
  selectedId,
  onSelect,
}: {
  observations: Observation[]
  isLoading: boolean
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  const [month, setMonth] = useState<number | null>(null)
  const [category, setCategory] = useState<Category | null>(null)

  const activeMonths = useMemo(() => {
    const s = new Set<number>()
    observations.forEach((o) => s.add(new Date(o.observed_at ?? o.created_at).getMonth() + 1))
    return Array.from(s).sort((a, b) => a - b)
  }, [observations])

  const filtered = useMemo(
    () =>
      observations.filter((o) => {
        if (month !== null && new Date(o.observed_at ?? o.created_at).getMonth() + 1 !== month) return false
        if (category !== null && o.category !== category) return false
        return true
      }),
    [observations, month, category]
  )

  return (
    <div>
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
        <Chip
          label="すべて"
          selected={month === null && category === null}
          onToggle={() => { setMonth(null); setCategory(null) }}
        />
        {activeMonths.map((m) => (
          <Chip key={m} label={`${m}月`} selected={month === m} onToggle={() => setMonth(month === m ? null : m)} />
        ))}
        {CATEGORIES.map((c) => (
          <Chip key={c} label={c} selected={category === c} onToggle={() => setCategory(category === c ? null : c)} />
        ))}
      </div>

      <p className="text-xs text-ink-muted mt-1 mb-2" aria-live="polite">
        {isLoading ? '読み込み中…' : `${filtered.length}件のはっけん`}
      </p>

      {isLoading ? (
        <div className="grid gap-3" aria-hidden="true">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-3 rounded-xl bg-bg p-2.5">
              <Skeleton w={60} h={60} radius={14} className="flex-shrink-0" />
              <div className="flex flex-col gap-2 flex-1 py-1">
                <Skeleton w="70%" h={13} radius={4} />
                <Skeleton w={44} h={16} radius={20} />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        observations.length === 0 ? (
          <SeededEmptyState />
        ) : (
          <EmptyState icon="🔍" title="該当する記録がありません" />
        )
      ) : (
        <ul role="list" className="grid gap-2 list-none p-0 m-0">
          {filtered.map((obs) => {
            const active = obs.id === selectedId
            return (
              <li key={obs.id}>
                <button
                  type="button"
                  onClick={() => onSelect(obs.id)}
                  aria-current={active ? 'true' : undefined}
                  className={`w-full flex gap-3 p-2.5 rounded-xl text-left transition-colors focus-ring ${
                    active ? 'bg-secondary-soft' : 'bg-bg hover:bg-secondary-soft/60'
                  }`}
                >
                  {obs.photo_url ? (
                    <div className="relative flex-shrink-0 overflow-hidden rounded-[14px]" style={{ width: 60, height: 60 }}>
                      <Image src={obs.photo_url} alt="" fill sizes="60px" className="object-cover" />
                    </div>
                  ) : (
                    <div
                      className="flex-shrink-0 flex items-center justify-center text-xl rounded-[14px]"
                      style={{ width: 60, height: 60, background: 'var(--tag-warm-bg)' }}
                      aria-hidden="true"
                    >
                      🌿
                    </div>
                  )}
                  <div className="flex flex-col gap-1 min-w-0 flex-1">
                    <p className="text-sm font-bold text-ink truncate">{obs.name || obs.category}</p>
                    <Badge category={obs.category} />
                    <p className="text-xs text-ink-muted truncate">
                      {new Date(obs.observed_at ?? obs.created_at).toLocaleDateString('ja-JP', {
                        month: 'numeric',
                        day: 'numeric',
                      })}
                      {obs.location_name ? ` · ${obs.location_name}` : ''}
                    </p>
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
