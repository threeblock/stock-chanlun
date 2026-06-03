import type { StockScreenResult } from '@/api/stock'

const CSV_HEADERS = [
  '代码',
  '名称',
  '现价',
  '涨跌幅%',
  '成交量',
  '成交额',
  '行业',
  '市盈率',
  '市净率',
  '缠论信号',
  '信号日期',
  '信号置信度',
  '双金叉',
  '双金叉日期',
  '趋势',
] as const

export function escapeCsvCell(value: string | number | null | undefined): string {
  if (value == null || value === '') return ''
  const s = String(value)
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

function rowFromResult(r: StockScreenResult): string[] {
  return [
    r.code,
    r.name,
    r.price > 0 ? r.price.toFixed(2) : '',
    r.change_pct.toFixed(2),
    String(Math.round(r.volume)),
    String(Math.round(r.amount)),
    r.industry ?? '',
    r.pe != null ? String(r.pe) : '',
    r.pb != null ? String(r.pb) : '',
    r.latest_signal ?? '',
    r.latest_signal_date ?? '',
    r.latest_signal_conf != null ? (r.latest_signal_conf * 100).toFixed(0) : '',
    r.has_dual_cross ? '是' : '否',
    r.dual_cross_date ?? '',
    r.trend ?? '',
  ]
}

export function buildScreenResultsCsv(results: StockScreenResult[]): string {
  const lines = [
    CSV_HEADERS.join(','),
    ...results.map(r => rowFromResult(r).map(escapeCsvCell).join(',')),
  ]
  return `\uFEFF${lines.join('\r\n')}`
}

export function downloadScreenResultsCsv(
  results: StockScreenResult[],
  filename?: string,
): void {
  if (!results.length) return
  const name =
    filename ?? `选股结果_${new Date().toISOString().slice(0, 10)}.csv`
  const blob = new Blob([buildScreenResultsCsv(results)], {
    type: 'text/csv;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}
