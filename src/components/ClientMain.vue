<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { useAppStore } from "@/stores/app.js";
import { useNotificationStore } from "@/stores/notification.js";
import ClientSidebar from "@/components/ClientSidebar.vue";
import ClientFAQ from "@/components/ClientFAQ.vue";

const { t, locale } = useI18n();
const route = useRoute();
const router = useRouter();
const appStore = useAppStore();

const loading = ref(false);
const docLoading = ref(false);

const me = computed(() => appStore.me as any);
const clientDocument = ref<any>(null);
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
    if (clientDocument.value) {
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
    clientDocument.value = r?.data || null;
  } finally {
    docLoading.value = false;
  }
};

const handleClickOutside = (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  if (!target.closest('.profile-menu-container')) {
    profileMenuOpen.value = false;
  }
};

onMounted(async () => {
  await loadMe();
  await loadDocument();
  
  // Close profile menu when clicking outside
  document.addEventListener('click', handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
});

// ✅ request card only if:
// - document exists
// - document status is "approved"
// - card_status is not already "pending" or "received"
const canRequestCard = computed(() => {
  if (!clientDocument.value) return false;
  if (clientDocument.value.status !== "approved") return false;
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

// Format IBAN with spaces
const formatIBAN = (iban: string) => {
  if (!iban) return '';
  return iban.replace(/(.{4})/g, '$1 ').trim();
};

// Format card number with spaces (4 groups of 4 digits)
const formatCardNumber = (cardNumber: string) => {
  if (!cardNumber) return '';
  // Remove any existing spaces
  const cleaned = cardNumber.replace(/\s/g, '');
  // Add space after every 4 digits
  return cleaned.replace(/(.{4})/g, '$1 ').trim();
};

// Profile menu
const profileMenuOpen = ref(false);
const fullName = computed(() => {
  const fn = me.value?.first_name || "";
  const ln = me.value?.last_name || "";
  const name = `${fn} ${ln}`.trim();
  return name || card.value?.full_name || t("header.userFallback");
});

const goProfile = async () => {
  profileMenuOpen.value = false;
  await router.push("/profile");
};

const doLogout = async () => {
  profileMenuOpen.value = false;
  appStore.logout();
  await router.replace("/login");
};

// Language toggle
const changeLanguage = (lang: string) => {
  locale.value = lang;
  sessionStorage.setItem("lang", lang);
};
const toggleLanguage = () => changeLanguage(locale.value === "de" ? "en" : "de");
const langLabel = computed(() => (locale.value === "de" ? "EN" : "DE"));
</script>

<template>
  <div class="flex min-h-screen">
    <!-- Left Sidebar -->
    <ClientSidebar />
    <main class="flex-1 relative">
      <!-- Profile Menu & Language Toggle - Top Right -->
      <div class="absolute top-0 right-0 z-10 p-6 profile-menu-container">
        <div class="flex items-center gap-3">
          <!-- Language Toggle -->
          <button
            @click="toggleLanguage"
            class="px-3 py-2 rounded-xl border border-black/10 bg-white hover:bg-black/5 transition font-semibold text-sm text-[#0B2A3C]"
          >
            {{ langLabel }}
          </button>
          
          <!-- Profile Menu -->
          <div class="relative">
            <button
              class="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-black/5 transition font-semibold text-[#0B2A3C]"
              @click="profileMenuOpen = !profileMenuOpen"
            >
              <div class="w-8 h-8 rounded-full bg-[#006AC7] flex items-center justify-center text-white text-sm font-bold">
                {{ fullName.charAt(0).toUpperCase() }}
              </div>
              <span class="text-sm">{{ fullName }}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>

        <div
          v-if="profileMenuOpen"
          class="absolute right-0 top-[48px] w-[220px] bg-white border border-black/10 rounded-xl shadow-lg overflow-hidden z-20"
        >
          <button class="w-full text-left px-4 py-3 hover:bg-black/5 flex items-center gap-3" @click="goProfile">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            {{ t("clientMain.profileMenu.profile") }}
          </button>
          <button class="w-full text-left px-4 py-3 hover:bg-black/5 flex items-center gap-3 relative">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
              <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
            {{ t("clientMain.profileMenu.mailbox") }}
            <span class="ml-auto bg-[#F79E1B] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">7</span>
          </button>
          <button class="w-full text-left px-4 py-3 hover:bg-black/5 flex items-center gap-3" @click="profileMenuOpen = false">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
            {{ t("clientMain.profileMenu.security") }}
          </button>
          <button class="w-full text-left px-4 py-3 hover:bg-black/5 flex items-center gap-3" @click="profileMenuOpen = false">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            {{ t("clientMain.profileMenu.feedback") }}
          </button>
          <button class="w-full text-left px-4 py-3 hover:bg-black/5 flex items-center gap-3" @click="profileMenuOpen = false">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="8.5" cy="7" r="4"></circle>
              <line x1="20" y1="8" x2="20" y2="14"></line>
              <line x1="23" y1="11" x2="17" y2="11"></line>
            </svg>
            {{ t("clientMain.profileMenu.referFriends") }}
          </button>
          <div class="border-t border-black/10"></div>
          <button
            class="w-full text-left px-4 py-3 hover:bg-black/5 flex items-center gap-3 text-[#B42318]"
            @click="doLogout"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            {{ t("clientMain.profileMenu.logout") }}
          </button>
        </div>
          </div>
        </div>
      </div>
      <div class="max-w-[1200px] mx-auto px-6 py-8">
        <div class="mb-6">
          <h1 class="text-[36px] font-bold text-[#0B2A3C] tracking-tight">
            <span v-if="route.path === '/'">{{ t('clientSidebar.home') }}</span>
            <span v-else-if="route.path === '/card'">{{ t('clientSidebar.card') }}</span>
            <span v-else-if="route.path === '/document'">{{ t('clientSidebar.document') }}</span>
            <span v-else-if="route.path === '/faq'">{{ t('clientSidebar.faq') }}</span>
            <span v-else>{{ t('clientMain.title') }}</span>
          </h1>
          <div class="h-px bg-black/10 mt-4"></div>
        </div>

        <div v-if="loading" class="text-[#2E4A63]">{{ t('clientMain.loading') }}</div>

        <div v-else class="space-y-6">
          <!-- Home Page -->
          <template v-if="route.path === '/'">
            <div class="space-y-6">
              <!-- Summary Balances -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="bg-white rounded-2xl border border-black/10 shadow-sm p-6">
                  <div class="text-sm text-[#6B7E8B] mb-2">{{ t('clientMain.home.availableBalance') }}</div>
                  <div class="text-[32px] font-bold text-[#0B2A3C]">
                    {{ card ? Number(card.balance || 0).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €' : '0,00 €' }}
                  </div>
                </div>
                <div class="bg-white rounded-2xl border border-black/10 shadow-sm p-6">
                  <div class="text-sm text-[#6B7E8B] mb-2">{{ t('clientMain.home.totalBalance') }}</div>
                  <div class="text-[32px] font-bold text-[#0B2A3C]">
                    {{ card ? (Number(card.balance || 0) + Number(card.limit || 0)).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €' : '0,00 €' }}
                  </div>
                </div>
              </div>

              <!-- Girokonto Section -->
              <div class="bg-white rounded-2xl border border-black/10 shadow-sm p-6">
                <div class="flex items-center justify-between mb-4">
                  <div>
                    <h2 class="text-[20px] font-bold text-[#0B2A3C] mb-1">{{ t('clientMain.home.girokonto') }}</h2>
                    <div class="text-sm text-[#6B7E8B]">
                      {{ me?.first_name || '' }} {{ me?.last_name || '' }}
                    </div>
                  </div>
                </div>
                
                <div v-if="card && card.iban" class="mb-4">
                  <div class="text-sm text-[#6B7E8B] mb-1">IBAN</div>
                  <div class="text-[16px] font-mono text-[#0B2A3C]">{{ formatIBAN(card.iban) }}</div>
                </div>

                <div class="flex gap-3 mb-6">
                  <button class="px-5 py-2.5 rounded-xl bg-[#006AC7] text-white hover:bg-[#134e8a] transition font-semibold text-sm">
                    {{ t('clientMain.home.uberweisung') }}
                  </button>
                  <button class="px-5 py-2.5 rounded-xl border border-black/10 bg-white hover:bg-[#F3F7FB] transition font-semibold text-sm text-[#0B2A3C]">
                    {{ t('clientMain.home.kontodetails') }}
                  </button>
                </div>
              </div>

              <!-- Visa Kreditkarte Section -->
              <div v-if="hasCard" class="bg-white rounded-2xl border border-black/10 shadow-sm p-6">
                <div class="flex items-center justify-between mb-4">
                  <div>
                    <h2 class="text-[20px] font-bold text-[#0B2A3C] mb-1">{{ t('clientMain.home.visaKreditkarte') }}</h2>
                    <div class="text-sm text-[#6B7E8B]">
                      {{ card.full_name || `${me?.first_name || ''} ${me?.last_name || ''}`.trim() }} •••• {{ card.card_number ? card.card_number.slice(-4) : '' }}
                    </div>
                  </div>
                </div>
                
                <div class="text-[24px] font-bold text-[#B42318] mb-4">
                  {{ Number(card.balance || 0).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }} €
                </div>

                <!-- Card Details -->
                <div class="space-y-3 border-t border-black/10 pt-4">
                  <div class="flex items-center justify-between">
                    <div class="text-sm text-[#6B7E8B]">{{ t('clientMain.home.limit') }}</div>
                    <div class="text-sm font-semibold text-[#0B2A3C]">
                      {{ Number(card.limit || 0).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }} €
                    </div>
                  </div>
                  <div v-if="card.bank_name" class="flex items-center justify-between">
                    <div class="text-sm text-[#6B7E8B]">{{ t('clientMain.home.bankName') }}</div>
                    <div class="text-sm font-semibold text-[#0B2A3C]">{{ card.bank_name }}</div>
                  </div>
                  <div v-if="card.bank_bic" class="flex items-center justify-between">
                    <div class="text-sm text-[#6B7E8B]">{{ t('clientMain.home.bankBic') }}</div>
                    <div class="text-sm font-semibold text-[#0B2A3C]">{{ card.bank_bic }}</div>
                  </div>
                  <div v-if="card.full_name" class="flex items-center justify-between">
                    <div class="text-sm text-[#6B7E8B]">{{ t('clientMain.home.fullName') }}</div>
                    <div class="text-sm font-semibold text-[#0B2A3C]">{{ card.full_name }}</div>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- Card Details Page -->
          <template v-else-if="route.path === '/card'">
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
                        <span v-if="showCardData && card.card_number">
                          {{ formatCardNumber(card.card_number) }}
                        </span>
                        <span v-else-if="card.card_number" class="select-none">
                          <span class="blur-sm">•••• •••• ••••</span> <span>{{ card.card_number.slice(-4) }}</span>
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
                      <span v-if="showCardData && card.card_number" class="font-mono">
                        {{ formatCardNumber(card.card_number) }}
                      </span>
                      <span v-else-if="card.card_number" class="select-none font-mono">
                        <span class="blur-sm">•••• •••• ••••</span> <span>{{ card.card_number.slice(-4) }}</span>
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
              <!-- Card ID -->
              <div class="flex items-center justify-between py-3 border-b border-black/5">
                <div class="text-sm text-[#6B7E8B]">{{ t('clientMain.cardId') }}</div>
                <div class="font-bold text-[#0B2A3C]">{{ card.card_id || '—' }}</div>
              </div>

              <!-- IBAN -->
              <div class="flex items-center justify-between py-3 border-b border-black/5">
                <div class="text-sm text-[#6B7E8B]">{{ t('clientMain.iban') }}</div>
                <div class="font-bold text-[#0B2A3C] font-mono">
                  <span v-if="showCardData">{{ card.iban || '—' }}</span>
                  <span v-else class="blur-sm select-none">•••• •••• •••• •••• ••••</span>
                </div>
              </div>

              <!-- Card Number -->
              <div class="flex items-center justify-between py-3 border-b border-black/5">
                <div class="text-sm text-[#6B7E8B]">{{ t('clientMain.cardNumber') }}</div>
                <div class="font-bold text-[#0B2A3C] font-mono">
                  <span v-if="showCardData && card.card_number">
                    {{ formatCardNumber(card.card_number) }}
                  </span>
                  <span v-else-if="card.card_number" class="select-none">
                    <span class="blur-sm">•••• •••• ••••</span> <span>{{ card.card_number.slice(-4) }}</span>
                  </span>
                  <span v-else class="blur-sm select-none">•••• •••• •••• ••••</span>
                </div>
              </div>

              <!-- CVV -->
              <div class="flex items-center justify-between py-3 border-b border-black/5">
                <div class="text-sm text-[#6B7E8B]">{{ t('clientMain.cvv') }}</div>
                <div class="font-bold text-[#0B2A3C] font-mono">
                  <span v-if="showCardData">{{ card.cvv || '—' }}</span>
                  <span v-else class="blur-sm select-none">•••</span>
                </div>
              </div>
              
              <!-- Karteninhaber*in -->
              <div class="flex items-center justify-between py-3 border-b border-black/5">
                <div class="text-sm text-[#6B7E8B]">{{ t('clientMain.cardHolder') }}</div>
                <div class="font-bold text-[#0B2A3C]">
                  <span v-if="showCardData">{{ card.full_name || `${me?.first_name || ''} ${me?.last_name || ''}`.trim() }}</span>
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

              <!-- Card Status -->
              <div class="flex items-center justify-between py-3 border-b border-black/5">
                <div class="text-sm text-[#6B7E8B]">{{ t('clientMain.cardStatus') }}</div>
                <div class="font-bold">
                  <span
                    class="px-3 py-1 rounded-full text-xs font-semibold"
                    :class="{
                      'bg-[#DDF7E9] text-[#0E6B3B]': card.card_status === 'received',
                      'bg-[#FFF3CD] text-[#7A5D00]': card.card_status === 'pending',
                      'bg-[#FFE0E0] text-[#B42318]': card.card_status === 'declined',
                    }"
                  >
                    {{ card.card_status || '—' }}
                  </span>
                </div>
              </div>

              <!-- Balance -->
              <div class="flex items-center justify-between py-3 border-b border-black/5">
                <div class="text-sm text-[#6B7E8B]">{{ t('clientMain.balance') }}</div>
                <div class="font-bold text-[#0B2A3C]">
                  <span v-if="showCardData">
                    {{ Number(card.balance || 0).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }} €
                  </span>
                  <span v-else class="blur-sm select-none">•••• €</span>
                </div>
              </div>
              
              <!-- Kartenlimit -->
              <div class="flex items-center justify-between py-3 border-b border-black/5">
                <div class="text-sm text-[#6B7E8B]">{{ t('clientMain.cardLimit') }}</div>
                <div class="font-bold text-[#0B2A3C]">
                  <span v-if="showCardData">
                    {{ Number(card.limit || 0).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }} €
                  </span>
                  <span v-else class="blur-sm select-none">•••• €</span>
                </div>
              </div>

              <!-- Bank Name -->
              <div v-if="card.bank_name" class="flex items-center justify-between py-3 border-b border-black/5">
                <div class="text-sm text-[#6B7E8B]">{{ t('clientMain.home.bankName') }}</div>
                <div class="font-bold text-[#0B2A3C]">{{ card.bank_name }}</div>
              </div>

              <!-- Bank BIC -->
              <div v-if="card.bank_bic" class="flex items-center justify-between py-3 border-b border-black/5">
                <div class="text-sm text-[#6B7E8B]">{{ t('clientMain.home.bankBic') }}</div>
                <div class="font-bold text-[#0B2A3C] font-mono">{{ card.bank_bic }}</div>
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
            <div v-else class="bg-white rounded-2xl border border-black/10 shadow-sm p-6">
              <div class="text-[#6B7E8B] text-center py-8">
                <p>{{ t('clientMain.noCard') || 'No card available yet.' }}</p>
              </div>
            </div>
          </template>

          <!-- Document Upload & Card Request Page -->
          <template v-else-if="route.path === '/document'">
            <div class="space-y-6">
              <!-- Header -->
              <div class="bg-white rounded-2xl border border-black/10 shadow-sm p-8">
                <h2 class="text-[32px] font-bold text-[#0B2A3C] mb-2">{{ t('clientMain.identityDocument') }}</h2>
                <p class="text-[16px] text-[#6B7E8B]">
                  {{ t('clientMain.documentSubtitle') }}
                </p>
              </div>

              <!-- Error Messages -->
              <div v-if="clientDocument?.status === 'rejected'" class="bg-[#FFE0E0] border border-[#B42318]/20 rounded-2xl p-6">
                <div class="flex items-start gap-4">
                  <div class="flex-shrink-0 w-10 h-10 rounded-full bg-[#B42318] flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                  </div>
                  <div class="flex-1">
                    <h3 class="text-[18px] font-bold text-[#B42318] mb-2">{{ t('clientMain.documentStatus.rejected') }}</h3>
                    <p class="text-[15px] text-[#B42318]/90">{{ clientDocument.review_comment || t('clientMain.documentStatus.rejected') }}</p>
                  </div>
                </div>
              </div>

              <div
                v-if="uploadError"
                class="bg-[#FFE0E0] border border-[#B42318]/20 rounded-2xl p-6"
              >
                <div class="text-[15px] text-[#B42318]">{{ uploadError }}</div>
              </div>

              <div
                v-if="requestCardError"
                class="bg-[#FFE0E0] border border-[#B42318]/20 rounded-2xl p-6"
              >
                <div class="text-[15px] text-[#B42318]">{{ requestCardError }}</div>
              </div>

              <!-- Step-by-Step Process -->
              <div class="space-y-4">
                <!-- Step 1: Upload Document -->
                <div class="bg-white rounded-2xl border border-black/10 shadow-sm p-8">
                  <div class="flex items-start gap-6">
                    <!-- Step Number -->
                    <div class="flex-shrink-0">
                      <div class="w-16 h-16 rounded-full flex items-center justify-center text-[24px] font-bold"
                        :class="{
                          'bg-[#006AC7] text-white': !clientDocument || clientDocument.status === 'rejected',
                          'bg-[#DDF7E9] text-[#0E6B3B]': clientDocument?.status === 'pending' || clientDocument?.status === 'approved',
                        }"
                      >
                        <span v-if="!clientDocument || clientDocument.status === 'rejected'">1</span>
                        <svg v-else width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </div>
                    </div>
                    
                    <!-- Step Content -->
                    <div class="flex-1">
                      <h3 class="text-[24px] font-bold text-[#0B2A3C] mb-2">
                        {{ t('clientMain.documentSteps.step1Title') }}
                      </h3>
                      <p class="text-[15px] text-[#6B7E8B] mb-6">
                        {{ t('clientMain.documentSteps.step1Description') }}
                      </p>

                      <!-- Status Badge -->
                      <div v-if="docLoading" class="mb-6">
                        <div class="text-sm text-[#6B7E8B]">{{ t('clientMain.loading') }}</div>
                      </div>
                      <div v-else-if="clientDocument" class="mb-6">
                        <span
                          class="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
                          :class="{
                            'bg-[#FFF3CD] text-[#7A5D00]': clientDocument.status === 'pending',
                            'bg-[#DDF7E9] text-[#0E6B3B]': clientDocument.status === 'approved',
                            'bg-[#FFE0E0] text-[#B42318]': clientDocument.status === 'rejected',
                          }"
                        >
                          <svg v-if="clientDocument.status === 'approved'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                          <svg v-else-if="clientDocument.status === 'pending'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                          </svg>
                          {{ clientDocument.status === 'pending' ? t('common.pending') : 
                             clientDocument.status === 'approved' ? t('common.approved') : 
                             t('common.rejected') }}
                        </span>
                      </div>

                      <!-- Upload Button -->
                      <div class="flex items-center gap-4">
                        <input
                          ref="fileInputRef"
                          type="file"
                          class="hidden"
                          accept="image/*,application/pdf"
                          @change="onFileSelected"
                        />
                        <button
                          v-if="!clientDocument || clientDocument?.status === 'rejected' || clientDocument?.status === 'pending'"
                          :disabled="uploadLoading"
                          class="px-8 py-4 rounded-xl font-semibold text-[16px] transition border-2
                                 border-[#006AC7] bg-[#006AC7] text-white hover:bg-[#0055A3] hover:border-[#0055A3]
                                 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-3"
                          @click="openFilePicker"
                        >
                          <svg v-if="!uploadLoading" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="17 8 12 3 7 8"></polyline>
                            <line x1="12" y1="3" x2="12" y2="15"></line>
                          </svg>
                          <svg v-else class="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
                          </svg>
                          <span v-if="uploadLoading">{{ t('clientMain.uploading') }}</span>
                          <span v-else-if="clientDocument?.status === 'rejected'">{{ t('clientMain.reUpload') }}</span>
                          <span v-else-if="clientDocument?.status === 'pending'">{{ t('clientMain.replaceDocument') }}</span>
                          <span v-else>{{ t('clientMain.upload') }}</span>
                        </button>
                        <p v-if="clientDocument?.status === 'pending'" class="text-[15px] text-[#6B7E8B]">
                          {{ t('clientMain.documentMessages.pending') }}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Step 2: Document Review -->
                <div 
                  class="bg-white rounded-2xl border-2 shadow-sm p-8 transition-all"
                  :class="{
                    'border-[#DDF7E9] bg-[#F0FDF4]': clientDocument?.status === 'approved',
                    'border-[#FFF3CD] bg-[#FFFBEB]': clientDocument?.status === 'pending',
                    'border-black/10': !clientDocument || clientDocument?.status === 'rejected',
                  }"
                >
                  <div class="flex items-start gap-6">
                    <!-- Step Number -->
                    <div class="flex-shrink-0">
                      <div class="w-16 h-16 rounded-full flex items-center justify-center text-[24px] font-bold"
                        :class="{
                          'bg-[#E5E7EB] text-[#6B7280]': !clientDocument || clientDocument.status === 'rejected',
                          'bg-[#FFF3CD] text-[#7A5D00]': clientDocument?.status === 'pending',
                          'bg-[#DDF7E9] text-[#0E6B3B]': clientDocument?.status === 'approved',
                        }"
                      >
                        <span v-if="!clientDocument || clientDocument.status === 'rejected'">2</span>
                        <svg v-else-if="clientDocument.status === 'pending'" class="animate-spin" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
                        </svg>
                        <svg v-else width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </div>
                    </div>
                    
                    <!-- Step Content -->
                    <div class="flex-1">
                      <h3 class="text-[24px] font-bold text-[#0B2A3C] mb-2">
                        {{ t('clientMain.documentSteps.step2Title') }}
                      </h3>
                      <p class="text-[15px] text-[#6B7E8B] mb-4">
                        <template v-if="!clientDocument">
                          {{ t('clientMain.documentSteps.step2DescriptionWaiting') }}
                        </template>
                        <template v-else-if="clientDocument.status === 'pending'">
                          {{ t('clientMain.documentSteps.step2DescriptionPending') }}
                        </template>
                        <template v-else-if="clientDocument.status === 'approved'">
                          {{ t('clientMain.documentSteps.step2DescriptionApproved') }}
                        </template>
                        <template v-else>
                          {{ t('clientMain.documentSteps.step2DescriptionRejected') }}
                        </template>
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Step 3: Request Card -->
                <div 
                  class="bg-white rounded-2xl border-2 shadow-sm p-8 transition-all"
                  :class="{
                    'border-[#DDF7E9] bg-[#F0FDF4]': clientDocument?.status === 'approved' && (me?.client_bank_status === 'received' || me?.client_bank_status === 'pending'),
                    'border-black/10': !clientDocument || clientDocument?.status !== 'approved',
                  }"
                >
                  <div class="flex items-start gap-6">
                    <!-- Step Number -->
                    <div class="flex-shrink-0">
                      <div class="w-16 h-16 rounded-full flex items-center justify-center text-[24px] font-bold"
                        :class="{
                          'bg-[#E5E7EB] text-[#6B7280]': !clientDocument || clientDocument.status !== 'approved',
                          'bg-[#006AC7] text-white': clientDocument?.status === 'approved' && canRequestCard && me?.client_bank_status !== 'pending' && me?.client_bank_status !== 'received',
                          'bg-[#DDF7E9] text-[#0E6B3B]': clientDocument?.status === 'approved' && (me?.client_bank_status === 'pending' || me?.client_bank_status === 'received'),
                        }"
                      >
                        <span v-if="!clientDocument || clientDocument.status !== 'approved'">3</span>
                        <svg v-else-if="me?.client_bank_status === 'pending' || me?.client_bank_status === 'received'" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        <span v-else>3</span>
                      </div>
                    </div>
                    
                    <!-- Step Content -->
                    <div class="flex-1">
                      <h3 class="text-[24px] font-bold text-[#0B2A3C] mb-2">
                        {{ t('clientMain.documentSteps.step3Title') }}
                      </h3>
                      <p class="text-[15px] text-[#6B7E8B] mb-6">
                        <template v-if="!clientDocument || clientDocument.status !== 'approved'">
                          {{ t('clientMain.documentSteps.step3DescriptionWaiting') }}
                        </template>
                        <template v-else-if="me?.client_bank_status === 'pending'">
                          {{ t('clientMain.documentSteps.step3DescriptionPending') }}
                        </template>
                        <template v-else-if="me?.client_bank_status === 'received'">
                          {{ t('clientMain.documentSteps.step3DescriptionReceived') }}
                        </template>
                        <template v-else>
                          {{ t('clientMain.documentSteps.step3DescriptionReady') }}
                        </template>
                      </p>

                      <!-- Request Card Button -->
                      <div v-if="clientDocument?.status === 'approved'">
                        <button
                          v-if="canRequestCard"
                          :disabled="requestCardLoading"
                          @click="requestCard"
                          class="px-8 py-4 rounded-xl font-semibold text-[16px] transition
                            bg-[#006AC7] text-white hover:bg-[#0055A3]
                            disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-3"
                        >
                          <svg v-if="!requestCardLoading" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                            <line x1="1" y1="10" x2="23" y2="10"></line>
                          </svg>
                          <svg v-else class="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
                          </svg>
                          <span v-if="requestCardLoading">{{ t('clientMain.submitting') }}</span>
                          <span v-else>{{ t('clientMain.requestCard') }}</span>
                        </button>
                        <div v-else-if="me?.client_bank_status === 'pending'" class="flex items-center gap-3 px-6 py-4 bg-[#FFF3CD] border border-[#7A5D00]/20 rounded-xl">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7A5D00" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                          </svg>
                          <span class="text-[15px] font-semibold text-[#7A5D00]">{{ t('clientMain.requestPending') }}</span>
                        </div>
                        <div v-else-if="me?.client_bank_status === 'received'" class="flex items-center gap-3 px-6 py-4 bg-[#DDF7E9] border border-[#0E6B3B]/20 rounded-xl">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0E6B3B" stroke-width="2">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                          <span class="text-[15px] font-semibold text-[#0E6B3B]">{{ t('clientMain.documentSteps.cardReceived') }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- FAQ Page -->
          <template v-else-if="route.path === '/faq'">
            <ClientFAQ />
          </template>
        </div>
      </div>
    </main>
  </div>
</template>
