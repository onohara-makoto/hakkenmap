import { Skeleton } from '@/app/components/ui/Skeleton'

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Skeleton w={40} h={40} circle />
    </div>
  )
}
