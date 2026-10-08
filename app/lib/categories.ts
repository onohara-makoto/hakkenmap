export const CATEGORY_COLORS: Record<string, { dot: string; bg: string; ink: string }> = {
  木: { dot: '#B08A5E', bg: '#F2E9D8', ink: '#A96A2E' },
  草: { dot: '#8A9A5B', bg: '#EAEEDD', ink: '#5F7136' },
  花: { dot: '#CE7150', bg: '#F2E9D8', ink: '#A96A2E' },
  きのこ: { dot: '#B08A5E', bg: '#F2E9D8', ink: '#A96A2E' },
  虫: { dot: '#8A9A5B', bg: '#EAEEDD', ink: '#5F7136' },
  その他: { dot: '#B4A992', bg: '#EFEAE0', ink: '#8A7C66' },
}

/** 地図ピン・アクセシビリティのリスト等価表現に使うアイコンとラベル（色だけに依存しない） */
export const CATEGORY_META: Record<
  string,
  { glyph: string; label: string; icon: string; sub: string; emptyNote: string }
> = {
  木: {
    glyph: '🌳',
    label: '木',
    icon: '/icons/categories/tree.png',
    sub: 'Trees',
    emptyNote: 'まだ空白のページ。最初の1本を探しに。',
  },
  草: {
    glyph: '🌿',
    label: '草',
    icon: '/icons/categories/grass.png',
    sub: 'Wild grasses',
    emptyNote: '道ばたの一株が最初の1件になります。',
  },
  花: {
    glyph: '🌸',
    label: '花',
    icon: '/icons/categories/flower.png',
    sub: 'Flowers',
    emptyNote: '季節の一輪を待つ、まっさらなページ。',
  },
  きのこ: {
    glyph: '🍄',
    label: 'きのこ',
    icon: '/icons/categories/mushroom.png',
    sub: 'Fungi collection',
    emptyNote: 'まだ空白のページ。最初の1つを探しに。',
  },
  虫: {
    glyph: '🐛',
    label: '虫',
    icon: '/icons/categories/bug.png',
    sub: 'Insects',
    emptyNote: 'きのこの近くにいるかもしれません。',
  },
  その他: {
    glyph: '📍',
    label: 'その他',
    icon: '/icons/categories/marker.png',
    sub: 'Field notes',
    emptyNote: '分類に迷うものは、ここに集めます。',
  },
}

export const CATEGORIES = ['木', '草', '花', 'きのこ', '虫', 'その他'] as const

/** コレクション棚の「次の称号」までの節目件数 */
const MILESTONES = [5, 10, 25, 50, 100, 200]
export function nextMilestone(count: number): number | null {
  return MILESTONES.find((m) => m > count) ?? null
}
