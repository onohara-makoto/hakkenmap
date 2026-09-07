import type { Observation } from '@/app/types/observation'

const dayKey = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()

/** 指定年の月別の記録数（index 0 = 1月） */
export function monthlyCounts(obs: Observation[], year: number): number[] {
  const counts = new Array(12).fill(0)
  for (const o of obs) {
    const d = new Date(o.created_at)
    if (d.getFullYear() === year) counts[d.getMonth()]++
  }
  return counts
}

/** 記録がある年の一覧（新しい順） */
export function recordedYears(obs: Observation[]): number[] {
  const s = new Set<number>()
  for (const o of obs) s.add(new Date(o.created_at).getFullYear())
  return Array.from(s).sort((a, b) => b - a)
}

/** created_at が連続する暦日数。今日か昨日に記録があれば継続とみなす */
export function currentStreakDays(obs: Observation[], now = new Date()): number {
  if (obs.length === 0) return 0
  const days = new Set(obs.map((o) => dayKey(new Date(o.created_at))))
  const cursor = new Date(dayKey(now))
  if (!days.has(cursor.getTime())) {
    cursor.setDate(cursor.getDate() - 1)
    if (!days.has(cursor.getTime())) return 0
  }
  let streak = 0
  while (days.has(cursor.getTime())) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

/** 今月の進捗（goal は既定10、localStorage 等で上書き可） */
export function thisMonthProgress(obs: Observation[], goal = 10, now = new Date()) {
  const count = obs.filter((o) => {
    const d = new Date(o.created_at)
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  }).length
  return { count, goal, ratio: goal > 0 ? Math.min(1, count / goal) : 0 }
}

export type YearRecap = {
  total: number
  byCategory: Record<string, number>
  topCategory: string | null
  busiestMonth: number
  distinctSpots: number
  first: string
  last: string
}

/** 「◯◯年の発見まとめ」。その年の記録が無ければ null */
export function yearRecap(obs: Observation[], year: number): YearRecap | null {
  const inYear = obs.filter((o) => new Date(o.created_at).getFullYear() === year)
  if (inYear.length === 0) return null

  const byCategory: Record<string, number> = {}
  const spots = new Set<string>()
  for (const o of inYear) {
    byCategory[o.category] = (byCategory[o.category] ?? 0) + 1
    if (o.location_name) spots.add(o.location_name)
  }
  const mc = monthlyCounts(inYear, year)
  const sorted = [...inYear].sort(
    (a, b) => +new Date(a.created_at) - +new Date(b.created_at)
  )

  return {
    total: inYear.length,
    byCategory,
    topCategory: Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null,
    busiestMonth: mc.indexOf(Math.max(...mc)) + 1,
    distinctSpots: spots.size,
    first: sorted[0].created_at,
    last: sorted[sorted.length - 1].created_at,
  }
}
