import { defineStore } from "pinia";
import axios from "axios";
import { useNotificationStore } from "@/stores/notification.js";

export const useAppStore = defineStore("app", {
  state: () => ({
    // base_url будет: http://127.0.0.1:8000/api
    base_url:
      (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000") +
      (import.meta.env.VITE_API_PREFIX || "/api"),

    isAuthenticated: sessionStorage.getItem("access") ? true : false,
    authType: sessionStorage.getItem("authType") || null, // 'staff' | 'client'

    access: sessionStorage.getItem("access") || null,
    refresh: sessionStorage.getItem("refresh") || null, // staff refresh

    // staff info
    staffRole: sessionStorage.getItem("staffRole") || null,
    staffUserId: sessionStorage.getItem("staffUserId")
      ? Number(sessionStorage.getItem("staffUserId"))
      : null,

    // client info
    clientId: sessionStorage.getItem("clientId")
      ? Number(sessionStorage.getItem("clientId"))
      : null,
    firstLoginRequired: sessionStorage.getItem("firstLoginRequired") === "1",

    me: null,
  }),

  actions: {
    notifyError(error, fallback = "Error") {
      const notificationStore = useNotificationStore();
      const msg =
        error?.response?.data?.detail ||
        error?.response?.data ||
        error?.message ||
        fallback;
      notificationStore.showNotification({ type: "error", message: msg });
    },

    setSession() {
      sessionStorage.setItem("authType", this.authType || "");
      sessionStorage.setItem("access", this.access || "");
      sessionStorage.setItem("refresh", this.refresh || "");

      sessionStorage.setItem("staffRole", this.staffRole || "");
      sessionStorage.setItem(
        "staffUserId",
        this.staffUserId ? String(this.staffUserId) : ""
      );

      sessionStorage.setItem(
        "clientId",
        this.clientId ? String(this.clientId) : ""
      );
      sessionStorage.setItem(
        "firstLoginRequired",
        this.firstLoginRequired ? "1" : "0"
      );

      this.isAuthenticated = !!this.access;
    },

    clearSession() {
      sessionStorage.removeItem("authType");
      sessionStorage.removeItem("access");
      sessionStorage.removeItem("refresh");

      sessionStorage.removeItem("staffRole");
      sessionStorage.removeItem("staffUserId");

      sessionStorage.removeItem("clientId");
      sessionStorage.removeItem("firstLoginRequired");
    },

    getAuthHeaders() {
      return this.access ? { Authorization: "Bearer " + this.access } : {};
    },

    logout() {
      this.isAuthenticated = false;
      this.authType = null;
      this.access = null;
      this.refresh = null;

      this.staffRole = null;
      this.staffUserId = null;

      this.clientId = null;
      this.firstLoginRequired = false;

      this.me = null;
      this.clearSession();
    },

    // ==========================
    // STAFF endpoints (подключены через /api/)
    // ==========================
    async staffLogin({ email, password }) {
      try {
        const response = await axios.post(this.base_url + "/auth/login/", {
          email,
          password,
        });

        this.authType = "staff";
        this.access = response.data.access;
        this.refresh = response.data.refresh;
        this.staffRole = response.data.role;
        this.staffUserId = response.data.user_id;

        // сброс client
        this.clientId = null;
        this.firstLoginRequired = false;

        this.setSession();
        await this.staffMe();

        return { ok: true, role: this.staffRole };
      } catch (error) {
        this.logout();
        this.notifyError(error, "Staff login error");
        return { ok: false };
      }
    },

    async staffRefresh() {
      if (!this.refresh) return { ok: false };
      try {
        const response = await axios.post(this.base_url + "/auth/refresh/", {
          refresh: this.refresh,
        });

        this.access = response.data.access;
        this.setSession();
        return { ok: true };
      } catch (error) {
        this.logout();
        this.notifyError(error, "Refresh error");
        return { ok: false };
      }
    },

    async staffMe() {
      try {
        const response = await axios.get(this.base_url + "/auth/me/", {
          headers: this.getAuthHeaders(),
        });
        this.me = response.data;
        return { ok: true, data: this.me };
      } catch (error) {
        if (error?.response?.status === 401 && this.authType === "staff") {
          const r = await this.staffRefresh();
          if (r.ok) return await this.staffMe();
        }
        this.notifyError(error, "Me error");
        return { ok: false };
      }
    },

    async staffChangePassword({ old_password, new_password }) {
      try {
        const response = await axios.post(
          this.base_url + "/auth/change-password/",
          { old_password, new_password },
          { headers: this.getAuthHeaders() }
        );
        return { ok: true, data: response.data };
      } catch (error) {
        this.notifyError(error, "Change password error");
        return { ok: false };
      }
    },

    // ==========================
    // CLIENT endpoints: /api/client/...
    // ==========================
    async clientLogin({ login_11, password }) {
      try {
        const digitsOnly = String(login_11).replace(/\D/g, "");
        const response = await axios.post(this.base_url + "/client/auth/login/", {
          login_11: digitsOnly,
          password,
        });

        this.authType = "client";
        this.access = response.data.access;
        this.refresh = null;

        this.clientId = response.data.client_id;
        this.firstLoginRequired = !!response.data.first_login_required;

        // сброс staff
        this.staffRole = null;
        this.staffUserId = null;

        this.setSession();
        await this.clientMe();

        return { ok: true, firstLoginRequired: this.firstLoginRequired };
      } catch (error) {
        this.logout();
        this.notifyError(error, "Client login error");
        return { ok: false };
      }
    },

    async clientMe() {
      try {
        const response = await axios.get(this.base_url + "/client/auth/me/", {
          headers: this.getAuthHeaders(),
        });
        this.me = response.data;
        return { ok: true, data: this.me };
      } catch (error) {
        this.notifyError(error, "Client me error");
        return { ok: false };
      }
    },

    async clientChangePasswordFirst({ new_password }) {
      try {
        const response = await axios.post(
          this.base_url + "/client/auth/change-password-first/",
          { new_password },
          { headers: this.getAuthHeaders() }
        );

        this.firstLoginRequired = false;
        this.setSession();

        return { ok: true, data: response.data };
      } catch (error) {
        this.notifyError(error, "Client change password error");
        return { ok: false };
      }
    },
  },
});
