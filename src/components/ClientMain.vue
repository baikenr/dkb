<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { useAppStore } from "@/stores/app.js";
import { useNotificationStore } from "@/stores/notification.js";
import ClientSidebar from "@/components/ClientSidebar.vue";
import ClientFAQ from "@/components/ClientFAQ.vue";
import Security from "@/components/Security.vue";

const { t, locale } = useI18n();
const route = useRoute();
const router = useRouter();
const appStore = useAppStore();
const notificationStore = useNotificationStore();

const loading = ref(false);
const docLoading = ref(false);

const me = computed(() => appStore.me as any);
const clientDocument = ref<any>(null);
const card = computed(() => me.value?.bank_card || null);
const hasCard = computed(() => !!card.value && me.value?.client_bank_status === "received");
const manager = computed(() => me.value?.manager || null);
const managerPhone = computed(() => manager.value?.phone || null);
const showManagerModal = ref(false);

// Account activation popup
const showActivationPopup = ref(false);
const activationAmount = computed(() => me.value?.activation_amount_eur || 0.24);

// Tooltip state for disabled Überweisung button
const showTooltip = ref(false);

// Card data visibility
const showCardData = ref(false);

// ===== upload state =====
const selectedFiles = ref({
  frontSide: null as File | null,
  backSide: null as File | null,
  bankStatement: null as File | null
});
const fileInputRefs = ref({
  frontSide: null as HTMLInputElement | null,
  backSide: null as HTMLInputElement | null,
  bankStatement: null as HTMLInputElement | null
});
const uploadError = ref({
  frontSide: "",
  backSide: "",
  bankStatement: "",
  general: ""
});
const isUploading = ref(false);

const openFilePicker = (type: 'frontSide' | 'backSide' | 'bankStatement') => {
  uploadError.value[type] = "";
  uploadError.value.general = "";
  fileInputRefs.value[type]?.click();
};

const onFileSelected = (e: Event, type: 'frontSide' | 'backSide' | 'bankStatement') => {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  // простая валидация
  const maxMb = 10;
  if (file.size > maxMb * 1024 * 1024) {
    uploadError.value[type] = t('clientMain.fileTooLarge', { max: maxMb });
    input.value = "";
    return;
  }

  selectedFiles.value[type] = file;
  uploadError.value[type] = "";
  input.value = "";
};

const removeFile = (type: 'frontSide' | 'backSide' | 'bankStatement') => {
  selectedFiles.value[type] = null;
  uploadError.value[type] = "";
};

const canSubmit = computed(() => {
  return selectedFiles.value.frontSide && selectedFiles.value.backSide && selectedFiles.value.bankStatement;
});

