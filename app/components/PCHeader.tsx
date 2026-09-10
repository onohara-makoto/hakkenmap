'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '../lib/supabase/client'
import { Logo, Button } from './ui'

export default function PCHeader() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const navLink = (href: string, label: string, active: boolean) => (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className="text-sm no-underline transition-colors focus-ring rounded-sm"
      style={{
        fontWeight: active ? 700 : 400,
        color: active ? 'var(--ink)' : 'var(--ink-sub)',
        padding: '4px 2px',
        borderBottom: active ? '2px solid var(--primary)' : '2px solid transparent',
      }}
    >
      {label}
    </Link>
  )

  return (
    <header
      className="hidden lg:flex items-center gap-6 px-8 sticky top-0 bg-surface border-b border-line"
      style={{ height: 56, zIndex: 100 }}
    >
      <Link href="/home" className="flex items-center gap-2 no-underline flex-shrink-0 focus-ring rounded-md">
        <Logo size={30} />
        <span className="text-base font-bold text-ink">発見マップ</span>
      </Link>

      <nav className="flex items-center gap-5 flex-1">
        {navLink('/home', '地図', pathname === '/home')}
        {navLink('/home/log', 'さんぽログ', pathname.startsWith('/home/log'))}
      </nav>

      <div className="flex items-center gap-3">
        <Button href="/home/new" size="sm">
          ＋ 記録する
        </Button>
        <button
          onClick={handleLogout}
          className="text-sm text-ink-muted bg-transparent border-none cursor-pointer focus-ring rounded-md px-1"
        >
          ログアウト
        </button>
      </div>
    </header>
  )
}
