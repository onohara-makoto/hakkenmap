'use client'

import { createContext, useContext, type ReactNode } from 'react'
import { COPY, type Copy } from '@/app/lib/copy'
import { getObservations, getObservation, deleteObservation } from '@/app/lib/observations'
import { demoSource } from '@/app/lib/demo/source'
import type { Observation } from '@/app/types/observation'

/** 画面が記録を読み書きする先。デモは固定サンプルを返し、削除は持たない（閲覧専用） */
export type ObservationSource = {
  list: () => Promise<Observation[]>
  get: (id: string) => Promise<Observation | null>
  remove?: (obs: Observation) => Promise<boolean>
}

export type AppMode = {
  kind: 'app' | 'demo'
  /** 画面内リンクの起点（/home または /demo） */
  base: string
  t: Copy
  source: ObservationSource
  /** 記録・削除・AI識別などの書き込み操作を出さない */
  readOnly: boolean
}

const supabaseSource: ObservationSource = {
  list: () => getObservations(),
  get: (id) => getObservation(id),
  remove: (obs) => deleteObservation(obs),
}

const MODES: Record<AppMode['kind'], AppMode> = {
  app: { kind: 'app', base: '/home', t: COPY.ja, source: supabaseSource, readOnly: false },
  demo: { kind: 'demo', base: '/demo', t: COPY.en, source: demoSource, readOnly: true },
}

const AppModeContext = createContext<AppMode>(MODES.app)

export function AppModeProvider({ kind, children }: { kind: AppMode['kind']; children: ReactNode }) {
  return <AppModeContext.Provider value={MODES[kind]}>{children}</AppModeContext.Provider>
}

export function useAppMode(): AppMode {
  return useContext(AppModeContext)
}
