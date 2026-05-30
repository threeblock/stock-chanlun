import type { KLine } from '../api/stock'

/** 主图渲染超过此根数时做等距降采样（保留首尾） */
export const KLINE_DISPLAY_MAX = 600

/** 副图超过此根数且已缩放时，仅渲染可见窗口附近数据 */
export const SUBCHART_SLICE_THRESHOLD = 400

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

/**
 * 按 dataZoom 百分比截取 K 线（带 5% 缓冲），减轻副图全量重绘。
 */
export function sliceKlinesForZoom(
  klines: KLine[],
  zoomStart = 0,
  zoomEnd = 100,
  maxPoints = SUBCHART_SLICE_THRESHOLD,
): KLine[] {
  const n = klines.length
  if (n <= maxPoints) return klines
  const from = Math.floor((n * zoomStart) / 100)
  const to = Math.ceil((n * zoomEnd) / 100)
  const span = Math.max(1, to - from)
  const pad = Math.max(5, Math.floor(span * 0.05))
  const start = Math.max(0, from - pad)
  const end = Math.min(n, to + pad)
  const slice = klines.slice(start, end)
  if (slice.length <= maxPoints) return slice
  return downsampleKlines(slice, maxPoints)
}
