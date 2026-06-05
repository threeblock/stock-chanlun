import type { StockScreenResult } from '@/api/stock'

export type ScreenSseEvent = { type: string; [k: string]: unknown }

export function parseScreenSseLine(raw: string): ScreenSseEvent | null {
  if (!raw.startsWith('data: ')) return null
  try {
    return JSON.parse(raw.slice(6)) as ScreenSseEvent
  } catch {
    return null
  }
}

/** 按 code 去重合并选股结果（重连时避免重复） */
export function upsertScreenResult(list: StockScreenResult[], item: StockScreenResult): void {
  const idx = list.findIndex(r => r.code === item.code)
  if (idx >= 0) list[idx] = item
  else list.push(item)
}
