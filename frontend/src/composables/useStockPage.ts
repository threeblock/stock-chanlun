/**
 * 个股页：缠论/K线/AI 与行情扩展信息加载（PC / 移动共用）
 */
import { ref } from 'vue'
import { stockApi, type Quote, type StockInfoFields, type StockExtras } from '../api/stock'
import { useChanlunStore, type LevelOption } from '../stores/chanlun'
import { useCommentStore } from '../stores/comment'
import { invalidateApiCache } from '../utils/apiCache'

export function useStockPage() {
  const store = useChanlunStore()
  const commentStore = useCommentStore()

  const quote = ref<Quote | null>(null)
  const stockInfo = ref<StockInfoFields | null>(null)
  const extras = ref<StockExtras | null>(null)

  async function loadQuoteExtras(code: string, force = false) {
    const settled = await Promise.allSettled([
      stockApi.quote(code, { force }),
      stockApi.info(code, { force }),
      stockApi.extras(code, 8, { force }),
    ])
    if (settled[0].status === 'fulfilled') quote.value = settled[0].value.data as Quote
    else quote.value = null
    if (settled[1].status === 'fulfilled') {
      const inf = settled[1].value.data.info
      stockInfo.value = inf && Object.keys(inf).length ? inf : null
    } else stockInfo.value = null
    if (settled[2].status === 'fulfilled') extras.value = settled[2].value.data
    else extras.value = null
  }

  async function loadStock(
    code: string,
    level: LevelOption,
    startDate?: string,
    endDate?: string,
    options?: { force?: boolean },
  ) {
    if (!code) return
    const force = options?.force ?? false
    await Promise.all([
      store.loadAll(code, level, startDate, endDate, { force }),
      loadQuoteExtras(code, force),
      commentStore.fetchComments(code, force),
    ])
  }

  async function changeLevel(code: string, level: LevelOption) {
    invalidateApiCache(`GET:/chanlun/${code}`)
    invalidateApiCache(`GET:/stocks/${code}/kline`)
    await store.loadAll(code, level, undefined, undefined, { force: true })
  }

  async function refreshAIStrategy(code: string, options?: { useLlm?: boolean }) {
    await store.fetchAISignal(code, store.currentLevel, options)
  }

  return {
    store,
    quote,
    stockInfo,
    extras,
    loadStock,
    changeLevel,
    loadQuoteExtras,
    refreshAIStrategy,
  }
}
