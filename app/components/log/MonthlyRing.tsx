import type { CSSProperties } from 'react'

/** 今月（または任意の月）の進捗を表す SVG リング */
export function MonthlyRing({
  count,
  goal,
  size = 56,
  animate = false,
  label,
  sub,
}: {
  count: number
  goal: number
  size?: number
  animate?: boolean
  label?: string
  /** リング中央、数字の下に添える小さな補足（例: "目標10"） */
  sub?: string
}) {
  const stroke = size >= 80 ? 8 : 6
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const ratio = goal > 0 ? Math.min(1, count / goal) : 0
  const offset = circ * (1 - ratio)

  const animStyle: CSSProperties | undefined = animate
    ? ({
        animation: 'var(--animate-ring-fill)',
        '--ring-dash': circ,
        '--ring-dash-target': offset,
      } as CSSProperties)
    : undefined

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={label ?? `${count} / ${goal} 件`}
    >
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-line)" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--color-primary)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={animate ? undefined : offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={animStyle}
      />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central">
        <tspan x="50%" dy={sub ? -size * 0.09 : 0} fontSize={size * 0.32} fontWeight="700" fill="var(--color-ink)">
          {count}
        </tspan>
        {sub && (
          <tspan x="50%" dy={size * 0.24} fontSize={size * 0.15} fill="var(--color-ink-sub)">
            {sub}
          </tspan>
        )}
      </text>
    </svg>
  )
}
