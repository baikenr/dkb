<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useAppStore } from "@/stores/app.js";
import { useNotificationStore } from "@/stores/notification.js";

const { t } = useI18n();
const appStore = useAppStore();

const loading = ref(false);
const clients = ref<any[]>([]);
const totalCount = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);

const searchQuery = ref("");
const cardStatusFilter = ref(""); // '' | 'pending' | 'declined' | 'received'
const documentStatusFilter = ref(""); // '' | status values
const showModal = ref(false);
const editingClient = ref<any>(null);
const formLoading = ref(false);
const showCredentialsModal = ref(false);
const createdCredentials = ref<any>(null);
const managers = ref<any[]>([]);
const showPasswordModal = ref(false);
const resettingPasswordClient = ref<any>(null);
const newPassword = ref("");
const passwordError = ref("");
const passwordLoading = ref(false);
const showPassword = ref(false);
const showCardModal = ref(false);
const viewingCardClient = ref<any>(null);
const cardData = ref({
  bank_name: "",
  full_name: "",
  card_number: "",
  cvv: "",
  iban: "",
  bank_bic: "",
  exp_month: null as number | null,
  exp_year: null as number | null,
  limit: "",
});
const cardDataErrors = ref<any>({});
const cardLoading = ref(false);
const cardSaving = ref(false);
const currentCardId = ref<number | null>(null);

const isAdmin = computed(() => appStore.staffRole === "admin");

// Form fields
const formData = ref({
  first_name: "",
  last_name: "",
  phone: "",
  email: "",
  birth_date: "",
  work_place: "",
  assigned_manager_id: null as number | null,
});

const formErrors = ref<any>({});

const loadClients = async () => {
  loading.value = true;
  try {
    const params: any = {
      page: currentPage.value,
      page_size: pageSize.value,
    };
    
    if (searchQuery.value.trim()) {
      params.search = searchQuery.value.trim();
    }
    
    if (cardStatusFilter.value) {
      params.card_status = cardStatusFilter.value;
    }
    
    if (documentStatusFilter.value) {
      params.document_status = documentStatusFilter.value;
    }

    const result = await appStore.staffClientsList(params);
    if (result.ok && result.data) {
      clients.value = result.data.results || result.data;
      totalCount.value = result.data.count || result.data.length || 0;
    }
  } catch (error) {
    console.error("Error loading clients:", error);
  } finally {
    loading.value = false;
  }
};

const loadManagers = async () => {
  // Load managers for all roles to display manager names
  try {
    const result = await appStore.staffUsersList({ role: "manager" });
    if (result.ok && result.data) {
      managers.value = result.data.results || result.data;
    }
  } catch (error) {
    console.error("Error loading managers:", error);
  }
};

const getManagerName = (managerId: number | null) => {
  if (!managerId) return "—";
  const manager = managers.value.find((m: any) => m.id === managerId);
  if (manager) {
    const name = `${manager.first_name || ''} ${manager.last_name || ''}`.trim();
    return name || manager.email || `${t('common.id')}: ${managerId}`;
  }
  return `${t('common.id')}: ${managerId}`;
};

const resetForm = () => {
  formData.value = {
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    birth_date: "",
    work_place: "",
    assigned_manager_id: isAdmin.value ? null : appStore.staffUserId,
  };
  formErrors.value = {};
  editingClient.value = null;
  createdCredentials.value = null;
};

const openCreateModal = () => {
  resetForm();
  showModal.value = true;
  if (isAdmin.value) {
    loadManagers();
  }
};

const openEditModal = (client: any) => {
  editingClient.value = client;
  formData.value = {
    first_name: client.first_name || "",
    last_name: client.last_name || "",
    phone: client.phone || "",
    email: client.email || "",
    birth_date: client.birth_date || "",
    work_place: client.work_place || "",
    assigned_manager_id: client.assigned_manager_id || null,
  };
  formErrors.value = {};
  showModal.value = true;
  if (isAdmin.value) {
    loadManagers();
  }
};

const closeModal = () => {
  showModal.value = false;
  resetForm();
};

const closeCredentialsModal = () => {
  showCredentialsModal.value = false;
  createdCredentials.value = null;
};

const validateForm = () => {
  formErrors.value = {};
  let valid = true;

  if (!formData.value.first_name?.trim()) {
    formErrors.value.first_name = t("clientsManagement.validation.firstNameRequired");
    valid = false;
  } else if (formData.value.first_name.trim().length < 2) {
    formErrors.value.first_name = t("clientsManagement.validation.firstNameMin");
    valid = false;
  } else if (formData.value.first_name.trim().length > 150) {
    formErrors.value.first_name = t("clientsManagement.validation.firstNameMax");
    valid = false;
  }

  if (!formData.value.last_name?.trim()) {
    formErrors.value.last_name = t("clientsManagement.validation.lastNameRequired");
    valid = false;
  } else if (formData.value.last_name.trim().length < 2) {
    formErrors.value.last_name = t("clientsManagement.validation.lastNameMin");
    valid = false;
  } else if (formData.value.last_name.trim().length > 150) {
    formErrors.value.last_name = t("clientsManagement.validation.lastNameMax");
    valid = false;
  }

  if (formData.value.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.value.email.trim())) {
    formErrors.value.email = t("clientsManagement.validation.emailInvalid");
    valid = false;
  }

  if (formData.value.phone?.trim() && formData.value.phone.trim().length > 30) {
    formErrors.value.phone = t("clientsManagement.validation.phoneMax");
    valid = false;
  }

  if (formData.value.work_place?.trim() && formData.value.work_place.trim().length > 255) {
    formErrors.value.work_place = t("clientsManagement.validation.workPlaceMax");
    valid = false;
  }

  return valid;
};

