'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/app/lib/supabase/client'
import { Logo } from '@/app/components/ui'

/**
 * モバイル専用（lg:hidden）の共通トップバー。
 * pathname から表示モードを自己決定する:
 *  - /home            → logo モード（ロゴ + タイトル + オーバーフローメニュー）
 *  - /home/new        → back モード（戻る + 「新しい発見」）
 *  - /home/xxxx（詳細）→ back モード（戻る + 「発見の記録」）
 *  - /home/map        → null（地図ページは独自ヘッダー。Phase 3 で統合予定）
 * デスクトップ（lg）は PCHeader が担うため常に非表示。
 */
export default function AppHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  if (pathname === '/home/map') return null

  const goBack = () => {
    if (window.history.length > 1) router.back()
    else router.push('/home')
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const mode: 'logo' | 'back' =
    pathname === '/home' ? 'logo' : 'back'

  const backTitle = pathname === '/home/new' ? '新しい発見' : '発見の記録'

  return (
    <header
      className="lg:hidden sticky top-0 z-40 flex items-center gap-2 px-4 bg-bg pt-safe"
      style={{ minHeight: 52 }}
    >
      {mode === 'logo' ? (
        <>
          <div className="flex items-center gap-2 flex-1 py-2.5">
            <Logo size={28} />
            <span className="text-lg font-bold text-ink">発見マップ</span>
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="メニュー"
              aria-expanded={menuOpen}
              className="w-9 h-9 rounded-full flex items-center justify-center text-ink text-xl bg-surface border border-line focus-ring"
            >
              ⋯
            </button>
            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  aria-hidden="true"
                  onClick={() => setMenuOpen(false)}
                />
                <div
                  role="menu"
                  className="absolute right-0 top-11 z-50 min-w-32 rounded-md bg-surface border border-line shadow-lg py-1"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-ink-sub focus-ring"
                  >
                    ログアウト
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={goBack}
            aria-label="戻る"
            className="w-9 h-9 rounded-full flex items-center justify-center text-ink text-base bg-surface border border-line shadow-sm focus-ring flex-shrink-0"
          >
            ←
          </button>
          <h1 className="text-lg font-bold text-ink py-2.5">{backTitle}</h1>
        </>
      )}
    </header>
  )
}
