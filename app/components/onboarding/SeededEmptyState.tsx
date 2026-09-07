import { Button, Badge } from '@/app/components/ui'

const EXAMPLES = [
  { name: 'オオイヌノフグリ', category: '花', when: '3月・公園のすみ' },
  { name: 'カワラタケ', category: 'きのこ', when: '10月・雑木林の倒木' },
  { name: 'ナナホシテントウ', category: '虫', when: '5月・草はらの葉の上' },
]

/**
 * 初回（記録ゼロ）の空状態。プレーンテキストの代わりに、
 * 「こんな風に記録できる」例カード + 単一 CTA を見せる。
 */
export function SeededEmptyState() {
  return (
    <div className="py-8">
      <p className="text-base font-semibold text-ink text-center">まだ記録がありません</p>
      <p className="text-sm text-ink-muted text-center mt-1 mb-5">
        お散歩でみつけた草花や生きものを{'\n'}地図に残していきましょう。
      </p>

      <p className="text-xs text-ink-muted mb-2">たとえば、こんな発見</p>
      <ul role="list" className="grid gap-2 list-none p-0 m-0">
        {EXAMPLES.map((ex) => (
          <li
            key={ex.name}
            className="flex items-center gap-3 p-2.5 rounded-xl bg-bg opacity-70"
            aria-hidden="true"
          >
            <div
              className="flex-shrink-0 flex items-center justify-center text-xl rounded-[14px]"
              style={{ width: 48, height: 48, background: 'var(--tag-warm-bg)' }}
            >
              🌿
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-ink truncate">{ex.name}</p>
              <div className="mt-0.5">
                <Badge category={ex.category} />
              </div>
              <p className="text-xs text-ink-muted mt-0.5 truncate">{ex.when}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-5 flex justify-center">
        <Button href="/home/new" variant="primary">
          ＋ 最初の発見を記録する
        </Button>
      </div>
    </div>
  )
}
