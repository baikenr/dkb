<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useAppStore } from "@/stores/app.js";
import { useNotificationStore } from "@/stores/notification.js";

const { t } = useI18n();
const appStore = useAppStore();
const notificationStore = useNotificationStore();

// ---- inbox ----
const loadingInbox = ref(false);
const inbox = ref<any[]>([]);
const totalCount = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);
const unreadCount = ref(0);

const searchQuery = ref("");
const filterStatus = ref<"all" | "read" | "unread">("all");

const selected = ref<any>(null);
const showDetail = ref(false);

const formatDate = (s: string) => {
  if (!s) return "—";
  try {
    const d = new Date(s);
    if (isNaN(d.getTime())) return s;
    return d.toLocaleString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return s;
  }
};

const loadInbox = async (page = 1) => {
  loadingInbox.value = true;
  try {
    const params: any = { page, page_size: pageSize.value };
    const res = await appStore.clientNotificationsList(params);
    if (res.ok) {
      inbox.value = res.data?.results || res.data || [];
      totalCount.value = res.data?.count ?? inbox.value.length;
      currentPage.value = page;
    }
  } finally {
    loadingInbox.value = false;
  }
};

const loadUnreadCount = async () => {
  const res = await appStore.clientNotificationCount();
  if (res.ok) unreadCount.value = res.data?.count ?? 0;
};

const totalPages = computed(() => Math.ceil(totalCount.value / pageSize.value));

const filteredInbox = computed(() => {
  let arr = inbox.value;

  if (filterStatus.value === "read") arr = arr.filter((n) => n.is_read);
  if (filterStatus.value === "unread") arr = arr.filter((n) => !n.is_read);

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase();
    arr = arr.filter(
      (n) =>
        String(n.title || "").toLowerCase().includes(q) ||
        String(n.message || "").toLowerCase().includes(q)
    );
  }
  return arr;
});

const openDetail = async (item: any) => {
  selected.value = item;
  showDetail.value = true;

  if (!item.is_read) {
    await appStore.clientNotificationUpdate(item.id, { is_read: true });
    await loadInbox(currentPage.value);
    await loadUnreadCount();
    // Обновляем счетчик в сайдбаре
    window.dispatchEvent(new Event("notification-updated"));
  }
};

const closeDetail = () => {
  showDetail.value = false;
  selected.value = null;
};

const toggleRead = async (item: any) => {
  await appStore.clientNotificationUpdate(item.id, { is_read: !item.is_read });
  await loadInbox(currentPage.value);
  await loadUnreadCount();
  // Обновляем счетчик в сайдбаре
  window.dispatchEvent(new Event("notification-updated"));
};

const deleteMsg = async (item: any) => {
  if (!confirm(t("clientFAQ.inbox.deleteConfirm"))) return;
  const res = await appStore.clientNotificationDelete(item.id);
  if (res.ok) {
    notificationStore.showNotification({ type: "success", message: t("clientFAQ.inbox.deleteSuccess") });
    if (selected.value?.id === item.id) closeDetail();
    await loadInbox(currentPage.value);
    await loadUnreadCount();
    // Обновляем счетчик в сайдбаре
    window.dispatchEvent(new Event("notification-updated"));
  }
};

