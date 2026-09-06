'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type Item = { href: string; label: string; icon: string; match: (p: string) => boolean }

const ITEMS: Item[] = [
  { href: '/home', label: '一覧', icon: '☰', match: (p) => p === '/home' },
  { href: '/home/new', label: '記録', icon: '＋', match: (p) => p === '/home/new' },
  { href: '/home/map', label: '地図', icon: '⚲', match: (p) => p === '/home/map' },
]

/**
 * モバイル専用（lg:hidden）の下部ナビ。中央「記録」は隆起した primary ボタン。
 * /home/new と詳細ページ（/home/xxxx）では非表示にして操作に集中させる。
 */
export default function BottomNav() {
  const pathname = usePathname()

  const hidden =
    pathname === '/home/new' ||
    (pathname.startsWith('/home/') && pathname !== '/home/map')

  if (hidden) return null

  return (
    <nav
      aria-label="メインナビゲーション"
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 flex items-stretch justify-around bg-surface border-t border-line pb-nav"
      style={{ paddingTop: 6 }}
    >
      {ITEMS.map((item) => {
        const active = item.match(pathname)
        const isCenter = item.href === '/home/new'

        if (isCenter) {
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label="記録する"
              className="flex flex-col items-center justify-center gap-0.5 -mt-5 focus-ring"
            >
              <span className="w-12 h-12 rounded-full bg-primary text-on-primary shadow-primary flex items-center justify-center text-2xl leading-none">
                {item.icon}
              </span>
              <span className="text-[10px] font-medium text-ink-sub">{item.label}</span>
            </Link>
          )
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className="flex flex-col items-center justify-center gap-0.5 px-6 py-1 focus-ring"
          >
            <span
              className={`text-xl leading-none ${active ? 'text-primary' : 'text-ink-faint'}`}
              aria-hidden="true"
            >
              {item.icon}
            </span>
            <span
              className={`text-[10px] ${active ? 'text-primary font-semibold' : 'text-ink-sub'}`}
            >
              {item.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
