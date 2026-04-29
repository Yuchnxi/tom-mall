import { defineStore } from 'pinia';

const TOKEN_KEY = 'tom-mall-admin-token';
const ADMIN_INFO_KEY = 'tom-mall-admin-info';
const MENUS_KEY = 'tom-mall-admin-menus';
const PERMISSIONS_KEY = 'tom-mall-admin-permissions';

function readStorage(key, fallback) {
  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: window.localStorage.getItem(TOKEN_KEY) || '',
    adminInfo: readStorage(ADMIN_INFO_KEY, null),
    menus: readStorage(MENUS_KEY, []),
    permissions: readStorage(PERMISSIONS_KEY, []),
  }),

  actions: {
    setAuth(payload) {
      this.token = payload.token || '';
      this.adminInfo = payload.adminInfo || null;
      this.menus = Array.isArray(payload.menus) ? payload.menus : [];
      this.permissions = Array.isArray(payload.permissions) ? payload.permissions : [];
      this.persist();
    },

    setProfile(payload) {
      this.adminInfo = payload.adminInfo || null;
      this.menus = Array.isArray(payload.menus) ? payload.menus : [];
      this.permissions = Array.isArray(payload.permissions) ? payload.permissions : [];
      this.persist();
    },

    persist() {
      window.localStorage.setItem(TOKEN_KEY, this.token || '');
      window.localStorage.setItem(ADMIN_INFO_KEY, JSON.stringify(this.adminInfo));
      window.localStorage.setItem(MENUS_KEY, JSON.stringify(this.menus));
      window.localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(this.permissions));
    },

    clearAuth() {
      this.token = '';
      this.adminInfo = null;
      this.menus = [];
      this.permissions = [];
      window.localStorage.removeItem(TOKEN_KEY);
      window.localStorage.removeItem(ADMIN_INFO_KEY);
      window.localStorage.removeItem(MENUS_KEY);
      window.localStorage.removeItem(PERMISSIONS_KEY);
    },

    logout() {
      this.clearAuth();
    },
  },
});
