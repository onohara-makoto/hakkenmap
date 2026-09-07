import { Skeleton } from '@/app/components/ui/Skeleton'

export default function SanpoLogLoading() {
  return (
    <div className="min-h-screen bg-bg pt-4">
      <div className="px-5 lg:px-8 pt-3 lg:pt-8 max-w-2xl mx-auto flex flex-col gap-4">
        <Skeleton w={140} h={28} radius={6} />
        <Skeleton w="100%" h={96} radius={16} />
        <Skeleton w="100%" h={140} radius={16} />
      </div>
    </div>
  )
}
