import { describe, expect, it } from 'vitest'
import { sortRows } from './sortRows'

describe('sortRows', () => {
  it('sorts numbers descending', () => {
    const rows = [{ n: 1 }, { n: 3 }, { n: 2 }]
    expect(sortRows(rows, 'n', 'desc').map(r => r.n)).toEqual([3, 2, 1])
  })

  it('sorts strings with locale', () => {
    const rows = [{ name: '乙' }, { name: '甲' }]
    expect(sortRows(rows, 'name', 'asc').map(r => r.name)).toEqual(['甲', '乙'])
  })
})
