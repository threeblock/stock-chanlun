<template>
  <div ref="chartRef" class="sub-chart volume-chart" />
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, computed } from 'vue'
import echarts from '../../utils/echarts'
import type { KLine } from '../../api/stock'
import { sliceKlinesForZoom } from '../../utils/chartDownsample'
import { useDebouncedCallback } from '../../composables/useDebounce'

const props = defineProps<{ klines: KLine[]; zoomStart?: number; zoomEnd?: number }>()

const chartRef = ref<HTMLDivElement | null>(null)
let chart: echarts.ECharts | null = null

const COLOR_UP = '#f85149'
const COLOR_DOWN = '#3fb950'
const zoomId = `vol-zoom-${Math.random().toString(36).slice(2)}`

const seriesKlines = computed(() =>
  sliceKlinesForZoom(props.klines, props.zoomStart ?? 0, props.zoomEnd ?? 100),
)

function buildOption() {
  const bars = seriesKlines.value
  if (bars.length < 1) return {}
  const dates = bars.map(k => k.date.slice(0, 10))
  const vols = bars.map(k => k.volume ?? 0)
  const colors = bars.map((k, i) => {
    if (i === 0) return k.close >= k.open ? COLOR_UP : COLOR_DOWN
    const prev = bars[i - 1].close
    return k.close >= prev ? COLOR_UP : COLOR_DOWN
  })
  const s = props.zoomStart ?? 0
  const e = props.zoomEnd ?? 100

  return {
    animation: false,
    grid: { left: 10, right: 10, top: 10, bottom: 30 },
    xAxis: [{
      type: 'category', data: dates,
      axisLine: { lineStyle: { color: '#30363d' } },
      axisTick: { show: false }, axisLabel: { show: false }, splitLine: { show: false }
    }],
    yAxis: [{
      scale: true, gridIndex: 0,
      axisLine: { show: false }, axisTick: { show: false },
      splitLine: { lineStyle: { color: '#21262d', type: 'dashed' } },
      axisLabel: {
        color: '#7d8590', fontSize: 9,
        formatter: (v: number) => {
          if (v >= 1e8) return (v / 1e8).toFixed(1) + '亿'
          if (v >= 1e4) return (v / 1e4).toFixed(0) + '万'
          return String(Math.round(v))
        }
      }
    }],
    dataZoom: [
      { id: zoomId, type: 'slider', xAxisIndex: 0, start: s, end: e, show: false }
    ],
    series: [{
      name: '成交量',
      type: 'bar',
      data: vols.map((v, i) => ({ value: v, itemStyle: { color: colors[i] } })),
      barMaxWidth: 4
    }],
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#1c2128', borderColor: '#30363d',
      textStyle: { color: '#e6edf3', fontSize: 11 },
      formatter: (params: unknown) => {
        const arr = Array.isArray(params) ? params : [params]
        const p = arr[0] as { dataIndex?: number; name?: string }
        const idx = p.dataIndex
        if (idx == null || idx < 0 || idx >= bars.length) return ''
        const k = bars[idx]
        const v = k.volume ?? 0
        let vs = String(v)
        if (v >= 1e8) vs = (v / 1e8).toFixed(2) + ' 亿'
        else if (v >= 1e4) vs = (v / 1e4).toFixed(2) + ' 万'
        return `${p.name ?? ''}<br/>成交量 <b>${vs}</b>`
      }
    }
  }
}

const onResize = useDebouncedCallback(() => chart?.resize(), 150)

onMounted(() => {
  if (!chartRef.value) return
  chart = echarts.init(chartRef.value)
  chart.setOption(buildOption())
  window.addEventListener('resize', onResize)
})
onUnmounted(() => {
  window.removeEventListener('resize', onResize)
  chart?.dispose()
})

watch([() => props.klines, () => props.zoomStart, () => props.zoomEnd], () => {
  if (!chart) return
  chart.setOption(buildOption(), { notMerge: true })
}, { deep: true })
</script>

<style scoped>
.volume-chart {
  width: 100%;
  height: 100px;
  background: var(--bg-card);
  border-radius: 12px;
  border: 1px solid var(--border);
}
</style>
