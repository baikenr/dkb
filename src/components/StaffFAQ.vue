<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useAppStore } from "@/stores/app.js";
import { useNotificationStore } from "@/stores/notification.js";

const { t } = useI18n();
const appStore = useAppStore();
const notificationStore = useNotificationStore();

// =======================
// NOTIFICATIONS (твое)
// =======================
const loading = ref(false);
const notificationsList = ref<any[]>([]);
const totalCount = ref(0);
const currentPage = ref(1);
const pageSize = ref(20);
const selectedNotification = ref<any>(null);
const showDetailModal = ref(false);
const searchQuery = ref("");
const filterStatus = ref<"all" | "read" | "unread">("all");
const filterType = ref<"all" | "faq" | "request">("all");
const unreadCount = ref(0);

const replyTitle = ref("");
const replyMessage = ref("");
const replyLoading = ref(false);
const replyError = ref("");
const replySuccess = ref(false);

const getReceiverClientId = (n: any) => {
  return (
    n?.receiver_client_id ??
    n?.receiver_client?.id ??
    n?.receiver_client ??
    n?.sender_client_id ??
    n?.sender_client?.id ??
    n?.sender_client ??
    n?.sender_user?.id ??
    n?.sender_user_id ??
    n?.client_id ??
    null
  );
};

const resetReplyForm = () => {
  replyTitle.value = "";
  replyMessage.value = "";
  replyLoading.value = false;
  replyError.value = "";
  replySuccess.value = false;
};

const sendReply = async () => {
  replyError.value = "";
  replySuccess.value = false;

  const n = selectedNotification.value;
  const receiverClientId = getReceiverClientId(n);

  if (!receiverClientId) {
    replyError.value = t("staffNotifications.reply.errors.noReceiver");
    return;
  }

  const title = replyTitle.value.trim() || (n?.title ? `Re: ${n.title}` : "Reply");
  const message = replyMessage.value.trim();

  if (!message) {
    replyError.value = t("staffNotifications.reply.errors.messageRequired");
    return;
  }

  replyLoading.value = true;
  try {
    const res = await appStore.staffSendMessageToClient({
      title,
      message,
      receiver_client: Number(receiverClientId),
    });

    if (res.ok) {
      replySuccess.value = true;
      replyTitle.value = "";
      replyMessage.value = "";

      await loadNotifications(currentPage.value);
      await loadUnreadCount();

      setTimeout(() => (replySuccess.value = false), 2500);
    } else {
      replyError.value = res.data?.detail || JSON.stringify(res.data);
    }
  } catch (e) {
    replyError.value = t("staffNotifications.reply.errors.failed");
  } finally {
    replyLoading.value = false;
  }
};

const loadNotifications = async (page = 1) => {
  loading.value = true;
  try {
    const params: any = {
      page,
      page_size: pageSize.value,
    };

    if (filterType.value !== "all") {
      params.type_notification = filterType.value;
    }

    const result = await appStore.staffNotificationsList(params);
    if (result.ok && result.data) {
      notificationsList.value = result.data.results || result.data || [];
      totalCount.value = result.data.count || notificationsList.value.length;
      currentPage.value = page;
    }
  } catch (error) {
    console.error("Error loading notifications:", error);
  } finally {
    loading.value = false;
  }
};

const loadUnreadCount = async () => {
  try {
    const result = await appStore.staffNotificationCount();
    if (result.ok && result.data) {
      unreadCount.value = result.data.count || 0;
    }
  } catch (error) {
    console.error("Error loading unread count:", error);
  }
};

const openDetailModal = (notification: any) => {
  selectedNotification.value = notification;
  showDetailModal.value = true;
  resetReplyForm();
  if (!notification.is_read) {
    markAsRead(notification.id);
  }
};

const closeDetailModal = () => {
  showDetailModal.value = false;
  selectedNotification.value = null;
};

const markAsRead = async (notificationId: number) => {
  try {
    await appStore.staffNotificationUpdate(notificationId, { is_read: true });
    await loadNotifications(currentPage.value);
    await loadUnreadCount();
  } catch (error) {
    console.error("Error marking as read:", error);
  }
};

const markAsUnread = async (notificationId: number) => {
  try {
    await appStore.staffNotificationUpdate(notificationId, { is_read: false });
    await loadNotifications(currentPage.value);
    await loadUnreadCount();
  } catch (error) {
    console.error("Error marking as unread:", error);
  }
};

