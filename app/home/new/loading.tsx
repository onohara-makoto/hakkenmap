import { Skeleton } from '@/app/components/ui/Skeleton'

export default function NewObservationLoading() {
  return (
    <div className="mx-auto px-5 lg:px-8 pt-5" style={{ maxWidth: 760 }}>
      <div className="lg:grid gap-7" style={{ gridTemplateColumns: '300px 1fr' }}>
        <Skeleton w="100%" h={172} radius={16} />
        <div className="flex flex-col gap-4 mt-6 lg:mt-0">
          <Skeleton w="100%" h={40} radius={22} />
          <Skeleton w="100%" h={48} radius={14} />
          <Skeleton w="100%" h={96} radius={14} />
        </div>
      </div>
    </div>
  )
}
