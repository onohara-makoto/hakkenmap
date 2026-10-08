import Image from 'next/image'
import { CATEGORY_META } from '@/app/lib/categories'

/** カテゴリのイラストアイコン（絵文字ではなくデザイン済みPNG） */
export function CategoryIcon({
  category,
  size = 20,
  className,
}: {
  category: string
  size?: number
  className?: string
}) {
  const meta = CATEGORY_META[category] ?? CATEGORY_META['その他']
  return (
    <Image
      src={meta.icon}
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      className={`inline-block align-middle shrink-0 ${className ?? ''}`}
    />
  )
}
