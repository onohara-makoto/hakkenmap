'use client'

import Image from 'next/image'
import { DetailBody } from '@/app/components/observation/DetailBody'
import { Button } from '@/app/components/ui'
import type { Observation } from '@/app/types/observation'

export function SheetDetail({
  obs,
  onClose,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
}: {
  obs: Observation
  onClose: () => void
  onPrev: () => void
  onNext: () => void
  hasPrev: boolean
  hasNext: boolean
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onClose}
          className="text-sm text-ink-sub bg-transparent border-none cursor-pointer focus-ring rounded-md px-1"
        >
          ← リストに戻る
        </button>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={onPrev}
            disabled={!hasPrev}
            aria-label="前の発見"
            className="w-8 h-8 rounded-full border border-line bg-surface text-ink flex items-center justify-center disabled:opacity-40 focus-ring"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={!hasNext}
            aria-label="次の発見"
            className="w-8 h-8 rounded-full border border-line bg-surface text-ink flex items-center justify-center disabled:opacity-40 focus-ring"
          >
            ›
          </button>
        </div>
      </div>

      {obs.photo_url && (
        <div className="relative w-full overflow-hidden rounded-lg" style={{ aspectRatio: '16 / 10' }}>
          <Image src={obs.photo_url} alt="" fill sizes="100vw" className="object-cover" />
        </div>
      )}

      <DetailBody obs={obs} compact />

      <Button href={`/home/${obs.id}`} variant="secondary" fullWidth>
        詳細をひらく
      </Button>
    </div>
  )
}
