import { describe, expect, it } from 'vitest'
import { buildScreenResultsCsv, escapeCsvCell } from './exportScreenCsv'
import type { StockScreenResult } from '@/api/stock'

function sample(overrides: Partial<StockScreenResult> = {}): StockScreenResult {
  return {
    code: '000001',
    name: '平安银行',
    price: 10.5,
    change_pct: 1.2,
    volume: 100000,
    amount: 5000000,
    industry: '银行',
    pe: 5.5,
    pb: 0.8,
    latest_signal: '一买',
    latest_signal_date: '2024-01-15',
    latest_signal_conf: 0.85,
    has_dual_cross: true,
    dual_cross_date: '2024-01-10',
    trend: 'up',
    ...overrides,
  }
}

describe('exportScreenCsv', () => {
  it('escapeCsvCell quotes fields with commas', () => {
    expect(escapeCsvCell('a,b')).toBe('"a,b"')
    expect(escapeCsvCell('say "hi"')).toBe('"say ""hi"""')
  })

  it('buildScreenResultsCsv includes BOM and header row', () => {
    const csv = buildScreenResultsCsv([sample()])
    expect(csv.startsWith('\uFEFF')).toBe(true)
    expect(csv).toContain('代码,名称')
    expect(csv).toContain('000001')
    expect(csv).toContain('平安银行')
  })
})
