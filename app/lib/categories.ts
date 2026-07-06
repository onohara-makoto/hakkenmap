export const CATEGORY_COLORS: Record<string, { dot: string; bg: string; ink: string }> = {
  木: { dot: '#B08A5E', bg: '#F2E9D8', ink: '#A96A2E' },
  草: { dot: '#8A9A5B', bg: '#EAEEDD', ink: '#5F7136' },
  花: { dot: '#CE7150', bg: '#F2E9D8', ink: '#A96A2E' },
  きのこ: { dot: '#B08A5E', bg: '#F2E9D8', ink: '#A96A2E' },
  虫: { dot: '#8A9A5B', bg: '#EAEEDD', ink: '#5F7136' },
  その他: { dot: '#B4A992', bg: '#EFEAE0', ink: '#8A7C66' },
}

export const CATEGORIES = ['木', '草', '花', 'きのこ', '虫', 'その他'] as const
