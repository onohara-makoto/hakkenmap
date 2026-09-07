'use client'

import { useCallback, useRef, useState } from 'react'
import type { ReactNode } from 'react'

export type Detent = 'peek' | 'half' | 'full'

const VISIBLE: Record<Detent, string> = {
  peek: '108px',
  half: '48dvh',
  full: '100%',
}

const ORDER: Detent[] = ['peek', 'half', 'full']

/**
 * 自作の3段ボトムシート（peek / half / full）。
 * vaul を使わずCSS transform + Pointer Events で実装しているため
 * 背後の地図は常に操作可能（シート本体だけが pointer-events を受ける）。
 * 下部ナビ（56px + セーフエリア）の上に載るよう bottom をオフセットしている。
 */
export function BottomSheet({
  detent,
  onDetentChange,
  ariaLabel,
  peekContent,
  children,
}: {
  detent: Detent
  onDetentChange: (d: Detent) => void
  ariaLabel: string
  peekContent?: ReactNode
  children: ReactNode
}) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [drag, setDrag] = useState<{ startY: number; startOffset: number } | null>(null)
  const [dragOffset, setDragOffset] = useState<number | null>(null)

  // 各 detent の「隠れている高さ(px)」を計算
  const hiddenPxFor = useCallback((d: Detent): number => {
    const panel = panelRef.current
    if (!panel) return 0
    const h = panel.offsetHeight
    if (d === 'full') return 0
    if (d === 'peek') return Math.max(0, h - 108)
    return Math.max(0, h - window.innerHeight * 0.48)
  }, [])

  const onPointerDown = (e: React.PointerEvent) => {
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
    setDrag({ startY: e.clientY, startOffset: hiddenPxFor(detent) })
    setDragOffset(hiddenPxFor(detent))
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag) return
    const dy = e.clientY - drag.startY
    const panelH = panelRef.current?.offsetHeight ?? 0
    setDragOffset(Math.min(panelH, Math.max(0, drag.startOffset + dy)))
  }

  const onPointerUp = () => {
    if (drag == null || dragOffset == null) { setDrag(null); return }
    // いちばん近い detent にスナップ
    let nearest: Detent = 'peek'
    let best = Infinity
    for (const d of ORDER) {
      const diff = Math.abs(hiddenPxFor(d) - dragOffset)
      if (diff < best) { best = diff; nearest = d }
    }
    setDrag(null)
    setDragOffset(null)
    onDetentChange(nearest)
  }

  const translateY =
    dragOffset != null ? `${dragOffset}px` : `calc(100% - ${VISIBLE[detent]})`

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label={ariaLabel}
      className="fixed inset-x-0 z-30 flex flex-col rounded-t-xl bg-surface shadow-lg"
      style={{
        bottom: 'calc(56px + env(safe-area-inset-bottom))',
        height: 'calc(100dvh - 56px - env(safe-area-inset-bottom) - 8dvh)',
        transform: `translateY(${translateY})`,
        transition: drag ? 'none' : 'transform 0.28s cubic-bezier(0.32, 0.72, 0, 1)',
        touchAction: 'none',
      }}
    >
      {/* ドラッグハンドル */}
      <div
        className="flex-shrink-0 cursor-grab active:cursor-grabbing pt-2 pb-1"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="mx-auto h-1 w-10 rounded-full bg-line" aria-hidden="true" />
        <div className="flex justify-center gap-1 pt-2 lg:hidden">
          {ORDER.map((d) => (
            <button
              key={d}
              type="button"
              aria-label={`シートを${d === 'peek' ? '最小' : d === 'half' ? '半分' : '最大'}にする`}
              onClick={() => onDetentChange(d)}
              className={`h-1.5 w-1.5 rounded-full ${detent === d ? 'bg-primary' : 'bg-line'}`}
            />
          ))}
        </div>
      </div>

      {detent === 'peek' && peekContent ? (
        <div className="flex-shrink-0 px-4 pb-3">{peekContent}</div>
      ) : (
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-16">{children}</div>
      )}
    </div>
  )
}
