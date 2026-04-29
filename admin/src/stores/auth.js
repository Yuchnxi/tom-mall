import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: '',
    adminInfo: null,
    menus: [],
    permissions: [],
  }),

  actions: {
    logout() {
      this.token = '';
      this.adminInfo = null;
      this.menus = [];
      this.permissions = [];
    },
  },
});
