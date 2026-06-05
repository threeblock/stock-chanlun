/** 表格行通用排序（字符串 localeCompare，数字相减） */
export type SortDir = 'asc' | 'desc'

export function sortRows<T>(
  list: T[],
  key: keyof T,
  dir: SortDir,
): T[] {
  const out = [...list]
  const mul = dir === 'asc' ? 1 : -1
  out.sort((a, b) => {
    const av = a[key]
    const bv = b[key]
    if (av == null && bv == null) return 0
    if (av == null) return 1
    if (bv == null) return -1
    if (typeof av === 'string' && typeof bv === 'string') {
      return av.localeCompare(bv, 'zh-CN') * mul
    }
    if (typeof av === 'boolean' && typeof bv === 'boolean') {
      return (Number(av) - Number(bv)) * mul
    }
    return (Number(av) - Number(bv)) * mul
  })
  return out
}
