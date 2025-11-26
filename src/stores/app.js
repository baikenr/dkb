import { defineStore } from 'pinia';
import axios from "axios";
import { useNotificationStore } from '@/stores/notification.js';

export const useAppStore = defineStore('app', {
  state: () => ({
    base_url: import.meta.env.VITE_API_BASE_URL,
    isAuthenticated: false,
    token: sessionStorage.getItem("token") || null,
  }),
  actions: {
    async loginUser({ username, password }) {
      try {
        const response = await axios.post(this.base_url + '/api-token-auth/', {
          username,
          password,
        });

        this.token = response.data.token;
        sessionStorage.setItem("token", this.token);
        this.isAuthenticated = true;
      } catch (error) {
        const notificationStore = useNotificationStore();
        notificationStore.showNotification({ type: 'error', message: error.response?.data });
      }
    },

    async getData(endpoint, needsToken = true) {
      try {
        const config = {};
        if (needsToken) {
          config.headers = {
            Authorization: 'Token ' + this.token,
          };
        }

        return await axios.get(this.base_url + endpoint, config);
      } catch (error) {
        const notificationStore = useNotificationStore();
        notificationStore.showNotification({ type: 'error', message: error.response?.data });
      }
    },
  },
});


