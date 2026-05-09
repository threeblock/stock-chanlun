import type { SupportResistance } from '../api/stock'

/**
 * 合并过近的价位、按强度截取，减少主图横向虚线密度。
 */
export function simplifySupportResistanceLevels(
  levels: SupportResistance[],
  midPrice: number,
  options?: { maxPerSide?: number; mergePct?: number }
): SupportResistance[] {
  const maxPerSide = options?.maxPerSide ?? 5
  const mergePct = options?.mergePct ?? 0.004
  const mergeDist = Math.max(Math.abs(midPrice) * mergePct, 0.02)

  const pickSide = (arr: SupportResistance[]): SupportResistance[] => {
    const sorted = [...arr].sort(
      (a, b) => (b.strength ?? 0.5) - (a.strength ?? 0.5)
    )
    const out: SupportResistance[] = []
    for (const lvl of sorted) {
      if (out.length >= maxPerSide) break
      if (out.some(o => Math.abs(o.price - lvl.price) < mergeDist)) continue
      out.push(lvl)
    }
    return out
  }

  const supports = levels.filter(l => l.type === 'support')
  const resistances = levels.filter(l => l.type === 'resistance')
  return [...pickSide(supports), ...pickSide(resistances)]
}
