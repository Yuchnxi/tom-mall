import { createRouter, createWebHistory } from 'vue-router';
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
    name: 'dashboard',
    component: DashboardView,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
