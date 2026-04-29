<template>
  <div class="login-page tm-page-shell">
    <section class="login-card tm-panel">
      <div class="login-card__brand">
        <div
          class="brand-mark"
          aria-hidden="true"
        >
          <span class="brand-mark__dot" />
          <span class="brand-mark__bar" />
        </div>
        <p class="tm-eyebrow">
          TOM MALL ADMIN
        </p>
        <h1 class="login-title">
          tom-mall 管理后台
        </h1>
      </div>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        class="login-form tm-form-control"
        label-position="left"
        label-width="92px"
        @keyup.enter="handleSubmit"
      >
        <el-form-item
          label="账号"
          prop="username"
        >
          <el-input
            v-model="form.username"
            size="large"
            clearable
            placeholder="请输入管理员账号"
            autocomplete="username"
          />
        </el-form-item>

        <el-form-item
          label="密码"
          prop="password"
        >
          <el-input
            v-model="form.password"
            type="password"
            show-password
            size="large"
            placeholder="请输入登录密码"
            autocomplete="current-password"
          />
        </el-form-item>

        <p
          v-if="errorMessage"
          class="form-error"
          role="alert"
        >
          {{ errorMessage }}
        </p>

        <el-button
          type="primary"
          size="large"
          class="submit-button"
          :loading="submitting"
          :disabled="submitting"
          @click="handleSubmit"
        >
          进入后台工作台
        </el-button>
      </el-form>

      <div class="login-card__footer">
        <p class="footer-note">
          仅限已授权管理员访问，请勿在公共设备保存登录信息。
        </p>
        <span class="footer-version">v1.0</span>
      </div>
    </section>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { loginByPassword } from '@/api/auth';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();
const formRef = ref(null);
const submitting = ref(false);
const errorMessage = ref('');

const form = reactive({
  username: '',
  password: '',
});

const rules = {
  username: [
    { required: true, message: '请输入管理员账号', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入登录密码', trigger: 'blur' },
  ],
};

async function handleSubmit() {
  if (submitting.value || !formRef.value) {
    return;
  }

  errorMessage.value = '';

  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) {
    return;
  }

  submitting.value = true;

  try {
    const data = await loginByPassword(form);
    authStore.setAuth(data);
    await router.replace('/');
  } catch (error) {
    errorMessage.value = error?.message || '登录失败，请稍后重试';
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.login-page {
  position: relative;
  display: grid;
  place-items: center;
  padding: 24px;
  overflow: hidden;
}

.login-page::before,
.login-page::after {
  content: '';
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
}

.login-page::before {
  top: -180px;
  left: min(10vw, 120px);
  width: 380px;
  height: 380px;
  background: radial-gradient(circle, rgba(74, 119, 150, 0.16), transparent 70%);
}

.login-page::after {
  right: min(12vw, 140px);
  bottom: -220px;
  width: 420px;
  height: 420px;
  background: radial-gradient(circle, rgba(132, 159, 180, 0.16), transparent 72%);
}

.login-card {
  position: relative;
  z-index: 1;
  width: min(100%, 520px);
  padding: 44px 40px 28px;
  overflow: hidden;
}

.login-card::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.54), rgba(255, 255, 255, 0)),
    radial-gradient(circle at top, rgba(44, 91, 122, 0.06), transparent 50%);
}

.login-card__brand,
.login-form,
.login-card__footer {
  position: relative;
  z-index: 1;
}

.login-card__brand {
  margin-bottom: 22px;
}

.brand-mark {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}

.brand-mark__dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: linear-gradient(135deg, #2c5b7a, #4d7e9f);
  box-shadow: 0 0 0 8px rgba(44, 91, 122, 0.08);
}

.brand-mark__bar {
  width: 44px;
  height: 10px;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(44, 91, 122, 0.24), rgba(44, 91, 122, 0.08));
}

.login-title {
  margin: 10px 0 0;
  font-family: var(--tm-font-display);
  font-size: clamp(30px, 5vw, 36px);
  line-height: 1.12;
  letter-spacing: -0.03em;
  color: var(--tm-color-text);
}

.login-form {
  display: grid;
  gap: 4px;
}

.login-form :deep(.el-form-item) {
  margin-bottom: 18px;
}

.login-form :deep(.el-form-item__label) {
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  min-height: var(--tm-control-height);
  padding-right: 14px;
  color: var(--tm-color-text);
  line-height: 1.5;
  white-space: nowrap;
}

.login-form :deep(.el-form-item__content) {
  display: flex;
  align-items: center;
  min-width: 0;
}

.form-error {
  margin: 0;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid rgba(171, 61, 50, 0.14);
  background: rgba(177, 59, 48, 0.08);
  color: #9f3d33;
  font-size: 14px;
  line-height: 1.6;
}

.submit-button {
  width: 100%;
  margin-top: 8px;
}

.login-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 26px;
  padding-top: 18px;
  border-top: 1px solid rgba(44, 91, 122, 0.1);
}

.footer-note {
  margin: 0;
  font-size: 13px;
  line-height: 1.7;
  color: var(--tm-color-text-soft);
}

.footer-version {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 52px;
  min-height: 30px;
  padding: 0 10px;
  border-radius: 999px;
  background: rgba(44, 91, 122, 0.08);
  color: var(--tm-color-primary);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
}

@media (max-width: 640px) {
  .login-page {
    padding: 16px;
  }

  .login-card {
    padding: 30px 20px 22px;
  }

  .login-card__footer {
    flex-direction: column;
    align-items: flex-start;
  }

  .login-form {
    gap: 0;
  }

  .login-form :deep(.el-form-item) {
    margin-bottom: 16px;
  }

  .login-form :deep(.el-form-item__label) {
    width: 84px !important;
    padding-right: 10px;
    font-size: 14px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .login-page::before,
  .login-page::after {
    opacity: 0.6;
  }
}
</style>
