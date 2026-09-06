'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '../lib/supabase/client'
import { Logo, Button } from './ui'

export default function PCHeader() {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push('/login');
    }

    const navLink = (href: string, label: string) => {
        const isActive = pathname === href || (href !== '/home' && pathname.startsWith(href));
        return (
            <Link
                href={href}
                className="text-sm no-underline transition-colors focus-ring rounded-sm"
                style={{
                    fontWeight: isActive ? 700 : 400,
                    color: isActive ? 'var(--ink)' : 'var(--ink-sub)',
                    padding: '4px 2px',
                    borderBottom: isActive ? '2px solid var(--primary)' : '2px solid transparent',
                }}
            >
                {label}
            </Link>
        )
    }

    return(
        <header className="hidden lg:flex items-center gap-6 px-8 sticky top-0 bg-surface border-b border-line" style={{ height: 56, zIndex: 100 }}>
            {/* ロゴ */ }
            <Link href="/home" className="flex items-center gap-2 no-underline flex-shrink-0 focus-ring rounded-md">
                <Logo size={30} />
                <span className="text-base font-bold text-ink">発見マップ</span>
            </Link>

            {/* ナビゲーションリンク */ }
            <nav className="flex items-center gap-5 flex-1">
                {navLink('/home', '一覧')}
                {navLink('/home/map', '地図')}
            </nav>

            {/* 右側アクション */ }
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
    );
}
