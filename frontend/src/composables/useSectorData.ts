/**
 * 板块成分股：缓存优先展示 + 可见性软刷新（PC / 移动共用）
 */
import { ref, watch, type MaybeRefOrGetter, toValue } from 'vue'
import { stockApi, type SectorDetail, type SectorStock } from '@/api/stock'
import { peekApiCache, API_CACHE_TTL } from '@/utils/apiCache'
import { useVisibilityRefresh } from './useVisibilityRefresh'

type SectorApiResponse = { data: SectorDetail }

function sectorCacheKey(name: string) {
  return `GET:/sector/${encodeURIComponent(name)}/stocks`
}

function applySectorPayload(
  target: {
    stocks: { value: SectorStock[] }
    total: { value: number }
    boardType: { value: 'industry' | 'concept' | null }
  },
  payload: SectorDetail,
) {
  target.stocks.value = payload.stocks ?? []
  target.total.value = payload.total ?? 0
  target.boardType.value = (payload.board_type as 'industry' | 'concept' | null) ?? null
}

export function useSectorData(
  sectorName: MaybeRefOrGetter<string>,
  options?: { autoRefresh?: boolean },
) {
  const stocks = ref<SectorStock[]>([])
  const total = ref(0)
  const boardType = ref<'industry' | 'concept' | null>(null)
  const loading = ref(false)
  const error = ref('')

  const target = { stocks, total, boardType }

  async function fetchData(force = false) {
    const name = toValue(sectorName).trim()
    if (!name) return

    const key = sectorCacheKey(name)
    if (!force) {
      const peek = peekApiCache<SectorApiResponse>(key)
      if (peek) {
        applySectorPayload(target, peek.data.data)
        error.value = ''
        if (!peek.isStale) return
        try {
          const res = await stockApi.sectorStocks(name, { force: true })
          applySectorPayload(target, res.data)
        } catch {
          /* 保留 stale 数据 */
        }
        return
      }
    }

    const showSkeleton = stocks.value.length === 0
    if (showSkeleton) loading.value = true
    error.value = ''
    try {
      const res = await stockApi.sectorStocks(name, { force })
      applySectorPayload(target, res.data)
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : '加载失败'
    } finally {
      loading.value = false
    }
  }

  watch(
    () => toValue(sectorName),
    () => {
      stocks.value = []
      total.value = 0
      boardType.value = null
      void fetchData()
    },
    { immediate: true },
  )

  if (options?.autoRefresh !== false) {
    useVisibilityRefresh(
      () => fetchData(false),
      API_CACHE_TTL.sector,
    )
  }

  return { stocks, total, boardType, loading, error, fetchData }
}
