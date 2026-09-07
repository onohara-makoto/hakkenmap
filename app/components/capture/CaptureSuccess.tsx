'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import { Button } from '@/app/components/ui'
import { MonthlyRing } from '@/app/components/log/MonthlyRing'
import { StreakBadge } from '@/app/components/log/StreakBadge'
import type { Observation } from '@/app/types/observation'

/**
 * 記録成功時のインタースティシャル。/home/new が即リダイレクトする代わりに表示する。
 * 「＋1 発見」・月間リング充填・連続記録バッジ・触覚フィードバック。
 */
export function CaptureSuccess({
  observation,
  monthCount,
  monthGoal,
  streakDays,
  onContinue,
}: {
  observation: Observation
  monthCount: number
  monthGoal: number
  streakDays: number
  onContinue: () => void
}) {
  useEffect(() => {
    navigator.vibrate?.(15)
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 px-8 text-center bg-bg animate-fade-in-up">
      {observation.photo_url && (
        <div className="relative w-28 h-28 rounded-xl overflow-hidden shadow-md">
          <Image src={observation.photo_url} alt="" fill sizes="112px" className="object-cover" />
        </div>
      )}

      <p className="text-2xl font-bold text-ink">＋1 発見！</p>

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
        <Button href={`/home?focus=${observation.id}`} variant="primary" fullWidth>
          地図で見る
        </Button>
        <Button variant="ghost" fullWidth onClick={onContinue}>
          つづけて記録
        </Button>
      </div>
    </div>
  )
}
