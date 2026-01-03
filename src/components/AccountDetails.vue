<script setup lang="ts">
import { onMounted, computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useAppStore } from "@/stores/app.js";
import { useNotificationStore } from "@/stores/notification.js";
import ClientSidebar from "@/components/ClientSidebar.vue";

const { t } = useI18n();
const appStore = useAppStore();
const notificationStore = useNotificationStore();

const loading = ref(false);
const docLoading = ref(false);
const me = computed(() => appStore.me as any);
const card = computed(() => me.value?.bank_card || null);
const docsApproved = computed(() => me.value?.client_document_status === "approved");
const clientDocument = ref<any>(null);
// Account details from backend
// These fields should come from backend: account_owner_name, account_iban, bank_bic, bank_name
// For now, using card fields as fallback
const accountOwner = computed(() => 
  me.value?.account_owner_name || 
  card.value?.full_name || 
  `${me.value?.first_name || ''} ${me.value?.last_name || ''}`.trim() || 
  '-'
);

const accountNumber = computed(() => 
  me.value?.account_iban || 
  me.value?.iban || 
  card.value?.iban || 
  null
);

const bankCode = computed(() => 
  me.value?.bank_bic || 
  card.value?.bank_bic || 
  null
);

const bankName = computed(() => 
  me.value?.bank_name || 
  card.value?.bank_name || 
  null
);

const hasCardData = computed(() => !!card.value);
const hasAllData = computed(() => accountNumber.value && bankCode.value && bankName.value);
const isDocumentApproved = computed(() => {
  // Проверяем статус документа из загруженного документа или из me
  return clientDocument.value?.status === 'approved' || me.value?.client_document_status === 'approved';
});
const shouldShowBanner = computed(() => !isDocumentApproved.value);

const loadMe = async () => {
  loading.value = true;
  try {
    await appStore.clientMe();
  } finally {
    loading.value = false;
  }
};

const loadDocument = async () => {
  docLoading.value = true;
  try {
    const r = await appStore.clientGetDocument();
    // API может возвращать массив или объект
    if (r?.data) {
      if (Array.isArray(r.data)) {
        // Если массив, берем первый элемент
        clientDocument.value = r.data.length > 0 ? r.data[0] : null;
      } else {
        // Если объект, используем как есть
        clientDocument.value = r.data;
      }
    } else {
      clientDocument.value = null;
    }
  } finally {
    docLoading.value = false;
  }
};

onMounted(async () => {
  if (!appStore.me) {
    await loadMe();
  }
  await loadDocument();
});

// Format IBAN with spaces
const formatIBAN = (iban: string | null) => {
  if (!iban) return '';
  return iban.replace(/(.{4})/g, '$1 ').trim();
};

// Copy to clipboard
const copyToClipboard = async (text: string, label: string) => {
  try {
    await navigator.clipboard.writeText(text);
    notificationStore.showNotification({
      type: "success",
      message: t('clientMain.accountDetails.copied', { field: label })
    });
  } catch (error) {
    console.error('Failed to copy:', error);
  }
};
</script>

