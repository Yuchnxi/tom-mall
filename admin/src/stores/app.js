import { computed, ref, watch } from 'vue';
import { defineStore } from 'pinia';

const THEME_KEY = 'tom-mall-admin-theme';
const COLLAPSE_KEY = 'tom-mall-admin-sidebar-collapsed';

function readTheme() {
  const savedTheme = window.localStorage.getItem(THEME_KEY);
  return savedTheme === 'light' ? 'light' : 'dark';
}

function readCollapsed() {
  return window.localStorage.getItem(COLLAPSE_KEY) === '1';
}

function syncTheme(theme) {
  document.documentElement.dataset.theme = theme;
}

export const useAppStore = defineStore('app', () => {
  const theme = ref(readTheme());
  const sidebarCollapsed = ref(readCollapsed());
  const keyword = ref('');
  const notificationCount = ref(3);

  const isDark = computed(() => theme.value === 'dark');

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value;
  }

  function setSidebarCollapsed(value) {
    sidebarCollapsed.value = Boolean(value);
  }

  function toggleTheme() {
    theme.value = isDark.value ? 'light' : 'dark';
  }

  function setKeyword(value) {
    keyword.value = value;
  }

  syncTheme(theme.value);

  watch(theme, value => {
    syncTheme(value);
    window.localStorage.setItem(THEME_KEY, value);
  }, { immediate: true });

  watch(sidebarCollapsed, value => {
    window.localStorage.setItem(COLLAPSE_KEY, value ? '1' : '0');
  }, { immediate: true });

  return {
    theme,
    sidebarCollapsed,
    keyword,
    notificationCount,
    isDark,
    toggleSidebar,
    setSidebarCollapsed,
    toggleTheme,
    setKeyword,
  };
});