const submitAllDocuments = async () => {
  if (!canSubmit.value) {
    uploadError.value.general = t('clientMain.selectAllDocuments');
    return;
  }

  isUploading.value = true;
  uploadError.value.general = "";

  try {
    // Отправляем файлы последовательно
    // Порядок: frontSide, backSide, bankStatement
    // Последний файл (bankStatement) будет сохранен в бэкенде
    const filesToUpload = [
      { file: selectedFiles.value.frontSide!, type: 'frontSide' },
      { file: selectedFiles.value.backSide!, type: 'backSide' },
      { file: selectedFiles.value.bankStatement!, type: 'bankStatement' }
    ];

    for (const { file, type } of filesToUpload) {
      uploadError.value[type] = "";
      
      let r;
      if (clientDocument.value) {
        if (typeof appStore.clientUpdateDocument !== 'function') {
          console.error('clientUpdateDocument method not found in store');
          uploadError.value[type] = "Update method not available. Please refresh the page.";
          isUploading.value = false;
          return;
        }
        r = await appStore.clientUpdateDocument(file);
      } else {
        r = await appStore.clientUploadDocument(file);
      }
      
      if (!r?.ok) {
        uploadError.value[type] = t('clientMain.uploadFailed');
        isUploading.value = false;
        return;
      }
    }

    // После успешной загрузки всех файлов очищаем выбранные файлы и обновляем документ
    selectedFiles.value = {
      frontSide: null,
      backSide: null,
      bankStatement: null
    };
    await loadDocument();
    
    notificationStore.showNotification({
      type: "success",
      message: t('clientMain.documentsUploadedSuccess')
    });
  } catch (error) {
    uploadError.value.general = t('clientMain.uploadFailed');
    console.error("Error uploading documents:", error);
  } finally {
    isUploading.value = false;
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

const handleClickOutside = (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  if (!target.closest('.profile-menu-container')) {
    profileMenuOpen.value = false;
  }
};

// Change password modal for first login
const mustChangePassword = computed(
  () => appStore.authType === "client" && appStore.firstLoginRequired === true
);

const showChangePasswordModal = ref(false);
const newPassword = ref("");
const confirmPassword = ref("");
const pwdError = ref("");
const pwdLoading = ref(false);

const submitChangePassword = async () => {
  pwdError.value = "";

  if (!newPassword.value || !confirmPassword.value) {
    pwdError.value = t("header.changePassword.errors.fillBoth");
    return;
  }
  if (newPassword.value.length < 8) {
    pwdError.value = t("header.changePassword.errors.min8");
    return;
  }
  if (newPassword.value !== confirmPassword.value) {
    pwdError.value = t("header.changePassword.errors.notMatch");
    return;
  }

  pwdLoading.value = true;
  try {
    const res = await appStore.clientChangePasswordFirst({ new_password: newPassword.value });
    if (!res?.ok) {
      pwdError.value = t("header.changePassword.errors.failed");
      return;
    }
    showChangePasswordModal.value = false;
    newPassword.value = "";
    confirmPassword.value = "";

    appStore.logout();
    await router.replace("/login");
  } finally {
    pwdLoading.value = false;
  }
};

onMounted(async () => {
  await loadMe();
  await loadDocument();
  
  // Close profile menu when clicking outside
  document.addEventListener('click', handleClickOutside);
  
  // Show change password modal if first login
  if (mustChangePassword.value) {
    showChangePasswordModal.value = true;
  }
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

const goSecurity = async () => {
  profileMenuOpen.value = false;
  await router.push("/security");
};

const goFAQ = async () => {
  profileMenuOpen.value = false;
  await router.push("/faq");
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
          <button 
            class="w-full text-left px-4 py-3 hover:bg-black/5 flex items-center gap-3" 
            @click="goSecurity"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
            {{ t("clientMain.profileMenu.security") }}
          </button>
          <button 
            class="w-full text-left px-4 py-3 hover:bg-black/5 flex items-center gap-3" 
            @click="goFAQ"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            {{ t("clientMain.profileMenu.feedback") }}
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
            <span v-else-if="route.path === '/security'">{{ t('security.title') }}</span>
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

                <div class="flex gap-3 mb-6 relative">
                  <div class="relative">
                    <button 
                      :disabled="!hasCard"
                      @click="hasCard && (showActivationPopup = true)"
                      :class="[
                        'px-5 py-2.5 rounded-xl transition font-semibold text-sm relative',
                        hasCard 
                          ? 'bg-[#006AC7] text-white hover:bg-[#134e8a] cursor-pointer' 
                          : 'opacity-50 cursor-not-allowed bg-gray-300 text-gray-500'
                      ]"
                      @mouseenter="!hasCard && (showTooltip = true)"
                      @mouseleave="showTooltip = false"
                    >
                      {{ t('clientMain.home.uberweisung') }}
                    </button>
                    <!-- Tooltip for disabled button -->
                    <div
                      v-if="showTooltip && !hasCard"
                      class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-4 py-2 bg-[#0B2A3C] text-white text-xs rounded-lg whitespace-nowrap z-50 shadow-lg"
                    >
                      {{ t('clientMain.home.uberweisungTooltip') }}
                      <div class="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                        <div class="w-2 h-2 bg-[#0B2A3C] transform rotate-45"></div>
                      </div>
                    </div>
                  </div>
                  <button 
                    @click="router.push('/account-details')"
                    class="px-5 py-2.5 rounded-xl border border-black/10 bg-white hover:bg-[#F3F7FB] transition font-semibold text-sm text-[#0B2A3C]"
                  >
                    {{ t('clientMain.home.kontodetails') }}
                  </button>
                </div>
                
                <!-- Activation Popup -->
                <div
                  v-if="showActivationPopup"
                  class="mt-4 p-4 bg-[#FFF3CD] border border-[#7A5D00]/20 rounded-xl"
                >
                  <div class="flex items-start gap-3">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7A5D00" stroke-width="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <div class="flex-1">
                      <p class="text-sm text-[#7A5D00] font-semibold" v-html="t('clientMain.home.accountNotActive', { amount: Number(activationAmount).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) })"></p>
                    </div>
                    <button
                      @click="showActivationPopup = false"
                      class="text-[#7A5D00] hover:text-[#7A5D00]/80 transition"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>
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
                v-if="requestCardError"
                class="bg-[#FFE0E0] border border-[#B42318]/20 rounded-2xl p-6"
            >
                <div class="text-[15px] text-[#B42318]">{{ requestCardError }}</div>
            </div>

              <!-- Step-by-Step Process -->
              <div class="space-y-4">
                <!-- Step 1: Upload Front Side -->
                <div class="bg-white rounded-2xl border border-black/10 shadow-sm p-8">
                  <div class="flex items-start gap-6">
                    <!-- Step Number -->
                    <div class="flex-shrink-0">
                      <div class="w-16 h-16 rounded-full flex items-center justify-center text-[24px] font-bold bg-[#006AC7] text-white">
                        1
                      </div>
                    </div>

                    <!-- Step Content -->
                    <div class="flex-1">
                      <h3 class="text-[24px] font-bold text-[#0B2A3C] mb-2">
                        {{ t('clientMain.documentFields.frontSide') }}
                      </h3>
                      <p class="text-[15px] text-[#6B7E8B] mb-6">
                        {{ t('clientMain.documentFields.frontSideDescription') }}
                      </p>

                      <!-- Upload Button -->
                      <div class="flex items-center gap-4">
                        <input
                          :ref="el => fileInputRefs.frontSide = el as HTMLInputElement"
                          type="file"
                          class="hidden"
                          accept="image/*,application/pdf"
                          @change="(e) => onFileSelected(e, 'frontSide')"
                        />
                        <button
                          :disabled="isUploading"
                          class="px-8 py-4 rounded-xl font-semibold text-[16px] transition border-2
                                 border-[#006AC7] bg-[#006AC7] text-white hover:bg-[#0055A3] hover:border-[#0055A3]
                                 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-3"
                          @click="openFilePicker('frontSide')"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="17 8 12 3 7 8"></polyline>
                            <line x1="12" y1="3" x2="12" y2="15"></line>
                          </svg>
                          <span>{{ t('clientMain.upload') }}</span>
                        </button>
                        <p v-if="uploadError.frontSide" class="text-[15px] text-[#B42318]">
                          {{ uploadError.frontSide }}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Step 2: Upload Back Side -->
                <div class="bg-white rounded-2xl border border-black/10 shadow-sm p-8">
                  <div class="flex items-start gap-6">
                    <!-- Step Number -->
                    <div class="flex-shrink-0">
                      <div class="w-16 h-16 rounded-full flex items-center justify-center text-[24px] font-bold bg-[#006AC7] text-white">
                        2
                      </div>
                    </div>

                    <!-- Step Content -->
                    <div class="flex-1">
                      <h3 class="text-[24px] font-bold text-[#0B2A3C] mb-2">
                        {{ t('clientMain.documentFields.backSide') }}
                      </h3>
                      <p class="text-[15px] text-[#6B7E8B] mb-6">
                        {{ t('clientMain.documentFields.backSideDescription') }}
                      </p>

                      <!-- File Selection -->
                      <div class="space-y-3">
                        <input
                          :ref="el => fileInputRefs.backSide = el as HTMLInputElement"
                          type="file"
                          class="hidden"
                          accept="image/*,application/pdf"
                          @change="(e) => onFileSelected(e, 'backSide')"
                        />
                        <button
                          :disabled="isUploading"
                          class="px-8 py-4 rounded-xl font-semibold text-[16px] transition border-2
                                 border-[#006AC7] bg-[#006AC7] text-white hover:bg-[#0055A3] hover:border-[#0055A3]
                                 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-3"
                          @click="openFilePicker('backSide')"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="17 8 12 3 7 8"></polyline>
                            <line x1="12" y1="3" x2="12" y2="15"></line>
                          </svg>
                          <span>{{ t('clientMain.upload') }}</span>
                        </button>
                        <div v-if="selectedFiles.backSide" class="flex items-center gap-3 p-3 bg-[#F0FDF4] border border-[#0E6B3B]/20 rounded-xl">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0E6B3B" stroke-width="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                            <polyline points="10 9 9 9 8 9"></polyline>
                          </svg>
                          <span class="text-[15px] text-[#0E6B3B] flex-1 truncate">{{ selectedFiles.backSide.name }}</span>
                          <button
                            @click="removeFile('backSide')"
                            class="text-[#B42318] hover:text-[#B42318]/80 transition"
                            :disabled="isUploading"
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <line x1="18" y1="6" x2="6" y2="18"></line>
                              <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                          </button>
                        </div>
                        <p v-if="uploadError.backSide" class="text-[15px] text-[#B42318]">
                          {{ uploadError.backSide }}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Step 3: Upload Bank Statement -->
                <div class="bg-white rounded-2xl border border-black/10 shadow-sm p-8">
                  <div class="flex items-start gap-6">
                    <!-- Step Number -->
                    <div class="flex-shrink-0">
                      <div class="w-16 h-16 rounded-full flex items-center justify-center text-[24px] font-bold bg-[#006AC7] text-white">
                        3
                      </div>
                    </div>

                    <!-- Step Content -->
                    <div class="flex-1">
                      <h3 class="text-[24px] font-bold text-[#0B2A3C] mb-2">
                        {{ t('clientMain.documentFields.bankStatement') }}
                      </h3>
                      <p class="text-[15px] text-[#6B7E8B] mb-6">
                        {{ t('clientMain.documentFields.bankStatementDescription') }}
                      </p>

                      <!-- File Selection -->
                      <div class="space-y-3">
                        <input
                          :ref="el => fileInputRefs.bankStatement = el as HTMLInputElement"
                          type="file"
                          class="hidden"
                          accept="image/*,application/pdf"
                          @change="(e) => onFileSelected(e, 'bankStatement')"
                        />
                        <button
                          :disabled="isUploading"
                          class="px-8 py-4 rounded-xl font-semibold text-[16px] transition border-2
                                 border-[#006AC7] bg-[#006AC7] text-white hover:bg-[#0055A3] hover:border-[#0055A3]
                                 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-3"
                          @click="openFilePicker('bankStatement')"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="17 8 12 3 7 8"></polyline>
                            <line x1="12" y1="3" x2="12" y2="15"></line>
                          </svg>
                          <span>{{ t('clientMain.upload') }}</span>
                        </button>
                        <div v-if="selectedFiles.bankStatement" class="flex items-center gap-3 p-3 bg-[#F0FDF4] border border-[#0E6B3B]/20 rounded-xl">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0E6B3B" stroke-width="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                            <polyline points="10 9 9 9 8 9"></polyline>
                          </svg>
                          <span class="text-[15px] text-[#0E6B3B] flex-1 truncate">{{ selectedFiles.bankStatement.name }}</span>
                          <button
                            @click="removeFile('bankStatement')"
                            class="text-[#B42318] hover:text-[#B42318]/80 transition"
                            :disabled="isUploading"
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <line x1="18" y1="6" x2="6" y2="18"></line>
                              <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                          </button>
                        </div>
                        <p v-if="uploadError.bankStatement" class="text-[15px] text-[#B42318]">
                          {{ uploadError.bankStatement }}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Submit All Documents Button -->
                <div v-if="canSubmit || isUploading" class="bg-white rounded-2xl border border-black/10 shadow-sm p-8">
                  <div class="flex items-center justify-between">
                    <div>
                      <h3 class="text-[20px] font-bold text-[#0B2A3C] mb-2">
                        {{ t('clientMain.submitAllDocuments') }}
                      </h3>
                      <p class="text-[15px] text-[#6B7E8B]">
                        {{ t('clientMain.submitAllDocumentsDescription') }}
                      </p>
                    </div>
                    <button
                      :disabled="!canSubmit || isUploading"
                      class="px-8 py-4 rounded-xl font-semibold text-[16px] transition border-2
                             border-[#0E6B3B] bg-[#0E6B3B] text-white hover:bg-[#0C5A2F] hover:border-[#0C5A2F]
                             disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-3"
                      @click="submitAllDocuments"
                    >
                      <svg v-if="!isUploading" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      <svg v-else class="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
                      </svg>
                      <span v-if="isUploading">{{ t('clientMain.uploading') }}</span>
                      <span v-else>{{ t('clientMain.submitAll') }}</span>
                    </button>
                  </div>
                  <p v-if="uploadError.general" class="text-[15px] text-[#B42318] mt-4">
                    {{ uploadError.general }}
                  </p>
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
                      <!-- Status Badge for Approved -->
                      <div v-if="clientDocument?.status === 'approved'" class="mt-4">
                        <span class="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-[#DDF7E9] text-[#0E6B3B]">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                          {{ t('common.approved') }}
                        </span>
                      </div>
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

          <!-- Security Page -->
          <template v-else-if="route.path === '/security'">
            <Security />
          </template>
        </div>
      </div>
    </main>
    
    <!-- Change Password Modal for First Login -->
    <div
      v-if="showChangePasswordModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100]"
    >
      <div class="w-full max-w-[480px] bg-white rounded-2xl p-6">
        <h2 class="text-xl font-bold mb-2">{{ t("header.changePassword.title") }}</h2>
        <p class="text-gray-600 mb-4">
          {{ t("header.changePassword.subtitle") }}
        </p>

        <div
          v-if="pwdError"
          class="mb-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2"
        >
          {{ pwdError }}
        </div>

        <input
          v-model="newPassword"
          type="password"
          class="w-full border rounded-lg px-3 py-2 mb-3"
          :placeholder="t('header.changePassword.newPasswordPlaceholder')"
        />
        <input
          v-model="confirmPassword"
          type="password"
          class="w-full border rounded-lg px-3 py-2"
          :placeholder="t('header.changePassword.confirmPasswordPlaceholder')"
        />

        <button
          class="mt-4 w-full bg-[#006ac7] hover:bg-[#134e8a] text-white py-3 rounded-xl font-semibold disabled:opacity-60"
          :disabled="pwdLoading"
          @click="submitChangePassword"
        >
          {{ t("header.changePassword.saveBtn") }}
        </button>
      </div>
    </div>

    <!-- Manager Contact Icon - Fixed Bottom Right -->
    <div
      v-if="managerPhone"
      class="fixed bottom-6 right-6 z-40"
    >
      <button
        @click="showManagerModal = true"
        class="w-14 h-14 rounded-full bg-[#006AC7] text-white shadow-lg hover:bg-[#0055A3] transition-all duration-300 flex items-center justify-center hover:scale-110"
        :title="t('clientMain.managerContact.title')"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
        </svg>
      </button>
    </div>

    <!-- Manager Contact Modal -->
    <div
      v-if="showManagerModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100]"
      @click.self="showManagerModal = false"
    >
      <div 
        class="bg-white rounded-2xl shadow-2xl w-full max-w-[420px] transform transition-all duration-300"
        :class="showManagerModal ? 'scale-100 opacity-100' : 'scale-95 opacity-0'"
      >
        <!-- Modal Header -->
        <div class="bg-gradient-to-r from-[#006AC7] to-[#0055A3] p-6 rounded-t-2xl">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div class="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
              </div>
              <div>
                <h3 class="text-[20px] font-bold text-white mb-1">
                  {{ t('clientMain.managerContact.title') }}
                </h3>
                <p class="text-sm text-white/80">
                  {{ t('clientMain.managerContact.subtitle') }}
                </p>
              </div>
            </div>
            <button
              @click="showManagerModal = false"
              class="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition text-white"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        <!-- Modal Content -->
        <div class="p-6 space-y-6">
          <!-- Manager Name -->
          <div v-if="manager?.first_name || manager?.last_name" class="p-4 rounded-xl bg-[#F7FBFF] border border-black/5">
            <div class="text-xs text-[#6B7E8B] font-semibold uppercase tracking-wide mb-2">
              {{ t('clientMain.managerContact.name') }}
            </div>
            <div class="text-[18px] font-bold text-[#0B2A3C]">
              {{ `${manager.first_name || ''} ${manager.last_name || ''}`.trim() }}
            </div>
          </div>

          <!-- Manager Phone -->
          <div class="p-4 rounded-xl bg-[#F7FBFF] border border-black/5">
            <div class="text-xs text-[#6B7E8B] font-semibold uppercase tracking-wide mb-2">
              {{ t('clientMain.managerContact.phone') }}
            </div>
            <a 
              :href="`tel:${managerPhone}`"
              class="text-[18px] font-bold text-[#006AC7] hover:text-[#0055A3] transition break-all flex items-center gap-2"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
              {{ managerPhone }}
            </a>
          </div>

          <!-- Call Button -->
          <a
            :href="`tel:${managerPhone}`"
            class="w-full px-6 py-4 rounded-xl bg-[#006AC7] text-white hover:bg-[#0055A3] transition font-semibold text-[16px] flex items-center justify-center gap-3"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
            </svg>
            {{ t('clientMain.managerContact.callButton') }}
          </a>
        </div>
      </div>
    </div>
  </div>
</template>
