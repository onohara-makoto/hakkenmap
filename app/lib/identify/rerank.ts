export type Candidate = { name: string; commonName: string | null; score: number }

export type NearbySpecies = { count: number; commonName: string | null }
/** key は学名の小文字 */
export type NearbyMap = Map<string, NearbySpecies>

export type TaxonInfo = { name: string; commonName: string | null }
/** key は元の学名の小文字。undefined(キー無し)=未確認、null=iNatに存在しない */
export type TaxaMap = Map<string, TaxonInfo | null>

const key = (s: string) => s.trim().toLowerCase()
const genus = (s: string) => key(s).split(/\s+/)[0] ?? ''

function hasCommon(c: string | null, name: string) {
  return !!c && c.trim() !== '' && key(c) !== key(name)
}

function nearbyWeight(count: number) {
  return 1 + 0.15 * Math.min(1, count / 50)
}

/**
 * Gemini 候補を並べ替え・補正する (除外・追加はしない)。
 * nearby が null (取得失敗/位置なし) のときは周辺による補正をしない。
 */
export function rerank(
  candidates: Candidate[],
  nearby: NearbyMap | null,
  taxa: TaxaMap,
  /** false (一部の候補しか taxa 確認できていない) のときは減点 (0.6/0.85) をしない */
  taxaComplete = true
): Candidate[] {
  const nearbyGenera = new Set<string>()
  nearby?.forEach((_, k) => nearbyGenera.add(genus(k)))

  const scored = candidates.map((c, i) => {
    let name = c.name
    let common = c.commonName
    let w = 1
    const near = nearby?.get(key(name))
    if (near) {
      w = nearbyWeight(near.count)
      if (!hasCommon(common, name) && hasCommon(near.commonName, name)) common = near.commonName
    } else if (taxa.has(key(name))) {
      const t = taxa.get(key(name))
      if (t === null) {
        w = taxaComplete ? 0.6 : 1
      } else if (t) {
        name = t.name
        if (!hasCommon(common, name) && hasCommon(t.commonName, name)) common = t.commonName
        const n2 = nearby?.get(key(name))
        if (n2) w = nearbyWeight(n2.count)
        else if (nearby && nearbyGenera.has(genus(name))) w = 1
        else w = nearby && taxaComplete ? 0.85 : 1
      }
    } else if (nearby && nearbyGenera.has(genus(name))) {
      w = 1
    }
    return { c: { name, commonName: common, score: Math.min(1, c.score * w) }, i }
  })
  scored.sort((a, b) => b.c.score - a.c.score || a.i - b.i)
  return scored.map((s) => s.c)
}