const submitForm = async () => {
  if (!validateForm()) return;

  formLoading.value = true;
  try {
    const payload: any = {
      first_name: formData.value.first_name.trim(),
      last_name: formData.value.last_name.trim(),
      phone: formData.value.phone?.trim() || "",
      email: formData.value.email?.trim() || "",
      birth_date: formData.value.birth_date || null,
      work_place: formData.value.work_place?.trim() || "",
    };

    if (isAdmin.value && formData.value.assigned_manager_id) {
      payload.assigned_manager_id = formData.value.assigned_manager_id;
    }

    if (!editingClient.value) {
      // Create
      const result = await appStore.staffClientCreate(payload);
      if (result.ok && result.data) {
        closeModal();
        await loadClients();
        // Show credentials if they were created
        if (result.data.credentials) {
          createdCredentials.value = result.data.credentials;
          showCredentialsModal.value = true;
        }
      } else {
        // Handle backend validation errors
        if (result.data) {
          const errors = result.data;
          Object.keys(errors).forEach((key) => {
            if (formData.value.hasOwnProperty(key)) {
              formErrors.value[key] = Array.isArray(errors[key]) ? errors[key][0] : errors[key];
            }
          });
        }
      }
    } else {
      // Update - include assigned_manager_id if admin
      if (isAdmin.value) {
        payload.assigned_manager_id = formData.value.assigned_manager_id;
      }
      
      const result = await appStore.staffClientUpdate(editingClient.value.id, payload);
      if (result.ok) {
        closeModal();
        await loadClients();
      } else {
        // Handle backend validation errors
        if (result.data) {
          const errors = result.data;
          Object.keys(errors).forEach((key) => {
            if (formData.value.hasOwnProperty(key)) {
              formErrors.value[key] = Array.isArray(errors[key]) ? errors[key][0] : errors[key];
            }
          });
        }
      }
    }
  } catch (error) {
    console.error("Error submitting form:", error);
    if (error?.response?.data) {
      const errors = error.response.data;
      Object.keys(errors).forEach((key) => {
        if (formData.value.hasOwnProperty(key)) {
          formErrors.value[key] = Array.isArray(errors[key]) ? errors[key][0] : errors[key];
        }
      });
    }
  } finally {
    formLoading.value = false;
  }
};

const handleDelete = async (client: any) => {
  const name = `${client.first_name || ''} ${client.last_name || ''}`.trim();
  if (!confirm(t("clientsManagement.delete.confirm", { name: name || client.email || `${t('common.id')}: ${client.id}` }))) {
    return;
  }

  loading.value = true;
  try {
    const result = await appStore.staffClientDelete(client.id);
    if (result.ok) {
      await loadClients();
    }
  } catch (error) {
    console.error("Error deleting client:", error);
  } finally {
    loading.value = false;
  }
};

const openPasswordModal = (client: any) => {
  resettingPasswordClient.value = client;
  newPassword.value = "";
  passwordError.value = "";
  showPasswordModal.value = true;
};

const closePasswordModal = () => {
  showPasswordModal.value = false;
  resettingPasswordClient.value = null;
  newPassword.value = "";
  passwordError.value = "";
  showPassword.value = false;
};

const handleResetPassword = async () => {
  passwordError.value = "";
  
  if (!newPassword.value || newPassword.value.length < 8) {
    passwordError.value = t("clientsManagement.passwordReset.errors.minLength");
    return;
  }

  if (!resettingPasswordClient.value) return;

  passwordLoading.value = true;
  try {
    const result = await appStore.staffClientSetPassword(resettingPasswordClient.value.id, newPassword.value);
    if (result.ok) {
      closePasswordModal();
      // Show success notification
      const notificationStore = useNotificationStore();
      notificationStore.showNotification({ 
        type: "success", 
        message: t("clientsManagement.passwordReset.success") 
      });
    } else {
      // Handle validation errors
      if (result.data) {
        if (result.data.detail) {
          passwordError.value = result.data.detail;
        } else if (result.data.new_password) {
          passwordError.value = Array.isArray(result.data.new_password) 
            ? result.data.new_password[0] 
            : result.data.new_password;
        } else {
          passwordError.value = t("clientsManagement.passwordReset.errors.failed");
        }
      }
    }
  } catch (error) {
    console.error("Error resetting password:", error);
    passwordError.value = t("clientsManagement.passwordReset.errors.failed");
  } finally {
    passwordLoading.value = false;
  }
};

