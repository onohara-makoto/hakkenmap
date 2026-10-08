import type { ReactNode } from 'react'
import { CategoryIcon } from '@/app/components/ui'
import { CATEGORY_META } from '@/app/lib/categories'
import type { YearRecap } from '@/app/lib/stats'

const MONTH_NAMES = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-2.5">
      <p className="text-[9.5px] tracking-wider text-ink-sub font-medium mb-1">{label}</p>
      <p className="flex items-baseline gap-1 text-[15px] font-bold text-ink" style={{ fontFamily: 'var(--font-zen-maru)' }}>
        {children}
      </p>
    </div>
  )
}

/** 年ごとの「探検日誌」。年間まとめの数値＋月別の記録密度バー */
export function ExpeditionLog({ recap, counts }: { recap: YearRecap; counts: number[] }) {
  const max = Math.max(1, ...counts)

  return (
    <div className="rounded-[18px] border border-line bg-surface-2 p-4">
      <div className="grid grid-cols-2 gap-2.5 mb-4">
        <Stat label="発見の数">
          {recap.total}
          <em className="not-italic text-[11px] text-ink-sub font-medium">件</em>
        </Stat>
        <Stat label="いちばん多い月">
          {recap.busiestMonth}
          <em className="not-italic text-[11px] text-ink-sub font-medium">月</em>
        </Stat>
        <Stat label="よく見た種類">
          {recap.topCategory ? (
            <>
              <CategoryIcon category={recap.topCategory} size={16} />
              <em className="not-italic text-[11px] text-ink-sub font-medium">
                {CATEGORY_META[recap.topCategory]?.label ?? recap.topCategory}
              </em>
            </>
          ) : (
            '—'
          )}
        </Stat>
        <Stat label="訪れた場所">
          {recap.distinctSpots}
          <em className="not-italic text-[11px] text-ink-sub font-medium">件</em>
        </Stat>
      </div>

      <div className="flex flex-col gap-2">
        {counts.map((n, i) => {
          const isPeak = n > 0 && i + 1 === recap.busiestMonth
          return (
            <div key={i} className="grid grid-cols-[34px_1fr_30px] items-center gap-2">
              <span className={`text-xs font-medium ${isPeak ? 'text-primary font-bold' : 'text-ink-sub'}`}>
                {MONTH_NAMES[i]}
              </span>
              <span className="h-[9px] rounded-full bg-line/60 overflow-hidden">
                <span
                  className={`block h-full rounded-full ${isPeak ? 'bg-primary' : 'bg-secondary'}`}
                  style={{ width: `${(n / max) * 100}%` }}
                />
              </span>
              <span className={`text-xs text-right tabular-nums ${isPeak ? 'text-primary font-bold' : 'text-ink-sub'}`}>
                {n}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
