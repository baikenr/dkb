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

        // ==========================
    // CLIENT DOCUMENTS: /api/client/documents/
    // ==========================
    async clientGetDocument() {
      try {
        const response = await axios.get(this.base_url + "/client/documents/", {
          headers: this.getAuthHeaders(),
        });
        // бэк возвращает либо null, либо объект
        return { ok: true, data: response.data };
      } catch (error) {
        this.notifyError(error, "Client get document error");
        return { ok: false, data: null };
      }
    },

    async clientUploadDocument(file) {
      try {
        const form = new FormData();
        form.append("file", file);

        const response = await axios.post(this.base_url + "/client/documents/", form, {
          headers: {
            ...this.getAuthHeaders(),
            "Content-Type": "multipart/form-data",
          },
        });

        return { ok: true, data: response.data };
      } catch (error) {
        this.notifyError(error, "Client upload document error");
        return { ok: false };
      }
    },

    async clientUpdateDocument(file) {
      try {
        const form = new FormData();
        form.append("file", file);

        const response = await axios.patch(this.base_url + "/client/documents/", form, {
          headers: {
            ...this.getAuthHeaders(),
            "Content-Type": "multipart/form-data",
          },
        });

        return { ok: true, data: response.data };
      } catch (error) {
        this.notifyError(error, "Client update document error");
        return { ok: false };
      }
    },

    // ==========================
    // CLIENT CARD REQUEST: POST /api/client/auth/request-card/ (sets card_status = "pending")
    // ==========================
    async clientRequestCard() {
      try {
        // Send POST request to client endpoint to set card_status = "pending"
        const response = await axios.post(
          this.base_url + "/client/auth/request-card/",
          {},
          { headers: this.getAuthHeaders() }
        );
        return { ok: true, data: response.data };
      } catch (error) {
        if (error?.response?.status === 400 || error?.response?.status === 422) {
          return { ok: false, data: error.response.data };
        }
        this.notifyError(error, "Request card error");
        return { ok: false, data: error?.response?.data };
      }
    },

    // ==========================
    // STAFF CREATE CARD: POST /api/cards/ (creates actual card)
    // ==========================
    async staffCreateCard(cardData) {
      try {
        const response = await axios.post(
          this.base_url + "/cards/",
          cardData,
          { headers: this.getAuthHeaders() }
        );
        return { ok: true, data: response.data };
      } catch (error) {
        if (error?.response?.status === 400 || error?.response?.status === 422) {
          return { ok: false, data: error.response.data };
        }
        this.notifyError(error, "Create card error");
        return { ok: false, data: error?.response?.data };
      }
    },

    // ==========================
    // STAFF USERS: /api/users/
    // ==========================
    async staffUsersList(params = {}) {
      try {
        const response = await axios.get(this.base_url + "/users/", {
          headers: this.getAuthHeaders(),
          params,
        });
        return { ok: true, data: response.data };
      } catch (error) {
        this.notifyError(error, "Get users error");
        return { ok: false };
      }
    },

    async staffUserGet(id) {
      try {
        const response = await axios.get(this.base_url + `/users/${id}/`, {
          headers: this.getAuthHeaders(),
        });
        return { ok: true, data: response.data };
      } catch (error) {
        this.notifyError(error, "Get user error");
        return { ok: false };
      }
    },

    async staffUserCreate(userData) {
      try {
        const response = await axios.post(
          this.base_url + "/users/",
          userData,
          { headers: this.getAuthHeaders() }
        );
        return { ok: true, data: response.data };
      } catch (error) {
        // Don't show notification for validation errors, return them to component
        if (error?.response?.status === 400 || error?.response?.status === 422) {
          return { ok: false, data: error.response.data };
        }
        this.notifyError(error, "Create user error");
        return { ok: false, data: error?.response?.data };
      }
    },

    async staffUserUpdate(id, userData) {
      try {
        const response = await axios.patch(
          this.base_url + `/users/${id}/`,
          userData,
          { headers: this.getAuthHeaders() }
        );
        return { ok: true, data: response.data };
      } catch (error) {
        // Don't show notification for validation errors, return them to component
        if (error?.response?.status === 400 || error?.response?.status === 422) {
          return { ok: false, data: error.response.data };
        }
        this.notifyError(error, "Update user error");
        return { ok: false, data: error?.response?.data };
      }
    },

    async staffUserDelete(id) {
      try {
        await axios.delete(this.base_url + `/users/${id}/`, {
          headers: this.getAuthHeaders(),
        });
        return { ok: true };
      } catch (error) {
        this.notifyError(error, "Delete user error");
        return { ok: false };
      }
    },

    // ==========================
    // STAFF CLIENTS: /api/staff/staff/clients/
    // ==========================
    async staffClientsList(params = {}) {
      try {
        const response = await axios.get(this.base_url + "/staff/staff/clients/", {
          headers: this.getAuthHeaders(),
          params,
        });
        return { ok: true, data: response.data };
      } catch (error) {
        this.notifyError(error, "Get clients error");
        return { ok: false };
      }
    },

    async staffClientGet(id) {
      try {
        const response = await axios.get(this.base_url + `/staff/staff/clients/${id}/`, {
          headers: this.getAuthHeaders(),
        });
        return { ok: true, data: response.data };
      } catch (error) {
        this.notifyError(error, "Get client error");
        return { ok: false };
      }
    },

    async staffClientCreate(clientData) {
      try {
        const response = await axios.post(
          this.base_url + "/staff/staff/clients/",
          clientData,
          { headers: this.getAuthHeaders() }
        );
        return { ok: true, data: response.data };
      } catch (error) {
        // Don't show notification for validation errors, return them to component
        if (error?.response?.status === 400 || error?.response?.status === 422) {
          return { ok: false, data: error.response.data };
        }
        this.notifyError(error, "Create client error");
        return { ok: false, data: error?.response?.data };
      }
    },

    async staffClientUpdate(id, clientData) {
      try {
        const response = await axios.patch(
          this.base_url + `/staff/staff/clients/${id}/`,
          clientData,
          { headers: this.getAuthHeaders() }
        );
        return { ok: true, data: response.data };
      } catch (error) {
        // Don't show notification for validation errors, return them to component
        if (error?.response?.status === 400 || error?.response?.status === 422) {
          return { ok: false, data: error.response.data };
        }
        this.notifyError(error, "Update client error");
        return { ok: false, data: error?.response?.data };
      }
    },

    async staffClientDelete(id) {
      try {
        await axios.delete(this.base_url + `/staff/staff/clients/${id}/`, {
          headers: this.getAuthHeaders(),
        });
      return { ok: true };
      } catch (error) {
        this.notifyError(error, "Delete client error");
        return { ok: false };
      }
    },

    async staffClientAssignManager(clientId, managerId) {
      try {
        const response = await axios.post(
          this.base_url + `/staff/staff/clients/${clientId}/assign-manager/`,
          { assigned_manager_id: managerId },
          { headers: this.getAuthHeaders() }
        );
        return { ok: true, data: response.data };
      } catch (error) {
        this.notifyError(error, "Assign manager error");
        return { ok: false, data: error?.response?.data };
      }
    },

    async staffClientSetPassword(clientId, newPassword) {
      try {
        const response = await axios.post(
          this.base_url + `/client/staff/clients/${clientId}/password/set/`,
          { new_password: newPassword },
          { headers: this.getAuthHeaders() }
        );
        return { ok: true, data: response.data };
      } catch (error) {
        // Don't show notification for validation errors, return them to component
        if (error?.response?.status === 400 || error?.response?.status === 422) {
          return { ok: false, data: error.response.data };
        }
        this.notifyError(error, "Set password error");
        return { ok: false, data: error?.response?.data };
      }
    },

    // ==========================
    // STAFF DOCUMENTS: /api/staff/documents/
    // ==========================
    async staffDocumentsList(params = {}) {
      try {
        const response = await axios.get(this.base_url + "/staff/documents/", {
          headers: this.getAuthHeaders(),
          params,
        });
        return { ok: true, data: response.data };
      } catch (error) {
        this.notifyError(error, "Get documents error");
        return { ok: false };
      }
    },

    async staffDocumentReview(docId, reviewData) {
      try {
        const response = await axios.patch(
          this.base_url + `/staff/documents/${docId}/review/`,
          reviewData,
          { headers: this.getAuthHeaders() }
        );
        return { ok: true, data: response.data };
      } catch (error) {
        this.notifyError(error, "Review document error");
        return { ok: false, data: error?.response?.data };
      }
    },

    // ==========================
    // CLIENT FAQ: /api/support/faq-notifications/
    // ==========================
    async clientSendFAQ(title, message) {
      try {
        const response = await axios.post(
          this.base_url + "/support/faq-notifications/",
          { title, message },
          { headers: this.getAuthHeaders() }
        );
        return { ok: true, data: response.data };
      } catch (error) {
        this.notifyError(error, "Send FAQ error");
        return { ok: false, data: error?.response?.data };
      }
    },

    // ==========================
    // STAFF NOTIFICATIONS: /api/stm/notification/
    // ==========================
    async staffNotificationsList(params = {}) {
      try {
        const response = await axios.get(this.base_url + "/stm/notification/", {
          headers: this.getAuthHeaders(),
          params,
        });
        return { ok: true, data: response.data };
      } catch (error) {
        this.notifyError(error, "Get notifications list error");
        return { ok: false };
      }
    },

    async staffNotificationGet(id) {
      try {
        const response = await axios.get(this.base_url + `/stm/notification/${id}/`, {
          headers: this.getAuthHeaders(),
        });
        return { ok: true, data: response.data };
      } catch (error) {
        this.notifyError(error, "Get notification error");
        return { ok: false, data: error?.response?.data };
      }
    },

    async staffNotificationUpdate(id, data) {
      try {
        const response = await axios.patch(
          this.base_url + `/stm/notification/${id}/`,
          data,
          { headers: this.getAuthHeaders() }
        );
        return { ok: true, data: response.data };
      } catch (error) {
        this.notifyError(error, "Update notification error");
        return { ok: false, data: error?.response?.data };
      }
    },

    async staffNotificationDelete(id) {
      try {
        await axios.delete(this.base_url + `/stm/notification/${id}/`, {
          headers: this.getAuthHeaders(),
        });
        return { ok: true };
      } catch (error) {
        this.notifyError(error, "Delete notification error");
        return { ok: false };
      }
    },

    async staffNotificationCount() {
      try {
        const response = await axios.get(this.base_url + "/stm/notification/count/", {
          headers: this.getAuthHeaders(),
        });
        return { ok: true, data: response.data };
      } catch (error) {
        this.notifyError(error, "Get notification count error");
        return { ok: false };
      }
    },

    async staffNotificationShort(count = 3) {
      try {
        const response = await axios.get(this.base_url + "/stm/notification/short/", {
          headers: this.getAuthHeaders(),
          params: { count },
        });
        return { ok: true, data: response.data };
      } catch (error) {
        this.notifyError(error, "Get short notifications error");
        return { ok: false };
      }
    },

    // Legacy methods for backward compatibility
    async staffFAQList(params = {}) {
      return this.staffNotificationsList({ ...params, type_notification: 'faq' });
    },

    async staffFAQMarkRead(notificationId) {
      return this.staffNotificationUpdate(notificationId, { is_read: true });
    },
  },
});
