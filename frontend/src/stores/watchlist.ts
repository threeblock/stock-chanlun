import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { stockApi, type Quote } from '../api/stock'

const STORAGE_KEY = 'chanstock_watchlist_v2'

function loadFromStorage(): Quote[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Quote[]
    return Array.isArray(parsed) ? parsed : []
  } catch { return [] }
}

function saveToStorage(items: Quote[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch { /* storage full */ }
}

export const useWatchlistStore = defineStore('watchlist', () => {
  // 启动时从本地存储恢复，闪屏阶段就有数据
  const stocks = ref<Quote[]>(loadFromStorage())
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastUpdated = ref<Date | null>(
    stocks.value.length > 0 ? new Date() : null
  )
  const synced = ref(false) // 是否已与后端同步

  const sortedByChange = computed(() =>
    [...stocks.value].sort((a, b) => b.change_pct - a.change_pct)
  )

  const hasSignals = computed(() =>
    stocks.value.some(s => s.change_pct > 0)
  )

  // 任何变化都写入本地存储
  watch(stocks, (val) => saveToStorage(val), { deep: true })

  async function fetchWatchlist() {
    loading.value = true
    error.value = null
    try {
      const res = await stockApi.watchlist()
      stocks.value = res.data.stocks || []
      lastUpdated.value = new Date()
      synced.value = true
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e)
    } finally {
      loading.value = false
    }
  }

  async function addStock(code: string) {
    if (stocks.value.some(s => s.code === code)) {
      const err = new Error('该股票已在自选列表中')
      error.value = err.message
      throw err
    }
    try {
      await stockApi.addWatch(code)
      // 乐观更新：直接追加，后端数据等下次 fetch 时刷新
      stocks.value.push({
        code,
        name: '',
        price: 0,
        change_pct: 0,
        volume: 0,
        high: 0,
        low: 0,
        open: 0,
        prev_close: 0,
        amount: 0,
      })
      await fetchWatchlist()
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e)
      throw e
    }
  }

  async function removeStock(code: string) {
    const snapshot = [...stocks.value]
    stocks.value = stocks.value.filter(s => s.code !== code)
    try {
      await stockApi.removeWatch(code)
    } catch (e: unknown) {
      stocks.value = snapshot
      error.value = e instanceof Error ? e.message : String(e)
      throw e
    }
  }

  return { stocks, loading, error, lastUpdated, sortedByChange, hasSignals,
           fetchWatchlist, addStock, removeStock }
})