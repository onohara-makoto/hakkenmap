'use client'

import { createClient } from '@/app/lib/supabase/client'

export default function LoginPage() {
  const supabase = createClient()

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    })
    if (error) console.error('ログインエラー:', error.message)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-[34px]" style={{ background: 'var(--bg)' }}>
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
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div style={{ width: 16, height: 16, borderRadius: 5, background: 'var(--primary)' }} />
          </div>
        </div>

        {/* タイトル */}
        <div className="text-center" style={{ marginTop: -4 }}>
          <h1 style={{ fontSize: 30, fontWeight: 700, color: 'var(--ink)', lineHeight: 1.2 }}>hakkenmap</h1>
          <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--secondary)', marginTop: 4 }}>発見マップ</p>
        </div>

        {/* タグライン */}
        <p style={{ fontSize: 13, color: 'var(--ink-sub)', lineHeight: 1.9, textAlign: 'center' }}>
          お散歩でみつけた草花や生きものを、<br />写真と地図で残そう。
        </p>

        {/* Google ボタン */}
        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center gap-3 transition-colors"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            borderRadius: 18,
            padding: '16px 20px',
            boxShadow: '0 2px 8px rgba(60,45,30,.08)',
            cursor: 'pointer',
          }}
        >
          {/* Google アイコン */}
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: '50%',
              flexShrink: 0,
              background: 'conic-gradient(#EA4335 0deg 90deg, #FBBC05 90deg 180deg, #34A853 180deg 270deg, #4285F4 270deg 360deg)',
            }}
          />
          <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--ink)', flex: 1, textAlign: 'center' }}>
            Google ではじめる
          </span>
        </button>

        {/* 装飾ドット */}
        <div className="flex gap-2 mt-2">
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)' }} />
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--secondary)' }} />
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--clay)' }} />
        </div>

      </div>
    </div>
  )
}
