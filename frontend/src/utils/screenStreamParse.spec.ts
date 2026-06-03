import { describe, expect, it } from 'vitest'
import { parseScreenSseLine, upsertScreenResult } from './screenStreamParse'
import type { StockScreenResult } from '@/api/stock'

function sample(code: string): StockScreenResult {
  return {
    code,
    name: code,
    price: 10,
    change_pct: 1,
    volume: 1000,
    amount: 0,
    industry: null,
    pe: null,
    pb: null,
    latest_signal: null,
    latest_signal_date: null,
    latest_signal_conf: null,
    has_dual_cross: false,
    dual_cross_date: null,
    trend: 'up',
  }
}

describe('screenStreamParse', () => {
  it('parseScreenSseLine parses data lines', () => {
    const ev = parseScreenSseLine('data: {"type":"progress","done":1,"total":10}')
    expect(ev?.type).toBe('progress')
    expect(ev?.done).toBe(1)
  })

  it('parseScreenSseLine returns null for invalid lines', () => {
    expect(parseScreenSseLine('event: ping')).toBeNull()
    expect(parseScreenSseLine('data: not-json')).toBeNull()
  })

  it('upsertScreenResult replaces by code', () => {
    const list = [sample('000001')]
    upsertScreenResult(list, { ...sample('000001'), price: 20 })
    expect(list).toHaveLength(1)
    expect(list[0].price).toBe(20)
    upsertScreenResult(list, sample('000002'))
    expect(list).toHaveLength(2)
  })
})
