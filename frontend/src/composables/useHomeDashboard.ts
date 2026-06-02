/**
 * 首页大盘 / 热门股 / 新闻数据（PC 与移动端共用）
 */
import { ref, computed } from 'vue'
import { stockApi, type HotStock, type MarketOverview, type NewsItem } from '../api/stock'

export function emptyMarketOverview(): MarketOverview {
  return {
    indices: {},
    market_breadth: { advancers: 0, decliners: 0, unchanged: 0 },
    sectors: [],
    sectors_top: [],
    sectors_bottom: [],
    stale: false,
  }
}

export function formatNewsTime(t: string): string {
  if (!t) return ''
  try {
    const d = new Date(t)
    if (isNaN(d.getTime())) return t
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    const hh = String(d.getHours()).padStart(2, '0')
    const mi = String(d.getMinutes()).padStart(2, '0')
    return `${mm}-${dd} ${hh}:${mi}`
  } catch {
    return t
  }
}

export function useHomeDashboard(hotLimit = 20, newsLimit = 8) {
  const marketData = ref<MarketOverview>(emptyMarketOverview())
  const marketLoading = ref(true)
  const marketError = ref('')

  const hotStocks = ref<HotStock[]>([])
  const hotLoading = ref(true)
  const hotError = ref('')

  const newsList = ref<NewsItem[]>([])
  const newsLoading = ref(true)
  const newsError = ref('')

  const allLoading = computed(
    () => marketLoading.value && hotLoading.value && newsLoading.value,
  )

  async function fetchHot(force = false) {
    hotLoading.value = true
    hotError.value = ''
    try {
      const res = await stockApi.hotStocks(hotLimit, { force })
      if (res.data.error) {
        hotError.value = res.data.error
        hotStocks.value = []
      } else {
        hotStocks.value = res.data.stocks ?? []
      }
    } catch {
      hotError.value = '热门股票获取失败'
      hotStocks.value = []
    } finally {
      hotLoading.value = false
    }
  }

  async function fetchMarket(force = false) {
    marketLoading.value = true
    marketError.value = ''
    try {
      const res = await stockApi.marketOverview({ force })
      const d = res.data
      if (d.stale) {
        marketError.value = d.error || '大盘数据暂不可用，请稍后重试'
      }
      marketData.value = {
        indices: d.indices ?? {},
        market_breadth: d.market_breadth ?? { advancers: 0, decliners: 0, unchanged: 0 },
        sectors: d.sectors ?? [],
        sectors_top: d.sectors_top ?? [],
        sectors_bottom: d.sectors_bottom ?? [],
        stale: d.stale,
      }
    } catch {
      marketError.value = '大盘数据获取失败'
      marketData.value = { ...emptyMarketOverview(), stale: true }
    } finally {
      marketLoading.value = false
    }
  }

  async function fetchNews(force = false) {
    newsLoading.value = true
    newsError.value = ''
    try {
      const res = await stockApi.news(newsLimit, { force })
      newsList.value = res.data.items ?? []
    } catch {
      newsError.value = '新闻获取失败'
    } finally {
      newsLoading.value = false
    }
  }

  async function refreshAll(force = false) {
    await Promise.allSettled([
      fetchHot(force),
      fetchMarket(force),
      fetchNews(force),
    ])
  }

  return {
    marketData,
    marketLoading,
    marketError,
    hotStocks,
    hotLoading,
    hotError,
    newsList,
    newsLoading,
    newsError,
    allLoading,
    fetchHot,
    fetchMarket,
    fetchNews,
    refreshAll,
  }
}
