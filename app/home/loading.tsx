import { Skeleton } from '@/app/components/ui/Skeleton'

function FeedCardSkeleton() {
  return (
    <div className="flex lg:flex-col gap-3 rounded-xl bg-surface shadow-md p-2.5">
      <Skeleton w={66} h={66} radius={15} className="flex-shrink-0" />
      <div className="flex flex-col gap-2 min-w-0 flex-1 py-1">
        <Skeleton w="70%" h={14} radius={4} />
        <Skeleton w={48} h={18} radius={22} />
        <Skeleton w="50%" h={11} radius={4} />
      </div>
    </div>
  )
}

export default function HomeLoading() {
  return (
    <div className="px-5 lg:px-8 pt-24 lg:pt-8 pb-32">
      <div className="grid gap-3 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <FeedCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
