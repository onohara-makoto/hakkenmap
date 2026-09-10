export function Spinner({
  size = 24,
  label = '読み込み中',
}: {
  size?: number
  label?: string
}) {
  return (
    <span
      role="status"
      aria-label={label}
      className="inline-block rounded-full border-2 border-line border-t-primary animate-[spin_0.8s_linear_infinite]"
      style={{ width: size, height: size }}
    />
  )
}
