import { Button } from '@/app/components/ui/Button'

export default function DemoObservationNotFound() {
  return (
    <div lang="en" className="flex flex-col items-center justify-center gap-4 px-6 py-24 text-center">
      <p className="text-4xl" aria-hidden="true">🌿</p>
      <p className="text-base font-semibold text-ink">This sample find does not exist</p>
      <Button href="/demo" variant="primary">
        Back to the demo
      </Button>
    </div>
  )
}
