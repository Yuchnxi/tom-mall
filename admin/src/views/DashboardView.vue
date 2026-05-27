<template>
  <div class="dashboard-page tm-page-shell">
    <section class="dashboard-hero">
      <div>
        <p class="tm-eyebrow">
          运营面板
        </p>
        <h1>tom-mall 管理后台</h1>
        <p class="hero-description">
          登录闭环已接入完成，当前页面作为后台首页占位区，后续商品、订单和会员模块将沿用同一套视觉基线。
        </p>
      </div>

      <el-button
        type="primary"
        class="hero-button"
        @click="handleLogout"
      >
        退出登录
      </el-button>
    </section>

    <section class="dashboard-grid">
      <article class="dashboard-card tm-panel">
        <span class="card-label">当前状态</span>
        <strong>认证链路已打通</strong>
        <p>支持登录、登录态恢复、401 回跳与主动退出。</p>
      </article>

      <article class="dashboard-card tm-panel">
        <span class="card-label">视觉方向</span>
        <strong>运营中枢基线</strong>
        <p>后续后台页面将延续当前的色彩、卡片和表单语言。</p>
      </article>
    </section>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { logoutRequest } from '@/api/auth';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();

async function handleLogout() {
  try {
    await logoutRequest();
  } catch {
    // 忽略退出请求失败，优先保证本地登录态清理
  } finally {
    authStore.clearAuth();
    router.replace('/login');
  }
}
</script>

<style scoped>
.dashboard-page {
  padding: 40px 24px;
}

.dashboard-hero {
  width: min(1120px, 100%);
  margin: 0 auto;
  padding: 0 4px;
  display: flex;
  justify-content: space-between;
  gap: 24px;
  align-items: flex-start;
}

.dashboard-hero h1 {
  margin: 10px 0 12px;
  font-size: clamp(30px, 4.2vw, 52px);
  line-height: 1.05;
  letter-spacing: -0.04em;
}

.hero-description {
  max-width: 720px;
  margin: 0;
  color: var(--tm-color-text-soft);
  line-height: 1.8;
}

.hero-button {
  margin-top: 12px;
}

.dashboard-grid {
  width: min(1120px, 100%);
  margin: 28px auto 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.dashboard-card {
  padding: 24px;
}

.card-label {
  display: inline-block;
  margin-bottom: 14px;
  font-size: 12px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--tm-color-accent);
}

.dashboard-card strong {
  display: block;
  font-size: 22px;
  margin-bottom: 10px;
}

.dashboard-card p {
  margin: 0;
  line-height: 1.75;
  color: var(--tm-color-text-soft);
}

@media (max-width: 720px) {
  .dashboard-page {
    padding: 24px 16px;
  }

  .dashboard-hero {
    flex-direction: column;
  }

  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}
</style>
