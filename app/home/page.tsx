'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getObservations } from '@/app/lib/observations'
import { createClient } from '@/app/lib/supabase/client'
import { CATEGORIES } from '@/app/lib/categories'
import type { Observation } from '@/app/types/observation'
import type { Category } from '@/app/types/observation'
import { Logo, Chip, Badge, EmptyState, Skeleton } from '@/app/components/ui'

export default function HomePage() {
  const router = useRouter()
  const [observations, setObservations] = useState<Observation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)

  useEffect(() => {
    getObservations().then((data) => { setObservations(data); setIsLoading(false) })
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const activeMonths = useMemo(() => {
    const months = new Set<number>()
    observations.forEach((obs) => {
      const date = new Date(obs.observed_at ?? obs.created_at)
      months.add(date.getMonth() + 1)
    })
    return Array.from(months).sort((a, b) => a - b)
  }, [observations])

  const filtered = useMemo(() => {
    return observations.filter((obs) => {
      if (selectedMonth !== null) {
        const month = new Date(obs.observed_at ?? obs.created_at).getMonth() + 1
        if (month !== selectedMonth) return false
      }
      if (selectedCategory !== null && obs.category !== selectedCategory) return false
      return true
    })
  }, [observations, selectedMonth, selectedCategory])

  return (
    <div className="min-h-screen bg-bg">
      <div className="flex-1 flex flex-col relative">

        {/* スマホ: ヘッダー */}
        <header className="lg:hidden flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <Logo size={30} />
            <span className="text-xl font-bold text-ink">発見マップ</span>
          </div>
          <button onClick={handleLogout} className="bg-transparent border-none cursor-pointer text-ink-muted text-sm focus-ring rounded-md px-1">
            ログアウト
          </button>
        </header>

        {/* PC: ページ見出し */}
        <div className="px-8 pt-8 pb-2">
          <h1 className="text-2xl font-bold text-ink">わたしの発見</h1>
          {!isLoading && (
            <p className="text-xs text-ink-muted mt-1">{filtered.length}件の記録</p>
          )}
        </div>

        {/* フィルター */}
        <div className="px-5 lg:px-8 pt-2">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <Chip
              label="すべて"
              selected={selectedMonth === null && selectedCategory === null}
              onToggle={() => { setSelectedMonth(null); setSelectedCategory(null) }}
            />
            {activeMonths.map((month) => (
              <Chip
                key={month}
                label={`${month}月`}
                selected={selectedMonth === month}
                onToggle={() => setSelectedMonth(selectedMonth === month ? null : month)}
              />
            ))}
            {CATEGORIES.map((cat) => (
              <Chip
                key={cat}
                label={cat}
                selected={selectedCategory === cat}
                onToggle={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
              />
            ))}
          </div>
        </div>

        {/* 件数（スマホ） */}
        {!isLoading && (
          <p className="lg:hidden px-5 mt-1 text-xs text-ink-muted">
            {filtered.length}件のはっけん
          </p>
        )}

        {/* リスト */}
        <div className="flex-1 px-5 lg:px-8 pb-32 lg:pb-8 mt-3">
          {isLoading ? (
            <div className="grid gap-3 lg:grid-cols-3" aria-hidden="true">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex lg:flex-col gap-3 rounded-xl bg-surface shadow-md p-2.5">
                  <Skeleton w={66} h={66} radius={15} className="flex-shrink-0" />
                  <div className="flex flex-col gap-2 min-w-0 flex-1 py-1">
                    <Skeleton w="70%" h={14} radius={4} />
                    <Skeleton w={48} h={18} radius={22} />
                    <Skeleton w="50%" h={11} radius={4} />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            observations.length === 0 ? (
              <EmptyState
                icon="🌿"
                title="まだ記録がありません"
                body={'お散歩でみつけた草花や生きものを\n最初の発見として記録してみましょう！'}
                action={{ label: '＋ 記録する', href: '/home/new' }}
              />
            ) : (
              <EmptyState icon="🔍" title="該当する記録がありません" />
            )
          ) : (
            <ul role="list" className="grid gap-3 lg:grid-cols-3 list-none p-0 m-0">
              {filtered.map((obs) => (
                <li key={obs.id}>
                  <Link
                    href={`/home/${obs.id}`}
                    className="flex lg:flex-col gap-3 p-2.5 rounded-xl bg-surface shadow-md transition-shadow hover:shadow-lg no-underline text-inherit focus-ring"
                  >
                    {/* サムネイル */}
                    {obs.photo_url ? (
                      <div className="relative flex-shrink-0 overflow-hidden rounded-[15px]" style={{ width: 66, height: 66 }}>
                        <Image
                          src={obs.photo_url}
                          alt={`${obs.name || obs.category}${obs.location_name ? ` (${obs.location_name})` : ''}`}
                          fill
                          sizes="66px"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div
                        className="flex-shrink-0 flex items-center justify-center text-2xl rounded-[15px]"
                        style={{ width: 66, height: 66, background: 'var(--tag-warm-bg)' }}
                        aria-hidden="true"
                      >
                        🌿
                      </div>
                    )}
                    <div className="flex flex-col gap-1 min-w-0 flex-1">
                      <p className="text-sm font-bold text-ink truncate">
                        {obs.name || obs.category}
                      </p>
                      <Badge category={obs.category} />
                      <p className="text-xs text-ink-muted truncate">
                        {new Date(obs.observed_at ?? obs.created_at).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })}
                        {obs.location_name ? ` · ${obs.location_name}` : ''}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* スマホ: フローティングボタン */}
        <div
          className="lg:hidden fixed bottom-0 left-0 right-0 px-5 pb-6 pt-10"
          style={{ background: 'linear-gradient(transparent, var(--bg) 34%)', pointerEvents: 'none' }}
        >
          <div className="flex gap-3" style={{ pointerEvents: 'auto' }}>
            <Link
              href="/home/new"
              className="flex-1 flex items-center justify-center gap-1 rounded-lg py-3.5 font-semibold text-base bg-primary text-on-primary shadow-primary transition-opacity hover:opacity-80 no-underline focus-ring"
            >
              ＋ 記録する
            </Link>
            <Link
              href="/home/map"
              className="flex items-center justify-center rounded-lg px-5 py-3.5 font-medium text-sm bg-surface text-secondary-ink border border-line transition-colors hover:opacity-80 no-underline focus-ring"
            >
              地図
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}
