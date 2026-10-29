'use client'

import { useEffect, useRef, type RefObject } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { CategoryIcon, EmptyState, Skeleton } from '@/app/components/ui'
import { SeededEmptyState } from '@/app/components/onboarding/SeededEmptyState'
import { FilterChips } from './FilterChips'
import type { ObservationFilter } from './useObservationFilter'
import type { Observation } from '@/app/types/observation'

const SCROLL_KEY = 'zukan-scroll'

/** スクロール位置がどの一覧のものかを表すキー。表示・絞り込みが違えば別の一覧とみなす */
function listKey() {
  const p = new URLSearchParams(window.location.search)
  return ['view', 'month', 'category'].map((k) => p.get(k) ?? '').join('|')
}

/**
 * 写真を主役にした図鑑表示。2列（sm 3列 / lg 4列）のカードで、タップで詳細ページへ。
 * 図鑑は固定レイヤー内でスクロールするためブラウザのスクロール復元が効かない。
 * 詳細へ移る直前の位置を sessionStorage に残し、戻ってきて読み込みが終わったら1回だけ戻す。
 * 保存時と表示・絞り込みが違う場合は別の一覧なので捨てる。
 */
export function ZukanGrid({
  observations,
  filter,
  isLoading,
  scrollRef,
}: {
  observations: Observation[]
  filter: ObservationFilter
  isLoading: boolean
  scrollRef: RefObject<HTMLDivElement | null>
}) {
  const { filtered } = filter
  const restoredRef = useRef(false)

  useEffect(() => {
    if (isLoading || restoredRef.current) return
    restoredRef.current = true
    const raw = sessionStorage.getItem(SCROLL_KEY)
    if (raw === null) return
    sessionStorage.removeItem(SCROLL_KEY)
    let saved: { key?: unknown; top?: unknown } | null
    try {
      saved = JSON.parse(raw)
    } catch {
      return
    }
    if (saved?.key !== listKey() || typeof saved?.top !== 'number') return
    if (scrollRef.current) scrollRef.current.scrollTop = saved.top
  }, [isLoading, scrollRef])

  const rememberScroll = () => {
    if (!scrollRef.current) return
    sessionStorage.setItem(SCROLL_KEY, JSON.stringify({ key: listKey(), top: scrollRef.current.scrollTop }))
  }

  return (
    <div className="max-w-5xl mx-auto px-4 lg:px-8">
      <div className="flex items-baseline justify-between mb-3">
        <h1 className="text-xl font-bold font-display text-ink">わたしの図鑑</h1>
        {!isLoading && (
          <span className="text-xs text-ink-muted" aria-live="polite">
            {filtered.length}件
          </span>
        )}
      </div>

      <FilterChips filter={filter} />

      <div className="mt-2">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3" aria-hidden="true">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="aspect-square" w="100%" radius={12} />
                <div className="flex flex-col gap-1.5 mt-2">
                  <Skeleton w="70%" h={13} radius={4} />
                  <Skeleton w="45%" h={11} radius={4} />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          observations.length === 0 ? (
            <SeededEmptyState />
          ) : (
            <EmptyState icon="🔍" title="該当する記録がありません" />
          )
        ) : (
          <ul role="list" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 list-none p-0 m-0">
            {filtered.map((obs) => {
              const title = obs.name || obs.category
              return (
                <li key={obs.id}>
                  <Link
                    href={`/home/${obs.id}`}
                    onClick={rememberScroll}
                    className="group block focus-ring rounded-xl"
                  >
                    {obs.photo_url ? (
                      <div className="relative aspect-square overflow-hidden rounded-xl bg-surface-2">
                        <Image
                          src={obs.photo_url}
                          alt={title}
                          fill
                          sizes="(min-width: 1024px) 240px, (min-width: 640px) 33vw, 50vw"
                          className="object-cover transition-transform group-hover:scale-[1.03]"
                        />
                      </div>
                    ) : (
                      <div
                        className="aspect-square rounded-xl flex items-center justify-center"
                        style={{ background: 'var(--tag-warm-bg)' }}
                      >
                        <CategoryIcon category={obs.category} size={56} />
                      </div>
                    )}
                    <p className="text-sm font-bold text-ink truncate mt-1.5">{title}</p>
                    <p className="text-xs text-ink-muted">
                      {new Date(obs.observed_at ?? obs.created_at).toLocaleDateString('ja-JP', {
                        year: 'numeric',
                        month: 'numeric',
                        day: 'numeric',
                      })}
                    </p>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
