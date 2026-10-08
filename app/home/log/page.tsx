'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useMemo, useState } from 'react'
import { getObservations } from '@/app/lib/observations'
import { monthlyCounts, recordedYears, currentStreakDays, thisMonthProgress, yearRecap, spotCounts } from '@/app/lib/stats'
import { CATEGORIES, CATEGORY_META } from '@/app/lib/categories'
import { MonthlyRing } from '@/app/components/log/MonthlyRing'
import { StreakBadge } from '@/app/components/log/StreakBadge'
import { CategoryPlate } from '@/app/components/log/CategoryPlate'
import { SpotCatalog } from '@/app/components/log/SpotCatalog'
import { ExpeditionLog } from '@/app/components/log/ExpeditionLog'
import { SectionLeaf } from '@/app/components/log/SectionLeaf'
import { Card, EmptyState, Skeleton, CategoryIcon } from '@/app/components/ui'
import type { Observation } from '@/app/types/observation'

const MONTH_GOAL = 10

function topCategoryOf(counts: Record<string, number>): string | null {
  const entries = Object.entries(counts)
  if (entries.length === 0) return null
  return entries.sort((a, b) => b[1] - a[1])[0][0]
}

export default function SanpoLogPage() {
  const [observations, setObservations] = useState<Observation[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getObservations().then((d) => {
      setObservations(d)
      setIsLoading(false)
    })
  }, [])

  const years = useMemo(() => recordedYears(observations), [observations])
  const streak = useMemo(() => currentStreakDays(observations), [observations])
  const month = useMemo(() => thisMonthProgress(observations, MONTH_GOAL), [observations])

  const totalByCategory = useMemo(() => {
    const m: Record<string, number> = {}
    for (const o of observations) m[o.category] = (m[o.category] ?? 0) + 1
    return m
  }, [observations])
  const topCategoryOverall = useMemo(() => topCategoryOf(totalByCategory), [totalByCategory])
  const topCount = Math.max(0, ...Object.values(totalByCategory))

  const monthTopCategory = useMemo(() => {
    const now = new Date()
    const m: Record<string, number> = {}
    for (const o of observations) {
      const d = new Date(o.created_at)
      if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()) {
        m[o.category] = (m[o.category] ?? 0) + 1
      }
    }
    return topCategoryOf(m)
  }, [observations])

  const spots = useMemo(() => spotCounts(observations), [observations])

  const monthHeadline =
    month.count >= month.goal
      ? month.count === month.goal
        ? `目標の${month.goal}件を達成しました。今月のページはもう満点です。`
        : `目標を${month.count - month.goal}件超えました。今月のページはもう満点です。`
      : `目標まであと${month.goal - month.count}件です。`

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
          <div className="mt-5 flex flex-col gap-8">
            {/* 今月の記録 */}
            <SectionLeaf title="今月の記録" folio={`${new Date().getMonth() + 1}月`}>
              <Card padding="md">
                <div className="flex gap-4 items-center">
                  <MonthlyRing
                    count={month.count}
                    goal={month.goal}
                    size={78}
                    sub={`目標${month.goal}`}
                    label={`今月 ${month.count} / ${month.goal} 件`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-ink-sub mb-1">今月の発見スタンプ</p>
                    <p
                      className="text-sm font-bold text-ink mb-2.5 leading-relaxed"
                      style={{ fontFamily: 'var(--font-zen-maru)' }}
                    >
                      {monthHeadline}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <StreakBadge days={streak} />
                      {streak < 2 && (
                        <p className="text-xs text-ink-muted">今日記録すると連続記録がはじまります</p>
                      )}
                      {monthTopCategory && (
                        <span
                          className="inline-flex items-center gap-1 rounded-full text-xs font-semibold px-2.5 py-1"
                          style={{ background: 'var(--color-secondary-soft)', color: 'var(--color-secondary-ink)' }}
                        >
                          <CategoryIcon category={monthTopCategory} size={14} />
                          {CATEGORY_META[monthTopCategory]?.label}豊作
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </SectionLeaf>

            {/* コレクション棚 */}
            <SectionLeaf
              title="コレクション棚"
              folio={`図版 01–0${CATEGORIES.length}`}
              subtitle="見つけた生きものを、種類ごとの図版に集めています。タップで一覧へ。"
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {CATEGORIES.map((c, i) => (
                  <CategoryPlate
                    key={c}
                    category={c}
                    folio={i + 1}
                    count={totalByCategory[c] ?? 0}
                    topCount={topCount}
                    isChampion={!!topCategoryOverall && c === topCategoryOverall && (totalByCategory[c] ?? 0) > 0}
                  />
                ))}
              </div>
            </SectionLeaf>

            {/* 訪れた場所 */}
            <SectionLeaf title="訪れた場所" folio="目録カード">
              <SpotCatalog spots={spots} />
            </SectionLeaf>

            {/* 年ごとの探検日誌 */}
            {years.map((year) => {
              const counts = monthlyCounts(observations, year)
              const recap = yearRecap(observations, year)
              if (!recap) return null
              return (
                <SectionLeaf key={year} title="探検日誌" folio={`${year}年`}>
                  <ExpeditionLog recap={recap} counts={counts} />
                </SectionLeaf>
              )
            })}

            <p className="text-center text-[11px] text-ink-faint tracking-wide pb-2">
              図鑑は記録するたびにページが増えます
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
