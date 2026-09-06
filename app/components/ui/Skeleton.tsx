export function Skeleton({
  w,
  h,
  radius = 12,
  circle,
  className = '',
}: {
  w?: number | string
  h?: number | string
  radius?: number
  circle?: boolean
  className?: string
}) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{
        width: w,
        height: h,
        borderRadius: circle ? '50%' : radius,
      }}
      aria-hidden="true"
    />
  )
}
