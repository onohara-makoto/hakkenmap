import Link from 'next/link'
import { CATEGORY_META, nextMilestone } from '@/app/lib/categories'
import { CategoryIcon } from '@/app/components/ui'

/** コレクション棚の1枚。カテゴリごとの記録数を図鑑の見開きページ風に見せる */
export function CategoryPlate({
  category,
  folio,
  count,
  topCount,
  isChampion,
}: {
  category: string
  /** 図版番号（1始まり） */
  folio: number
  count: number
  /** 最多カテゴリの件数。バーの相対的な長さの基準にする */
  topCount: number
  isChampion: boolean
}) {
  const meta = CATEGORY_META[category] ?? CATEGORY_META['その他']
  const isEmpty = count === 0
  const ratio = isEmpty ? 0 : topCount > 0 ? Math.max(count / topCount, 0.08) : 0
  const milestone = nextMilestone(count)

  const note = isEmpty
    ? meta.emptyNote
    : isChampion && milestone
      ? `今いちばん厚いページ。次の称号まであと${milestone - count}件。`
      : `${count}件、記録しました。`

  const inner = (
    <>
      <div className="flex items-start justify-between">
        <span className="text-[9.5px] tracking-wider text-ink-faint font-medium inline-flex items-center gap-1">
          図版 {String(folio).padStart(2, '0')}
          {isChampion && <span className="text-[11px]">👑</span>}
        </span>
        <CategoryIcon
          category={category}
          size={30}
          className={isEmpty ? 'grayscale opacity-45' : ''}
        />
      </div>
      <p className={`mt-2 mb-0.5 text-[13.5px] font-bold ${isEmpty ? 'text-ink-sub' : 'text-ink'}`} style={{ fontFamily: 'var(--font-zen-maru)' }}>
        {meta.label}
      </p>
      <p className="text-[9.5px] text-ink-faint tracking-wide mb-2.5">{meta.sub}</p>

      <div className="flex items-baseline gap-1">
        <span className="text-[21px] font-black text-ink" style={{ fontFamily: 'var(--font-zen-maru)' }}>
          {count}
        </span>
        <span className="text-[10.5px] text-ink-sub font-medium">件</span>
      </div>
      <div className="h-[5px] rounded-full bg-line/60 my-2 overflow-hidden">
        <div
          className={`h-full rounded-full ${isChampion ? 'bg-primary' : isEmpty ? 'bg-ink-faint' : 'bg-secondary'}`}
          style={{ width: `${Math.round(ratio * 100)}%` }}
        />
      </div>
      <p className="text-[10.5px] text-ink-sub leading-relaxed">{note}</p>
      <p className="mt-2 text-[10.5px] font-bold text-primary opacity-0 -translate-x-0.5 transition-all group-hover:opacity-100 group-hover:translate-x-0">
        {isEmpty ? '記録しに行く →' : '一覧を見る →'}
      </p>
    </>
  )

  const className =
    'group relative rounded-2xl border border-line bg-surface px-3 pt-3.5 pb-3 overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-clay' +
    (isChampion ? ' bg-gradient-to-br from-surface to-primary/10 border-primary/30' : '')

  const href = isEmpty ? '/home/new' : `/home?category=${encodeURIComponent(category)}`

  return (
    <Link href={href} className={className}>
      {inner}
    </Link>
  )
}
