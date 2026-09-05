import { Button } from '@/app/components/ui/Button'

export default function ObservationNotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-6 py-24 text-center">
      <p className="text-4xl" aria-hidden="true">🌿</p>
      <p className="text-base font-semibold text-ink">記録が見つかりません</p>
      <p className="text-sm text-ink-muted">削除されたか、URL が正しくない可能性があります。</p>
      <Button href="/home" variant="primary">
        一覧に戻る
      </Button>
    </div>
  )
}
