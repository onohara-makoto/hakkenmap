const EMPTY_SLOT_TEXT = [
  'まだ場所の記録がありません',
  '次に歩いた場所がここに並びます',
  '公園・河原・裏山、なんでも1枚に',
]

/** 「訪れた場所」を図書カード風の一覧で見せる */
export function SpotCatalog({ spots }: { spots: { name: string; count: number }[] }) {
  const shown = spots.slice(0, 3)
  const emptySlots = Math.max(0, 3 - shown.length)

  return (
    <div className="rounded-[18px] border border-line bg-surface p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-ink-sub">場所ごとの記録カード</span>
        <span className="text-[15px] font-black text-ink-sub" style={{ fontFamily: 'var(--font-zen-maru)' }}>
          <span className="text-[19px] text-primary">{spots.length}</span> 件
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {shown.map((s) => (
          <div
            key={s.name}
            className="flex items-center gap-2.5 rounded-[10px] border-[1.5px] border-dashed border-ink-faint bg-surface px-3.5 py-3"
          >
            <span className="text-[17px] shrink-0">📌</span>
            <span className="text-xs text-ink-sub leading-snug">
              <b className="block text-ink-sub font-bold text-[12px] mb-0.5">{s.name}</b>
              {s.count}件の発見を記録
            </span>
          </div>
        ))}
        {Array.from({ length: emptySlots }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-2.5 rounded-[10px] border-[1.5px] border-dashed border-ink-faint bg-surface px-3.5 py-3"
          >
            <span className="text-[17px] shrink-0 opacity-40">📌</span>
            <span className="text-xs text-ink-faint leading-snug">
              <b className="block text-ink-faint font-bold text-[12px] mb-0.5">空きスロット</b>
              {EMPTY_SLOT_TEXT[(shown.length + i) % EMPTY_SLOT_TEXT.length]}
            </span>
          </div>
        ))}
      </div>

      <p className="mt-2.5 text-[11px] text-ink-sub text-center leading-relaxed">
        発見を記録すると、その場所のカードが1枚増えます。
      </p>
    </div>
  )
}
