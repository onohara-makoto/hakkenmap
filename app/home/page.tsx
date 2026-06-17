'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { getObservations } from '@/app/lib/observations'
import type { Observation } from '@/app/types/observation'
import type { Category } from '@/app/types/observation'

const CATEGORIES: Category[] = ['木', '草', '花', 'きのこ', '虫', 'その他']

export default function HomePage() {
  const [observations, setObservations] = useState<Observation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)

  useEffect(() => {
    getObservations().then((data) => { setObservations(data); setIsLoading(false) })
  }, [])

  const activeMonths = useMemo(() => {
    const months = new Set<number>()
    observations.forEach((obs) => {
      const date = new Date(obs.observed_at ?? obs.created_at)
      months.add(date.getMonth() + 1)
    })
    return Array.from(months).sort((a, b) => a - b)
  }, [observations])

  const filtered = useMemo(() => {
    return observations.filter((obs) => {
      if (selectedMonth !== null) {
        const month = new Date(obs.observed_at ?? obs.created_at).getMonth() + 1
        if (month !== selectedMonth) return false
      }
      if (selectedCategory !== null && obs.category !== selectedCategory) return false
      return true
    })
  }, [observations, selectedMonth, selectedCategory])

  return (
    <div className="max-w-md mx-auto p-4">
      {/* ヘッダー */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">hakkenmap</h1>
        <div className="flex gap-2">
          <Link href="/home/map" className="border border-green-600 text-green-600 px-3 py-2 rounded-lg text-sm">
            地図
          </Link>
          <Link href="/home/new" className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm">
            ＋ 記録する
          </Link>
        </div>
      </div>

      {/* 月フィルター */}
      {activeMonths.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-hide">
          <button
            onClick={() => setSelectedMonth(null)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm border ${
              selectedMonth === null
                ? 'bg-green-600 text-white border-green-600'
                : 'bg-white text-gray-600 border-gray-300'
            }`}
          >
            すべて
          </button>
          {activeMonths.map((month) => (
            <button
              key={month}
              onClick={() => setSelectedMonth(selectedMonth === month ? null : month)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm border ${
                selectedMonth === month
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-white text-gray-600 border-gray-300'
              }`}
            >
              {month}月
            </button>
          ))}
        </div>
      )}

      {/* カテゴリフィルター */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm border ${
            selectedCategory === null
              ? 'bg-gray-700 text-white border-gray-700'
              : 'bg-white text-gray-600 border-gray-300'
          }`}
        >
          全カテゴリ
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm border ${
              selectedCategory === cat
                ? 'bg-gray-700 text-white border-gray-700'
                : 'bg-white text-gray-600 border-gray-300'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 件数 */}
      {!isLoading && (
        <p className="text-xs text-gray-400 mb-3">{filtered.length} 件</p>
      )}

      {/* リスト */}
      {isLoading ? (
        <p className="text-gray-400 text-center mt-12">読み込み中...</p>
      ) : filtered.length === 0 ? (
        <p className="text-gray-500 text-center mt-12">
          {observations.length === 0
            ? 'まだ記録がありません。最初の発見を記録してみましょう！'
            : '該当する記録がありません。'}
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map((obs) => (
            <div key={obs.id} className="bg-white text-gray-900 rounded-xl shadow-sm p-4 flex gap-4">
              {obs.photo_url && (
                <img
                  src={obs.photo_url}
                  alt="観察写真"
                  className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">{obs.name || obs.category}</p>
                <p className="text-xs text-gray-500">{obs.category}</p>
                {obs.memo && (
                  <p className="text-sm text-gray-700 mt-1 truncate">{obs.memo}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(obs.observed_at ?? obs.created_at).toLocaleDateString('ja-JP')}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
