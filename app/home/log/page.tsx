'use client'

export const dynamic = 'force-dynamic'

import { EmptyState } from '@/app/components/ui'

// さんぽログ（月別タイムライン・ストリーク・年間まとめ）は Phase 4 で実装予定。
export default function SanpoLogPage() {
  return (
    <div className="min-h-screen bg-bg pt-4">
      <div className="px-5 lg:px-8 pt-3 lg:pt-8">
        <h1 className="text-2xl font-bold text-ink">さんぽログ</h1>
      </div>
      <EmptyState
        icon="📔"
        title="さんぽログは準備中です"
        body="月別の記録・連続記録・年間まとめをここで振り返れるようになります。"
        action={{ label: '発見を記録する', href: '/home/new' }}
      />
    </div>
  )
}
