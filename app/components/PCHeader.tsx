'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '../lib/supabase/client'

function Logo() {
    return(
        <div style={{
            width: 20, height: 30, borderRadius: 11, background: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
            <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 9, height: 9, borderRadius: 3, background: 'var(--primary)', }}>
                </div>
            </div>
        </div>
    )
}

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
            <Link href={href} style={{
                fontSize: 14, fontWeight: isActive ? 700:400,
                color: isActive ? 'var(--ink)' : 'var(--ink-sub)',
                textDecoration: 'none', padding: '4px 2px',
                borderBottom: isActive ? '2px solid var(--primary)' : '2px solid transparent',
                transition: 'color 0.15s',
            }}>{label}</Link>
        )
    }

    return(
        <header className="hidden lg:flex items-center gap-6 px-8" style={{
            height: 56, background: 'var(--surface)', borderBottom: '1px solid var(--line)',
            position: 'sticky', top: 0, zIndex: 100,
        }}>
            {/* ロゴ */ }
            <Link href="/home" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0 }}>
                <Logo />
                <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>発見マップ</span>
            </Link>

            {/* ナビゲーションリンク */ }
            <nav className="flex items-center gap-5 flex-1">
                {navLink('/home', '一覧')}
                {navLink('/home/map', '地図')}
            </nav>

            {/* 右側アクション */ }
            <div className="flex items-center gap-3">
                <Link href="/home/new" style={{
                    fontSize: 13, fontWeight: 600, padding: '7px 16px', borderRadius: 14,
                    background: 'var(--primary)', color: 'var(--on-primary)',
                    textDecoration: 'none', boxShadow: '0 6px 16px -8px rgba(206,113,80,.7)',
                }}>
                    ＋ 記録する
                </Link>
                <button onClick={handleLogout} style={{
                    fontSize: 13, color: 'var(--ink-muted)', background: 'none', border: 'none', cursor: 'pointer',
                }}>
                    ログアウト
                </button>
            </div>
        </header>
    );
}