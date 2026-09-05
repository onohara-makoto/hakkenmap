import { Button } from '@/app/components/ui/Button'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-4xl" aria-hidden="true">🌿</p>
      <p className="text-base font-semibold text-ink">ページが見つかりません</p>
      <p className="text-sm text-ink-muted">お探しのページは移動または削除された可能性があります。</p>
      <Button href="/home" variant="primary">
        ホームに戻る
      </Button>
    </div>
  )
}
