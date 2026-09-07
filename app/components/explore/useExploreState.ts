'use client'

import { useReducer } from 'react'
import type { Detent } from './BottomSheet'
import type { Bbox } from '@/app/lib/geo'

type State = {
  selectedId: string | null
  detent: Detent
  savedBounds: Bbox | null
}

type Action =
  | { type: 'selectPin'; id: string; bounds: Bbox | null }
  | { type: 'selectRow'; id: string; bounds: Bbox | null }
  | { type: 'closeDetail' }
  | { type: 'setDetent'; detent: Detent }
  | { type: 'clearSaved' }

const initial: State = { selectedId: null, detent: 'peek', savedBounds: null }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'selectPin':
      // ピンから選択: 現在の表示範囲を保存し、シートを半分開いて詳細へ
      return {
        selectedId: action.id,
        detent: state.detent === 'peek' ? 'half' : state.detent,
        savedBounds: state.savedBounds ?? action.bounds,
      }
    case 'selectRow':
      // リスト行から選択: 表示範囲を保存して詳細へ（地図は呼び出し側で flyTo）
      return {
        selectedId: action.id,
        detent: 'half',
        savedBounds: state.savedBounds ?? action.bounds,
      }
    case 'closeDetail':
      return { ...state, selectedId: null, detent: 'half' }
    case 'setDetent':
      return { ...state, detent: action.detent }
    case 'clearSaved':
      return { ...state, savedBounds: null }
    default:
      return state
  }
}

export function useExploreState() {
  return useReducer(reducer, initial)
}

export type { State as ExploreState, Action as ExploreAction }
