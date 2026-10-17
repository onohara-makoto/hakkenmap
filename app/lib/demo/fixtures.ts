import type { Category, Observation } from '@/app/types/observation'

/**
 * ログイン不要デモ（/demo）用の固定サンプル。実ユーザーのデータとは無関係。
 * 写真は public/demo/ の生成イラスト、場所名は架空、座標は地図表示用の例示。
 * 日付は「今日から何日前」で持たせ、いつ開いても今月の記録・連続記録が見えるようにする。
 */

type Fixture = {
  id: string
  category: Category
  name: string
  memo: string
  image: string
  spot: keyof typeof SPOTS | null
  /** 地点内のばらつき（度） */
  jitter?: [number, number]
  daysAgo: number
}

const SPOTS = {
  'Maple Hill Park': [35.7032, 139.5735],
  'Willow Creek Trail': [35.6985, 139.5622],
  'Old Shrine Grove': [35.7061, 139.5812],
  'Cedar Woods': [35.6942, 139.5771],
} as const

const FIXTURES: Fixture[] = [
  { id: 'demo-01', category: 'きのこ', name: 'Fly agaric', image: 'flyagaric', spot: 'Cedar Woods', jitter: [0.0004, -0.0003], daysAgo: 0,
    memo: 'Bright red cap with white flecks, growing under the birch at the edge of the woods. Not touching this one.' },
  { id: 'demo-02', category: '虫', name: 'Seven-spot ladybird', image: 'ladybird', spot: 'Maple Hill Park', jitter: [-0.0005, 0.0006], daysAgo: 1,
    memo: 'Resting on a leaf near the playground fence.' },
  { id: 'demo-03', category: '花', name: 'Cosmos', image: 'cosmos', spot: 'Willow Creek Trail', jitter: [0.0006, 0.0004], daysAgo: 2,
    memo: 'A whole bank of them along the creek path. Mostly pink, a few white.' },
  { id: 'demo-04', category: '木', name: 'Japanese maple', image: 'maple', spot: 'Maple Hill Park', jitter: [0.0003, -0.0007], daysAgo: 5,
    memo: 'Leaves are just starting to turn.' },
  { id: 'demo-05', category: 'その他', name: 'Acorns', image: 'acorn', spot: 'Old Shrine Grove', jitter: [-0.0002, 0.0002], daysAgo: 9,
    memo: 'Three acorns on the stone steps.' },
  { id: 'demo-06', category: '草', name: 'Moss on a wall', image: 'moss', spot: null, daysAgo: 12,
    memo: 'Photo had no GPS data, so this find is in the list but not on the map.' },
  { id: 'demo-07', category: 'きのこ', name: 'Turkey tail', image: 'turkeytail', spot: 'Cedar Woods', jitter: [-0.0006, -0.0004], daysAgo: 21,
    memo: 'Layered brackets on a fallen log.' },
  { id: 'demo-08', category: '木', name: 'Ginkgo', image: 'ginkgo', spot: 'Old Shrine Grove', jitter: [0.0005, 0.0005], daysAgo: 34,
    memo: 'The big tree by the gate.' },
  { id: 'demo-09', category: '虫', name: 'Swallowtail butterfly', image: 'swallowtail', spot: 'Willow Creek Trail', jitter: [-0.0004, 0.0008], daysAgo: 58,
    memo: 'Visiting the flowers by the bridge.' },
  { id: 'demo-10', category: '花', name: 'Hydrangea', image: 'hydrangea', spot: 'Old Shrine Grove', jitter: [-0.0007, -0.0002], daysAgo: 120,
    memo: 'Blue and violet clusters along the shrine path after the rain.' },
  { id: 'demo-11', category: '草', name: 'Field horsetail', image: 'horsetail', spot: 'Willow Creek Trail', jitter: [0.0002, -0.0009], daysAgo: 190,
    memo: '' },
  { id: 'demo-12', category: '花', name: 'Dandelion', image: 'dandelion', spot: 'Maple Hill Park', jitter: [-0.0003, -0.0002], daysAgo: 380,
    memo: 'First flower of the spring walk.' },
  { id: 'demo-13', category: '草', name: 'Wild mint', image: 'mint', spot: 'Willow Creek Trail', jitter: [0.0009, 0.0001], daysAgo: 410,
    memo: 'Smells like mint when you brush past it.' },
  { id: 'demo-14', category: 'その他', name: 'Feather', image: 'feather', spot: 'Cedar Woods', jitter: [0.0001, 0.0009], daysAgo: 440,
    memo: 'Probably from a jay.' },
]

export function buildDemoObservations(now = new Date()): Observation[] {
  return FIXTURES.map((f) => {
    const at = new Date(now.getFullYear(), now.getMonth(), now.getDate() - f.daysAgo, 10, 30)
    const base = f.spot ? SPOTS[f.spot] : null
    const iso = at.toISOString()
    return {
      id: f.id,
      user_id: 'demo',
      category: f.category,
      name: f.name,
      memo: f.memo,
      latitude: base ? base[0] + (f.jitter?.[0] ?? 0) : null,
      longitude: base ? base[1] + (f.jitter?.[1] ?? 0) : null,
      location_name: f.spot,
      observed_at: iso,
      created_at: iso,
      photo_path: null,
      photo_url: `/demo/${f.image}.svg`,
    }
  })
}
