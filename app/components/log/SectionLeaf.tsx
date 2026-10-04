import type { ReactNode } from 'react'

/** 図鑑の見開きページ風セクション見出し（左端に綴じ糸のような点線） */
export function SectionLeaf({
  title,
  folio,
  subtitle,
  children,
}: {
  title: string
  folio: string
  subtitle?: string
  children: ReactNode
}) {
  return (
    <section className="relative pl-3.5">
      <div
        className="absolute left-0 top-1.5 bottom-1.5 w-[2px] opacity-55"
        style={{
          backgroundImage: 'repeating-linear-gradient(to bottom, var(--color-clay) 0 5px, transparent 5px 10px)',
        }}
      />
      <div className="flex items-baseline justify-between mb-2.5">
        <div className="flex items-center gap-1.5 text-[16.5px] font-bold text-ink" style={{ fontFamily: 'var(--font-zen-maru)' }}>
          <span className="w-[7px] h-[7px] rounded-full bg-secondary inline-block" />
          {title}
        </div>
        <div className="text-[10.5px] tracking-wider text-ink-faint font-medium whitespace-nowrap">{folio}</div>
      </div>
      {subtitle && <p className="text-xs text-ink-sub mb-3 leading-relaxed">{subtitle}</p>}
      {children}
    </section>
  )
}