const deleteNotification = async (notificationId: number) => {
  if (!confirm(t("staffNotifications.deleteConfirm"))) return;

  try {
    const result = await appStore.staffNotificationDelete(notificationId);
    if (result.ok) {
      notificationStore.showNotification({
        type: "success",
        message: t("staffNotifications.deleteSuccess"),
      });
      await loadNotifications(currentPage.value);
      await loadUnreadCount();
      if (selectedNotification.value?.id === notificationId) {
        closeDetailModal();
      }
    }
  } catch (error) {
    console.error("Error deleting notification:", error);
  }
};

const filteredNotifications = computed(() => {
  let filtered = notificationsList.value;

  if (filterStatus.value === "read") {
    filtered = filtered.filter((n) => n.is_read);
  } else if (filterStatus.value === "unread") {
    filtered = filtered.filter((n) => !n.is_read);
  }

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(
      (n) =>
        n.title?.toLowerCase().includes(query) ||
        n.message?.toLowerCase().includes(query) ||
        (n.sender_user &&
          (`${n.sender_user.first_name || ""} ${n.sender_user.last_name || ""}`.toLowerCase().includes(query) ||
            n.sender_user.email?.toLowerCase().includes(query) ||
            n.sender_user.phone?.toLowerCase().includes(query))) ||
        (n.sender_user_id && String(n.sender_user_id).includes(query))
    );
  }

  return filtered;
});

const totalPages = computed(() => Math.ceil(totalCount.value / pageSize.value));

const formatDate = (dateString: string) => {
  if (!dateString) return "—";
  if (typeof dateString === "string" && dateString.match(/^\d{2}\.\d{2}\.\d{4} \d{2}:\d{2}$/)) {
    return dateString;
  }
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    return dateString;
  }
};

const getNotificationTypeLabel = (type: string) => {
  if (type === "faq") return t("staffNotifications.types.faq");
  if (type === "request") return t("staffNotifications.types.request");
  return type;
};

const getNotificationTypeBadgeClass = (type: string) => {
  if (type === "faq") return "bg-[#006AC7] text-white";
  if (type === "request") return "bg-[#F79E1B] text-white";
  return "bg-gray-100 text-gray-800";
};

const applyFilters = () => {
  loadNotifications(1);
};

// =======================
// CLIENTS (НОВОЕ: примитивный UI)
// =======================
type Client = {
  id: number;
  first_name?: string;
  last_name?: string;
  phone?: string;
  email?: string;
};

const clientsLoading = ref(false);
const clients = ref<Client[]>([]);
const clientSearch = ref("");

const showClientModal = ref(false);
const selectedClient = ref<Client | null>(null);

const clientName = (c: Client) => {
  const n = `${c.first_name || ""} ${c.last_name || ""}`.trim();
  return n || `ID: ${c.id}`;
};

const loadClients = async () => {
  clientsLoading.value = true;
  try {
    // у тебя метод уже есть ✅
    const res = await appStore.staffClientsList();
    if (res.ok) {
      clients.value = Array.isArray(res.data) ? res.data : (res.data?.results || []);
    }
  } catch (e) {
    console.error("Error loading clients:", e);
  } finally {
    clientsLoading.value = false;
  }
};

const filteredClients = computed(() => {
  const q = clientSearch.value.trim().toLowerCase();
  if (!q) return clients.value;

  return clients.value.filter((c) => {
    return (
      String(c.id).includes(q) ||
      clientName(c).toLowerCase().includes(q) ||
      (c.phone || "").toLowerCase().includes(q) ||
      (c.email || "").toLowerCase().includes(q)
    );
  });
});

const openClientModal = (c: Client) => {
  selectedClient.value = c;
  showClientModal.value = true;

  // отдельная форма для сообщений клиенту (не мешаем reply по уведомлениям)
  clientMsgTitle.value = "";
  clientMsgText.value = "";
  clientMsgError.value = "";
  clientMsgSuccess.value = false;
};

const closeClientModal = () => {
  showClientModal.value = false;
  selectedClient.value = null;
};

// отдельные поля, чтобы не мешать reply в модалке уведомлений
const clientMsgTitle = ref("");
const clientMsgText = ref("");
const clientMsgLoading = ref(false);
const clientMsgError = ref("");
const clientMsgSuccess = ref(false);

