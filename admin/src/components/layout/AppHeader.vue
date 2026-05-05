<template>
  <header class="app-header">
    <div class="header-left">
      <el-button
        circle
        class="header-icon-button"
        @click="appStore.toggleSidebar"
      >
        <el-icon>
          <component :is="appStore.sidebarCollapsed ? Expand : Fold" />
        </el-icon>
      </el-button>

      <div class="header-breadcrumb">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item>
            {{ pageTitle }}
          </el-breadcrumb-item>
        </el-breadcrumb>
      </div>
    </div>

    <div class="header-right">
      <div class="header-search">
        <el-input
          v-model="keyword"
          placeholder="搜索功能 / 订单 / 商品"
          clearable
          @input="appStore.setKeyword"
        >
          <template #prefix>
            <el-icon>
              <Search />
            </el-icon>
          </template>
        </el-input>
      </div>

      <el-tooltip :content="appStore.isDark ? '切换浅色主题' : '切换深色主题'">
        <el-button
          circle
          class="header-icon-button"
          @click="appStore.toggleTheme"
        >
          <el-icon>
            <component :is="appStore.isDark ? Sunny : Moon" />
          </el-icon>
        </el-button>
      </el-tooltip>

      <el-popover
        placement="bottom"
        :width="260"
        trigger="click"
      >
        <template #reference>
          <el-badge
            :value="appStore.notificationCount"
            :hidden="appStore.notificationCount === 0"
          >
            <el-button
              circle
              class="header-icon-button"
            >
              <el-icon>
                <Bell />
              </el-icon>
            </el-button>
          </el-badge>
        </template>

        <div class="header-popover">
          <strong>消息通知</strong>
          <p>订单审核、库存预警和系统通知会显示在这里。</p>
        </div>
      </el-popover>

      <el-tooltip content="帮助信息">
        <el-button
          circle
          class="header-icon-button"
        >
          <el-icon>
            <InfoFilled />
          </el-icon>
        </el-button>
      </el-tooltip>

      <el-dropdown @command="handleCommand">
        <div class="profile-entry">
          <el-avatar :size="32">
            {{ avatarText }}
          </el-avatar>
          <div class="profile-copy">
            <strong>{{ displayName }}</strong>
            <span>{{ roleLabel }}</span>
          </div>
          <el-icon class="profile-arrow">
            <ArrowDown />
          </el-icon>
        </div>

        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="profile">
              个人信息
            </el-dropdown-item>
            <el-dropdown-item
              command="theme"
            >
              切换主题
            </el-dropdown-item>
            <el-dropdown-item
              divided
              command="logout"
            >
              退出登录
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue';
import { ElMessage } from 'element-plus';
import {
  ArrowDown,
  Bell,
  Expand,
  Fold,
  InfoFilled,
  Moon,
  Search,
  Sunny,
} from '@element-plus/icons-vue';
import { useRouter } from 'vue-router';
import { logoutRequest } from '@/api/auth';
import { useAppStore } from '@/stores/app';
import { useAuthStore } from '@/stores/auth';

defineProps({
  pageTitle: {
    type: String,
    default: '首页',
  },
});

const router = useRouter();
const appStore = useAppStore();
const authStore = useAuthStore();

const displayName = computed(() => authStore.adminInfo?.realName || authStore.adminInfo?.username || '管理员');
const roleLabel = computed(() => authStore.adminInfo?.isSuper ? '超级管理员' : '后台用户');
const avatarText = computed(() => displayName.value.slice(0, 1));

const keyword = computed({
  get: () => appStore.keyword,
  set: value => appStore.setKeyword(value),
});

async function handleCommand(command) {
  if (command === 'theme') {
    appStore.toggleTheme();
    return;
  }

  if (command === 'profile') {
    ElMessage.info('个人信息功能后续接入');
    return;
  }

  if (command === 'logout') {
    try {
      await logoutRequest();
    } catch {
      // 退出接口失败时仍然优先清理本地登录态
    } finally {
      authStore.clearAuth();
      router.replace('/login');
    }
  }
}
</script>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  min-height: var(--tm-header-height);
  padding: 0 24px;
  background: var(--tm-color-header);
  border-bottom: 1px solid var(--tm-color-border);
  backdrop-filter: blur(14px);
}

.header-left,
.header-right {
  display: flex;
  align-items: center;
  gap: 14px;
}

.header-left {
  min-width: 0;
}

.header-right {
  flex: 1;
  justify-content: flex-end;
}

.header-breadcrumb {
  display: flex;
  align-items: center;
  min-width: 0;
}

.header-breadcrumb :deep(.el-breadcrumb__inner) {
  color: var(--tm-color-text);
  font-size: 18px;
  font-weight: 700;
  transition: color 0.18s ease;
}

.header-breadcrumb :deep(.el-breadcrumb__inner:hover),
.header-breadcrumb :deep(.el-breadcrumb__inner:focus) {
  color: #3dd598;
}

.header-search {
  width: min(340px, 34vw);
}

.header-search :deep(.el-input__wrapper) {
  border-radius: var(--tm-radius-control);
  background: var(--tm-color-search);
  box-shadow: 0 0 0 1px var(--tm-color-border) inset;
}

.header-search :deep(.el-input__inner) {
  color: var(--tm-color-text);
}

.header-icon-button {
  border: 1px solid var(--tm-color-border);
  background: var(--tm-color-panel-soft);
  color: var(--tm-color-text);
}

.header-icon-button:hover {
  color: var(--tm-color-primary);
  border-color: rgba(61, 213, 152, 0.28);
  background: var(--tm-color-panel);
}

.header-popover strong {
  display: block;
  margin-bottom: 8px;
  color: #10202c;
}

.header-popover p {
  margin: 0;
  color: #5d6b75;
  line-height: 1.7;
}

.profile-entry {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 10px 6px 6px;
  border-radius: 999px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.profile-entry:hover {
  background: rgba(255, 255, 255, 0.04);
}

.profile-copy {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.profile-copy strong {
  font-size: 14px;
  color: var(--tm-color-text);
}

.profile-copy span {
  margin-top: 2px;
  font-size: 12px;
  color: var(--tm-color-text-faint);
}

.profile-arrow {
  color: var(--tm-color-text-faint);
}

@media (max-width: 960px) {
  .app-header {
    flex-wrap: wrap;
    padding: 14px 16px;
  }

  .header-right {
    width: 100%;
  }

  .header-search {
    flex: 1;
    width: auto;
  }
}

@media (max-width: 720px) {
  .profile-copy {
    display: none;
  }

  .header-breadcrumb :deep(.el-breadcrumb__inner) {
    font-size: 16px;
  }
}
</style>
