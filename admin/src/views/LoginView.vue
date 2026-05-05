<template>
  <div
    class="login-page"
    :style="pageStyle"
  >
    <section class="login-shell">
      <header class="login-header">
        <div
          class="brand-mark"
          aria-hidden="true"
        >
          <span class="brand-mark__outer">
            <span class="brand-mark__inner" />
          </span>
        </div>

        <h1 class="login-title">
          Chenxi 商城管理系统
        </h1>

        <p class="login-subtitle">
          欢迎登录，请输入您的账号密码
        </p>
      </header>

      <section class="login-card">
        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          class="login-form"
          label-position="left"
          label-width="56px"
          @keyup.enter="handleSubmit"
        >
          <el-form-item
            label="账号"
            prop="username"
            class="login-form-item"
          >
            <el-input
              v-model="form.username"
              size="large"
              clearable
              placeholder="请输入账号"
              autocomplete="username"
            >
              <template #prefix>
                <el-icon class="input-prefix-icon">
                  <User />
                </el-icon>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item
            label="密码"
            prop="password"
            class="login-form-item"
          >
            <el-input
              v-model="form.password"
              type="password"
              show-password
              size="large"
              placeholder="请输入密码"
              autocomplete="current-password"
            >
              <template #prefix>
                <el-icon class="input-prefix-icon">
                  <Lock />
                </el-icon>
              </template>
            </el-input>
          </el-form-item>

          <div class="login-tools">
            <el-checkbox v-model="rememberMe">
              记住我
            </el-checkbox>

            <button
              type="button"
              class="link-button"
              @click="handleForgotPassword"
            >
              忘记密码？
            </button>
          </div>

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
            登录
          </el-button>
        </el-form>
      </section>
    </section>

    <footer class="login-footer">
      © 2024 Chenxi 商城. 版权所有
    </footer>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { Lock, User } from '@element-plus/icons-vue';
import { useRouter } from 'vue-router';
import { loginByPassword } from '@/api/auth';
import { useAuthStore } from '@/stores/auth';
import loginBackground from '@/assets/login_bg.png';

const router = useRouter();
const authStore = useAuthStore();
const formRef = ref(null);
const submitting = ref(false);
const errorMessage = ref('');
const rememberMe = ref(false);

const form = reactive({
  username: '',
  password: '',
});

const pageStyle = {
  backgroundImage: `linear-gradient(180deg, rgba(5, 11, 18, 0.26), rgba(5, 11, 18, 0.22)), url(${loginBackground})`,
};

const rules = {
  username: [
    { required: true, message: '请输入管理员账号', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入登录密码', trigger: 'blur' },
  ],
};

function handleForgotPassword() {
  ElMessage.info('请联系超级管理员重置密码');
}

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
  --login-primary: #41c794;
  --login-primary-strong: #35ae80;
  --login-card-bg: rgba(27, 37, 50, 0.76);
  --login-card-border: rgba(255, 255, 255, 0.06);
  --login-input-bg: rgba(255, 255, 255, 0.04);
  --login-input-border: rgba(255, 255, 255, 0.06);
  --login-text-main: #f3f7fb;
  --login-text-soft: rgba(225, 234, 243, 0.7);
  --login-text-placeholder: rgba(192, 204, 218, 0.5);
  --login-shadow: 0 24px 60px rgba(0, 0, 0, 0.34);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 32px 20px 96px;
  overflow: hidden;
  background-position: center center;
  background-repeat: no-repeat;
  background-size: cover;
}

.login-shell {
  position: relative;
  z-index: 1;
  width: min(100%, 600px);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 32px 32px;
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 28px;
  background: linear-gradient(180deg, rgba(24, 35, 47, 0.72), rgba(10, 18, 28, 0.76));
  box-shadow:
    0 28px 80px rgba(0, 0, 0, 0.42),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(10px);
}

.login-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 30px;
  text-align: center;
}

.brand-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 18px;
}

