/**
 * useVirtualScroll — 轻量级虚拟滚动 composable
 *
 * 用法:
 *   const { visibleItems, containerProps, wrapperProps } = useVirtualScroll({
 *     items: stockList,
 *     itemHeight: 48,        // 每项高度（px）
 *     overscan: 3,           // 上下各多渲染 N 项防止白屏
 *     maxHeight: 600,        // 可选，限制容器最大高度
 *   })
 *
 * 模板中:
 *   <div v-bind="containerProps" style="max-height: 600px; overflow-y: auto">
 *     <div v-bind="wrapperProps">
 *       <div v-for="item in visibleItems" :key="item.code" class="table-row">
 *         {{ item.name }}
 *       </div>
 *     </div>
 *   </div>
 */
import { ref, computed, type CSSProperties, type Ref } from 'vue'

export interface VirtualScrollOptions<T> {
  items: Ref<T[]>
  itemHeight: number
  overscan?: number
  maxHeight?: number
}

export function useVirtualScroll<T>(
  options: VirtualScrollOptions<T>
) {
  const { items, itemHeight, overscan = 3, maxHeight } = options

  const scrollTop = ref(0)
  const containerRef = ref<HTMLElement | null>(null)

  const totalHeight = computed(() => items.value.length * itemHeight)

  const visibleRange = computed(() => {
    const start = Math.max(0, Math.floor(scrollTop.value / itemHeight) - overscan)
    const end = Math.min(
      items.value.length,
      Math.ceil((scrollTop.value + (maxHeight ?? 1000)) / itemHeight) + overscan
    )
    return { start, end }
  })

  const visibleItems = computed(() =>
    items.value.slice(visibleRange.value.start, visibleRange.value.end)
  )

  const offsetY = computed(() => visibleRange.value.start * itemHeight)

  function onScroll(e: Event) {
    scrollTop.value = (e.target as HTMLElement).scrollTop
  }

  function scrollToIndex(index: number) {
    if (!containerRef.value) return
    containerRef.value.scrollTop = index * itemHeight
  }

  const containerProps = computed(() => ({
    ref: containerRef,
    onScroll,
    style: (
      maxHeight !== undefined
        ? { maxHeight: `${maxHeight}px`, overflowY: 'auto' }
        : { overflowY: 'auto' }
    ) as CSSProperties
  }))

  const wrapperProps = computed(() => ({
    style: { height: `${totalHeight.value}px`, position: 'relative' } as CSSProperties
  }))

  return {
    visibleItems,
    containerProps,
    wrapperProps,
    offsetY,
    scrollToIndex,
    visibleRange,
    totalHeight,
  }
}
