import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { CATEGORIES } from '@/app/lib/categories'
import type { Observation, Category } from '@/app/types/observation'

export type ObservationFilter = {
  month: number | null
  setMonth: (m: number | null) => void
  category: Category | null
  setCategory: (c: Category | null) => void
  /** 記録がある月（1〜12、昇順） */
  activeMonths: number[]
  filtered: Observation[]
  reset: () => void
}

function parseMonth(v: string | null): number | null {
  const n = Number(v)
  return v !== null && Number.isInteger(n) && n >= 1 && n <= 12 ? n : null
}

function parseCategory(v: string | null): Category | null {
  return (CATEGORIES as readonly string[]).includes(v ?? '') ? (v as Category) : null
}

/**
 * 絞り込みを URL（month= / category=）に書き戻す。詳細から戻ったときに同じ一覧を再現するため。
 * 連続で呼ばれても上書きし合わないよう、閉包の params ではなく現在の URL から組み立てる
 */
function replaceFilterParams(patch: { month?: number | null; category?: Category | null }) {
  const next = new URLSearchParams(window.location.search)
  if (patch.month !== undefined) {
    if (patch.month === null) next.delete('month')
    else next.set('month', String(patch.month))
  }
  if (patch.category !== undefined) {
    if (patch.category === null) next.delete('category')
    else next.set('category', patch.category)
  }
  const qs = next.toString()
  window.history.replaceState(null, '', qs ? `${window.location.pathname}?${qs}` : window.location.pathname)
}

/**
 * 月・カテゴリの絞り込み。地図の一覧と図鑑で同じ状態を共有するため Shell 側で持つ。
 * 状態は URL に置く（replaceState は useSearchParams と同期する）
 */
export function useObservationFilter(observations: Observation[]): ObservationFilter {
  const params = useSearchParams()
  const month = parseMonth(params.get('month'))
  const category = parseCategory(params.get('category'))

  const setMonth = useCallback((m: number | null) => replaceFilterParams({ month: m }), [])
  const setCategory = useCallback((c: Category | null) => replaceFilterParams({ category: c }), [])
  const reset = useCallback(() => replaceFilterParams({ month: null, category: null }), [])

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

  return { month, setMonth, category, setCategory, activeMonths, filtered, reset }
}