<template>
  <div class="flex min-h-screen">
    <!-- Left Sidebar -->
    <ClientSidebar />
    <main class="flex-1 relative">
      <div class="max-w-[1200px] mx-auto px-6 py-8">
        <div class="mb-6">
          <h1 class="text-[36px] font-bold text-[#0B2A3C] tracking-tight">
            {{ t('clientMain.home.kontodetails') }}
          </h1>
          <div class="h-px bg-black/10 mt-4"></div>
        </div>

        <div v-if="loading" class="text-[#2E4A63]">{{ t('clientMain.loading') }}</div>

        <div v-else class="space-y-6">
          <!-- Status Banner -->
          <div
            v-if="shouldShowBanner"
            class="bg-[#FFF3CD] border border-[#7A5D00]/20 rounded-2xl p-6"
          >
            <div class="flex items-start gap-4">
              <div class="flex-shrink-0 w-10 h-10 rounded-full bg-[#7A5D00] flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
              </div>
              <div class="flex-1">
                <h3 class="text-[16px] font-bold text-[#7A5D00] mb-1">
                  {{ t('clientMain.accountDetails.waitingForCard') }}
                </h3>
                <p class="text-[14px] text-[#7A5D00]/90">
                  {{ t('clientMain.accountDetails.waitingForCardDescription') }}
                </p>
              </div>
            </div>
          </div>

          <!-- Main Card -->
          <div class="bg-white rounded-2xl border border-black/10 shadow-sm overflow-hidden">
            <!-- Header -->
            <div class="bg-gradient-to-r from-[#006AC7] to-[#0055A3] p-6">
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                    <line x1="1" y1="10" x2="23" y2="10"></line>
                  </svg>
                </div>
                <div>
                  <h2 class="text-[24px] font-bold text-white mb-1">
                    {{ t('clientMain.accountDetails.title') }}
                  </h2>
                  <p class="text-sm text-white/80">
                    {{ t('clientMain.accountDetails.subtitle') }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Content -->
            <div class="p-8">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Account Owner Name -->
                <div class="p-6 rounded-xl bg-[#F7FBFF] border border-black/5 hover:border-[#006AC7]/20 transition">
                  <div class="flex items-center gap-3 mb-4">
                    <div class="w-10 h-10 rounded-lg bg-[#E8F3FF] flex items-center justify-center">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#006AC7" stroke-width="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                    </div>
                    <div class="text-sm font-semibold text-[#6B7E8B] uppercase tracking-wide">
                      {{ t('clientMain.accountDetails.accountOwner') }}
                    </div>
                  </div>
                  <div class="text-[18px] font-bold text-[#0B2A3C] break-words">
                    {{ accountOwner }}
                  </div>
                </div>

                <!-- Account Number (IBAN) -->
                <div class="p-6 rounded-xl bg-[#F7FBFF] border border-black/5 hover:border-[#006AC7]/20 transition">
                  <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 rounded-lg bg-[#E8F3FF] flex items-center justify-center">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#006AC7" stroke-width="2">
                          <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                          <line x1="1" y1="10" x2="23" y2="10"></line>
                        </svg>
                      </div>
                      <div class="text-sm font-semibold text-[#6B7E8B] uppercase tracking-wide">
                        {{ t('clientMain.accountDetails.accountNumber') }}
                      </div>
                    </div>
                    <button
                      v-if="accountNumber"
                      @click="copyToClipboard(accountNumber, t('clientMain.accountDetails.accountNumber'))"
                      class="p-2 rounded-lg hover:bg-[#E8F3FF] transition text-[#006AC7]"
                      :title="t('clientMain.accountDetails.copy')"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                    </button>
                  </div>
                  <div class="text-[18px] font-bold text-[#0B2A3C] font-mono break-all">
                    <span v-if="accountNumber" class="select-all">{{ formatIBAN(accountNumber) }}</span>
                    <span v-else class="text-[#6B7E8B] italic font-normal">
                      {{ t('clientMain.accountDetails.cardNotCreated') }}
                    </span>
                  </div>
                </div>

                <!-- Bank Code (BIC/SWIFT) -->
                <div class="p-6 rounded-xl bg-[#F7FBFF] border border-black/5 hover:border-[#006AC7]/20 transition">
                  <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 rounded-lg bg-[#E8F3FF] flex items-center justify-center">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#006AC7" stroke-width="2">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                          <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                      </div>
                      <div class="text-sm font-semibold text-[#6B7E8B] uppercase tracking-wide">
                        {{ t('clientMain.accountDetails.bankCode') }}
                      </div>
                    </div>
                    <button
                      v-if="bankCode"
                      @click="copyToClipboard(bankCode, t('clientMain.accountDetails.bankCode'))"
                      class="p-2 rounded-lg hover:bg-[#E8F3FF] transition text-[#006AC7]"
                      :title="t('clientMain.accountDetails.copy')"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                    </button>
                  </div>
                  <div class="text-[18px] font-bold text-[#0B2A3C] font-mono break-all">
                    <span v-if="bankCode" class="select-all">{{ bankCode }}</span>
                    <span v-else class="text-[#6B7E8B] italic font-normal">
                      {{ t('clientMain.accountDetails.cardNotCreated') }}
                    </span>
                  </div>
                </div>

                <!-- Bank Name -->
                <div class="p-6 rounded-xl bg-[#F7FBFF] border border-black/5 hover:border-[#006AC7]/20 transition">
                  <div class="flex items-center gap-3 mb-4">
                    <div class="w-10 h-10 rounded-lg bg-[#E8F3FF] flex items-center justify-center">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#006AC7" stroke-width="2">
                        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                      </svg>
                    </div>
                    <div class="text-sm font-semibold text-[#6B7E8B] uppercase tracking-wide">
                      {{ t('clientMain.accountDetails.bankName') }}
                    </div>
                  </div>
                  <div class="text-[18px] font-bold text-[#0B2A3C] break-words">
                    <span v-if="bankName">{{ bankName }}</span>
                    <span v-else class="text-[#6B7E8B] italic font-normal">
                      {{ t('clientMain.accountDetails.cardNotCreated') }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Info Note -->
              <div v-if="hasAllData" class="mt-6 p-4 bg-[#E8F3FF] border border-[#006AC7]/20 rounded-xl">
                <div class="flex items-start gap-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#006AC7" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                  </svg>
                  <div class="flex-1">
                    <p class="text-sm text-[#006AC7]">
                      {{ t('clientMain.accountDetails.infoNote') }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

