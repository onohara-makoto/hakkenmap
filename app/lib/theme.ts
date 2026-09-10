export type ThemePref = 'system' | 'light' | 'dark'

export const THEME_KEY = 'hakken-theme'

/** <head> でペイント前に実行する no-flash スクリプト（文字列） */
export const themeInitScript = `(function(){try{var t=localStorage.getItem('${THEME_KEY}');var m=window.matchMedia('(prefers-color-scheme: dark)').matches;var dark=t==='dark'||((!t||t==='system')&&m);document.documentElement.classList.toggle('dark',dark);}catch(e){}})();`

export function getStoredPref(): ThemePref {
  if (typeof localStorage === 'undefined') return 'system'
  const v = localStorage.getItem(THEME_KEY)
  return v === 'light' || v === 'dark' ? v : 'system'
}

export function resolveDark(pref: ThemePref): boolean {
  if (pref === 'dark') return true
  if (pref === 'light') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export const THEME_EVENT = 'hakken-theme-change'

export function applyPref(pref: ThemePref) {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('dark', resolveDark(pref))
  if (pref === 'system') localStorage.removeItem(THEME_KEY)
  else localStorage.setItem(THEME_KEY, pref)
  window.dispatchEvent(new Event(THEME_EVENT))
}

const CYCLE: ThemePref[] = ['system', 'light', 'dark']
export function nextPref(pref: ThemePref): ThemePref {
  return CYCLE[(CYCLE.indexOf(pref) + 1) % CYCLE.length]
}
