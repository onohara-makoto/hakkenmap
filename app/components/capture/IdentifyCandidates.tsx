'use client'

import { useAppMode } from '@/app/lib/app-mode'
import type { IdentifyResult } from '@/app/lib/identify/handler'

/** AI識別の候補一覧。タップした候補を名前欄に入れる */
export function IdentifyCandidates({
  results,
  selectedIndex,
  onSelect,
}: {
  results: IdentifyResult[]
  selectedIndex: number | null
  onSelect: (result: IdentifyResult, index: number) => void
}) {
  const { t } = useAppMode()
  return (
    <div className="rounded-lg bg-surface" style={{ padding: '12px 14px' }}>
      <p className="text-xs text-ink-muted mb-2">{t.capture.candidatesHeading}</p>
      {results.length === 0 ? (
        <p className="text-xs text-ink-muted">{t.capture.noCandidates}</p>
      ) : (
        <div className="flex flex-col gap-1">
          {results.map((r, i) => {
            const isSelected = selectedIndex === i
            return (
              <button
                key={i}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onSelect(r, i)}
                className="text-left rounded-md border-none cursor-pointer text-sm flex items-center gap-2 transition-colors focus-ring"
                style={{
                  padding: '8px 12px',
                  background: isSelected ? 'var(--primary)' : 'var(--bg)',
                  color: isSelected ? 'var(--on-primary)' : 'var(--ink)',
                }}
              >
                <span className="flex-1 min-w-0">
                  <span className="font-medium">{r.commonName ?? r.name}</span>
                  {r.commonName && r.name && (
                    <span className="block text-xs italic opacity-70 truncate">{r.name}</span>
                  )}
                </span>
                <span className="text-xs opacity-70">
                  {isSelected ? t.capture.selected : `${Math.round(r.score * 100)}%`}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
