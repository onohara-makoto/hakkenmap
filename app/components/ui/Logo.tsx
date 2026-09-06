/**
 * アプリの唯一のロゴマーク。
 * 以前は home/page.tsx・login/page.tsx・PCHeader.tsx にそれぞれ別寸法で
 * 重複実装されていた（PCHeader 版は 20×30 の非正方形バグあり）。
 * size を渡すだけで内部の比率を計算する。
 */
export function Logo({ size = 30 }: { size?: number }) {
  const circle = size * 0.6
  const square = size * 0.3
  const squareRadius = Math.max(3, size * 0.1)

  return (
    <div
      className="flex items-center justify-center flex-shrink-0 bg-secondary"
      style={{ width: size, height: size, borderRadius: size * 0.37 }}
      aria-hidden="true"
    >
      <div
        className="flex items-center justify-center rounded-full bg-white"
        style={{ width: circle, height: circle }}
      >
        <div
          className="bg-primary"
          style={{ width: square, height: square, borderRadius: squareRadius }}
        />
      </div>
    </div>
  )
}
