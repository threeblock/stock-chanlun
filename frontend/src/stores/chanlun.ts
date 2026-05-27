import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { stockApi, type KLine, type ChanlunResult, type AISignal } from '../api/stock'

export type LevelOption = '1min' | '5min' | '15min' | '30min' | '60min' | 'daily' | 'weekly' | 'monthly'

/** 指标显示配置 */
export interface IndicatorConfig {
  // 主图
  ma5: boolean
  ma20: boolean
  ma60: boolean
  bis: boolean
  xiangs: boolean
  zhongshus: boolean
  signals: boolean
  aiLines: boolean
  supportResistance: boolean
  // 副图
  volume: boolean
  macd: boolean
  rsi: boolean
  skdj: boolean
}

export const defaultIndicators: IndicatorConfig = {
  ma5: true,
  ma20: true,
  ma60: true,
  bis: true,
  /** 默认关闭线段，避免与「笔」叠两层折线导致杂乱；需要时在指标面板打开 */
  xiangs: false,
  zhongshus: true,
  signals: true,
  aiLines: true,
  supportResistance: true,
  volume: true,
  macd: true,
  rsi: false,
  skdj: false,
}

const INDICATOR_KEY = 'chanstock_indicators_v1'

function loadIndicators(): IndicatorConfig {
  try {
    const raw = localStorage.getItem(INDICATOR_KEY)
    if (!raw) return { ...defaultIndicators }
    return { ...defaultIndicators, ...JSON.parse(raw) as Partial<IndicatorConfig> }
  } catch { return { ...defaultIndicators } }
}

function isAbortError(e: unknown): boolean {
  return e instanceof Error && e.name === 'AbortError'
}

export const useChanlunStore = defineStore('chanlun', () => {
  const klines = ref<KLine[]>([])
  const chanlunResult = ref<ChanlunResult | null>(null)
  const aiSignal = ref<AISignal | null>(null)
  const loadingKline = ref(false)
  const loadingChanlun = ref(false)
  const loadingAI = ref(false)
  const errorKline = ref<string | null>(null)
  const errorChanlun = ref<string | null>(null)
  const errorAI = ref<string | null>(null)
  const currentLevel = ref<LevelOption>('daily')
  const aiModel = ref<string>('deepseek')
  const indicators = ref<IndicatorConfig>(loadIndicators())
  const klineUpdatedAt = ref<string | null>(null)
  const chanlunUpdatedAt = ref<string | null>(null)
  const aiUpdatedAt = ref<string | null>(null)

  let loadSeq = 0
  let klineAbort: AbortController | null = null
  let chanlunAbort: AbortController | null = null
  let aiAbort: AbortController | null = null

  watch(indicators, (val) => {
    try { localStorage.setItem(INDICATOR_KEY, JSON.stringify(val)) } catch { /* ignore */ }
  }, { deep: true })

  function timeNow() {
    return new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  function isStale(seq: number) {
    return seq !== loadSeq
  }

  async function fetchKline(
    code: string,
    level: LevelOption = 'daily',
    startDate?: string,
    endDate?: string,
    seq?: number,
  ) {
    klineAbort?.abort()
    klineAbort = new AbortController()
    const signal = klineAbort.signal
    loadingKline.value = true
    errorKline.value = null
    try {
      const res = await stockApi.kline(code, level, 500, startDate, endDate, { signal })
      if (seq != null && isStale(seq)) return
      klines.value = res.data.klines || []
      klineUpdatedAt.value = timeNow()
    } catch (e: unknown) {
      if (isAbortError(e)) return
      if (seq != null && isStale(seq)) return
      errorKline.value = e instanceof Error ? e.message : String(e)
    } finally {
      if (seq == null || !isStale(seq)) loadingKline.value = false
    }
  }

  async function fetchChanlun(code: string, level: LevelOption = 'daily', seq?: number) {
    chanlunAbort?.abort()
    chanlunAbort = new AbortController()
    const signal = chanlunAbort.signal
    loadingChanlun.value = true
    errorChanlun.value = null
    try {
      const res = await stockApi.chanlun(code, level, { signal })
      if (seq != null && isStale(seq)) return
      chanlunResult.value = res.data
      if (res.data.klines?.length) {
        klines.value = res.data.klines
        klineUpdatedAt.value = timeNow()
      }
      chanlunUpdatedAt.value = timeNow()
    } catch (e: unknown) {
      if (isAbortError(e)) return
      if (seq != null && isStale(seq)) return
      errorChanlun.value = e instanceof Error ? e.message : String(e)
    } finally {
      if (seq == null || !isStale(seq)) loadingChanlun.value = false
    }
  }

  async function fetchAISignal(
    code: string,
    level: LevelOption = 'daily',
    options?: { useLlm?: boolean; seq?: number },
  ) {
    aiAbort?.abort()
    aiAbort = new AbortController()
    const signal = aiAbort.signal
    const seq = options?.seq
    loadingAI.value = true
    errorAI.value = null
    try {
      const res = await stockApi.aiSignal(code, level, aiModel.value, {
        useLlm: options?.useLlm ?? false,
        signal,
      })
      if (seq != null && isStale(seq)) return
      aiSignal.value = res.data
      aiUpdatedAt.value = timeNow()
    } catch (e: unknown) {
      if (isAbortError(e)) return
      if (seq != null && isStale(seq)) return
      errorAI.value = e instanceof Error ? e.message : String(e)
    } finally {
      if (seq == null || !isStale(seq)) loadingAI.value = false
    }
  }

  async function loadAll(code: string, level: LevelOption = 'daily', startDate?: string, endDate?: string) {
    const seq = ++loadSeq
    currentLevel.value = level
    const hasDateFilter = Boolean(startDate || endDate)

    if (hasDateFilter) {
      await Promise.all([
        fetchChanlun(code, level, seq),
        fetchKline(code, level, startDate, endDate, seq),
      ])
    } else {
      await fetchChanlun(code, level, seq)
      if (!isStale(seq) && !klines.value.length && !errorChanlun.value) {
        await fetchKline(code, level, startDate, endDate, seq)
      }
    }

    if (!isStale(seq)) {
      void fetchAISignal(code, level, { useLlm: false, seq })
    }
  }

  async function setAiModel(model: string, code: string) {
    aiModel.value = model
    await stockApi.setAiModel(model)
    await fetchAISignal(code, currentLevel.value, { useLlm: true })
  }

  function toggleIndicator(key: keyof IndicatorConfig) {
    indicators.value[key] = !indicators.value[key]
  }

  function setIndicator(key: keyof IndicatorConfig, value: boolean) {
    indicators.value[key] = value
  }

  return {
    klines, chanlunResult, aiSignal,
    loadingKline, loadingChanlun, loadingAI,
    errorKline, errorChanlun, errorAI,
    currentLevel, aiModel, indicators,
    klineUpdatedAt, chanlunUpdatedAt, aiUpdatedAt,
    fetchKline, fetchChanlun, fetchAISignal, loadAll, setAiModel,
    toggleIndicator, setIndicator,
  }
})
