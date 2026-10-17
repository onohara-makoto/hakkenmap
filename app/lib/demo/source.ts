import { buildDemoObservations } from './fixtures'
import type { Observation } from '@/app/types/observation'

/**
 * デモ用のデータ取得元。ネットワークにも Supabase にもアクセスしない。
 * remove を持たないので、画面側は削除操作を出さない。
 */
export const demoSource = {
  list: async (): Promise<Observation[]> => buildDemoObservations(),
  get: async (id: string): Promise<Observation | null> =>
    buildDemoObservations().find((o) => o.id === id) ?? null,
}