const sendMessageToClient = async () => {
  clientMsgError.value = "";
  clientMsgSuccess.value = false;

  if (!selectedClient.value?.id) {
    clientMsgError.value = t("staffClientMessages.errors.noClient");
    return;
  }

  const text = clientMsgText.value.trim();
  if (!text) {
    clientMsgError.value = t("staffClientMessages.errors.messageRequired");
    return;
  }

  const title = clientMsgTitle.value.trim() || "Сообщение";

  clientMsgLoading.value = true;
  try {
    const res = await appStore.staffSendMessageToClient({
      title,
      message: text,
      receiver_client: Number(selectedClient.value.id),
    });

    if (res.ok) {
      clientMsgSuccess.value = true;
      clientMsgTitle.value = "";
      clientMsgText.value = "";

      // если хочешь, можно обновить уведомления после отправки
      await loadNotifications(currentPage.value);
      await loadUnreadCount();

      setTimeout(() => (clientMsgSuccess.value = false), 2500);
    } else {
      clientMsgError.value = res.data?.detail || JSON.stringify(res.data);
    }
  } catch (e) {
    clientMsgError.value = t("staffClientMessages.errors.sendFailed");
  } finally {
    clientMsgLoading.value = false;
  }
};

onMounted(async () => {
  await loadNotifications(1);
  await loadUnreadCount();
  await loadClients();
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="bg-white rounded-2xl border border-black/10 shadow-sm p-8">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-[32px] font-bold text-[#0B2A3C] mb-2">{{ t("staffNotifications.title") }}</h2>
          <p class="text-[16px] text-[#6B7E8B]">
            {{ t("staffNotifications.subtitle") }}
          </p>
        </div>
        <div v-if="unreadCount > 0" class="px-4 py-2 bg-[#006AC7] text-white rounded-xl font-semibold">
          {{ t("staffNotifications.unreadCount", { count: unreadCount }) }}
        </div>
      </div>
    </div>

    <!-- ✅ Мои клиенты (простая секция) -->
    <div class="bg-white rounded-2xl border border-black/10 shadow-sm p-6">
      <div class="flex items-center justify-between mb-4">
        <div>
          <div class="text-[20px] font-bold text-[#0B2A3C]">
            {{ t("staffClientMessages.title") }}
          </div>
          <div class="text-sm text-[#6B7E8B]">
            {{ t("staffClientMessages.subtitle") }}
          </div>
        </div>

        <button
          @click="loadClients"
          class="px-4 py-2 rounded-xl border border-black/10 text-[#0B2A3C] font-semibold hover:bg-black/5 transition"
        >
          {{ t("staffClientMessages.refresh") }}
        </button>
      </div>

      <input
        v-model="clientSearch"
        type="text"
        class="w-full px-4 py-2.5 rounded-xl border border-black/10 bg-white text-[#0B2A3C]
              focus:outline-none focus:ring-2 focus:ring-[#006AC7]/20 focus:border-[#006AC7]"
        :placeholder="t('staffClientMessages.searchPlaceholder')"
      />

      <div v-if="clientsLoading" class="text-sm text-[#6B7E8B] mt-4">
        {{ t("staffClientMessages.loading") }}
      </div>
      <div v-else-if="filteredClients.length === 0" class="text-sm text-[#6B7E8B] mt-4">
        {{ t("staffClientMessages.empty") }}
      </div>

      <div v-else class="mt-4 space-y-2">
        <div
          v-for="c in filteredClients"
          :key="c.id"
          class="flex items-center justify-between p-4 rounded-xl border border-black/10 hover:bg-black/5 transition"
        >
          <div>
            <div class="font-semibold text-[#0B2A3C]">{{ clientName(c) }}</div>
            <div class="text-xs text-[#6B7E8B]">
              {{ c.phone || t("common.dash") }}
              <span v-if="c.email"> • {{ c.email }}</span>
            </div>
          </div>

          <button
            @click="openClientModal(c)"
            class="px-4 py-2 rounded-xl bg-[#006AC7] text-white font-semibold hover:bg-[#0055A3] transition"
          >
            {{ t("staffClientMessages.write") }}
          </button>
        </div>
      </div>
    </div>

    <!-- Filters and Search -->
    <div class="bg-white rounded-2xl border border-black/10 shadow-sm p-6">
      <div class="flex flex-col gap-4">
        <div class="flex-1">
          <input
            v-model="searchQuery"
            type="text"
            class="w-full px-4 py-2.5 rounded-xl border border-black/10 bg-white text-[#0B2A3C] focus:outline-none focus:ring-2 focus:ring-[#006AC7]/20 focus:border-[#006AC7]"
            :placeholder="t('staffNotifications.searchPlaceholder')"
          />
        </div>

        <div class="flex flex-wrap items-center gap-4">
          <div class="flex items-center gap-2">
            <span class="text-sm text-[#6B7E8B] font-semibold">{{ t("staffNotifications.filters.type") }}:</span>
            <button
              @click="filterType = 'all'; applyFilters()"
              class="px-4 py-2.5 rounded-xl font-semibold text-sm transition"
              :class="filterType === 'all' ? 'bg-[#006AC7] text-white' : 'bg-white border border-black/10 text-[#0B2A3C] hover:bg-black/5'"
            >
              {{ t("staffNotifications.filters.allTypes") }}
            </button>
            <button
              @click="filterType = 'faq'; applyFilters()"
              class="px-4 py-2.5 rounded-xl font-semibold text-sm transition"
              :class="filterType === 'faq' ? 'bg-[#006AC7] text-white' : 'bg-white border border-black/10 text-[#0B2A3C] hover:bg-black/5'"
            >
              {{ t("staffNotifications.filters.faq") }}
            </button>
            <button
              @click="filterType = 'request'; applyFilters()"
              class="px-4 py-2.5 rounded-xl font-semibold text-sm transition"
              :class="filterType === 'request' ? 'bg-[#006AC7] text-white' : 'bg-white border border-black/10 text-[#0B2A3C] hover:bg-black/5'"
            >
              {{ t("staffNotifications.filters.request") }}
            </button>
          </div>

          <div class="flex items-center gap-2">
            <span class="text-sm text-[#6B7E8B] font-semibold">{{ t("staffNotifications.filters.status") }}:</span>
            <button
              @click="filterStatus = 'all'"
              class="px-4 py-2.5 rounded-xl font-semibold text-sm transition"
              :class="filterStatus === 'all' ? 'bg-[#006AC7] text-white' : 'bg-white border border-black/10 text-[#0B2A3C] hover:bg-black/5'"
            >
              {{ t("staffNotifications.filters.all") }}
            </button>
            <button
              @click="filterStatus = 'unread'"
              class="px-4 py-2.5 rounded-xl font-semibold text-sm transition"
              :class="filterStatus === 'unread' ? 'bg-[#006AC7] text-white' : 'bg-white border border-black/10 text-[#0B2A3C] hover:bg-black/5'"
            >
              {{ t("staffNotifications.filters.unread") }}
            </button>
            <button
              @click="filterStatus = 'read'"
              class="px-4 py-2.5 rounded-xl font-semibold text-sm transition"
              :class="filterStatus === 'read' ? 'bg-[#006AC7] text-white' : 'bg-white border border-black/10 text-[#0B2A3C] hover:bg-black/5'"
            >
              {{ t("staffNotifications.filters.read") }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Notifications List -->
    <div v-if="loading" class="bg-white rounded-2xl border border-black/10 shadow-sm p-8 text-center">
      <div class="text-[#6B7E8B]">{{ t("staffNotifications.loading") }}</div>
    </div>

    <div v-else-if="filteredNotifications.length === 0" class="bg-white rounded-2xl border border-black/10 shadow-sm p-8 text-center">
      <div class="text-[#6B7E8B]">{{ t("staffNotifications.noNotifications") }}</div>
    </div>

    <div v-else class="space-y-4">
      <div
        v-for="notification in filteredNotifications"
        :key="notification.id"
        class="bg-white rounded-2xl border border-black/10 shadow-sm p-6 hover:border-[#006AC7]/30 hover:shadow-md transition"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1 cursor-pointer" @click="openDetailModal(notification)">
            <div class="flex items-center gap-3 mb-2">
              <h3 class="text-[18px] font-bold text-[#0B2A3C]">
                {{ notification.title || t("staffNotifications.noTitle") }}
              </h3>
              <span class="px-2 py-1 rounded-full text-xs font-semibold" :class="getNotificationTypeBadgeClass(notification.type_notification)">
                {{ getNotificationTypeLabel(notification.type_notification) }}
              </span>
              <span v-if="!notification.is_read" class="px-2 py-1 rounded-full text-xs font-semibold bg-[#006AC7] text-white">
                {{ t("staffNotifications.new") }}
              </span>
            </div>
            <p class="text-sm text-[#6B7E8B] mb-3 line-clamp-2">{{ notification.message }}</p>
            <div class="flex items-center gap-4 text-xs text-[#6B7E8B]">
              <span>
                {{ t("staffNotifications.from") }}:
                <span v-if="notification.sender_user">
                  {{ `${notification.sender_user.first_name || ""} ${notification.sender_user.last_name || ""}`.trim()
                    || notification.sender_user.email
                    || `${t("common.id")}: ${notification.sender_user.id || notification.sender_user}` }}
                </span>
                <span v-else-if="notification.sender_user_id">
                  {{ t("common.id") }}: {{ notification.sender_user_id }}
                </span>
                <span v-else>—</span>
              </span>
              <span>{{ formatDate(notification.created_at) }}</span>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button
              @click.stop="notification.is_read ? markAsUnread(notification.id) : markAsRead(notification.id)"
              class="p-2 rounded-lg hover:bg-black/5 transition"
              :title="notification.is_read ? t('staffNotifications.markUnread') : t('staffNotifications.markRead')"
            >
              <svg v-if="notification.is_read" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-[#6B7E8B]">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-[#006AC7]">
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </button>

            <button
              @click.stop="deleteNotification(notification.id)"
              class="p-2 rounded-lg hover:bg-[#FFE0E0] transition"
              :title="t('staffNotifications.delete')"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-[#B42318]">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>

            <button @click.stop="openDetailModal(notification)" class="p-2 rounded-lg hover:bg-black/5 transition">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-[#6B7E8B]">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Detail Modal (уведомление) -->
    <div
      v-if="showDetailModal && selectedNotification"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      @click.self="closeDetailModal"
    >
      <div class="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div class="p-6 border-b border-black/10 flex-shrink-0">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <h2 class="text-[24px] font-bold text-[#0B2A3C]">
                {{ selectedNotification.title || t("staffNotifications.noTitle") }}
              </h2>
              <span class="px-3 py-1 rounded-full text-xs font-semibold" :class="getNotificationTypeBadgeClass(selectedNotification.type_notification)">
                {{ getNotificationTypeLabel(selectedNotification.type_notification) }}
              </span>
            </div>
            <button @click="closeDetailModal" class="text-[#6B7E8B] hover:text-[#0B2A3C] transition">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div class="p-6 overflow-y-auto flex-1">
          <div class="space-y-4">
            <div class="bg-[#F7FBFF] rounded-xl p-4">
              <div class="text-sm font-semibold text-[#0B2A3C] mb-2">{{ t("staffNotifications.detail.from") }}</div>
              <div class="text-sm text-[#6B7E8B]">
                <div v-if="selectedNotification.sender_user">
                  <div v-if="selectedNotification.sender_user.first_name || selectedNotification.sender_user.last_name">
                    {{ `${selectedNotification.sender_user.first_name || ''} ${selectedNotification.sender_user.last_name || ''}`.trim() }}
                  </div>
                  <div v-else-if="selectedNotification.sender_user.email">
                    {{ selectedNotification.sender_user.email }}
                  </div>
                  <div v-else>
                    {{ t("common.id") }}: {{ selectedNotification.sender_user.id || selectedNotification.sender_user_id }}
                  </div>
                  <div v-if="selectedNotification.sender_user.email" class="mt-1">
                    {{ t("common.email") }}: {{ selectedNotification.sender_user.email }}
                  </div>
                  <div v-if="selectedNotification.sender_user.phone" class="mt-1">
                    {{ t("common.phone") }}: {{ selectedNotification.sender_user.phone }}
                  </div>
                </div>
                <div v-else-if="selectedNotification.sender_user_id">
                  {{ t("common.clientId") }}: {{ selectedNotification.sender_user_id }}
                </div>
                <div v-else>—</div>
              </div>
            </div>

            <div class="text-sm text-[#6B7E8B]">
              <span class="font-semibold">{{ t("staffNotifications.detail.date") }}:</span>
              {{ formatDate(selectedNotification.created_at) }}
            </div>

            <div>
              <div class="text-sm font-semibold text-[#0B2A3C] mb-2">{{ t("staffNotifications.detail.message") }}</div>
              <div class="text-[15px] text-[#0B2A3C] whitespace-pre-wrap bg-[#F7FBFF] rounded-xl p-4">
                {{ selectedNotification.message }}
              </div>
            </div>

            <div class="pt-4 border-t border-black/10">
              <div class="text-sm font-semibold text-[#0B2A3C] mb-2">{{ t("staffNotifications.reply.title") }}</div>

              <div v-if="replySuccess" class="mb-3 bg-[#DDF7E9] border border-[#0E6B3B]/20 rounded-xl p-3 text-[#0E6B3B] text-sm">
                {{ t("staffNotifications.reply.success") }}
              </div>

              <div v-if="replyError" class="mb-3 bg-[#FFE0E0] border border-[#B42318]/20 rounded-xl p-3 text-[#B42318] text-sm">
                {{ replyError }}
              </div>

              <input
                v-model="replyTitle"
                type="text"
                class="w-full mb-3 px-4 py-2.5 rounded-xl border border-black/10 bg-white text-[#0B2A3C]
                      focus:outline-none focus:ring-2 focus:ring-[#006AC7]/20 focus:border-[#006AC7]"
                :placeholder="t('staffNotifications.reply.titlePlaceholder')"
              />

              <textarea
                v-model="replyMessage"
                rows="4"
                class="w-full px-4 py-2.5 rounded-xl border border-black/10 bg-white text-[#0B2A3C]
                      focus:outline-none focus:ring-2 focus:ring-[#006AC7]/20 focus:border-[#006AC7] resize-none"
                :placeholder="t('staffNotifications.reply.messagePlaceholder')"
              ></textarea>

              <div class="flex justify-end mt-3">
                <button
                  @click="sendReply"
                  :disabled="replyLoading"
                  class="px-6 py-2.5 rounded-xl bg-[#006AC7] text-white font-semibold hover:bg-[#0055A3] transition
                        disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {{ replyLoading ? t("staffNotifications.reply.sending") : t("staffNotifications.reply.send") }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ✅ Client Message Modal (самый простой) -->
    <div
      v-if="showClientModal && selectedClient"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      @click.self="closeClientModal"
    >
      <div class="bg-white rounded-2xl shadow-xl max-w-lg w-full">
        <div class="p-6 border-b border-black/10 flex items-center justify-between">
          <div>
            <div class="text-[18px] font-bold text-[#0B2A3C]">
              {{ t("staffClientMessages.modal.title") }}
            </div>
            <div class="text-sm text-[#6B7E8B]">
              {{ clientName(selectedClient) }}
              <span v-if="selectedClient.phone">• {{ selectedClient.phone }}</span>
            </div>
          </div>

          <button
            @click="closeClientModal"
            class="text-[#6B7E8B] hover:text-[#0B2A3C] transition"
            :title="t('staffClientMessages.modal.close')"
          >
            ✕
          </button>
        </div>

        <div class="p-6 space-y-3">
          <div
            v-if="clientMsgSuccess"
            class="bg-[#DDF7E9] border border-[#0E6B3B]/20 rounded-xl p-3 text-[#0E6B3B] text-sm"
          >
            {{ t("staffClientMessages.modal.sent") }}
          </div>

          <div
            v-if="clientMsgError"
            class="bg-[#FFE0E0] border border-[#B42318]/20 rounded-xl p-3 text-[#B42318] text-sm"
          >
            {{ clientMsgError }}
          </div>

          <input
            v-model="clientMsgTitle"
            type="text"
            class="w-full px-4 py-2.5 rounded-xl border border-black/10"
            :placeholder="t('staffClientMessages.modal.topicPlaceholder')"
          />

          <textarea
            v-model="clientMsgText"
            rows="5"
            class="w-full px-4 py-2.5 rounded-xl border border-black/10 resize-none"
            :placeholder="t('staffClientMessages.modal.messagePlaceholder')"
          ></textarea>

          <button
            @click="sendMessageToClient"
            :disabled="clientMsgLoading"
            class="w-full px-6 py-3 rounded-xl bg-[#006AC7] text-white font-semibold hover:bg-[#0055A3] transition
                  disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {{ clientMsgLoading ? t("staffClientMessages.modal.sending") : t("staffClientMessages.modal.send") }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
