/**
 * 页面可见时定时刷新；隐藏 Tab 时暂停；429 时指数退避。
 */
import { onMounted, onUnmounted, ref } from 'vue'
import axios from 'axios'

export interface VisibilityRefreshOptions {
  /** 触发 429 后最长退避间隔（毫秒） */
  maxBackoffMs?: number
  /** 是否在挂载后立即执行一次（默认 false，由调用方自行首刷） */
  runOnMount?: boolean
}

function isRateLimitedError(err: unknown): boolean {
  if (!axios.isAxiosError(err)) {
    return err instanceof Error && err.message.includes('过于频繁')
  }
  return err.response?.status === 429
}

export function useVisibilityRefresh(
  callback: () => void | Promise<void>,
  baseIntervalMs: number,
  options: VisibilityRefreshOptions = {},
) {
  const { maxBackoffMs = baseIntervalMs * 4, runOnMount = false } = options
  const currentDelayMs = ref(baseIntervalMs)
  let timer: ReturnType<typeof setTimeout> | null = null
  let disposed = false

  async function tick() {
    if (disposed || document.hidden) return
    try {
      await callback()
      currentDelayMs.value = baseIntervalMs
    } catch (err) {
      if (isRateLimitedError(err)) {
        currentDelayMs.value = Math.min(currentDelayMs.value * 2, maxBackoffMs)
      }
    }
  }

  function scheduleNext() {
    if (disposed) return
    if (timer) clearTimeout(timer)
    timer = setTimeout(async () => {
      await tick()
      scheduleNext()
    }, currentDelayMs.value)
  }

  function start() {
    disposed = false
    scheduleNext()
  }

  function stop() {
    disposed = true
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }

  function onVisibilityChange() {
    if (document.hidden) {
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
    } else {
      scheduleNext()
    }
  }

  onMounted(() => {
    document.addEventListener('visibilitychange', onVisibilityChange)
    if (runOnMount) void tick()
    start()
  })

  onUnmounted(() => {
    document.removeEventListener('visibilitychange', onVisibilityChange)
    stop()
  })

  return { start, stop, currentDelayMs }
}
