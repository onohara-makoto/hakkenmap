'use client'

import { useEffect } from 'react'
import { Button } from '@/app/components/ui/Button'

export default function HomeError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center gap-4 px-6 py-24 text-center">
      <p className="text-4xl" aria-hidden="true">🍂</p>
      <p className="text-base font-semibold text-ink">記録の読み込みに失敗しました</p>
      <p className="text-sm text-ink-muted">通信状況を確認してもう一度お試しください。</p>
      <Button onClick={() => unstable_retry()} variant="primary">
        もう一度試す
      </Button>
    </div>
  )
}