onMounted(async () => {
  await loadInbox(1);
  await loadUnreadCount();
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="bg-white rounded-2xl border border-black/10 shadow-sm p-8">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h2 class="text-[32px] font-bold text-[#0B2A3C] mb-2">{{ t('clientMessages.title') }}</h2>
          <p class="text-[16px] text-[#6B7E8B]">
            {{ t('clientMessages.subtitle') }}
          </p>
        </div>

        <div v-if="unreadCount > 0" class="px-4 py-2 bg-[#006AC7] text-white rounded-xl font-semibold">
          {{ t("clientFAQ.inbox.unreadCount", { count: unreadCount }) }}
        </div>
      </div>
    </div>

    <!-- Inbox -->
    <div class="bg-white rounded-2xl border border-black/10 shadow-sm p-8 space-y-4">
      <div class="flex items-center justify-between gap-4">
        <h3 class="text-[20px] font-bold text-[#0B2A3C]">{{ t("clientFAQ.inbox.title") }}</h3>

        <div class="flex items-center gap-2">
          <input
            v-model="searchQuery"
            type="text"
            class="px-4 py-2.5 rounded-xl border border-black/10 bg-white text-[#0B2A3C] focus:outline-none focus:ring-2 focus:ring-[#006AC7]/20 focus:border-[#006AC7]"
            :placeholder="t('clientFAQ.inbox.searchPlaceholder')"
          />

          <select
            v-model="filterStatus"
            class="px-4 py-2.5 rounded-xl border border-black/10 bg-white text-[#0B2A3C]"
          >
            <option value="all">{{ t("clientFAQ.inbox.filters.all") }}</option>
            <option value="unread">{{ t("clientFAQ.inbox.filters.unread") }}</option>
            <option value="read">{{ t("clientFAQ.inbox.filters.read") }}</option>
          </select>
        </div>
      </div>

      <div v-if="loadingInbox" class="text-center text-[#6B7E8B] py-10">
        {{ t("clientFAQ.inbox.loading") }}
      </div>

      <div v-else-if="filteredInbox.length === 0" class="text-center text-[#6B7E8B] py-10">
        {{ t("clientFAQ.inbox.noMessages") }}
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="item in filteredInbox"
          :key="item.id"
          class="p-4 rounded-xl border border-black/10 hover:border-[#006AC7]/30 hover:shadow-sm transition"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1 cursor-pointer" @click="openDetail(item)">
              <div class="flex items-center gap-2">
                <div v-if="!item.is_read" class="relative flex-shrink-0">
                  <span class="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                  <span class="relative w-2.5 h-2.5 bg-red-500 rounded-full"></span>
                </div>
                <div class="text-[16px] font-bold text-[#0B2A3C]">
                  {{ item.title || t("clientFAQ.inbox.noTitle") }}
                </div>
                <span v-if="!item.is_read" class="px-2 py-1 rounded-full text-xs font-semibold bg-[#006AC7] text-white">
                  {{ t("clientFAQ.inbox.new") }}
                </span>
              </div>

              <div class="text-sm text-[#6B7E8B] mt-1 line-clamp-2">
                {{ item.message }}
              </div>

              <div class="text-xs text-[#6B7E8B] mt-2">
                {{ formatDate(item.created_at) }}
              </div>
            </div>

            <div class="flex items-center gap-2">
              <button
                @click="toggleRead(item)"
                class="px-3 py-2 rounded-lg border border-black/10 hover:bg-black/5 text-sm font-semibold"
              >
                {{ item.is_read ? t("clientFAQ.inbox.markUnread") : t("clientFAQ.inbox.markRead") }}
              </button>

              <button
                @click="deleteMsg(item)"
                class="px-3 py-2 rounded-lg border border-[#B42318]/30 text-[#B42318] hover:bg-[#FFE0E0] text-sm font-semibold"
              >
                {{ t("common.delete") }}
              </button>
            </div>
          </div>
        </div>

        <div v-if="totalPages > 1" class="flex items-center justify-between pt-4 border-t border-black/10">
          <button
            class="px-4 py-2 rounded-xl border border-black/10 hover:bg-black/5 disabled:opacity-50"
            :disabled="currentPage === 1"
            @click="loadInbox(currentPage - 1)"
          >
            {{ t("common.previous") }}
          </button>

          <div class="text-sm text-[#6B7E8B]">
            {{ t("clientFAQ.inbox.page", { current: currentPage, total: totalPages }) }}
          </div>

          <button
            class="px-4 py-2 rounded-xl border border-black/10 hover:bg-black/5 disabled:opacity-50"
            :disabled="currentPage === totalPages"
            @click="loadInbox(currentPage + 1)"
          >
            {{ t("common.next") }}
          </button>
        </div>
      </div>
    </div>

    <!-- Detail Modal -->
    <div
      v-if="showDetail && selected"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      @click.self="closeDetail"
    >
      <div class="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div class="p-6 border-b border-black/10 flex items-center justify-between">
          <div class="text-[20px] font-bold text-[#0B2A3C]">
            {{ selected.title || t("clientFAQ.inbox.noTitle") }}
          </div>
          <button @click="closeDetail" class="text-[#6B7E8B] hover:text-[#0B2A3C]">✕</button>
        </div>

        <div class="p-6 overflow-y-auto">
          <div class="text-xs text-[#6B7E8B] mb-4">{{ formatDate(selected.created_at) }}</div>
          <div class="whitespace-pre-wrap text-[#0B2A3C] bg-[#F7FBFF] rounded-xl p-4">
            {{ selected.message }}
          </div>
        </div>

        <div class="p-6 border-t border-black/10 flex justify-end gap-2">
          <button
            @click="toggleRead(selected)"
            class="px-4 py-2 rounded-xl border border-black/10 hover:bg-black/5 font-semibold"
          >
            {{ selected.is_read ? t("clientFAQ.inbox.markUnread") : t("clientFAQ.inbox.markRead") }}
          </button>
          <button
            @click="deleteMsg(selected)"
            class="px-4 py-2 rounded-xl border border-[#B42318]/30 text-[#B42318] hover:bg-[#FFE0E0] font-semibold"
          >
            {{ t("common.delete") }}
          </button>
          <button
            @click="closeDetail"
            class="px-4 py-2 rounded-xl bg-[#006AC7] text-white hover:bg-[#0055A3] font-semibold"
          >
            {{ t("clientFAQ.inbox.close") }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

