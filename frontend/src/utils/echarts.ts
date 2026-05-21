/**
 * ECharts 按需注册（全项目共用，避免各图表重复打包完整 echarts）
 */
import * as echarts from 'echarts/core'
import { BarChart, CandlestickChart, LineChart } from 'echarts/charts'
import {
  DataZoomComponent,
  GraphicComponent,
  GridComponent,
  TooltipComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([
  BarChart,
  CandlestickChart,
  LineChart,
  GridComponent,
  TooltipComponent,
  DataZoomComponent,
  GraphicComponent,
  CanvasRenderer,
])

export default echarts
export type { ECharts } from 'echarts/core'
