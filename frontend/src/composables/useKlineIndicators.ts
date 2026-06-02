/**
 * 共享 K 线副图指标计算 — 供 KLineChart 副图 / 主图共振标记复用，避免重复算 MACD/RSI/SKDJ。
 */
import { computed, type Ref } from 'vue'
import type { KLine } from '../api/stock'
import { calcMACD, calcRSI, calcSKDJ } from '../utils/stockIndicators'

export function useKlineIndicators(klines: Ref<KLine[]>) {
  return computed(() => {
    const bars = klines.value
    if (bars.length < 2) {
      return { closes: [] as number[], macd: null as ReturnType<typeof calcMACD> | null, rsi: null as (number | null)[] | null, sk: null as (number | null)[] | null, sd: null as (number | null)[] | null }
    }
    const closes = bars.map(k => k.close)
    const highs = bars.map(k => k.high)
    const lows = bars.map(k => k.low)
    const macd = bars.length >= 30 ? calcMACD(closes) : null
    const rsi = bars.length >= 20 ? calcRSI(closes).rsi : null
    const skdj = bars.length >= 12 ? calcSKDJ(highs, lows, closes) : null
    return {
      closes,
      macd,
      rsi,
      sk: skdj?.sk ?? null,
      sd: skdj?.sd ?? null,
    }
  })
}
