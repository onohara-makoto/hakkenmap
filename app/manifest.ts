import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'hakkenmap｜発見マップ',
    short_name: '発見',
    description: 'お散歩でみつけた草花や生きものを、写真と地図で残そう。',
    lang: 'ja',
    start_url: '/home',
    display: 'standalone',
    background_color: '#F6F1E8',
    theme_color: '#F6F1E8',
    categories: ['lifestyle', 'travel', 'education'],
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  }
}
