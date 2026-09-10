'use client'

import { useEffect, useSyncExternalStore } from 'react'
import {
  applyPref,
  getStoredPref,
  nextPref,
  THEME_EVENT,
  THEME_KEY,
  type ThemePref,
} from '@/app/lib/theme'

const META: Record<ThemePref, { icon: string; label: string }> = {
  system: { icon: '🌗', label: '端末に合わせる' },
  light: { icon: '☀️', label: 'ライト' },
  dark: { icon: '🌙', label: 'ダーク' },
}

function subscribe(cb: () => void) {
  window.addEventListener(THEME_EVENT, cb)
  window.addEventListener('storage', cb)
  return () => {
    window.removeEventListener(THEME_EVENT, cb)
    window.removeEventListener('storage', cb)
  }
}

export function ThemeToggle({ variant = 'icon' }: { variant?: 'icon' | 'row' }) {
  const pref = useSyncExternalStore<ThemePref>(subscribe, getStoredPref, () => 'system')

  // system 設定時、OS のダーク切り替えに追従
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      if (!localStorage.getItem(THEME_KEY)) applyPref('system')
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const cycle = () => applyPref(nextPref(pref))

  if (variant === 'row') {
    return (
      <button
        type="button"
        onClick={cycle}
        role="menuitem"
        className="w-full flex items-center gap-2 text-left px-4 py-2 text-sm text-ink-sub focus-ring"
      >
        <span aria-hidden="true">{META[pref].icon}</span>
        テーマ: {META[pref].label}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={`テーマ切り替え（現在: ${META[pref].label}）`}
      className="w-9 h-9 rounded-full flex items-center justify-center text-base bg-surface border border-line text-ink focus-ring"
    >
      <span aria-hidden="true">{META[pref].icon}</span>
    </button>
  )
}