.brand-mark__outer {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 9px;
  background: linear-gradient(180deg, #52e0ab 0%, #26a778 100%);
  transform: rotate(45deg);
  box-shadow: 0 8px 22px rgba(65, 199, 148, 0.26);
}

.brand-mark__inner {
  width: 11px;
  height: 11px;
  border: 2px solid #102432;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.18);
}

.login-title {
  margin: 0;
  color: var(--login-text-main);
  font-size: clamp(28px, 4vw, 34px);
  font-weight: 700;
  letter-spacing: 0.01em;
}

.login-subtitle {
  margin: 14px 0 0;
  color: var(--login-text-soft);
  font-size: 14px;
  line-height: 1.7;
}

.login-card {
  width: min(100%, 420px);
  padding: 24px 20px 20px;
}

.login-form :deep(.el-form-item) {
  margin-bottom: 18px;
}

.login-form :deep(.el-form-item.login-form-item) {
  display: flex;
  align-items: center;
  gap: 12px;
}

.login-form :deep(.el-form-item__label) {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 0;
  color: var(--login-text-soft);
  font-size: 13px;
  line-height: 1.5;
  white-space: nowrap;
}

.login-form :deep(.el-form-item__content) {
  min-width: 0;
}

.login-form :deep(.el-input__wrapper) {
  min-height: 44px;
  border-radius: 8px;
  background: var(--login-input-bg);
  box-shadow: 0 0 0 1px var(--login-input-border) inset;
}

.login-form :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px rgba(92, 114, 140, 0.28) inset;
}

.login-form :deep(.el-input__wrapper.is-focus) {
  box-shadow:
    0 0 0 1px rgba(65, 199, 148, 0.65) inset,
    0 0 0 4px rgba(65, 199, 148, 0.08);
}

.login-form :deep(.el-input__inner) {
  color: var(--login-text-main);
  font-size: 14px;
}

.login-form :deep(.el-input__inner::placeholder) {
  color: var(--login-text-placeholder);
}

.login-form :deep(.el-input__prefix),
.login-form :deep(.el-input__suffix),
.login-form :deep(.el-input__password) {
  color: rgba(226, 235, 244, 0.62);
}

.input-prefix-icon {
  font-size: 16px;
}

.login-tools {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 2px 0 18px;
}

.login-tools :deep(.el-checkbox) {
  color: var(--login-text-soft);
}

.login-tools :deep(.el-checkbox__label) {
  color: var(--login-text-soft);
  font-size: 13px;
}

.login-tools :deep(.el-checkbox__inner) {
  background: transparent;
  border-color: rgba(199, 212, 225, 0.45);
}

.login-tools :deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background: var(--login-primary);
  border-color: var(--login-primary);
}

.link-button {
  padding: 0;
  border: 0;
  background: transparent;
  color: rgba(86, 207, 159, 0.82);
  font-size: 13px;
  cursor: pointer;
}

.link-button:hover {
  color: #77e1b6;
}

.form-error {
  margin: 0 0 16px;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(191, 73, 73, 0.14);
  border: 1px solid rgba(220, 108, 108, 0.16);
  color: #ffb6b6;
  font-size: 13px;
  line-height: 1.6;
}

.submit-button {
  width: 100%;
}

.login-form :deep(.el-button--primary) {
  min-height: 46px;
  border-radius: 8px;
  --el-button-bg-color: var(--login-primary);
  --el-button-border-color: var(--login-primary);
  --el-button-hover-bg-color: #49d29e;
  --el-button-hover-border-color: #49d29e;
  --el-button-active-bg-color: var(--login-primary-strong);
  --el-button-active-border-color: var(--login-primary-strong);
  color: #0f2532;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.14em;
  box-shadow: 0 14px 28px rgba(49, 176, 127, 0.26);
}

.login-footer {
  position: absolute;
  z-index: 1;
  bottom: 18px;
  left: 50%;
  transform: translateX(-50%);
  color: rgba(219, 229, 239, 0.56);
  font-size: 12px;
  letter-spacing: 0.02em;
  text-align: center;
}

@media (max-width: 640px) {
  .login-page {
    padding: 24px 16px 80px;
  }

  .login-shell {
    width: 100%;
    padding: 28px 16px 24px;
    border-radius: 22px;
  }

  .login-card {
    width: 100%;
    padding: 22px 16px 18px;
  }

  .login-title {
    font-size: 26px;
  }

  .login-subtitle {
    font-size: 13px;
  }

  .login-tools {
    flex-wrap: wrap;
  }

  .login-form :deep(.el-form-item.login-form-item) {
    gap: 10px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .login-form :deep(.el-input__wrapper),
  .login-form :deep(.el-button--primary) {
    transition: none;
  }
}
</style>
