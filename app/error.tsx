'use client'

import { useEffect } from 'react'
import { Button } from '@/app/components/ui/Button'

export default function Error({
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
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-4xl" aria-hidden="true">🍂</p>
      <p className="text-base font-semibold text-ink">エラーが発生しました</p>
      <p className="text-sm text-ink-muted">しばらくしてからもう一度お試しください。</p>
      <Button onClick={() => unstable_retry()} variant="primary">
        もう一度試す
      </Button>
    </div>
  )
}
