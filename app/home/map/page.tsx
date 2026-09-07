import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

/**
 * 地図ページは /home の Explore（地図 + ボトムシート）に統合された。
 * 旧 URL・?focus= ディープリンクは /home に引き継いでリダイレクトする。
 */
export default async function MapRedirect({
  searchParams,
}: {
  searchParams: Promise<{ focus?: string }>
}) {
  const { focus } = await searchParams
  redirect(focus ? `/home?focus=${focus}` : '/home')
}
