export type Category = '木' | '草' | '花' | 'きのこ' | '虫' | 'その他'

export type ObservationInsert = {
  category: Category
  name?: string | null
  memo: string
  latitude: number | null
  longitude: number | null
  location_name?: string | null
  observed_at: string | null
  /** Storage（photos バケット）内のオブジェクトパス。`${user_id}/${observation_id}.${ext}` */
  photo_path: string | null
}

export type Observation = ObservationInsert & {
  id: string
  user_id: string
  created_at: string
  /**
   * 表示用の写真URL。DBの値ではなく、取得時に photo_path から発行した期限付き署名URL。
   * （DBの photo_url 列は旧方式の365日署名URLで、photo_path 移行前の記録の復元にのみ使う）
   */
  photo_url: string | null
}
