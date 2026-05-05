import axios from 'axios';
import { ElMessage } from 'element-plus';
import { useAuthStore } from '@/stores/auth';
import pinia from '@/stores/pinia';

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:7001/api/v1',
  timeout: 10000,
});

request.interceptors.request.use(config => {
  const authStore = useAuthStore(pinia);

  if (authStore.token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${authStore.token}`;
  }

  return config;
});

request.interceptors.response.use(
  response => {
    const { code, message, data } = response.data || {};

    if (code === 0) {
      return data;
    }

    if (code === 401) {
      const authStore = useAuthStore(pinia);
      authStore.clearAuth();
      window.location.assign('/login');
      return Promise.reject(new Error(message || '请先登录'));
    }

    ElMessage.error(message || '请求失败');
    return Promise.reject(new Error(message || '请求失败'));
  },
  error => {
    const message = error.response?.data?.message || error.message || '网络异常，请稍后重试';
    ElMessage.error(message);
    return Promise.reject(error);
  }
);

export default request;
