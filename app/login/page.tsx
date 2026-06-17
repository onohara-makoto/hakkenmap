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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-2">hakkenmap</h1>
        <p className="text-gray-500 text-center mb-8">
          自然の発見を地図に記録するアプリ
        </p>
        <button
          onClick={handleGoogleLogin}
          className="w-full bg-white border border-gray-300 text-gray-700
                     py-3 px-4 rounded-lg flex items-center justify-center
                     gap-3 hover:bg-gray-50 transition-colors shadow-sm"
        >
          Google でログイン
        </button>
      </div>
    </div>
  )
}
