import { describe, expect, it, vi, afterEach } from 'vitest'
import {
  getApiCache,
  peekApiCache,
  setApiCache,
  scheduleApiRevalidate,
  invalidateApiCache,
} from './apiCache'

describe('apiCache', () => {
  afterEach(() => {
    invalidateApiCache()
    vi.useRealTimers()
  })

  it('returns fresh data before staleAt', () => {
    setApiCache('k', { v: 1 }, 1000)
    const peek = peekApiCache<{ v: number }>('k')
    expect(peek?.data.v).toBe(1)
    expect(peek?.isStale).toBe(false)
  })

  it('marks stale after 70% TTL but still returns data', () => {
    vi.useFakeTimers()
    setApiCache('k', { v: 1 }, 1000)
    vi.advanceTimersByTime(800)
    const peek = peekApiCache<{ v: number }>('k')
    expect(peek?.isStale).toBe(true)
    expect(getApiCache<{ v: number }>('k')?.v).toBe(1)
  })

  it('scheduleApiRevalidate updates cache on success', async () => {
    setApiCache('k', { v: 1 }, 1000)
    scheduleApiRevalidate('k', 1000, async () => ({ v: 2 }))
    await vi.waitFor(() => getApiCache<{ v: number }>('k')?.v === 2)
    expect(getApiCache<{ v: number }>('k')?.v).toBe(2)
  })
})
