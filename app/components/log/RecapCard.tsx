import { Card } from '@/app/components/ui'
import { CATEGORY_META } from '@/app/lib/categories'
import type { YearRecap } from '@/app/lib/stats'

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-lg font-bold text-ink">{value}</span>
      <span className="text-xs text-ink-muted">{label}</span>
    </div>
  )
}

export function RecapCard({ recap, year }: { recap: YearRecap; year: number }) {
  const topLabel = recap.topCategory
    ? `${CATEGORY_META[recap.topCategory]?.glyph ?? ''}${CATEGORY_META[recap.topCategory]?.label ?? recap.topCategory}`
    : '—'

  return (
    <Card padding="md">
      <p className="text-sm font-bold text-ink mb-3">{year}年の発見まとめ</p>
      <div className="grid grid-cols-2 gap-y-4 gap-x-2">
        <Stat label="発見の数" value={`${recap.total}`} />
        <Stat label="いちばん多い月" value={`${recap.busiestMonth}月`} />
        <Stat label="よく見た" value={topLabel} />
        <Stat label="訪れた場所" value={`${recap.distinctSpots}`} />
      </div>
    </Card>
  )
}
