'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import { Button } from '@/app/components/ui'
import { MonthlyRing } from '@/app/components/log/MonthlyRing'
import { StreakBadge } from '@/app/components/log/StreakBadge'
import type { Observation } from '@/app/types/observation'

/**
 * 記録成功時のインタースティシャル。/home/new が即リダイレクトする代わりに表示する。
 * 「＋N 発見」・月間リング充填・連続記録バッジ・触覚フィードバック。
 * 一括登録では observations に複数件が入る。
 */
export function CaptureSuccess({
  observations,
  monthCount,
  monthGoal,
  streakDays,
  onContinue,
}: {
  observations: Observation[]
  monthCount: number
  monthGoal: number
  streakDays: number
  onContinue: () => void
}) {
  useEffect(() => {
    navigator.vibrate?.(15)
  }, [])

  const count = observations.length
  const first = observations[0]
  const mapHref =
    count === 1 && first ? `/home?focus=${first.id}` : '/home'

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 px-8 text-center bg-bg animate-fade-in-up">
      {first?.photo_url && (
        <div className="relative w-28 h-28 rounded-xl overflow-hidden shadow-md">
          <Image src={first.photo_url} alt="" fill sizes="112px" className="object-cover" />
          {count > 1 && (
            <span className="absolute right-1 bottom-1 rounded-md bg-primary text-on-primary text-xs font-bold px-1.5 py-0.5">
              ×{count}
            </span>
          )}
        </div>
      )}

      <p className="text-2xl font-bold text-ink">＋{count} 発見！</p>

      <MonthlyRing
        count={monthCount}
        goal={monthGoal}
        size={96}
        animate
        label={`今月 ${monthCount} / ${monthGoal} 件`}
      />
      <p className="text-sm text-ink-sub">
        今月 {monthCount} / {monthGoal} 件
      </p>

      <StreakBadge days={streakDays} />

      <div className="flex flex-col gap-2 w-full max-w-xs pt-3">
        <Button href={mapHref} variant="primary" fullWidth>
          地図で見る
        </Button>
        <Button variant="ghost" fullWidth onClick={onContinue}>
          つづけて記録
        </Button>
      </div>
    </div>
  )
}
