/** K 线日期与缠论结构在图表轴上的索引映射（PC / 移动端共用） */

export function normDay(s: string): string {
  return s.replace('T', ' ').trim().slice(0, 10)
}

export function buildDateLookup(dates: string[]): Map<string, number> {
  const lookup = new Map<string, number>()
  for (let j = 0; j < dates.length; j++) lookup.set(dates[j], j)
  return lookup
}

/** 在 dates（YYYY-MM-DD）里找索引；找不到则找时间最接近的一根 */
export function dateToIdxRobust(d: string, dates: string[], lookup?: Map<string, number>): number {
  const key = normDay(d)
  const fromMap = lookup?.get(key)
  if (fromMap != null) return fromMap
  let i = dates.indexOf(key)
  if (i >= 0) return i
  const t = Date.parse(key.replace(/-/g, '/'))
  if (Number.isNaN(t)) return -1
  let best = -1
  let bestDiff = Infinity
  for (let j = 0; j < dates.length; j++) {
    const tj = Date.parse(dates[j].replace(/-/g, '/'))
    if (Number.isNaN(tj)) continue
    const diff = Math.abs(tj - t)
    if (diff < bestDiff) {
      bestDiff = diff
      best = j
    }
  }
  return best
}

export function resolveBarRange(
  start: string,
  end: string,
  n: number,
  dates: string[],
  lookup?: Map<string, number>,
): [number, number] | null {
  if (n <= 0) return null
  let s = dateToIdxRobust(start, dates, lookup)
  let e = dateToIdxRobust(end, dates, lookup)
  if (s < 0 && e < 0) return null
  if (s < 0) s = 0
  if (e < 0) e = n - 1
  if (s > e) [s, e] = [e, s]
  s = Math.max(0, Math.min(n - 1, s))
  e = Math.max(0, Math.min(n - 1, e))
  if (s > e) return null
  return [s, e]
}
