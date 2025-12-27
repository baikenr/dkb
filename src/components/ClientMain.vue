<script setup lang="ts">
import { onMounted, ref, computed } from "vue";
import { useI18n } from "vue-i18n";
import { useAppStore } from "@/stores/app.js";
import { useNotificationStore } from "@/stores/notification.js";

const { t } = useI18n();
const appStore = useAppStore();

const loading = ref(false);
const docLoading = ref(false);

const me = computed(() => appStore.me as any);
const document = ref<any>(null);
const card = computed(() => me.value?.bank_card || null);
const hasCard = computed(() => !!card.value && me.value?.client_bank_status === "received");

// Card data visibility
const showCardData = ref(false);

// ===== upload state =====
const uploadLoading = ref(false);
const uploadError = ref("");
const fileInputRef = ref<HTMLInputElement | null>(null);

const openFilePicker = () => {
  uploadError.value = "";
  fileInputRef.value?.click();
};

const onFileSelected = async (e: Event) => {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  // простая валидация
  const maxMb = 10;
  if (file.size > maxMb * 1024 * 1024) {
      uploadError.value = t('clientMain.fileTooLarge', { max: maxMb });
    input.value = "";
    return;
  }

  uploadLoading.value = true;
  uploadError.value = "";
  try {
    // If document exists, use PATCH to update, otherwise use POST to create
    let r;
    if (document.value) {
      if (typeof appStore.clientUpdateDocument !== 'function') {
        console.error('clientUpdateDocument method not found in store');
        uploadError.value = "Update method not available. Please refresh the page.";
        return;
      }
      r = await appStore.clientUpdateDocument(file);
    } else {
      r = await appStore.clientUploadDocument(file);
    }
    
    if (!r?.ok) {
      uploadError.value = t('clientMain.uploadFailed');
      return;
    }
    await loadDocument();
  } finally {
    uploadLoading.value = false;
    input.value = "";
  }
};

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
    document.value = r?.data || null;
  } finally {
    docLoading.value = false;
  }
};

onMounted(async () => {
  await loadMe();
  await loadDocument();
});

// ✅ request card only if:
// - document exists
// - document status is "approved"
// - card_status is not already "pending" or "received"
const canRequestCard = computed(() => {
  if (!document.value) return false;
  if (document.value.status !== "approved") return false;
  // Don't allow if card_status is already "pending" or "received"
  const cardStatus = me.value?.client_bank_status;
  if (cardStatus === "pending" || cardStatus === "received") return false;
  return true;
});

const requestCardLoading = ref(false);
const requestCardError = ref("");

const requestCard = async () => {
  if (!canRequestCard.value) return;
  
  requestCardLoading.value = true;
  requestCardError.value = "";
  
  try {
    const result = await appStore.clientRequestCard();
    if (!result.ok) {
      requestCardError.value = result.data?.detail || t('clientMain.cardRequestFailed');
      return;
    }
    
    // Reload client data to get updated card_status
    await loadMe();
    await loadDocument();
    
    // Show success message
    const notificationStore = useNotificationStore();
    notificationStore.showNotification({ 
      type: "success", 
      message: t('clientMain.cardRequestSuccess') 
    });
  } catch (error) {
    console.error("Error requesting card:", error);
        requestCardError.value = t('clientMain.cardRequestFailed');
  } finally {
    requestCardLoading.value = false;
  }
};
</script>

