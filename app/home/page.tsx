'use client'

export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import ExploreShell from '@/app/components/explore/ExploreShell'

export default function HomePage() {
  return (
    <Suspense fallback={<div className="fixed inset-0 z-0 bg-bg" />}>
      <ExploreShell />
    </Suspense>
  )
}
