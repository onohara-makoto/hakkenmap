'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useMemo, useState } from 'react'
import { getObservations } from '@/app/lib/observations'
import {
  monthlyCounts,
  recordedYears,
  currentStreakDays,
  thisMonthProgress,
  yearRecap,
} from '@/app/lib/stats'
import { CATEGORIES, CATEGORY_META } from '@/app/lib/categories'
import { MonthlyRing } from '@/app/components/log/MonthlyRing'
import { StreakBadge } from '@/app/components/log/StreakBadge'
import { RecapCard } from '@/app/components/log/RecapCard'
import { Card, EmptyState, Skeleton } from '@/app/components/ui'
import type { Observation } from '@/app/types/observation'

const MONTH_GOAL = 10
const MONTH_NAMES = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

export default function SanpoLogPage() {
  const [observations, setObservations] = useState<Observation[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getObservations().then((d) => { setObservations(d); setIsLoading(false) })
  }, [])

  const years = useMemo(() => recordedYears(observations), [observations])
  const streak = useMemo(() => currentStreakDays(observations), [observations])
  const month = useMemo(() => thisMonthProgress(observations, MONTH_GOAL), [observations])
  const totalByCategory = useMemo(() => {
    const m: Record<string, number> = {}
    for (const o of observations) m[o.category] = (m[o.category] ?? 0) + 1
    return m
  }, [observations])

  return (
    <div className="min-h-screen bg-bg pb-24">
      <div className="px-5 lg:px-8 pt-4 lg:pt-8 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-ink">さんぽログ</h1>

        {isLoading ? (
          <div className="mt-6 flex flex-col gap-4">
            <Skeleton w="100%" h={96} radius={16} />
            <Skeleton w="100%" h={140} radius={16} />
          </div>
        ) : observations.length === 0 ? (
          <EmptyState
            icon="📔"
            title="まだ記録がありません"
            body="発見を記録すると、月別のふりかえりや連続記録がここに表示されます。"
            action={{ label: '発見を記録する', href: '/home/new' }}
          />
        ) : (
          <div className="mt-5 flex flex-col gap-6">
            {/* 今月 + ストリーク */}
            <Card padding="md">
              <div className="flex items-center gap-4">
                <MonthlyRing
                  count={month.count}
                  goal={month.goal}
                  size={72}
                  label={`今月 ${month.count} / ${month.goal} 件`}
                />
                <div className="flex flex-col gap-1.5">
                  <p className="text-sm text-ink-sub">
                    今月の発見 <span className="font-bold text-ink">{month.count}</span> / {month.goal}
                  </p>
                  <StreakBadge days={streak} />
                  {streak < 2 && (
                    <p className="text-xs text-ink-muted">今日記録すると連続記録がはじまります</p>
                  )}
                </div>
              </div>
            </Card>

            {/* カテゴリ別合計 */}
            <div>
              <p className="text-xs text-ink-muted mb-2">カテゴリ別の合計</p>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.filter((c) => totalByCategory[c]).map((c) => (
                  <span
                    key={c}
                    className="inline-flex items-center gap-1 rounded-full bg-surface border border-line text-sm px-3 py-1"
                  >
                    <span aria-hidden="true">{CATEGORY_META[c]?.glyph}</span>
                    {c} <span className="font-bold text-ink">{totalByCategory[c]}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* 年ごとのタイムライン */}
            {years.map((year) => {
              const counts = monthlyCounts(observations, year)
              const recap = yearRecap(observations, year)
              return (
                <div key={year} className="flex flex-col gap-3">
                  <p className="text-sm font-bold text-ink">{year}年</p>
                  {recap && <RecapCard recap={recap} year={year} />}
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {counts.map((n, i) =>
                      n > 0 ? (
                        <div
                          key={i}
                          className="flex flex-col items-center gap-1 rounded-lg bg-surface py-3"
                        >
                          <MonthlyRing count={n} goal={MONTH_GOAL} size={48} label={`${MONTH_NAMES[i]} ${n}件`} />
                          <span className="text-xs text-ink-muted">{MONTH_NAMES[i]}</span>
                        </div>
                      ) : null
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
