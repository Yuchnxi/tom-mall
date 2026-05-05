import { createRouter, createWebHistory } from 'vue-router';
import { getAdminInfo } from '@/api/auth';
import AppLayout from '@/components/layout/AppLayout.vue';
import { useAuthStore } from '@/stores/auth';
import pinia from '@/stores/pinia';
import DashboardView from '@/views/DashboardView.vue';
import LoginView from '@/views/LoginView.vue';

const routes = [
  {
    path: '/login',
    name: 'login',
    component: LoginView,
  },
  {
    path: '/',
    component: AppLayout,
    children: [
      {
        path: '',
        name: 'dashboard',
        component: DashboardView,
        meta: {
          title: '首页',
        },
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

let restorePromise = null;
let hasRestoredFromServer = false;

async function restoreAuthState() {
  const authStore = useAuthStore(pinia);

  if (!authStore.token) {
    hasRestoredFromServer = false;
    return false;
  }

  if (hasRestoredFromServer && authStore.adminInfo) {
    return true;
  }

  if (!restorePromise) {
    restorePromise = getAdminInfo()
      .then(data => {
        authStore.setProfile(data);
        hasRestoredFromServer = true;
        return true;
      })
      .catch(() => {
        authStore.clearAuth();
        hasRestoredFromServer = false;
        return false;
      })
      .finally(() => {
        restorePromise = null;
      });
  }

  return restorePromise;
}

router.beforeEach(async to => {
  const authStore = useAuthStore(pinia);
  const isLoginPage = to.path === '/login';

  if (!authStore.token) {
    return isLoginPage ? true : '/login';
  }

  const restored = await restoreAuthState();
  if (!restored) {
    return isLoginPage ? true : '/login';
  }

  if (isLoginPage) {
    return '/';
  }

  return true;
});

export default router;
