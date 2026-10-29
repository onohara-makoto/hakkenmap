import Link from 'next/link'
import Image from 'next/image'
import { CATEGORY_META, nextMilestone } from '@/app/lib/categories'
import { CategoryIcon, Icon } from '@/app/components/ui'

/** コレクション棚の1枚。カテゴリごとの記録数を、代表写真つきの図鑑の見開きページ風に見せる */
export function CategoryPlate({
  category,
  folio,
  count,
  topCount,
  isChampion,
  coverUrl,
}: {
  category: string
  /** 図版番号（1始まり） */
  folio: number
  count: number
  /** 最多カテゴリの件数。バーの相対的な長さの基準にする */
  topCount: number
  isChampion: boolean
  /** 代表写真（写真付きで最新の記録）。無ければカテゴリアイコンを出す */
  coverUrl: string | null
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
      {/* 外側の padding を打ち消してカード端まで広げる */}
      <div className="-mx-3 -mt-3.5 mb-2.5 relative aspect-[4/3] overflow-hidden bg-surface-2">
        {coverUrl ? (
          <Image src={coverUrl} alt="" fill sizes="(min-width: 640px) 200px, 50vw" className="object-cover" />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: 'var(--tag-warm-bg)' }}
          >
            <CategoryIcon
              category={category}
              size={44}
              className={isEmpty ? 'grayscale opacity-45' : ''}
            />
          </div>
        )}
        <span className="absolute top-2 left-2 rounded-full bg-surface/90 px-2 py-0.5 text-xs text-ink-muted font-medium inline-flex items-center gap-1">
          図版 {String(folio).padStart(2, '0')}
          {isChampion && <span className="text-xs">👑</span>}
        </span>
      </div>
      <p className={`mb-0.5 text-base font-bold font-display inline-flex items-center gap-1.5 ${isEmpty ? 'text-ink-sub' : 'text-ink'}`}>
        <CategoryIcon category={category} size={18} className={isEmpty ? 'grayscale opacity-45' : ''} />
        {meta.label}
      </p>
      <p className="text-xs text-ink-muted mb-2.5">{meta.sub}</p>

      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold font-display text-ink">
          {count}
        </span>
        <span className="text-xs text-ink-sub font-medium">件</span>
      </div>
      <div className="h-[5px] rounded-full bg-line/60 my-2 overflow-hidden">
        <div
          className={`h-full rounded-full ${isChampion ? 'bg-primary' : isEmpty ? 'bg-ink-faint' : 'bg-secondary'}`}
          style={{ width: `${Math.round(ratio * 100)}%` }}
        />
      </div>
      <p className="text-xs text-ink-sub leading-relaxed">{note}</p>
      <p className="mt-auto pt-2 text-xs font-bold text-primary inline-flex items-center gap-0.5">
        {isEmpty ? '記録しに行く' : '図鑑で見る'}
        <Icon name="forward" size={14} className="transition-transform group-hover:translate-x-0.5" />
      </p>
    </>
  )

  const className =
    'group relative flex flex-col rounded-2xl border border-line bg-surface px-3 pt-3.5 pb-3 overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-clay' +
    (isChampion ? ' bg-gradient-to-br from-surface to-primary/10 border-primary/30' : '')

  const href = isEmpty ? '/home/new' : `/home?view=zukan&category=${encodeURIComponent(category)}`

  return (
    <Link href={href} className={className}>
      {inner}
    </Link>
  )
}
