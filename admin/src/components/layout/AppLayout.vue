<template>
  <div class="app-layout tm-page-shell">
    <transition name="tm-fade">
      <div
        v-if="showMobileMask"
        class="layout-mask"
        @click="appStore.setSidebarCollapsed(true)"
      />
    </transition>

    <el-container class="layout-container">
      <el-aside
        class="layout-aside"
        :class="{ 'is-mobile-open': showMobileMask }"
        :width="asideWidth"
      >
        <AppSidebar :collapsed="appStore.sidebarCollapsed" />
      </el-aside>

      <el-container class="layout-main-shell">
        <el-header class="layout-header">
          <AppHeader :page-title="pageTitle" />
        </el-header>

        <el-main class="layout-main tm-scrollbar">
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import AppHeader from './AppHeader.vue';
import AppSidebar from './AppSidebar.vue';
import { useAppStore } from '@/stores/app';

const appStore = useAppStore();
const route = useRoute();
const isMobile = ref(false);

const pageTitle = computed(() => route.meta?.title || '首页');
const asideWidth = computed(() => (appStore.sidebarCollapsed ? '88px' : '244px'));
const showMobileMask = computed(() => isMobile.value && !appStore.sidebarCollapsed);

function handleResize() {
  isMobile.value = window.innerWidth < 960;

  if (isMobile.value) {
    appStore.setSidebarCollapsed(true);
  }
}

onMounted(() => {
  handleResize();
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
});
</script>

<style scoped>
.app-layout {
  position: relative;
  height: 100vh;
  overflow: hidden;
}

.layout-container {
  height: 100vh;
  background: transparent;
}

.layout-aside {
  position: relative;
  z-index: 21;
  transition: width 0.24s ease;
  overflow: hidden;
}

.layout-main-shell {
  min-width: 0;
  height: 100vh;
  overflow: hidden;
}

.layout-header {
  flex: 0 0 auto;
  padding: 0;
  height: auto;
}

.layout-main {
  flex: 1;
  min-height: 0;
  padding: 24px;
  overflow: auto;
  background:
    radial-gradient(circle at top right, rgba(61, 213, 152, 0.06), transparent 24%),
    linear-gradient(180deg, rgba(10, 19, 27, 0.12), rgba(10, 19, 27, 0));
}

.layout-mask {
  position: fixed;
  inset: 0;
  z-index: 20;
  background: var(--tm-color-mask);
}

@media (max-width: 959px) {
  .layout-aside {
    position: fixed;
    inset: 0 auto 0 0;
    width: var(--tm-sidebar-width) !important;
    transform: translateX(-100%);
    transition: transform 0.24s ease;
  }

  .layout-aside.is-mobile-open {
    transform: translateX(0);
  }

  .layout-main {
    padding: 16px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .layout-aside {
    transition: none;
  }
}
</style>
