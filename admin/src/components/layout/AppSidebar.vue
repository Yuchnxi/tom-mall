<template>
  <aside
    class="app-sidebar"
    :class="{ 'is-collapsed': collapsed }"
  >
    <div class="sidebar-brand">
      <div class="brand-logo">
        <span class="brand-logo__shape">
          <span class="brand-logo__inner" />
        </span>
      </div>

      <div
        class="brand-copy"
        :aria-hidden="collapsed"
      >
        <strong>Chenxi 商城</strong>
        <span>Admin Console</span>
      </div>
    </div>

    <el-scrollbar class="sidebar-menu-wrap">
      <el-menu
        :default-active="activeMenu"
        :collapse="collapsed"
        :collapse-transition="false"
        class="sidebar-menu"
        background-color="transparent"
        text-color="rgba(225, 236, 243, 0.72)"
        active-text-color="#ffffff"
        @select="handleSelect"
      >
        <el-menu-item
          v-for="item in menuList"
          :key="item.index"
          :index="item.index"
          :disabled="item.disabled"
        >
          <el-icon>
            <component :is="item.icon" />
          </el-icon>
          <template #title>
            <span>{{ item.label }}</span>
          </template>
        </el-menu-item>
      </el-menu>
    </el-scrollbar>
  </aside>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  DataAnalysis,
  Goods,
  Histogram,
  Management,
  Menu as MenuIcon,
  Memo,
  Setting,
  ShoppingCartFull,
  User,
} from '@element-plus/icons-vue';
import { useAuthStore } from '@/stores/auth';

defineProps({
  collapsed: {
    type: Boolean,
    default: false,
  },
});

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const fallbackMenus = [
  { index: '/', label: '首页', icon: Histogram, disabled: false },
  { index: '/dashboard/analytics', label: '数据概览', icon: DataAnalysis, disabled: true },
  { index: '/orders', label: '订单管理', icon: Memo, disabled: true },
  { index: '/products', label: '商品管理', icon: Goods, disabled: true },
  { index: '/users', label: '用户管理', icon: User, disabled: true },
  { index: '/operations', label: '营销管理', icon: ShoppingCartFull, disabled: true },
  { index: '/content', label: '内容管理', icon: MenuIcon, disabled: true },
  { index: '/finance', label: '财务管理', icon: Management, disabled: true },
  { index: '/reports', label: '报表分析', icon: DataAnalysis, disabled: true },
  { index: '/system', label: '系统设置', icon: Setting, disabled: true },
];

function pickIcon(iconName) {
  const iconMap = {
    Histogram,
    DataAnalysis,
    Memo,
    Goods,
    User,
    ShoppingCartFull,
    Menu: MenuIcon,
    Management,
    Setting,
  };

  return iconMap[iconName] || Histogram;
}

const menuList = computed(() => {
  if (!Array.isArray(authStore.menus) || authStore.menus.length === 0) {
    return fallbackMenus;
  }

  return authStore.menus
    .filter(item => item?.type !== 3)
    .map(item => ({
      index: item.path || item.route || '/',
      label: item.title || item.name || '未命名菜单',
      icon: pickIcon(item.icon),
      disabled: !item.path || item.path === '#',
    }));
});

const activeMenu = computed(() => route.path || '/');

function handleSelect(index) {
  const target = menuList.value.find(item => item.index === index);
  if (!target || target.disabled || target.index === route.path) {
    return;
  }

  router.push(target.index);
}
</script>

<style scoped>
.app-sidebar {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--tm-color-sidebar);
  border-right: 1px solid rgba(144, 176, 191, 0.08);
  color: var(--tm-color-text);
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: var(--tm-header-height);
  padding: 0 31px;
  overflow: hidden;
  border-bottom: 1px solid rgba(144, 176, 191, 0.08);
}

.brand-logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
}

.brand-logo__shape {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 8px;
  background: linear-gradient(180deg, #4de3aa 0%, #28b77f 100%);
  transform: rotate(45deg);
  box-shadow: 0 10px 20px rgba(49, 199, 138, 0.24);
}

.brand-logo__inner {
  width: 10px;
  height: 10px;
  border: 2px solid #08202a;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.24);
}

.brand-copy {
  display: flex;
  flex-direction: column;
  width: 124px;
  overflow: hidden;
  opacity: 1;
  transition:
    width 0.2s ease,
    opacity 0.16s ease;
}

.brand-copy strong {
  font-family: var(--tm-font-display);
  font-size: 16px;
  font-weight: 700;
  color: #f6fbff;
  white-space: nowrap;
}

.brand-copy span {
  margin-top: 4px;
  font-size: 12px;
  color: rgba(225, 236, 243, 0.52);
  white-space: nowrap;
}

.sidebar-menu-wrap {
  flex: 1;
  min-height: 0;
  padding: 18px 12px;
}

.sidebar-menu {
  border-right: 0;
}

.sidebar-menu :deep(.el-menu-item) {
  margin-bottom: 8px;
  border-radius: 12px;
  height: 44px;
  line-height: 44px;
  color: rgba(225, 236, 243, 0.72);
  transition:
    background-color 0.18s ease,
    box-shadow 0.18s ease,
    color 0.18s ease;
}

.sidebar-menu :deep(.el-menu-item:hover) {
  color: #ffffff;
  background: rgba(61, 213, 152, 0.14);
  box-shadow: inset 0 0 0 1px rgba(61, 213, 152, 0.18);
}

.sidebar-menu :deep(.el-menu-item.is-active) {
  background: linear-gradient(90deg, rgba(61, 213, 152, 0.26), rgba(61, 213, 152, 0.16));
  box-shadow: inset 0 0 0 1px rgba(85, 231, 176, 0.08);
}

.sidebar-menu :deep(.el-menu-item.is-active:hover) {
  background: linear-gradient(90deg, rgba(61, 213, 152, 0.34), rgba(61, 213, 152, 0.2));
  box-shadow: inset 0 0 0 1px rgba(61, 213, 152, 0.24);
}

.sidebar-menu :deep(.el-menu-item:hover .el-icon),
.sidebar-menu :deep(.el-menu-item:hover span) {
  color: #ffffff;
}

.sidebar-menu :deep(.el-menu-item.is-disabled) {
  opacity: 0.6;
}

.app-sidebar.is-collapsed .brand-copy {
  width: 0;
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .brand-copy {
    transition: none;
  }
}
</style>
