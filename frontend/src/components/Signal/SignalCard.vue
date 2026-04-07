<template>
  <div class="card signal-card">
    <div class="card-header">
      <span class="card-title">缠论信号</span>
      <div class="header-right">
        <span v-if="updatedAt" class="card-time">{{ updatedAt }}</span>
        <span class="info-icon" title="一买=首次底部背驰买入 | 二买=回踩不破一买买入 | 三买=突破中枢后回踩买入 | 一卖=首次顶部背驰卖出 | 二卖=反弹不破一卖卖出 | 三卖=跌破中枢后反弹卖出">?</span>
      </div>
    </div>

    <div v-if="signals.length === 0" class="empty-signals">
      <span>暂无买卖点</span>
    </div>

    <div v-else class="signal-list">
      <div
        v-for="(sig, idx) in visibleSignals"
        :key="`${sig.datetime}-${sig.type}-${idx}`"
        class="signal-item"
        :class="sigClass(sig.type)"
      >
        <div class="signal-header">
          <span class="signal-type">{{ sig.type }}</span>
          <span class="signal-level mono">{{ sig.level }}</span>
        </div>
        <div class="signal-detail">
          <span class="signal-price mono">{{ sig.price.toFixed(2) }}</span>
          <span class="signal-date">{{ formatDate(sig.datetime) }}</span>
        </div>
        <div class="signal-meta">
          <div class="confidence-row">
            <span class="conf-label">置信</span>
            <div class="confidence-bar">
              <div
                class="confidence-fill"
                :style="{
                  width: (sig.confidence * 100) + '%',
                  background: confColor(sig.confidence)
                }"
              />
            </div>
            <span class="conf-value mono">{{ (sig.confidence * 100).toFixed(0) }}%</span>
          </div>
          <div class="signal-desc">{{ sig.description }}</div>
        </div>
      </div>

      <button
        v-if="signals.length > visibleCount"
        class="show-more"
        @click="visibleCount = signals.length"
      >
        查看全部 ({{ signals.length }})
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Signal } from '../../api/stock'

const props = defineProps<{ signals: Signal[]; updatedAt?: string | null }>()

const visibleCount = ref(5)

/** 按日期降序，最新在前 */
const sortedByDateDesc = computed(() =>
  [...props.signals].sort((a, b) => {
    const ta = new Date(a.datetime).getTime()
    const tb = new Date(b.datetime).getTime()
    return tb - ta
  })
)

const visibleSignals = computed(() =>
  sortedByDateDesc.value.slice(0, visibleCount.value)
)

function sigClass(type: string) {
  if (type.includes('买')) return 'sig-buy'
  if (type.includes('卖')) return 'sig-sell'
  return ''
}

function confColor(c: number) {
  if (c >= 0.75) return 'var(--accent-green)'
  if (c >= 0.5) return 'var(--accent-amber)'
  return 'var(--accent-red)'
}

function formatDate(d: string) {
  return d.slice(0, 10)
}
</script>

<style scoped>
.signal-card { padding: 14px; }
.card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.card-title { font-size: 0.85rem; font-weight: 700; }
.header-right { display: flex; align-items: center; gap: 6px; }
.card-time { font-size: 0.65rem; color: var(--text-muted); font-family: var(--font-mono); }
.info-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  font-size: 0.65rem;
  font-weight: 700;
  color: var(--text-muted);
  cursor: help;
  line-height: 1;
}

.empty-signals {
  text-align: center;
  padding: 20px;
  color: var(--text-muted);
  font-size: 0.85rem;
}

.signal-list { display: flex; flex-direction: column; gap: 8px; }

.signal-item {
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid var(--border);
  transition: all 0.15s;
}
.sig-buy { border-left: 3px solid var(--accent-green); }
.sig-sell { border-left: 3px solid var(--accent-red); }

.signal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.signal-type { font-size: 0.85rem; font-weight: 600; }
.sig-buy .signal-type { color: var(--accent-green); }
.sig-sell .signal-type { color: var(--accent-red); }
.signal-level { font-size: 0.7rem; color: var(--text-muted); }

.signal-detail { display: flex; justify-content: space-between; margin-bottom: 6px; }
.signal-price { font-size: 1rem; font-weight: 700; }
.signal-date { font-size: 0.75rem; color: var(--text-muted); }

.signal-meta {}
.confidence-row { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
.conf-label { font-size: 0.7rem; color: var(--text-muted); }
.conf-value { font-size: 0.7rem; width: 28px; text-align: right; }
.signal-desc { font-size: 0.7rem; color: var(--text-secondary); line-height: 1.4; }

.show-more {
  background: none;
  border: none;
  color: var(--accent-blue);
  font-size: 0.8rem;
  cursor: pointer;
  text-align: center;
  padding: 6px;
  width: 100%;
  border-radius: 6px;
  transition: background 0.15s;
}
.show-more:hover { background: var(--bg-hover); }
</style>