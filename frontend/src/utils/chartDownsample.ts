import type { KLine } from '../api/stock'

/** 主图渲染超过此根数时做等距降采样（保留首尾） */
export const KLINE_DISPLAY_MAX = 600

/**
 * 等距降采样 K 线，用于 ECharts 主图性能；缠论叠加仍用全量 props。
 */
export function downsampleKlines(klines: KLine[], maxPoints = KLINE_DISPLAY_MAX): KLine[] {
  const n = klines.length
  if (n <= maxPoints) return klines
  const step = Math.ceil(n / maxPoints)
  const out: KLine[] = []
  for (let i = 0; i < n; i += step) {
    out.push(klines[i])
  }
  const last = klines[n - 1]
  if (out[out.length - 1]?.date !== last.date) {
    out.push(last)
  }
  return out
}
