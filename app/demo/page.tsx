'use client'

import { Suspense } from 'react'
import ExploreShell from '@/app/components/explore/ExploreShell'

export default function DemoExplorePage() {
  return (
    <Suspense fallback={<div className="fixed inset-0 z-0 bg-bg" />}>
      <ExploreShell />
    </Suspense>
  )
}
