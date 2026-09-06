'use client'

import { useState } from 'react'
import { createClient } from '@/app/lib/supabase/client'
import { Logo } from '@/app/components/ui'

export default function LoginPage() {
  const supabase = createClient()
  const [error, setError] = useState('')

  const handleGoogleLogin = async () => {
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    })
    if (error) {
      console.error('ログインエラー:', error.message)
      setError('ログインに失敗しました。もう一度お試しください。')
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-[34px] bg-bg">
      <div className="w-full max-w-sm flex flex-col items-center gap-6">

        {/* ロゴ */}
        <div
          className="flex items-center justify-center"
          style={{
            width: 80,
            height: 80,
            borderRadius: 28,
            background: 'var(--secondary)',
            transform: 'rotate(-4deg)',
            boxShadow: '0 12px 26px -10px rgba(138,154,91,.8)',
          }}
          aria-hidden="true"
        >
          <Logo size={48} />
        </div>

        {/* タイトル */}
        <div className="text-center" style={{ marginTop: -4 }}>
          <h1 className="text-3xl font-bold text-ink" style={{ lineHeight: 1.2 }}>hakkenmap</h1>
          <p className="text-sm font-medium mt-1" style={{ color: 'var(--secondary)' }}>発見マップ</p>
        </div>

        {/* タグライン */}
        <p className="text-sm text-ink-sub text-center" style={{ lineHeight: 1.9 }}>
          お散歩でみつけた草花や生きものを、<br />写真と地図で残そう。
        </p>

        {/* Google ボタン */}
        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center gap-3 rounded-xl bg-surface border border-line shadow-sm cursor-pointer transition-colors focus-ring"
          style={{ padding: '16px 20px' }}
        >
          {/* Google アイコン */}
          <div
            className="rounded-full flex-shrink-0"
            style={{
              width: 18,
              height: 18,
              background: 'conic-gradient(#EA4335 0deg 90deg, #FBBC05 90deg 180deg, #34A853 180deg 270deg, #4285F4 270deg 360deg)',
            }}
            aria-hidden="true"
          />
          <span className="text-base font-medium text-ink flex-1 text-center">
            Google ではじめる
          </span>
        </button>

        {error && (
          <p role="alert" className="text-sm text-danger text-center">{error}</p>
        )}

        {/* 装飾ドット */}
        <div className="flex gap-2 mt-2" aria-hidden="true">
          <div className="rounded-full" style={{ width: 6, height: 6, background: 'var(--primary)' }} />
          <div className="rounded-full" style={{ width: 6, height: 6, background: 'var(--secondary)' }} />
          <div className="rounded-full" style={{ width: 6, height: 6, background: 'var(--clay)' }} />
        </div>

      </div>
    </div>
  )
}