<template>
  <div class="pt-[96px] flex">
    <main class="flex-1">
      <div class="max-w-[1200px] mx-auto px-6 py-8">
        <div class="mb-6">
          <h1 class="text-[36px] font-bold text-[#0B2A3C] tracking-tight">{{ t('clientMain.title') }}</h1>
          <div class="h-px bg-black/10 mt-4"></div>
        </div>

        <div v-if="loading" class="text-[#2E4A63]">{{ t('clientMain.loading') }}</div>

        <div v-else class="space-y-6">
          <!-- Card Details (if card exists) -->
          <div v-if="hasCard" class="bg-white rounded-2xl border border-black/10 shadow-sm p-6">
            <h2 class="text-[24px] font-bold text-[#0B2A3C] mb-6">{{ t('clientMain.cardDetails') }}</h2>
            
            <!-- Informationen Section -->
            <div class="bg-[#F7FBFF] rounded-2xl border border-black/5 p-6 mb-6">
              <div class="flex flex-col md:flex-row gap-6">
                <!-- Card Image (Left) -->
                <div class="flex-shrink-0">
                  <div class="relative w-[340px] h-[214px] bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] rounded-2xl shadow-xl overflow-hidden border border-black/20">
                    <!-- DKB Logo (top left) -->
                    <div class="absolute top-4 left-4">
                      <div class="text-[#006AC7] font-bold text-xl">DKB</div>
                    </div>
                    
                    <!-- Large DKB pattern in background -->
                    <div class="absolute inset-0 opacity-10 flex items-center justify-center">
                      <div class="text-white font-bold text-8xl tracking-wider">DKB</div>
                    </div>
                    
                    <!-- Card Number (masked or shown) -->
                    <div class="absolute bottom-16 left-4 right-4">
                      <div class="text-white text-xl font-mono tracking-wider">
                        <span v-if="showCardData">
                          {{ card.first_four_digits }} •••• •••• {{ card.last_four_digits }}
                        </span>
                        <span v-else class="blur-sm select-none">
                          •••• •••• •••• ••••
                        </span>
                      </div>
                    </div>
                    
                    <!-- VISA Logo (bottom right) -->
                    <div class="absolute bottom-4 right-4">
                      <div class="bg-white rounded px-3 py-1.5">
                        <div class="text-[#1434CB] font-bold text-sm">VISA</div>
                        <div class="text-[#F79E1B] font-bold text-xs">Credit</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- Card Info (Right) -->
                <div class="flex-1 flex flex-col justify-between">
                  <div>
                    <div class="text-[18px] font-bold text-[#0B2A3C] mb-2">VISA-Card DKB-Cash</div>
                    <div class="text-sm text-[#6B7E8B] mb-4">
                      <span v-if="showCardData" class="font-mono">
                        {{ card.first_four_digits }} •••• •••• {{ card.last_four_digits }}
                      </span>
                      <span v-else class="blur-sm select-none">
                        •••• •••• •••• ••••
                      </span>
                    </div>
                  </div>
                  
                  <button
                    class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#E8F3FF] text-[#006AC7] hover:bg-[#D0E7FF] transition font-semibold text-sm w-fit"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                    {{ t('clientMain.temporarilyLock') }}
                  </button>
                </div>
              </div>
            </div>
            
            <!-- Detailed Card Information -->
            <div class="space-y-4">
              <!-- Karteninhaber*in -->
              <div class="flex items-center justify-between py-3 border-b border-black/5">
                <div class="text-sm text-[#6B7E8B]">{{ t('clientMain.cardHolder') }}</div>
                <div class="font-bold text-[#0B2A3C]">
                  <span v-if="showCardData">{{ card.full_name || `${me.value?.first_name || ''} ${me.value?.last_name || ''}`.trim() }}</span>
                  <span v-else class="blur-sm select-none">•••• ••••</span>
                </div>
              </div>
              
              <!-- Kartentyp -->
              <div class="flex items-center justify-between py-3 border-b border-black/5">
                <div class="text-sm text-[#6B7E8B]">{{ t('clientMain.cardType') }}</div>
                <div class="font-bold text-[#0B2A3C]">VISA-Card DKB-Cash</div>
              </div>
              
              <!-- Gültig bis -->
              <div class="flex items-center justify-between py-3 border-b border-black/5">
                <div class="text-sm text-[#6B7E8B]">{{ t('clientMain.expires') }}</div>
                <div class="font-bold text-[#0B2A3C]">
                  <span v-if="showCardData && card.exp_month && card.exp_year">
                    {{ String(card.exp_month).padStart(2, '0') }}/{{ card.exp_year }}
                  </span>
                  <span v-else-if="showCardData">—</span>
                  <span v-else class="blur-sm select-none">••/••</span>
                </div>
              </div>
              
              <!-- Kartenlimit -->
              <div class="flex items-center justify-between py-3 border-b border-black/5">
                <div class="text-sm text-[#6B7E8B]">{{ t('clientMain.cardLimit') }}</div>
                <div class="font-bold text-[#0B2A3C]">
                  <span v-if="showCardData">
                    {{ Number(card.limit || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }} €
                  </span>
                  <span v-else class="blur-sm select-none">•••• €</span>
                </div>
              </div>
            </div>
            
            <!-- Toggle visibility button -->
            <div class="mt-6 flex justify-center">
              <button
                @click="showCardData = !showCardData"
                class="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-black/10 bg-white hover:bg-[#F3F7FB] transition font-semibold text-sm text-[#0B2A3C]"
              >
                <svg v-if="showCardData" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
                <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path>
                  <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path>
                  <path d="M6.61 6.61A13.16 13.16 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path>
                  <line x1="2" y1="2" x2="22" y2="22"></line>
                </svg>
                <span>{{ showCardData ? t('clientMain.hideData') : t('clientMain.showData') }}</span>
              </button>
            </div>
          </div>

          <!-- Document Upload & Card Request -->
          <div class="bg-white rounded-2xl border border-black/10 shadow-sm p-6">
            <div class="flex items-center justify-between gap-4 mb-4">
              <div>
                <div class="text-[18px] font-bold text-[#0B2A3C]">{{ t('clientMain.identityDocument') }}</div>
                <div class="text-sm text-[#6B7E8B] mt-1">
                  {{ t('clientMain.documentSubtitle') }}
                </div>
              </div>

              <div class="flex items-center gap-2">
                <div v-if="docLoading" class="text-sm text-[#6B7E8B]">{{ t('clientMain.loading') }}</div>

                <span
                  v-else
                  class="px-3 py-1 rounded-full text-sm font-semibold"
                  :class="{
                    'bg-[#FFF3CD] text-[#7A5D00]': !document || document.status === 'pending',
                    'bg-[#DDF7E9] text-[#0E6B3B]': document?.status === 'approved',
                    'bg-[#FFE0E0] text-[#B42318]': document?.status === 'rejected',
                  }"
                >
                  {{ document ? document.status : t('clientMain.notUploaded') }}
                </span>
              </div>
            </div>

            <div v-if="document?.status === 'rejected'" class="mb-4 text-sm text-[#B42318] bg-[#FFE0E0] border border-black/5 rounded-xl px-4 py-3">
              {{ document.review_comment || t('clientMain.documentStatus.rejected') }}
            </div>

            <div
              v-if="uploadError"
              class="mb-4 text-sm text-[#B42318] bg-[#FFE0E0] border border-black/5 rounded-xl px-4 py-3"
            >
              {{ uploadError }}
            </div>

            <div
              v-if="requestCardError"
              class="mb-4 text-sm text-[#B42318] bg-[#FFE0E0] border border-black/5 rounded-xl px-4 py-3"
            >
              {{ requestCardError }}
            </div>

            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div class="text-sm text-[#6B7E8B]">
                <template v-if="document">
                  <span v-if="document.status === 'pending'">{{ t('clientMain.documentMessages.pending') }}</span>
                  <span v-else-if="document.status === 'approved'">{{ t('clientMain.documentMessages.approved') }}</span>
                  <span v-else-if="document.status === 'rejected'">{{ t('clientMain.documentMessages.rejected') }}</span>
                </template>
                <template v-else>
                  {{ t('clientMain.documentMessages.notUploaded') }}
                </template>
              </div>

              <div class="flex items-center gap-2">
                <!-- hidden file input -->
                <input
                  ref="fileInputRef"
                  type="file"
                  class="hidden"
                  accept="image/*,application/pdf"
                  @change="onFileSelected"
                />

                <!-- upload/update button -->
                <button
                  v-if="!document || document?.status === 'rejected' || document?.status === 'pending'"
                  :disabled="uploadLoading"
                  class="px-5 py-3 rounded-xl font-semibold transition border border-black/10
                         bg-white hover:bg-[#F3F7FB]
                         disabled:opacity-60 disabled:cursor-not-allowed"
                  @click="openFilePicker"
                >
                  <span v-if="uploadLoading">{{ t('clientMain.uploading') }}</span>
                  <span v-else-if="document?.status === 'rejected'">{{ t('clientMain.reUpload') }}</span>
                  <span v-else-if="document?.status === 'pending'">{{ t('clientMain.replaceDocument') }}</span>
                  <span v-else>{{ t('clientMain.upload') }}</span>
                </button>

                <!-- request card button (only visible when document is approved) -->
                <button
                  v-if="document?.status === 'approved'"
                  :disabled="!canRequestCard || requestCardLoading"
                  @click="requestCard"
                  class="px-6 py-3 rounded-xl font-semibold transition
                    bg-[#006AC7] text-white hover:bg-[#134e8a]
                    disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  <span v-if="requestCardLoading">{{ t('clientMain.submitting') }}</span>
                  <span v-else-if="me?.client_bank_status === 'pending'">{{ t('clientMain.requestPending') }}</span>
                  <span v-else>{{ t('clientMain.requestCard') }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
