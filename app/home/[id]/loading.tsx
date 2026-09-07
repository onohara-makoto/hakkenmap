import { Skeleton } from '@/app/components/ui/Skeleton'

export default function ObservationDetailLoading() {
  return (
    <div style={{ minHeight: '100vh' }}>
      <div className="mx-auto" style={{ maxWidth: 680 }}>
        <div className="lg:flex lg:gap-7 lg:p-8">
          <div className="lg:w-[300px] lg:flex-shrink-0">
            <div className="relative w-full" style={{ aspectRatio: '1' }}>
              <Skeleton w="100%" h="100%" radius={0} className="lg:rounded-[22px]" />
            </div>
          </div>
          <div className="flex-1 px-5 lg:px-0 pt-5 lg:pt-0 pb-10 flex flex-col gap-4">
            <Skeleton w={80} h={22} radius={22} />
            <Skeleton w="60%" h={26} radius={6} />
            <Skeleton w="100%" h={72} radius={16} />
            <Skeleton w="100%" h={90} radius={16} />
          </div>
        </div>
      </div>
    </div>
  )
}
