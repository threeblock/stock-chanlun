<template>
  <div v-if="trends.length" class="multi-level-block">
    <span class="multi-level-label">多级别趋势</span>
    <div class="multi-level-chips">
      <span
        v-for="t in trends"
        :key="t.level"
        class="level-chip"
        :class="chipClass(t.trend)"
        :title="t.signalsCount ? `${t.signalsCount} 个信号` : undefined"
      >
        {{ t.label }} · {{ t.trend }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { LevelTrendChip } from '@/composables/useMultiLevelTrends'

defineProps<{
  trends: LevelTrendChip[]
}>()

function chipClass(trend: string) {
  if (trend === '上涨') return 'chip-up'
  if (trend === '下跌') return 'chip-down'
  return 'chip-flat'
}
</script>

<style scoped>
.multi-level-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.multi-level-label {
  font-size: 0.68rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.4px;
}
.multi-level-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.level-chip {
  font-size: 0.72rem;
  padding: 3px 8px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--bg-secondary);
  white-space: nowrap;
}
.chip-up {
  color: var(--accent-green);
  border-color: rgba(63, 185, 80, 0.25);
  background: rgba(63, 185, 80, 0.08);
}
.chip-down {
  color: var(--accent-red);
  border-color: rgba(248, 81, 73, 0.25);
  background: rgba(248, 81, 73, 0.08);
}
.chip-flat {
  color: var(--accent-amber);
  border-color: rgba(210, 153, 34, 0.25);
  background: rgba(210, 153, 34, 0.08);
}
</style>
