import type { ReactNode } from 'react'

export type IconName =
  | 'map'
  | 'plus'
  | 'notebook'
  | 'back'
  | 'forward'
  | 'more'
  | 'locate'
  | 'fit'
  | 'alert'
  | 'grid'

/** 24×24 グリッド上の線画。塗りは使わず stroke だけで描く（点のみ例外） */
const PATHS: Record<IconName, ReactNode> = {
  map: (
    <>
      <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z" />
      <path d="M9 4v14M15 6v14" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  notebook: (
    <>
      <path d="M6 3h11a2 2 0 0 1 2 2v16H8a2 2 0 0 1-2-2V3Z" />
      <path d="M10 8h5M10 12h5" />
    </>
  ),
  back: <path d="M15 5l-7 7 7 7" />,
  forward: <path d="M9 5l7 7-7 7" />,
  more: (
    <>
      <circle cx="5" cy="12" r="1" fill="currentColor" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
      <circle cx="19" cy="12" r="1" fill="currentColor" />
    </>
  ),
  locate: (
    <>
      <circle cx="12" cy="12" r="7" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    </>
  ),
  fit: <path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" />,
  alert: (
    <>
      <path d="M12 4 2.5 20h19L12 4Z" />
      <path d="M12 10v4M12 17h.01" />
    </>
  ),
  grid: (
    <>
      <rect x="4" y="4" width="6.5" height="6.5" rx="1.5" />
      <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" />
    </>
  ),
}

/**
 * UI 用のインラインSVGアイコン。線幅・角の丸めを全アイコンで揃えるため、
 * strokeWidth は固定にしてサイズだけ変えられるようにしている。
 * 色は currentColor（親の text-* を継承）。装飾扱いなので読み上げ名は親に付ける。
 */
export function Icon({ name, size = 22, className }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {PATHS[name]}
    </svg>
  )
}
