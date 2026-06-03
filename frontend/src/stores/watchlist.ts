import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { stockApi, type Quote } from '../api/stock'
import { invalidateApiCache } from '../utils/apiCache'

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
  const sortedByChange = computed(() =>
    [...stocks.value].sort((a, b) => b.change_pct - a.change_pct)
  )

  const hasSignals = computed(() =>
    stocks.value.some(s => s.change_pct > 0)
  )

  let saveTimer: ReturnType<typeof setTimeout> | null = null

  watch(
    () => stocks.value.map(s => `${s.code}:${s.price}:${s.change_pct}`).join('|'),
    () => {
      if (saveTimer) clearTimeout(saveTimer)
      saveTimer = setTimeout(() => saveToStorage(stocks.value), 300)
    },
  )

  async function fetchWatchlist(force = false) {
    if (
      !force &&
      lastUpdated.value &&
      Date.now() - lastUpdated.value.getTime() < 30_000
    ) {
      return
    }
    loading.value = true
    error.value = null
    try {
      const res = await stockApi.watchlist({ force })
      stocks.value = res.data.stocks || []
      lastUpdated.value = new Date()
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
      invalidateApiCache('GET:/watchlist')
      try {
        const q = await stockApi.quote(code, { force: true })
        const row = q.data
        if (!stocks.value.some(s => s.code === row.code)) {
          stocks.value.push(row)
        }
      } catch {
        await fetchWatchlist()
      }
      lastUpdated.value = new Date()
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
      invalidateApiCache('GET:/watchlist')
    } catch (e: unknown) {
      stocks.value = snapshot
      error.value = e instanceof Error ? e.message : String(e)
      throw e
    }
  }

  return { stocks, loading, error, lastUpdated, sortedByChange, hasSignals,
           fetchWatchlist, addStock, removeStock }
})