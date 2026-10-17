import type { Metadata } from 'next'
import { AppModeProvider } from '@/app/lib/app-mode'
import PCHeader from '@/app/components/PCHeader'
import AppHeader from '@/app/components/nav/AppHeader'
import BottomNav from '@/app/components/nav/BottomNav'

export const metadata: Metadata = {
  title: 'hakkenmap demo',
  description: 'A read-only demo of hakkenmap with fictional sample finds. No sign-in required.',
}

/**
 * ログイン不要のデモ。固定サンプル（app/lib/demo）だけを表示し、Supabase・Gemini には一切アクセスしない。
 * proxy.ts の認証チェックは /home 配下のみなので、ここは未ログインでも開ける。
 */
export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppModeProvider kind="demo">
      <div lang="en" className="contents">
        <PCHeader />
        <AppHeader />
        {children}
        <BottomNav />
      </div>
    </AppModeProvider>
  )
}
