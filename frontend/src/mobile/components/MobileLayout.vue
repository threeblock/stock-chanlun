<template>
  <div class="mobile-layout">
    <!-- 顶部搜索栏 -->
    <MobileSearchBar ref="searchBarRef" @search="onSearch" />

    <!-- 主内容区 -->
    <main class="mobile-main">
      <RouterView v-slot="{ Component }">
        <Transition :name="transitionName" mode="out-in">
          <component :is="Component" :key="route.path" />
        </Transition>
      </RouterView>
    </main>

    <!-- 底部 Tab 导航 -->
    <MobileBottomNav />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterView, useRouter, useRoute } from 'vue-router'
import MobileSearchBar from '../components/MobileSearchBar.vue'
import MobileBottomNav from '../components/MobileBottomNav.vue'

const router = useRouter()
const route = useRoute()
const searchBarRef = ref<InstanceType<typeof MobileSearchBar> | null>(null)

function onSearch(code: string) {
  router.push(`/m/stock/${code}`)
}

// 前进/后退决定过渡方向
const transitionName = ref('slide-left')
router.beforeEach((to, from) => {
  const toDepth = to.path.split('/').filter(Boolean).length
  const fromDepth = from.path.split('/').filter(Boolean).length
  transitionName.value = toDepth <= fromDepth ? 'slide-right' : 'slide-left'
  return true
})

onMounted(() => {
  searchBarRef.value?.focus()
})
</script>

<style scoped>
.mobile-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  min-height: 100dvh;
  background: var(--bg-base);
}

.mobile-main {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding-bottom: calc(var(--tabbar-height) + env(safe-area-inset-bottom, 0px));
  padding-top: var(--searchbar-height);
  position: relative;
}

/* 页面切换滑入/滑出动画 */
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
}
.slide-left-enter-from { opacity: 0; transform: translateX(20px); }
.slide-left-leave-to  { opacity: 0; transform: translateX(-20px); }
.slide-right-enter-from { opacity: 0; transform: translateX(-20px); }
.slide-right-leave-to  { opacity: 0; transform: translateX(20px); }
</style>
