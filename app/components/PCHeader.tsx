'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '../lib/supabase/client'
import { Logo, Button } from './ui'
import { useAppMode } from '../lib/app-mode'
import { DemoBadge } from './demo/DemoBadge'

export default function PCHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const { base, t, readOnly } = useAppMode()

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
      <Link href={base} className="flex items-center gap-2 no-underline flex-shrink-0 focus-ring rounded-md">
        <Logo size={30} />
        <span className="text-base font-bold text-ink">{t.appName}</span>
      </Link>
      <DemoBadge withNote />

      <nav className="flex items-center gap-5 flex-1">
        {navLink(base, t.nav.map, pathname === base)}
        {navLink(`${base}/log`, t.nav.log, pathname.startsWith(`${base}/log`))}
      </nav>

      <div className="flex items-center gap-3">
        <Button href={`${base}/new`} size="sm">
          {t.nav.recordButton}
        </Button>
        {readOnly ? (
          <Button href="/login" size="sm" variant="ghost">
            {t.nav.logout}
          </Button>
        ) : (
          <>
            <button
              onClick={handleLogout}
              className="text-sm text-ink-muted bg-transparent border-none cursor-pointer focus-ring rounded-md px-1"
            >
              {t.nav.logout}
            </button>
          </>
        )}
      </div>
    </header>
  )
}
