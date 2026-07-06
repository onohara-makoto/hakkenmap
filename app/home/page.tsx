'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getObservations } from '@/app/lib/observations'
import { createClient } from '@/app/lib/supabase/client'
import { CATEGORY_COLORS, CATEGORIES } from '@/app/lib/categories'
import type { Observation } from '@/app/types/observation'
import type { Category } from '@/app/types/observation'

function Logo({ size = 30, innerSize = 9 }: { size?: number; innerSize?: number }) {
  return (
    <div style={{
      width: size, height: size,
      borderRadius: Math.round(size * 0.37),
      background: 'var(--secondary)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <div style={{ width: innerSize * 2, height: innerSize * 2, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: innerSize, height: innerSize, borderRadius: 3, background: 'var(--primary)' }} />
      </div>
    </div>
  )
}

function CategoryBadge({ category }: { category: string }) {
  const color = CATEGORY_COLORS[category] ?? CATEGORY_COLORS['その他']
  return (
    <span style={{
      fontSize: 11, fontWeight: 500,
      background: color.bg, color: color.ink,
      borderRadius: 22, padding: '2px 8px',
      display: 'inline-block',
    }}>
      {category}
    </span>
  )
}

function Chip({
  label, selected, onClick,
}: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 transition-colors"
      style={{
        fontSize: 13, fontWeight: selected ? 600 : 400,
        padding: '7px 15px', borderRadius: 22,
        border: selected ? 'none' : '1px solid var(--line)',
        background: selected ? 'var(--ink)' : 'var(--surface)',
        color: selected ? '#fff' : 'var(--ink-sub)',
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  )
}

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
    <div className="min-h-screen lg:flex" style={{ background: 'var(--bg)' }}>

      {/* PC: サイドバー */}
      <aside className="hidden lg:flex flex-col" style={{
        width: 244, minHeight: '100vh', background: '#F1EADC',
        borderRight: '1px solid var(--line)', padding: '24px 16px',
        position: 'sticky', top: 0, height: '100vh',
      }}>
        <div className="flex items-center gap-2 mb-6">
          <Logo size={34} innerSize={11} />
          <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}>発見マップ</span>
        </div>
        <Link href="/home/new" className="flex items-center justify-center gap-1 mb-4 transition-opacity hover:opacity-80" style={{
          background: 'var(--primary)', color: 'var(--on-primary)',
          borderRadius: 14, padding: '10px 0', fontWeight: 600, fontSize: 14,
          boxShadow: '0 10px 22px -10px rgba(206,113,80,.8)',
        }}>
          ＋ 記録する
        </Link>
        <nav className="flex flex-col gap-1 mb-4">
          <Link href="/home" className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{
            background: 'var(--surface)', boxShadow: '0 2px 8px rgba(60,45,30,.08)',
            fontWeight: 700, fontSize: 14, color: 'var(--ink)',
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--secondary)', display: 'inline-block' }} />
            一覧
          </Link>
          <Link href="/home/map" className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{
            fontWeight: 400, fontSize: 14, color: 'var(--ink-sub)',
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--line)', display: 'inline-block' }} />
            地図
          </Link>
        </nav>
        <div className="mt-auto pt-4" style={{ borderTop: '1px solid var(--line)' }}>
          <button onClick={handleLogout} style={{ fontSize: 13, color: 'var(--ink-muted)', cursor: 'pointer', background: 'none', border: 'none' }}>
            ログアウト
          </button>
        </div>
      </aside>

      {/* メインコンテンツ */}
      <div className="flex-1 flex flex-col" style={{ maxWidth: '100%', position: 'relative' }}>

        {/* スマホ: ヘッダー */}
        <header className="lg:hidden flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <Logo size={30} innerSize={9} />
            <span style={{ fontSize: 19, fontWeight: 700, color: 'var(--ink)' }}>発見マップ</span>
          </div>
          <button onClick={handleLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-muted)', fontSize: 13 }}>
            ログアウト
          </button>
        </header>

        {/* PC: ページ見出し */}
        <div className="hidden lg:block px-8 pt-8 pb-2">
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--ink)' }}>わたしの発見</h1>
          {!isLoading && (
            <p style={{ fontSize: 13, color: 'var(--ink-muted)', marginTop: 4 }}>{filtered.length}件の記録</p>
          )}
        </div>

        {/* フィルター */}
        <div className="px-5 lg:px-8 pt-2">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <Chip label="すべて" selected={selectedMonth === null && selectedCategory === null} onClick={() => { setSelectedMonth(null); setSelectedCategory(null) }} />
            {activeMonths.map((month) => (
              <Chip key={month} label={`${month}月`}
                selected={selectedMonth === month}
                onClick={() => setSelectedMonth(selectedMonth === month ? null : month)}
              />
            ))}
            {CATEGORIES.map((cat) => (
              <Chip key={cat} label={cat}
                selected={selectedCategory === cat}
                onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
              />
            ))}
          </div>
        </div>

        {/* 件数（スマホ） */}
        {!isLoading && (
          <p className="lg:hidden px-5 mt-1" style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
            {filtered.length}件のはっけん
          </p>
        )}

        {/* リスト */}
        <div className="flex-1 px-5 lg:px-8 pb-32 lg:pb-8 mt-3">
          {isLoading ? (
            <p className="text-center mt-16" style={{ color: 'var(--ink-muted)' }}>読み込み中...</p>
          ) : filtered.length === 0 ? (
            <p className="text-center mt-16" style={{ color: 'var(--ink-muted)', fontSize: 14 }}>
              {observations.length === 0
                ? 'まだ記録がありません。\n最初の発見を記録してみましょう！'
                : '該当する記録がありません。'}
            </p>
          ) : (
            <div className="grid gap-3 lg:grid-cols-3">
              {filtered.map((obs) => (
                <Link
                  key={obs.id}
                  href={`/home/${obs.id}`}
                  className="flex lg:flex-col gap-3 transition-shadow hover:shadow-md"
                  style={{
                    background: 'var(--surface)', borderRadius: 20,
                    padding: 10,
                    boxShadow: '0 6px 16px -12px rgba(60,45,30,.3)',
                    textDecoration: 'none', color: 'inherit',
                  }}
                >
                  {/* サムネイル */}
                  {obs.photo_url ? (
                    <img
                      src={obs.photo_url}
                      alt="観察写真"
                      className="object-cover flex-shrink-0"
                      style={{ width: 66, height: 66, borderRadius: 15 }}
                    />
                  ) : (
                    <div className="flex-shrink-0" style={{
                      width: 66, height: 66, borderRadius: 15,
                      background: CATEGORY_COLORS[obs.category]?.bg ?? '#F2E9D8',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 24,
                    }}>
                      🌿
                    </div>
                  )}
                  <div className="flex flex-col gap-1 min-w-0 flex-1">
                    <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }} className="truncate">
                      {obs.name || obs.category}
                    </p>
                    <CategoryBadge category={obs.category} />
                    <p style={{ fontSize: 11, color: 'var(--ink-muted)' }} className="truncate">
                      {new Date(obs.observed_at ?? obs.created_at).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })}
                      {obs.location_name ? ` · ${obs.location_name}` : ''}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* スマホ: フローティングボタン */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 px-5 pb-6 pt-10" style={{
          background: 'linear-gradient(transparent, var(--bg) 34%)',
          pointerEvents: 'none',
        }}>
          <div className="flex gap-3" style={{ pointerEvents: 'auto' }}>
            <Link href="/home/new" className="flex-1 flex items-center justify-center gap-1 transition-opacity hover:opacity-80" style={{
              background: 'var(--primary)', color: 'var(--on-primary)',
              borderRadius: 16, padding: '14px 0', fontWeight: 600, fontSize: 15,
              boxShadow: '0 10px 22px -10px rgba(206,113,80,.8)',
              textDecoration: 'none',
            }}>
              ＋ 記録する
            </Link>
            <Link href="/home/map" className="flex items-center justify-center transition-colors hover:opacity-80" style={{
              background: 'var(--surface)', color: 'var(--secondary-ink)',
              border: '1px solid var(--line)',
              borderRadius: 16, padding: '14px 20px', fontWeight: 500, fontSize: 14,
              textDecoration: 'none',
            }}>
              地図
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}
