import { describe, expect, it } from 'vitest'
import { buildDateLookup, dateToIdxRobust, resolveBarRange } from './chartDateUtils'

describe('chartDateUtils', () => {
  const dates = ['2024-01-02', '2024-01-03', '2024-01-04']

  it('dateToIdxRobust finds exact match', () => {
    expect(dateToIdxRobust('2024-01-03', dates)).toBe(1)
  })

  it('dateToIdxRobust uses lookup map', () => {
    const lookup = buildDateLookup(dates)
    expect(dateToIdxRobust('2024-01-04', dates, lookup)).toBe(2)
  })

  it('resolveBarRange clamps invalid endpoints', () => {
    const r = resolveBarRange('2024-01-01', '2024-01-99', 3, dates)
    expect(r).toEqual([0, 2])
  })
})
