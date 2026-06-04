/**
 * GET 响应短期内存缓存（stale-while-revalidate：命中即返，过期前后台静默刷新）。
 */

type CacheEntry<T> = {
  data: T
  /** 超过此时间仍返回数据，但触发后台 revalidate */
  staleAt: number
  /** 超过此时间条目作废 */
  expiresAt: number
}

const store = new Map<string, CacheEntry<unknown>>()
const revalidating = new Set<string>()

/** stale 阈值占 TTL 的比例（0.7 = TTL 70% 后视为 stale） */
const STALE_RATIO = 0.7
/** 防止长时间浏览撑爆内存 */
export const API_CACHE_MAX_ENTRIES = 256
const MAX_ENTRIES = API_CACHE_MAX_ENTRIES

function touchEntry(key: string, entry: CacheEntry<unknown>) {
  store.delete(key)
  store.set(key, entry)
}

function evictIfNeeded() {
  while (store.size >= MAX_ENTRIES) {
    const oldest = store.keys().next().value
    if (oldest == null) break
    store.delete(oldest)
  }
}

export const API_CACHE_TTL = {
  kline: 60_000,
  chanlun: 90_000,
  quote: 15_000,
  info: 300_000,
  extras: 120_000,
  hot: 120_000,
  news: 120_000,
  market: 60_000,
  watchlist: 30_000,
  search: 30_000,
  comments: 60_000,
  sector: 120_000,
  settings: 300_000,
  chanlunMulti: 90_000,
  /** 规则引擎 AI 策略（与后端 ai_signal_rule_cache 90s 对齐） */
  aiSignalRule: 90_000,
  /** LLM 增强 AI 策略（与后端 ai_signal_llm_cache 300s 对齐） */
  aiSignalLlm: 300_000,
} as const

function purgeExpired(key: string, entry: CacheEntry<unknown>): boolean {
  if (Date.now() > entry.expiresAt) {
    store.delete(key)
    return true
  }
  return false
}

export function getApiCache<T>(key: string): T | null {
  const entry = store.get(key)
  if (!entry) return null
  if (purgeExpired(key, entry)) return null
  touchEntry(key, entry)
  return entry.data as T
}

export function peekApiCache<T>(key: string): { data: T; isStale: boolean } | null {
  const entry = store.get(key)
  if (!entry) return null
  if (purgeExpired(key, entry)) return null
  touchEntry(key, entry)
  return {
    data: entry.data as T,
    isStale: Date.now() > entry.staleAt,
  }
}

export function setApiCache<T>(key: string, data: T, ttlMs: number): void {
  const now = Date.now()
  if (store.has(key)) store.delete(key)
  else evictIfNeeded()
  store.set(key, {
    data,
    staleAt: now + ttlMs * STALE_RATIO,
    expiresAt: now + ttlMs,
  })
}

export function invalidateApiCache(prefix?: string): void {
  if (!prefix) {
    store.clear()
    revalidating.clear()
    return
  }
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key)
  }
  for (const key of revalidating) {
    if (key.startsWith(prefix)) revalidating.delete(key)
  }
}

export function apiCacheStats(): { size: number; maxEntries: number } {
  const now = Date.now()
  for (const [key, entry] of store.entries()) {
    if (now > entry.expiresAt) store.delete(key)
  }
  return { size: store.size, maxEntries: MAX_ENTRIES }
}

/** 后台静默刷新；同一 key 同时只跑一个 revalidate */
export function scheduleApiRevalidate<T>(
  key: string,
  ttlMs: number,
  factory: () => Promise<T>,
): void {
  if (revalidating.has(key)) return
  revalidating.add(key)
  void factory()
    .then(data => setApiCache(key, data, ttlMs))
    .catch(() => { /* 保留 stale 数据 */ })
    .finally(() => revalidating.delete(key))
}
