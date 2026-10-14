'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Button } from '@/app/components/ui'
import { IdentifyCandidates } from '@/app/components/capture/IdentifyCandidates'
import { DemoNotice } from '@/app/components/demo/DemoBadge'
import { CATEGORIES, CATEGORY_COLORS } from '@/app/lib/categories'
import { useAppMode } from '@/app/lib/app-mode'
import type { IdentifyResult } from '@/app/lib/identify/handler'
import type { Category } from '@/app/types/observation'

/**
 * 記録画面のプレビュー。実際のアプリ（/home/new）と同じ流れを見せるが、
 * AI識別は固定のサンプル候補を返すだけで API を呼ばず、保存もしない。
 */
const SAMPLE_RESULTS: IdentifyResult[] = [
  { commonName: 'Garden cosmos', name: 'Cosmos bipinnatus', score: 0.86 },
  { commonName: 'Sulphur cosmos', name: 'Cosmos sulphureus', score: 0.08 },
  { commonName: 'Japanese anemone', name: 'Anemone hupehensis', score: 0.04 },
]

export default function DemoNewPage() {
  const { t } = useAppMode()
  const [category, setCategory] = useState<Category>('花')
  const [name, setName] = useState('')
  const [isIdentifying, setIsIdentifying] = useState(false)
  const [results, setResults] = useState<IdentifyResult[] | null>(null)
  const [selected, setSelected] = useState<number | null>(null)

  const suggest = () => {
    setIsIdentifying(true)
    setResults(null)
    setSelected(null)
    setTimeout(() => {
      setResults(SAMPLE_RESULTS)
      setIsIdentifying(false)
    }, 700)
  }

  return (
    <div className="bg-bg" style={{ minHeight: '100vh' }}>
      <div className="mx-auto" style={{ maxWidth: 760 }}>
        <h1 className="hidden lg:block text-lg font-bold text-ink px-8 pt-5 pb-4">{t.nav.newTitle}</h1>

        <div className="px-5 lg:px-8 pt-4 lg:pt-0 pb-24 flex flex-col gap-5">
          <DemoNotice />

          <div className="lg:grid gap-7" style={{ gridTemplateColumns: '300px 1fr' }}>
            <div className="flex flex-col gap-3 mb-6 lg:mb-0">
              <div className="relative overflow-hidden" style={{ height: 172, borderRadius: 20 }}>
                <Image src="/demo/cosmos.svg" alt="Sample photo of cosmos flowers" fill className="object-cover" />
              </div>
              <div className="rounded-xl bg-surface text-xs text-ink-sub" style={{ padding: '10px 14px' }}>
                <p className="font-semibold text-ink mb-1">Photo info (read from EXIF)</p>
                <p>Taken: 2 days ago, 10:30</p>
                <p>Location: 35.69910, 139.56260</p>
              </div>
              <button
                type="button"
                onClick={suggest}
                disabled={isIdentifying}
                aria-busy={isIdentifying}
                className="rounded-lg text-sm font-medium border-none transition-opacity focus-ring disabled:opacity-60"
                style={{ padding: '10px 0', background: 'var(--secondary-soft)', color: 'var(--secondary-ink)' }}
              >
                {isIdentifying ? 'Identifying…' : '✨ Suggest names with AI'}
              </button>
              {results && (
                <>
                  <IdentifyCandidates
                    results={results}
                    selectedIndex={selected}
                    onSelect={(r, i) => { setName(r.commonName ?? r.name); setSelected(i) }}
                  />
                  <p className="text-[11px] text-ink-muted">
                    Sample suggestions for the demo. The real app sends the photo to Gemini through an
                    authenticated, rate-limited API route.
                  </p>
                </>
              )}
            </div>

            <div className="flex flex-col gap-5">
              <div>
                <span className="text-sm font-medium text-ink-sub block mb-2">Category</span>
                <div className="flex flex-wrap gap-2" role="group" aria-label="Choose a category">
                  {CATEGORIES.map((cat) => {
                    const isSelected = category === cat
                    return (
                      <button
                        key={cat}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => setCategory(cat)}
                        className={`rounded-full text-sm border-none cursor-pointer transition-all focus-ring ${isSelected ? 'font-bold' : ''}`}
                        style={{
                          padding: '8px 15px',
                          background: isSelected ? 'var(--primary)' : 'var(--surface)',
                          color: isSelected ? 'var(--on-primary)' : CATEGORY_COLORS[cat].ink,
                          outline: isSelected ? 'none' : '1px solid var(--line)',
                        }}
                      >
                        {t.categoryLabel(cat)}
                      </button>
                    )
                  })}
                </div>
              </div>

              <label className="text-sm font-medium text-ink-sub block">
                Name <span className="font-normal text-ink-muted text-xs">(optional)</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Garden cosmos"
                  className="mt-1.5 w-full box-border rounded-lg text-sm bg-surface text-ink border border-line focus-ring"
                  style={{ padding: '13px 14px' }}
                />
              </label>

              <Button type="button" variant="primary" size="lg" fullWidth disabled>
                Save (disabled in demo)
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
