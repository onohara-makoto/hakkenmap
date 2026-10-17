'use client'

import { useAppMode } from '@/app/lib/app-mode'

/** デモ画面であることを示す小さな札。本番アプリ（/home）では何も描画しない */
export function DemoBadge({ withNote = false }: { withNote?: boolean }) {
  const { kind } = useAppMode()
  if (kind !== 'demo') return null
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <span
        className="rounded-full text-[11px] font-bold tracking-wider px-2 py-0.5"
        style={{ background: 'var(--tag-warm-bg)', color: 'var(--tag-warm-ink)' }}
      >
        DEMO
      </span>
      {withNote && <span className="text-xs text-ink-muted">Sample data · read-only</span>}
    </span>
  )
}

/** デモの説明。記録・削除・AI識別が無効であることを明示する */
export function DemoNotice() {
  const { kind } = useAppMode()
  if (kind !== 'demo') return null
  return (
    <p
      className="rounded-lg text-xs leading-relaxed px-3.5 py-2.5"
      style={{ background: 'var(--tag-warm-bg)', color: 'var(--tag-warm-ink)' }}
    >
      <b>Demo mode.</b> Every find, photo and place here is fictional sample data. Recording,
      deleting and AI identification are turned off, and nothing is sent to the server.
    </p>
  )
}
