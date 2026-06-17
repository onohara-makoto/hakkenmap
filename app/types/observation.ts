export type Category = '木' | '草' | '花' | 'きのこ' | '虫' | 'その他'

export type ObservationInsert = {
  category: Category
  name?: string | null
  memo: string
  latitude: number | null
  longitude: number | null
  observed_at: string | null
  photo_url: string | null
}

export type Observation = ObservationInsert & {
  id: string
  user_id: string
  created_at: string
}
