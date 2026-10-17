'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAppMode } from '@/app/lib/app-mode'

type Item = { href: string; label: string; icon: string; match: (p: string) => boolean; center?: boolean }

/**
 * モバイル専用（lg:hidden）の下部ナビ。中央「記録」は隆起した primary ボタン。
 * Explore（/home）と さんぽログ（/home/log）でのみ表示。
 * /home/new・詳細・/home/map（リダイレクト）では非表示。
 */
export default function BottomNav() {
  const pathname = usePathname()
  const { base, t } = useAppMode()

  const visible = pathname === base || pathname.startsWith(`${base}/log`)
  if (!visible) return null

  const items: Item[] = [
    { href: base, label: t.nav.map, icon: '⚲', match: (p) => p === base },
    { href: `${base}/new`, label: t.nav.record, icon: '＋', match: (p) => p === `${base}/new`, center: true },
    { href: `${base}/log`, label: t.nav.log, icon: '📔', match: (p) => p.startsWith(`${base}/log`) },
  ]

  return (
    <nav
      aria-label={t.nav.mainNav}
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 flex items-stretch justify-around bg-surface border-t border-line pb-nav"
      style={{ paddingTop: 6 }}
    >
      {items.map((item) => {
        const active = item.match(pathname)

        if (item.center) {
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={t.nav.recordAction}
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
            <span className={`text-[10px] ${active ? 'text-primary font-semibold' : 'text-ink-sub'}`}>
              {item.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
