import { Skeleton } from '@/app/components/ui/Skeleton'

export default function ObservationDetailLoading() {
  return (
    <div style={{ minHeight: '100vh' }}>
      <div className="mx-auto" style={{ maxWidth: 680 }}>
        {/* PC */}
        <div className="hidden lg:block p-8">
          <div className="flex gap-7">
            <Skeleton w={300} h={300} radius={22} className="flex-shrink-0" />
            <div className="flex flex-col gap-4 flex-1">
              <Skeleton w={80} h={22} radius={22} />
              <Skeleton w="60%" h={30} radius={6} />
              <Skeleton w="100%" h={72} radius={16} />
              <Skeleton w="100%" h={90} radius={16} />
            </div>
          </div>
        </div>
        {/* モバイル */}
        <div className="lg:hidden flex flex-col gap-4 px-5 pt-5">
          <Skeleton w="100%" h={270} radius={20} />
          <Skeleton w={80} h={22} radius={22} />
          <Skeleton w="60%" h={24} radius={6} />
          <Skeleton w="100%" h={72} radius={16} />
          <Skeleton w="100%" h={90} radius={16} />
        </div>
      </div>
    </div>
  )
}
