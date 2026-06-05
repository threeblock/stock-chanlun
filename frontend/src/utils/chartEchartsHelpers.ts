import type { ECharts } from './echarts'

type ZoomRange = { start?: number; end?: number }

function readDataZoom(chart: ECharts): { inside?: ZoomRange; slider?: ZoomRange } {
  const dz = (chart.getOption() as { dataZoom?: ZoomRange[] }).dataZoom ?? []
  return { inside: dz[0], slider: dz[1] ?? dz[0] }
}

/** setOption 后恢复用户当前的 dataZoom 区间，避免指标切换时视图跳回默认 70–100% */
export function setChartOptionKeepDataZoom(
  chart: ECharts,
  option: Record<string, unknown>,
  notMerge = true,
) {
  const saved = readDataZoom(chart)
  chart.setOption(option, { notMerge })
  const { inside, slider } = saved
  if (inside?.start == null || inside.end == null) return
  chart.setOption({
    dataZoom: [
      { start: inside.start, end: inside.end },
      {
        start: slider?.start ?? inside.start,
        end: slider?.end ?? inside.end,
      },
    ],
  })
}