const handleAssignManager = async (client: any, managerId: number) => {
  if (!isAdmin.value) return;
  
  loading.value = true;
  try {
    const result = await appStore.staffClientAssignManager(client.id, managerId);
    if (result.ok) {
      await loadClients();
    }
  } catch (error) {
    console.error("Error assigning manager:", error);
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  currentPage.value = 1;
  loadClients();
};

const getCardStatusBadgeClass = (status: string) => {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "declined":
      return "bg-red-100 text-red-800";
    case "received":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getDocumentStatusBadgeClass = (status: string) => {
  if (!status) return "bg-gray-100 text-gray-800";
  switch (status.toLowerCase()) {
    case "approved":
      return "bg-green-100 text-green-800";
    case "rejected":
      return "bg-red-100 text-red-800";
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const totalPages = computed(() => Math.ceil(totalCount.value / pageSize.value));

const changePage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
    loadClients();
  }
};

const openCardModal = async (client: any) => {
  viewingCardClient.value = client;
  cardLoading.value = true;
  showCardModal.value = true;
  cardDataErrors.value = {};
  
  try {
    const result = await appStore.staffGetCardByClient(client.id);
    if (result.ok && result.data) {
      currentCardId.value = result.data.id;
      cardData.value = {
        bank_name: result.data.bank_name || "",
        full_name: result.data.full_name || "",
        card_number: result.data.card_number || "",
        cvv: result.data.cvv || "",
        iban: result.data.iban || "",
        bank_bic: result.data.bank_bic || "",
        exp_month: result.data.exp_month || null,
        exp_year: result.data.exp_year || null,
        limit: result.data.limit || "",
      };
    } else {
      // Card not found
      cardData.value = {
        bank_name: "DKB",
        full_name: `${client.first_name || ''} ${client.last_name || ''}`.trim() || "Client",
        card_number: "",
        cvv: "",
        iban: "",
        bank_bic: "",
        exp_month: null,
        exp_year: null,
        limit: "",
      };
      currentCardId.value = null;
    }
  } catch (error) {
    console.error("Error loading card:", error);
  } finally {
    cardLoading.value = false;
  }
};

const closeCardModal = () => {
  showCardModal.value = false;
  viewingCardClient.value = null;
  currentCardId.value = null;
  cardData.value = {
    bank_name: "",
    full_name: "",
    card_number: "",
    cvv: "",
    iban: "",
    bank_bic: "",
    exp_month: null,
    exp_year: null,
    limit: "",
  };
  cardDataErrors.value = {};
};

const formatCardNumber = (value: string) => {
  const digits = value.replace(/\D/g, "");
  return digits.match(/.{1,4}/g)?.join(" ") || digits;
};

const validateCardData = () => {
  cardDataErrors.value = {};
  let isValid = true;

  if (!cardData.value.bank_name?.trim()) {
    cardDataErrors.value.bank_name = t('cardRequests.errors.bankNameRequired');
    isValid = false;
  }

  if (!cardData.value.full_name?.trim()) {
    cardDataErrors.value.full_name = t('cardRequests.errors.fullNameRequired');
    isValid = false;
  }

  const cardNumberDigits = cardData.value.card_number.replace(/\D/g, "");
  if (cardNumberDigits.length < 13 || cardNumberDigits.length > 19) {
    cardDataErrors.value.card_number = t('cardRequests.errors.cardNumberInvalid');
    isValid = false;
  }

  const cvvDigits = cardData.value.cvv.replace(/\D/g, "");
  if (cvvDigits.length !== 3 && cvvDigits.length !== 4) {
    cardDataErrors.value.cvv = t('cardRequests.errors.cvvInvalid');
    isValid = false;
  }

  if (!cardData.value.exp_month || cardData.value.exp_month < 1 || cardData.value.exp_month > 12) {
    cardDataErrors.value.exp_month = t('cardRequests.errors.expMonthInvalid');
    isValid = false;
  }

  const currentYear = new Date().getFullYear();
  if (!cardData.value.exp_year || cardData.value.exp_year < currentYear) {
    cardDataErrors.value.exp_year = t('cardRequests.errors.expYearInvalid');
    isValid = false;
  }

  return isValid;
};

const saveCard = async () => {
  if (!validateCardData()) {
    return;
  }

  cardSaving.value = true;
  try {
    const cardNumberDigits = cardData.value.card_number.replace(/\D/g, "");
    const cvvDigits = cardData.value.cvv.replace(/\D/g, "");
    
    const cardPayload: any = {
      bank_name: cardData.value.bank_name,
      full_name: cardData.value.full_name,
      card_number: cardNumberDigits,
      cvv: cvvDigits,
      iban: cardData.value.iban || "",
      bank_bic: cardData.value.bank_bic || "",
      exp_month: cardData.value.exp_month,
      exp_year: cardData.value.exp_year,
      limit: cardData.value.limit || "0",
    };

    let result;
    if (currentCardId.value) {
      // Update existing card
      result = await appStore.staffUpdateCard(currentCardId.value, cardPayload);
    } else {
      // Create new card
      cardPayload.to_client = viewingCardClient.value.id;
      result = await appStore.staffCreateCard(cardPayload);
    }

    if (result.ok) {
      const notificationStore = useNotificationStore();
      notificationStore.showNotification({
        type: "success",
        message: currentCardId.value ? t('clientsManagement.cardUpdated') : t('clientsManagement.cardCreated')
      });
      closeCardModal();
      await loadClients();
    } else {
      if (result.data) {
        cardDataErrors.value = result.data;
      }
    }
  } catch (error) {
    console.error("Error saving card:", error);
  } finally {
    cardSaving.value = false;
  }
};

onMounted(() => {
  loadClients();
  loadManagers();
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header with Actions -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4 flex-1">
        <!-- Search -->
        <div class="flex-1 max-w-md">
          <div class="relative">
            <input
              v-model="searchQuery"
              @keyup.enter="handleSearch"
              type="text"
              :placeholder="t('clientsManagement.searchPlaceholder')"
              class="w-full px-4 py-2.5 pl-10 pr-4 rounded-xl border border-black/10 bg-white text-[#0B2A3C] placeholder:text-[#6B7E8B] focus:outline-none focus:ring-2 focus:ring-[#006AC7]/20 focus:border-[#006AC7]"
            />
            <svg
              class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7E8B]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        <!-- Card Status Filter -->
        <select
          v-model="cardStatusFilter"
          @change="handleSearch"
          class="px-4 py-2.5 rounded-xl border border-black/10 bg-white text-[#0B2A3C] focus:outline-none focus:ring-2 focus:ring-[#006AC7]/20 focus:border-[#006AC7]"
        >
          <option value="">{{ t('clientsManagement.allCardStatuses') }}</option>
          <option value="pending">{{ t('clientsManagement.status.pending') }}</option>
          <option value="declined">{{ t('clientsManagement.status.declined') }}</option>
          <option value="received">{{ t('clientsManagement.status.received') }}</option>
        </select>

        <!-- Document Status Filter -->
        <select
          v-model="documentStatusFilter"
          @change="handleSearch"
          class="px-4 py-2.5 rounded-xl border border-black/10 bg-white text-[#0B2A3C] focus:outline-none focus:ring-2 focus:ring-[#006AC7]/20 focus:border-[#006AC7]"
        >
          <option value="">{{ t('clientsManagement.allDocumentStatuses') }}</option>
          <option value="pending">{{ t('common.pending') }}</option>
          <option value="approved">{{ t('common.approved') }}</option>
          <option value="rejected">{{ t('common.rejected') }}</option>
        </select>
      </div>

      <!-- Create Button -->
      <button
        @click="openCreateModal"
        class="px-6 py-2.5 bg-[#006AC7] text-white rounded-xl font-semibold hover:bg-[#0055A3] transition flex items-center gap-2"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 5v14M5 12h14" />
        </svg>
        {{ t('clientsManagement.createClient') }}
      </button>
    </div>

    <!-- Clients Table -->
    <div class="bg-white rounded-2xl border border-black/10 shadow-sm overflow-hidden">
      <div v-if="loading" class="p-8 text-center text-[#6B7E8B]">{{ t('clientsManagement.loading') }}</div>
      
      <div v-else-if="clients.length === 0" class="p-8 text-center text-[#6B7E8B]">
        {{ t('clientsManagement.noClients') }}
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-[#F7FBFF] border-b border-black/10">
            <tr>
              <th class="px-6 py-4 text-left text-sm font-semibold text-[#0B2A3C]">{{ t('clientsManagement.table.id') }}</th>
              <th class="px-6 py-4 text-left text-sm font-semibold text-[#0B2A3C]">{{ t('clientsManagement.table.name') }}</th>
              <th class="px-6 py-4 text-left text-sm font-semibold text-[#0B2A3C]">{{ t('clientsManagement.table.email') }}</th>
              <th class="px-6 py-4 text-left text-sm font-semibold text-[#0B2A3C]">{{ t('clientsManagement.table.phone') }}</th>
              <th class="px-6 py-4 text-left text-sm font-semibold text-[#0B2A3C]">{{ t('clientsManagement.table.workPlace') }}</th>
              <th class="px-6 py-4 text-left text-sm font-semibold text-[#0B2A3C]">{{ t('clientsManagement.table.assignedManager') }}</th>
              <th class="px-6 py-4 text-left text-sm font-semibold text-[#0B2A3C]">{{ t('clientsManagement.table.login') }}</th>
              <th class="px-6 py-4 text-left text-sm font-semibold text-[#0B2A3C]">{{ t('clientsManagement.table.cardStatus') }}</th>
              <th class="px-6 py-4 text-left text-sm font-semibold text-[#0B2A3C]">{{ t('clientsManagement.table.documentStatus') }}</th>
              <th class="px-6 py-4 text-left text-sm font-semibold text-[#0B2A3C]">{{ t('clientsManagement.table.card') || 'Card' }}</th>
              <th class="px-6 py-4 text-right text-sm font-semibold text-[#0B2A3C]">{{ t('clientsManagement.table.actions') }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-black/5">
            <tr v-for="client in clients" :key="client.id" class="hover:bg-[#F7FBFF]/50">
              <td class="px-6 py-4 text-sm text-[#0B2A3C]">{{ client.id }}</td>
              <td class="px-6 py-4 text-sm text-[#0B2A3C]">
                {{ `${client.first_name || ''} ${client.last_name || ''}`.trim() || '—' }}
              </td>
              <td class="px-6 py-4 text-sm text-[#0B2A3C]">{{ client.email || '—' }}</td>
              <td class="px-6 py-4 text-sm text-[#0B2A3C]">{{ client.phone || '—' }}</td>
              <td class="px-6 py-4 text-sm text-[#0B2A3C]">{{ client.work_place || '—' }}</td>
              <td class="px-6 py-4 text-sm text-[#0B2A3C]">
                {{ getManagerName(client.assigned_manager_id) }}
              </td>
              <td class="px-6 py-4 text-sm text-[#0B2A3C]">{{ client.login_11 || '—' }}</td>
              <td class="px-6 py-4">
                <span
                  v-if="client.card_status"
                  class="px-3 py-1 rounded-full text-xs font-semibold"
                  :class="getCardStatusBadgeClass(client.card_status)"
                >
                  {{ client.card_status }}
                </span>
                <span v-else class="text-sm text-[#6B7E8B]">—</span>
              </td>
              <td class="px-6 py-4">
                <span
                  v-if="client.document_status !== null"
                  class="px-3 py-1 rounded-full text-xs font-semibold"
                  :class="getDocumentStatusBadgeClass(client.document_status)"
                >
                  {{ client.document_status }}
                </span>
                <span v-else class="text-sm text-[#6B7E8B]">{{t('clientsManagement.table.documentNotUploaded') }}</span>
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-2">
                  <button
                    @click="openCardModal(client)"
                    class="px-3 py-1.5 text-sm text-[#0E6B3B] hover:bg-[#DDF7E9] rounded-lg transition"
                  >
                    {{ t('clientsManagement.actions.viewCard') }}
                  </button>
                </div>
              </td>
              <td class="px-6 py-4 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button
                    @click="openEditModal(client)"
                    class="px-3 py-1.5 text-sm text-[#006AC7] hover:bg-[#E8F3FF] rounded-lg transition"
                  >
                    {{ t('clientsManagement.actions.edit') }}
                  </button>
                  <button
                    @click="openPasswordModal(client)"
                    class="px-3 py-1.5 text-sm text-[#F79E1B] hover:bg-[#FFF3CD] rounded-lg transition"
                    :title="t('clientsManagement.actions.resetPassword')"
                  >
                    {{ t('clientsManagement.actions.resetPassword') }}
                  </button>
                  <button
                    @click="handleDelete(client)"
                    class="px-3 py-1.5 text-sm text-[#CC0000] hover:bg-[#FFE5E5] rounded-lg transition"
                  >
                    {{ t('clientsManagement.actions.delete') }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="px-6 py-4 border-t border-black/10 flex items-center justify-between">
        <div class="text-sm text-[#6B7E8B]">
          {{ t('clientsManagement.pagination.showing', { from: (currentPage - 1) * pageSize + 1, to: Math.min(currentPage * pageSize, totalCount), total: totalCount }) }}
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="changePage(currentPage - 1)"
            :disabled="currentPage === 1"
            class="px-4 py-2 rounded-lg border border-black/10 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black/5 transition"
          >
            {{ t('clientsManagement.pagination.previous') }}
          </button>
          <span class="px-4 py-2 text-sm text-[#0B2A3C]">
            {{ t('clientsManagement.pagination.page', { current: currentPage, total: totalPages }) }}
          </span>
          <button
            @click="changePage(currentPage + 1)"
            :disabled="currentPage === totalPages"
            class="px-4 py-2 rounded-lg border border-black/10 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black/5 transition"
          >
            {{ t('clientsManagement.pagination.next') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Client Modal -->
    <div
      v-if="showModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      @click.self="closeModal"
    >
      <div class="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div class="p-6 border-b border-black/10">
          <h2 class="text-[24px] font-bold text-[#0B2A3C]">
            {{ editingClient ? t('clientsManagement.modal.editClient') : t('clientsManagement.modal.createClient') }}
          </h2>
        </div>

        <form @submit.prevent="submitForm" class="p-6 space-y-4">
          <!-- First Name -->
          <div>
            <label class="block text-sm font-semibold text-[#0B2A3C] mb-2">
              {{ t('clientsManagement.modal.firstName') }} <span class="text-[#CC0000]">*</span>
            </label>
            <input
              v-model="formData.first_name"
              type="text"
              class="w-full px-4 py-2.5 rounded-xl border border-black/10 bg-white text-[#0B2A3C] focus:outline-none focus:ring-2 focus:ring-[#006AC7]/20 focus:border-[#006AC7]"
            />
            <p v-if="formErrors.first_name" class="mt-1 text-sm text-[#CC0000]">{{ formErrors.first_name }}</p>
          </div>

          <!-- Last Name -->
          <div>
            <label class="block text-sm font-semibold text-[#0B2A3C] mb-2">
              {{ t('clientsManagement.modal.lastName') }} <span class="text-[#CC0000]">*</span>
            </label>
            <input
              v-model="formData.last_name"
              type="text"
              class="w-full px-4 py-2.5 rounded-xl border border-black/10 bg-white text-[#0B2A3C] focus:outline-none focus:ring-2 focus:ring-[#006AC7]/20 focus:border-[#006AC7]"
            />
            <p v-if="formErrors.last_name" class="mt-1 text-sm text-[#CC0000]">{{ formErrors.last_name }}</p>
          </div>

          <!-- Email -->
          <div>
            <label class="block text-sm font-semibold text-[#0B2A3C] mb-2">{{ t('clientsManagement.modal.email') }}</label>
            <input
              v-model="formData.email"
              type="email"
              class="w-full px-4 py-2.5 rounded-xl border border-black/10 bg-white text-[#0B2A3C] focus:outline-none focus:ring-2 focus:ring-[#006AC7]/20 focus:border-[#006AC7]"
            />
            <p v-if="formErrors.email" class="mt-1 text-sm text-[#CC0000]">{{ formErrors.email }}</p>
          </div>

          <!-- Phone -->
          <div>
            <label class="block text-sm font-semibold text-[#0B2A3C] mb-2">{{ t('clientsManagement.modal.phone') }}</label>
            <input
              v-model="formData.phone"
              type="tel"
              class="w-full px-4 py-2.5 rounded-xl border border-black/10 bg-white text-[#0B2A3C] focus:outline-none focus:ring-2 focus:ring-[#006AC7]/20 focus:border-[#006AC7]"
            />
            <p v-if="formErrors.phone" class="mt-1 text-sm text-[#CC0000]">{{ formErrors.phone }}</p>
          </div>

          <!-- Birth Date -->
          <div>
            <label class="block text-sm font-semibold text-[#0B2A3C] mb-2">{{ t('clientsManagement.modal.birthDate') }}</label>
            <input
              v-model="formData.birth_date"
              type="date"
              class="w-full px-4 py-2.5 rounded-xl border border-black/10 bg-white text-[#0B2A3C] focus:outline-none focus:ring-2 focus:ring-[#006AC7]/20 focus:border-[#006AC7]"
            />
          </div>

          <!-- Work Place -->
          <div>
            <label class="block text-sm font-semibold text-[#0B2A3C] mb-2">{{ t('clientsManagement.modal.workPlace') }}</label>
            <input
              v-model="formData.work_place"
              type="text"
              class="w-full px-4 py-2.5 rounded-xl border border-black/10 bg-white text-[#0B2A3C] focus:outline-none focus:ring-2 focus:ring-[#006AC7]/20 focus:border-[#006AC7]"
            />
            <p v-if="formErrors.work_place" class="mt-1 text-sm text-[#CC0000]">{{ formErrors.work_place }}</p>
          </div>

          <!-- Assigned Manager (Admin only) -->
          <div v-if="isAdmin">
            <label class="block text-sm font-semibold text-[#0B2A3C] mb-2">{{ t('clientsManagement.modal.assignedManager') }}</label>
            <select
              v-model="formData.assigned_manager_id"
              class="w-full px-4 py-2.5 rounded-xl border border-black/10 bg-white text-[#0B2A3C] focus:outline-none focus:ring-2 focus:ring-[#006AC7]/20 focus:border-[#006AC7]"
            >
              <option :value="null">{{ t('clientsManagement.modal.noManager') }}</option>
              <option v-for="manager in managers" :key="manager.id" :value="manager.id">
                {{ manager.first_name }} {{ manager.last_name }} ({{ manager.email }})
              </option>
            </select>
          </div>

          <!-- Form Actions -->
          <div class="flex items-center justify-end gap-3 pt-4 border-t border-black/10">
            <button
              type="button"
              @click="closeModal"
              class="px-6 py-2.5 rounded-xl border border-black/10 text-[#0B2A3C] font-semibold hover:bg-black/5 transition"
            >
              {{ t('clientsManagement.modal.cancel') }}
            </button>
            <button
              type="submit"
              :disabled="formLoading"
              class="px-6 py-2.5 bg-[#006AC7] text-white rounded-xl font-semibold hover:bg-[#0055A3] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ formLoading ? t('clientsManagement.modal.saving') : (editingClient ? t('clientsManagement.modal.update') : t('clientsManagement.modal.create')) }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Credentials Modal -->
    <div
      v-if="showCredentialsModal && createdCredentials"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      @click.self="closeCredentialsModal"
    >
      <div class="bg-white rounded-2xl shadow-xl max-w-md w-full">
        <div class="p-6 border-b border-black/10">
          <h2 class="text-[24px] font-bold text-[#0B2A3C]">{{ t('clientsManagement.credentials.title') }}</h2>
          <p class="text-sm text-[#6B7E8B] mt-1">{{ t('clientsManagement.credentials.subtitle') }}</p>
        </div>

        <div class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-semibold text-[#0B2A3C] mb-2">{{ t('clientsManagement.credentials.login') }}</label>
            <div class="px-4 py-2.5 rounded-xl border border-black/10 bg-[#F7FBFF] text-[#0B2A3C] font-mono">
              {{ createdCredentials.login_11 }}
            </div>
          </div>

          <div>
            <label class="block text-sm font-semibold text-[#0B2A3C] mb-2">{{ t('clientsManagement.credentials.tempPassword') }}</label>
            <div class="px-4 py-2.5 rounded-xl border border-black/10 bg-[#F7FBFF] text-[#0B2A3C] font-mono">
              {{ createdCredentials.temp_password }}
            </div>
          </div>

          <div v-if="createdCredentials.first_login_required" class="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p class="text-sm text-yellow-800">
              <strong>{{ t('common.note') }}:</strong> {{ t('clientsManagement.credentials.note') }}
            </p>
          </div>
        </div>

        <div class="p-6 border-t border-black/10 flex justify-end">
          <button
            @click="closeCredentialsModal"
            class="px-6 py-2.5 bg-[#006AC7] text-white rounded-xl font-semibold hover:bg-[#0055A3] transition"
          >
            {{ t('clientsManagement.credentials.ok') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Password Reset Modal -->
    <div
      v-if="showPasswordModal && resettingPasswordClient"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      @click.self="closePasswordModal"
    >
      <div class="bg-white rounded-2xl shadow-xl max-w-md w-full">
        <div class="p-6 border-b border-black/10">
          <h2 class="text-[24px] font-bold text-[#0B2A3C]">{{ t('clientsManagement.passwordReset.title') }}</h2>
          <p class="text-sm text-[#6B7E8B] mt-1">
            {{ t('clientsManagement.passwordReset.subtitle', { 
              name: `${resettingPasswordClient.first_name || ''} ${resettingPasswordClient.last_name || ''}`.trim() || resettingPasswordClient.email || `${t('common.id')}: ${resettingPasswordClient.id}`
            }) }}
          </p>
        </div>

        <form @submit.prevent="handleResetPassword" class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-semibold text-[#0B2A3C] mb-2">
              {{ t('clientsManagement.passwordReset.newPassword') }} <span class="text-[#CC0000]">*</span>
            </label>
            <div class="relative">
              <input
                v-model="newPassword"
                :type="showPassword ? 'text' : 'password'"
                class="w-full px-4 py-2.5 pr-12 rounded-xl border border-black/10 bg-white text-[#0B2A3C] focus:outline-none focus:ring-2 focus:ring-[#006AC7]/20 focus:border-[#006AC7]"
                :placeholder="t('clientsManagement.passwordReset.passwordPlaceholder')"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7E8B] hover:text-[#0B2A3C] transition-colors"
              >
                <svg v-if="showPassword" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
                <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path>
                  <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path>
                  <path d="M6.61 6.61A13.16 13.16 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path>
                  <line x1="2" y1="2" x2="22" y2="22"></line>
                </svg>
              </button>
            </div>
            <p v-if="passwordError" class="mt-1 text-sm text-[#CC0000]">{{ passwordError }}</p>
            <p class="mt-1 text-xs text-[#6B7E8B]">{{ t('clientsManagement.passwordReset.passwordHint') }}</p>
          </div>

          <div class="flex items-center justify-end gap-3 pt-4 border-t border-black/10">
            <button
              type="button"
              @click="closePasswordModal"
              class="px-6 py-2.5 rounded-xl border border-black/10 text-[#0B2A3C] font-semibold hover:bg-black/5 transition"
            >
              {{ t('clientsManagement.modal.cancel') }}
            </button>
            <button
              type="submit"
              :disabled="passwordLoading"
              class="px-6 py-2.5 bg-[#006AC7] text-white rounded-xl font-semibold hover:bg-[#0055A3] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ passwordLoading ? t('clientsManagement.passwordReset.resetting') : t('clientsManagement.passwordReset.reset') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Card View/Edit Modal -->
    <div
      v-if="showCardModal && viewingCardClient"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      @click.self="closeCardModal"
    >
      <div class="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div class="p-6 border-b border-black/10">
          <h2 class="text-[24px] font-bold text-[#0B2A3C]">{{ t('clientsManagement.cardModal.title') }}</h2>
          <p class="text-sm text-[#6B7E8B] mt-1">
            {{ t('clientsManagement.cardModal.subtitle', { 
              name: `${viewingCardClient.first_name || ''} ${viewingCardClient.last_name || ''}`.trim() || viewingCardClient.email || `${t('common.id')}: ${viewingCardClient.id}`
            }) }}
          </p>
        </div>

        <div v-if="cardLoading" class="p-6 text-center text-[#6B7E8B]">
          {{ t('common.loading') }}
        </div>

        <form v-else @submit.prevent="saveCard" class="p-6 space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Bank Name -->
            <div>
              <label class="block text-sm font-semibold text-[#0B2A3C] mb-2">{{ t('cardRequests.cardForm.bankName') }} <span class="text-[#CC0000]">*</span></label>
              <input
                v-model="cardData.bank_name"
                type="text"
                class="w-full px-4 py-2.5 rounded-xl border border-black/10 bg-white text-[#0B2A3C] focus:outline-none focus:ring-2 focus:ring-[#006AC7]/20 focus:border-[#006AC7]"
              />
              <p v-if="cardDataErrors.bank_name" class="mt-1 text-sm text-[#CC0000]">{{ cardDataErrors.bank_name }}</p>
            </div>

            <!-- Full Name -->
            <div>
              <label class="block text-sm font-semibold text-[#0B2A3C] mb-2">{{ t('cardRequests.cardForm.fullName') }} <span class="text-[#CC0000]">*</span></label>
              <input
                v-model="cardData.full_name"
                type="text"
                class="w-full px-4 py-2.5 rounded-xl border border-black/10 bg-white text-[#0B2A3C] focus:outline-none focus:ring-2 focus:ring-[#006AC7]/20 focus:border-[#006AC7]"
              />
              <p v-if="cardDataErrors.full_name" class="mt-1 text-sm text-[#CC0000]">{{ cardDataErrors.full_name }}</p>
            </div>

            <!-- Card Number -->
            <div>
              <label class="block text-sm font-semibold text-[#0B2A3C] mb-2">{{ t('cardRequests.cardForm.cardNumber') }} <span class="text-[#CC0000]">*</span></label>
              <input
                v-model="cardData.card_number"
                @input="cardData.card_number = formatCardNumber(cardData.card_number)"
                type="text"
                maxlength="19"
                placeholder="0000 0000 0000 0000"
                class="w-full px-4 py-2.5 rounded-xl border border-black/10 bg-white text-[#0B2A3C] focus:outline-none focus:ring-2 focus:ring-[#006AC7]/20 focus:border-[#006AC7]"
              />
              <p v-if="cardDataErrors.card_number" class="mt-1 text-sm text-[#CC0000]">{{ cardDataErrors.card_number }}</p>
            </div>

            <!-- CVV -->
            <div>
              <label class="block text-sm font-semibold text-[#0B2A3C] mb-2">{{ t('cardRequests.cardForm.cvv') }} <span class="text-[#CC0000]">*</span></label>
              <input
                v-model="cardData.cvv"
                type="text"
                maxlength="4"
                placeholder="000"
                class="w-full px-4 py-2.5 rounded-xl border border-black/10 bg-white text-[#0B2A3C] focus:outline-none focus:ring-2 focus:ring-[#006AC7]/20 focus:border-[#006AC7]"
              />
              <p v-if="cardDataErrors.cvv" class="mt-1 text-sm text-[#CC0000]">{{ cardDataErrors.cvv }}</p>
            </div>

            <!-- IBAN -->
            <div>
              <label class="block text-sm font-semibold text-[#0B2A3C] mb-2">{{ t('cardRequests.cardForm.iban') }}</label>
              <input
                v-model="cardData.iban"
                type="text"
                class="w-full px-4 py-2.5 rounded-xl border border-black/10 bg-white text-[#0B2A3C] focus:outline-none focus:ring-2 focus:ring-[#006AC7]/20 focus:border-[#006AC7]"
              />
              <p v-if="cardDataErrors.iban" class="mt-1 text-sm text-[#CC0000]">{{ cardDataErrors.iban }}</p>
            </div>

            <!-- BIC -->
            <div>
              <label class="block text-sm font-semibold text-[#0B2A3C] mb-2">{{ t('cardRequests.cardForm.bic') }}</label>
              <input
                v-model="cardData.bank_bic"
                type="text"
                class="w-full px-4 py-2.5 rounded-xl border border-black/10 bg-white text-[#0B2A3C] focus:outline-none focus:ring-2 focus:ring-[#006AC7]/20 focus:border-[#006AC7]"
              />
              <p v-if="cardDataErrors.bank_bic" class="mt-1 text-sm text-[#CC0000]">{{ cardDataErrors.bank_bic }}</p>
            </div>

            <!-- Exp Month -->
            <div>
              <label class="block text-sm font-semibold text-[#0B2A3C] mb-2">{{ t('cardRequests.cardForm.expMonth') }} <span class="text-[#CC0000]">*</span></label>
              <input
                v-model.number="cardData.exp_month"
                type="number"
                min="1"
                max="12"
                placeholder="12"
                class="w-full px-4 py-2.5 rounded-xl border border-black/10 bg-white text-[#0B2A3C] focus:outline-none focus:ring-2 focus:ring-[#006AC7]/20 focus:border-[#006AC7]"
              />
              <p v-if="cardDataErrors.exp_month" class="mt-1 text-sm text-[#CC0000]">{{ cardDataErrors.exp_month }}</p>
            </div>

            <!-- Exp Year -->
            <div>
              <label class="block text-sm font-semibold text-[#0B2A3C] mb-2">{{ t('cardRequests.cardForm.expYear') }} <span class="text-[#CC0000]">*</span></label>
              <input
                v-model.number="cardData.exp_year"
                type="number"
                :min="new Date().getFullYear()"
                placeholder="2026"
                class="w-full px-4 py-2.5 rounded-xl border border-black/10 bg-white text-[#0B2A3C] focus:outline-none focus:ring-2 focus:ring-[#006AC7]/20 focus:border-[#006AC7]"
              />
              <p v-if="cardDataErrors.exp_year" class="mt-1 text-sm text-[#CC0000]">{{ cardDataErrors.exp_year }}</p>
            </div>

            <!-- Limit -->
            <div>
              <label class="block text-sm font-semibold text-[#0B2A3C] mb-2">{{ t('cardRequests.cardForm.limit') }}</label>
              <input
                v-model="cardData.limit"
                type="text"
                class="w-full px-4 py-2.5 rounded-xl border border-black/10 bg-white text-[#0B2A3C] focus:outline-none focus:ring-2 focus:ring-[#006AC7]/20 focus:border-[#006AC7]"
              />
              <p v-if="cardDataErrors.limit" class="mt-1 text-sm text-[#CC0000]">{{ cardDataErrors.limit }}</p>
            </div>
          </div>

          <div class="flex items-center justify-end gap-3 pt-4 border-t border-black/10">
            <button
              type="button"
              @click="closeCardModal"
              class="px-6 py-2.5 rounded-xl border border-black/10 text-[#0B2A3C] font-semibold hover:bg-black/5 transition"
            >
              {{ t('clientsManagement.modal.cancel') }}
            </button>
            <button
              type="submit"
              :disabled="cardSaving"
              class="px-6 py-2.5 bg-[#006AC7] text-white rounded-xl font-semibold hover:bg-[#0055A3] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ cardSaving ? t('clientsManagement.modal.saving') : (currentCardId ? t('clientsManagement.cardModal.update') : t('clientsManagement.cardModal.create')) }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

