<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useAppStore } from "@/stores/app.js";
import { useNotificationStore } from "@/stores/notification.js";

const { t } = useI18n();
const appStore = useAppStore();
const notificationStore = useNotificationStore();

const loading = ref(false);
const cardRequests = ref<any[]>([]);
const documents = ref<any[]>([]);
const documentsMap = ref<Record<number, any>>({});

const showDocumentModal = ref(false);
const selectedDocument = ref<any>(null);
const showReviewModal = ref(false);
const reviewingDocument = ref<any>(null);
const reviewingClient = ref<any>(null);
const reviewComment = ref("");
const reviewStatus = ref<"approved" | "rejected">("approved");
const approveCardRequest = ref(false);
const cardData = ref({
  bank_name: "DKB",
  full_name: "",
  card_number: "",
  cvv: "",
  iban: "",
  bank_bic: "",
  exp_month: null as number | null,
  exp_year: null as number | null,
  limit: "-", // строка, как в примере
});

const cardDataErrors = ref({
  bank_name: "",
  full_name: "",
  card_number: "",
  cvv: "",
  iban: "",
  bank_bic: "",
  exp_month: "",
  exp_year: "",
  limit: "",
});

const showCreateCardModal = ref(false);
const creatingCardClient = ref<any>(null);
const cardFormData = ref({
  bank_name: "DKB",
  full_name: "",
  card_number: "",
  cvv: "",
  iban: "",
  bank_bic: "",
  exp_month: null as number | null,
  exp_year: null as number | null,
  limit: "-",
});

// Card view/edit modal
const showCardModal = ref(false);
const viewingCardClient = ref<any>(null);
const currentCardId = ref<number | null>(null);
const cardLoading = ref(false);
const cardSaving = ref(false);
const cardViewData = ref({
  bank_name: "",
  full_name: "",
  card_number: "",
  cvv: "",
  iban: "",
  bank_bic: "",
  exp_month: null as number | null,
  exp_year: null as number | null,
  limit: "",
  balance: "",
});
const cardViewErrors = ref({
  bank_name: "",
  full_name: "",
  card_number: "",
  cvv: "",
  iban: "",
  bank_bic: "",
  exp_month: "",
  exp_year: "",
  limit: "",
  balance: "",
});

const emptyCardViewErrors = () => ({
  bank_name: "",
  full_name: "",
  card_number: "",
  cvv: "",
  iban: "",
  bank_bic: "",
  exp_month: "",
  exp_year: "",
  limit: "",
  balance: "",
});

const loadCardRequests = async () => {
  loading.value = true;
  try {
    // Load all documents (to see all clients with uploaded documents)
    const documentsResult = await appStore.staffDocumentsList({});
    if (documentsResult.ok && documentsResult.data) {
      documents.value = documentsResult.data;
      
        // Get unique client IDs from documents
        const clientIdsWithDocuments = Array.from(new Set(documentsResult.data.map((doc: any) => doc.client_id)));
      
      // Create documents map
      const map: Record<number, any> = {};
      documentsResult.data.forEach((doc: any) => {
        map[doc.client_id] = doc;
      });
      documentsMap.value = map;
      
      // Load all clients
      const clientsResult = await appStore.staffClientsList({});
      if (clientsResult.ok && clientsResult.data) {
        const allClients = clientsResult.data.results || clientsResult.data;
        
        // Show clients that have documents OR have pending card status
        cardRequests.value = allClients.filter((c: any) => 
          clientIdsWithDocuments.includes(c.id) || c.card_status === "pending"
        );
      }
    }
  } catch (error) {
    console.error("Error loading card requests:", error);
  } finally {
    loading.value = false;
  }
};

const loadDocuments = async (clientIds: number[]) => {
  try {
    const result = await appStore.staffDocumentsList({});
    if (result.ok && result.data) {
      documents.value = result.data;
      // Create map for quick lookup
      const map: Record<number, any> = {};
      result.data.forEach((doc: any) => {
        if (clientIds.includes(doc.client_id)) {
          map[doc.client_id] = doc;
        }
      });
      documentsMap.value = map;
    }
  } catch (error) {
    console.error("Error loading documents:", error);
  }
};

const getDocumentForClient = (clientId: number) => {
  return documentsMap.value[clientId] || null;
};

const openDocumentViewer = (client: any) => {
  const doc = getDocumentForClient(client.id);
  if (doc && (doc.file || doc.front_side || doc.back_side || doc.bank_statement)) {
    selectedDocument.value = doc;
    showDocumentModal.value = true;
  }
};

const openReviewModal = (client: any) => {
  const doc = getDocumentForClient(client.id);
  if (doc) {
    reviewingDocument.value = doc;
    reviewingClient.value = client;
    reviewComment.value = doc.review_comment || "";
    reviewStatus.value = doc.status === "approved" ? "approved" : doc.status === "rejected" ? "rejected" : "approved";
    approveCardRequest.value = false;
    
    // Initialize card data with client's name
    const fullName = `${client.first_name || ''} ${client.last_name || ''}`.trim();
    cardData.value = {
      bank_name: "DKB",
      full_name: fullName || "",
      card_number: "",
      cvv: "",
      iban: "",
      bank_bic: "",
      exp_month: null,
      exp_year: null,
      limit: "-",
    };
    cardDataErrors.value = {
      bank_name: "",
      full_name: "",
      card_number: "",
      cvv: "",
      iban: "",
      bank_bic: "",
      exp_month: "",
      exp_year: "",
      limit: "",
    };
    
    showReviewModal.value = true;
  }
};

const closeDocumentModal = () => {
  showDocumentModal.value = false;
  selectedDocument.value = null;
};

const closeReviewModal = () => {
  showReviewModal.value = false;
  reviewingDocument.value = null;
  reviewingClient.value = null;
  reviewComment.value = "";
  approveCardRequest.value = false;
  cardData.value = {
    bank_name: "DKB",
    full_name: "",
    card_number: "",
    cvv: "",
    iban: "",
    bank_bic: "",
    exp_month: null,
    exp_year: null,
    limit: "-",
  };
  cardDataErrors.value = {
    bank_name: "",
    full_name: "",
    card_number: "",
    cvv: "",
    iban: "",
    bank_bic: "",
    exp_month: "",
    exp_year: "",
    limit: "",
  };
};

const validateCardData = () => {
  let isValid = true;
  cardDataErrors.value = {
    bank_name: "",
    full_name: "",
    card_number: "",
    cvv: "",
    iban: "",
    bank_bic: "",
    exp_month: "",
    exp_year: "",
    limit: "",
  };


  if (!cardData.value.bank_name || cardData.value.bank_name.trim() === "") {
    cardDataErrors.value.bank_name = t('cardRequests.cardForm.errors.bankNameRequired');
    isValid = false;
  }

  if (!cardData.value.full_name || cardData.value.full_name.trim() === "") {
    cardDataErrors.value.full_name = t('cardRequests.cardForm.errors.fullNameRequired');
    isValid = false;
  }

  if (!cardData.value.card_number || cardData.value.card_number.trim() === "") {
    cardDataErrors.value.card_number = t('cardRequests.cardForm.errors.cardNumberRequired');
    isValid = false;
  } else if (!/^\d{16}$/.test(cardData.value.card_number.replace(/\s/g, ''))) {
    cardDataErrors.value.card_number = t('cardRequests.cardForm.errors.cardNumberInvalid');
    isValid = false;
  }

  if (cardData.value.exp_month === null || cardData.value.exp_month < 1 || cardData.value.exp_month > 12) {
    cardDataErrors.value.exp_month = t('cardRequests.cardForm.errors.expMonthInvalid');
    isValid = false;
  }

  const currentYear = new Date().getFullYear();
  if (cardData.value.exp_year === null || cardData.value.exp_year < currentYear) {
    cardDataErrors.value.exp_year = t('cardRequests.cardForm.errors.expYearInvalid');
    isValid = false;
  }

  return isValid;
};

const submitReview = async () => {
  if (!reviewingDocument.value || !reviewingClient.value) return;

  // Validate card data if approving card request
  if (reviewStatus.value === "approved" && approveCardRequest.value && reviewingClient.value.card_status === "pending") {
    if (!validateCardData()) {
      return;
    }
  }

  loading.value = true;
  try {
    // First, review the document
    const docResult = await appStore.staffDocumentReview(reviewingDocument.value.id, {
      status: reviewStatus.value,
      review_comment: reviewComment.value,
    });

    if (docResult.ok) {
      // Document and card request are processed together
      // If document is approved and user wants to create card, do it
      if (reviewStatus.value === "approved" && approveCardRequest.value && reviewingClient.value.card_status === "pending") {
        // Create actual card for client with manually entered data
        const cardResult = await appStore.staffCreateCard({
          to_client: reviewingClient.value.id,
          bank_name: cardData.value.bank_name,
          full_name: cardData.value.full_name,
          card_number: cardData.value.card_number, // уже нормализован
          cvv: cardData.value.cvv,
          iban: cardData.value.iban,
          bank_bic: cardData.value.bank_bic,
          exp_month: cardData.value.exp_month,
          exp_year: cardData.value.exp_year,
          limit: cardData.value.limit,
        });
        if (!cardResult.ok) {
          console.error("Error creating card:", cardResult.data);
          appStore.notifyError(cardResult.data || "Error creating card");
          return;
        }
      }
      // If document is rejected, automatically decline card request
      else if (reviewStatus.value === "rejected") {
        // Reject document and decline card request
        const cardResult = await appStore.staffClientUpdate(reviewingClient.value.id, {
          card_status: "declined",
        });
        if (!cardResult.ok) {
          console.error("Error declining card request:", cardResult.data);
        }
      }
      // If document is approved but card request not approved yet, just update document status
      // Card request remains "pending" until manager explicitly approves it

      closeReviewModal();
      await loadCardRequests();
    }
  } catch (error) {
    console.error("Error reviewing document:", error);
  } finally {
    loading.value = false;
  }
};

const getCardStatusBadgeClass = (status: string) => {
  switch (status) {
    case "received":
      return "bg-green-100 text-green-800";
    case "declined":
      return "bg-red-100 text-red-800";
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getDocumentStatusBadgeClass = (status: string) => {
  switch (status) {
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

const generateCardNumber = () => {
  // Generate a 16-digit card number (starting with 4 for Visa)
  let cardNumber = "4";
  for (let i = 0; i < 15; i++) {
    cardNumber += Math.floor(Math.random() * 10).toString();
  }
  return cardNumber;
};

const canCreateCard = (client: any) => {
  const doc = getDocumentForClient(client.id);
  return doc?.status === "approved" && client.card_status === "pending";
};

const openCreateCardModal = (client: any) => {
  creatingCardClient.value = client;
  const fullName = `${client.first_name || ''} ${client.last_name || ''}`.trim();
  cardFormData.value = {
    bank_name: "DKB",
    full_name: fullName || "Client",
    card_number: generateCardNumber(),
    cvv: "",
    iban: "",
    bank_bic: "",
    exp_month: null,
    exp_year: null,
    limit: "-",
  };
  showCreateCardModal.value = true;
};

const closeCreateCardModal = () => {
  showCreateCardModal.value = false;
  creatingCardClient.value = null;
  cardFormData.value = {
    bank_name: "DKB",
    full_name: "",
    card_number: "",
    cvv: "",
    iban: "",
    bank_bic: "",
    exp_month: null,
    exp_year: null,
    limit: "-",
  };
};

const createCard = async () => {
  if (!creatingCardClient.value) return;

  loading.value = true;
  try {
    const result = await appStore.staffCreateCard({
      to_client: creatingCardClient.value.id,
      ...cardFormData.value,
    });

    if (!result.ok) {
      appStore.notifyError(result.data || "Error creating card");
      return;
    }

    closeCreateCardModal();
    await loadCardRequests();
  } catch (error) {
    console.error("Error creating card:", error);
    appStore.notifyError(error, "Error creating card");
  } finally {
    loading.value = false;
  }
};

const openCardModal = async (client: any) => {
  viewingCardClient.value = client;
  cardLoading.value = true;
  showCardModal.value = true;
  cardViewErrors.value = emptyCardViewErrors();
  
  try {
    // First, get card by client to find card ID
    const cardByClientResult = await appStore.staffGetCardByClient(client.id);
    if (cardByClientResult.ok && cardByClientResult.data && cardByClientResult.data.id) {
      // Card exists, get full card data by card ID
      currentCardId.value = cardByClientResult.data.id;
      const cardResult = await appStore.staffGetCard(currentCardId.value);
      
      if (cardResult.ok && cardResult.data) {
        // Populate form with card data
        cardViewData.value = {
          bank_name: cardResult.data.bank_name || "",
          full_name: cardResult.data.full_name || "",
          card_number: cardResult.data.card_number || "",
          cvv: cardResult.data.cvv || "",
          iban: cardResult.data.iban || "",
          bank_bic: cardResult.data.bank_bic || "",
          exp_month: cardResult.data.exp_month || null,
          exp_year: cardResult.data.exp_year || null,
          limit: cardResult.data.limit || "",
          balance: cardResult.data.balance || "0.00",
        };
      } else {
        // Fallback: use data from cardByClientResult
        cardViewData.value = {
          bank_name: cardByClientResult.data.bank_name || "",
          full_name: cardByClientResult.data.full_name || "",
          card_number: cardByClientResult.data.card_number || "",
          cvv: cardByClientResult.data.cvv || "",
          iban: cardByClientResult.data.iban || "",
          bank_bic: cardByClientResult.data.bank_bic || "",
          exp_month: cardByClientResult.data.exp_month || null,
          exp_year: cardByClientResult.data.exp_year || null,
          limit: cardByClientResult.data.limit || "",
          balance: cardByClientResult.data.balance || "0.00",
        };
      }
    } else {
      // Card not found - prepare form for creating new card
      cardViewData.value = {
        bank_name: "DKB",
        full_name: `${client.first_name || ''} ${client.last_name || ''}`.trim() || "Client",
        card_number: "",
        cvv: "",
        iban: "",
        bank_bic: "",
        exp_month: null,
        exp_year: null,
        limit: "",
        balance: "0.00",
      };
      currentCardId.value = null;
    }
  } catch (error) {
    console.error("Error loading card:", error);
    // On error, prepare form for creating new card
    cardViewData.value = {
      bank_name: "DKB",
      full_name: `${client.first_name || ''} ${client.last_name || ''}`.trim() || "Client",
      card_number: "",
      cvv: "",
      iban: "",
      bank_bic: "",
      exp_month: null,
      exp_year: null,
      limit: "",
      balance: "0.00",
    };
    currentCardId.value = null;
  } finally {
    cardLoading.value = false;
  }
};

const closeCardModal = () => {
  showCardModal.value = false;
  viewingCardClient.value = null;
  currentCardId.value = null;
  cardViewData.value = {
    bank_name: "",
    full_name: "",
    card_number: "",
    cvv: "",
    iban: "",
    bank_bic: "",
    exp_month: null,
    exp_year: null,
    limit: "",
    balance: "",
  };
  cardViewErrors.value = emptyCardViewErrors();
};

const formatCardNumber = (value: string) => {
  const digits = value.replace(/\D/g, "");
  return digits.match(/.{1,4}/g)?.join(" ") || digits;
};

const validateCardViewData = () => {
  cardViewErrors.value = emptyCardViewErrors();
  let isValid = true;

  if (!cardViewData.value.bank_name || cardViewData.value.bank_name.trim() === "") {
    cardViewErrors.value.bank_name = "Bank name is required";
    isValid = false;
  }

  if (!cardViewData.value.full_name || cardViewData.value.full_name.trim() === "") {
    cardViewErrors.value.full_name = "Full name is required";
    isValid = false;
  }

  if (!cardViewData.value.card_number || cardViewData.value.card_number.trim() === "") {
    cardViewErrors.value.card_number = "Card number is required";
    isValid = false;
  } else {
    const digits = cardViewData.value.card_number.replace(/\D/g, "");
    if (digits.length < 13 || digits.length > 19) {
      cardViewErrors.value.card_number = "Card number must be 13-19 digits";
      isValid = false;
    }
  }

  if (!cardViewData.value.cvv || cardViewData.value.cvv.trim() === "") {
    cardViewErrors.value.cvv = "CVV is required";
    isValid = false;
  } else {
    const digits = cardViewData.value.cvv.replace(/\D/g, "");
    if (digits.length !== 3 && digits.length !== 4) {
      cardViewErrors.value.cvv = "CVV must be 3 or 4 digits";
      isValid = false;
    }
  }

  if (cardViewData.value.exp_month === null || cardViewData.value.exp_month < 1 || cardViewData.value.exp_month > 12) {
    cardViewErrors.value.exp_month = "Expiration month must be 1-12";
    isValid = false;
  }

  const currentYear = new Date().getFullYear();
  if (cardViewData.value.exp_year === null || cardViewData.value.exp_year < currentYear) {
    cardViewErrors.value.exp_year = "Expiration year must be current or future year";
    isValid = false;
  }

  return isValid;
};

const saveCard = async () => {
  if (!validateCardViewData()) {
    return;
  }

  cardSaving.value = true;
  try {
    const cardNumberDigits = cardViewData.value.card_number.replace(/\D/g, "");
    const cvvDigits = cardViewData.value.cvv.replace(/\D/g, "");
    
    const cardPayload: any = {
      bank_name: cardViewData.value.bank_name,
      full_name: cardViewData.value.full_name,
      card_number: cardNumberDigits,
      cvv: cvvDigits,
      iban: cardViewData.value.iban || "",
      bank_bic: cardViewData.value.bank_bic || "",
      exp_month: cardViewData.value.exp_month,
      exp_year: cardViewData.value.exp_year,
      limit: cardViewData.value.limit || "0",
      balance: cardViewData.value.balance || "0.00",
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
      notificationStore.showNotification({
        type: "success",
        message: currentCardId.value ? "Card updated successfully" : "Card created successfully"
      });
      closeCardModal();
      await loadCardRequests();
    } else {
      if (result.data) {
        cardViewErrors.value = result.data;
      }
    }
  } catch (error) {
    console.error("Error saving card:", error);
  } finally {
    cardSaving.value = false;
  }
};

const getDocumentUrl = (filePath: string) => {
  if (!filePath) return "";
  // If already a full URL, return as is
  if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
    return filePath;
  }
  // Otherwise, construct full URL
  const baseUrl = appStore.base_url.replace("/api", "");
  return `${baseUrl}${filePath.startsWith("/") ? "" : "/"}${filePath}`;
};

const isImageFile = (filePath: string) => {
  if (!filePath) return false;
  const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"];
  const lowerPath = filePath.toLowerCase();
  return imageExtensions.some((ext) => lowerPath.endsWith(ext));
};

onMounted(() => {
  loadCardRequests();
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-[24px] font-bold text-[#0B2A3C]">{{ t('cardRequests.title') }}</h2>
        <p class="text-sm text-[#6B7E8B] mt-1">
          {{ t('cardRequests.subtitle') }}
        </p>
      </div>
    </div>

    <!-- Card Requests Table -->
    <div class="bg-white rounded-2xl border border-black/10 shadow-sm overflow-hidden">
      <div v-if="loading" class="p-8 text-center text-[#6B7E8B]">{{ t('cardRequests.loading') }}</div>
      
      <div v-else-if="cardRequests.length === 0" class="p-8 text-center text-[#6B7E8B]">
        {{ t('cardRequests.noClients') }}
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full min-w-[1200px]">
          <thead class="bg-[#F7FBFF] border-b border-black/10">
            <tr>
              <th class="px-4 py-4 text-left text-sm font-semibold text-[#0B2A3C] w-16">{{ t('cardRequests.table.id') }}</th>
              <th class="px-4 py-4 text-left text-sm font-semibold text-[#0B2A3C] w-40">{{ t('cardRequests.table.clientName') }}</th>
              <th class="px-4 py-4 text-left text-sm font-semibold text-[#0B2A3C] w-48">{{ t('cardRequests.table.email') }}</th>
              <th class="px-4 py-4 text-left text-sm font-semibold text-[#0B2A3C] w-32">{{ t('cardRequests.table.phone') }}</th>
              <th class="px-4 py-4 text-left text-sm font-semibold text-[#0B2A3C] w-36">{{ t('cardRequests.table.documentStatus') }}</th>
              <th class="px-4 py-4 text-left text-sm font-semibold text-[#0B2A3C] w-32">{{ t('cardRequests.table.cardStatus') }}</th>
              <th class="px-4 py-4 text-left text-sm font-semibold text-[#0B2A3C] w-24">{{ t('cardRequests.table.document') }}</th>
              <th class="px-4 py-4 text-left text-sm font-semibold text-[#0B2A3C] w-24">{{ t('cardRequests.table.card') }}</th>
              <th class="px-4 py-4 text-right text-sm font-semibold text-[#0B2A3C] w-40">{{ t('cardRequests.table.actions') }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-black/5">
            <tr v-for="client in cardRequests" :key="client.id" class="hover:bg-[#F7FBFF]/50">
              <td class="px-4 py-4 text-sm text-[#0B2A3C]">{{ client.id }}</td>
              <td class="px-4 py-4 text-sm text-[#0B2A3C] truncate">
                {{ `${client.first_name || ''} ${client.last_name || ''}`.trim() || '—' }}
              </td>
              <td class="px-4 py-4 text-sm text-[#0B2A3C] truncate">{{ client.email || '—' }}</td>
              <td class="px-4 py-4 text-sm text-[#0B2A3C]">{{ client.phone || '—' }}</td>
              <td class="px-4 py-4">
                <span
                  v-if="getDocumentForClient(client.id)"
                  class="px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
                  :class="getDocumentStatusBadgeClass(getDocumentForClient(client.id).status)"
                >
                  {{ getDocumentForClient(client.id).status }}
                </span>
                <span v-else class="text-sm text-[#6B7E8B]">{{ t('cardRequests.table.noDocument') }}</span>
              </td>
              <td class="px-4 py-4">
                <span
                  v-if="client.card_status"
                  class="px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
                  :class="getCardStatusBadgeClass(client.card_status)"
                >
                  {{ client.card_status }}
                </span>
                <span v-else class="text-sm text-[#6B7E8B]">—</span>
              </td>
              <td class="px-4 py-4">
                <div class="flex items-center gap-2">
                  <button
                    v-if="getDocumentForClient(client.id)"
                    @click="openDocumentViewer(client)"
                    class="px-2 py-1 text-xs text-[#006AC7] hover:bg-[#E8F3FF] rounded-lg transition whitespace-nowrap"
                  >
                    {{ t('cardRequests.actions.view') }}
                  </button>
                  <span v-else class="text-sm text-[#6B7E8B]">{{ t('common.dash') }}</span>
                </div>
              </td>
              <td class="px-4 py-4">
                <div class="flex items-center gap-2">
                  <button
                    @click="openCardModal(client)"
                    class="px-2 py-1 text-xs text-[#0E6B3B] hover:bg-[#DDF7E9] rounded-lg transition whitespace-nowrap"
                  >
                    {{ t('cardRequests.actions.viewCard') }}
                  </button>
                </div>
              </td>
              <td class="px-4 py-4 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button
                    v-if="getDocumentForClient(client.id) && client.card_status !== 'received'"
                    @click="openReviewModal(client)"
                    class="px-2 py-1 text-xs whitespace-nowrap bg-[#006AC7] text-white rounded-lg hover:bg-[#0055A3] transition"
                  >
                    {{ t('cardRequests.actions.reviewProcess') }}
                  </button>
                  <span v-else-if="!getDocumentForClient(client.id)" class="text-xs text-[#6B7E8B]">
                    {{ t('cardRequests.table.noDocument') }}
                  </span>
                  <span v-else-if="client.card_status === 'received'" class="text-xs text-[#6B7E8B]">
                    {{ t('cardRequests.table.cardReceived') }}
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Document Viewer Modal -->
    <div
      v-if="showDocumentModal && selectedDocument"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      @click.self="closeDocumentModal"
    >
      <div class="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div class="p-6 border-b border-black/10 flex items-center justify-between">
          <h2 class="text-[24px] font-bold text-[#0B2A3C]">{{ t('cardRequests.documentViewer.title') }}</h2>
          <button
            @click="closeDocumentModal"
            class="text-[#6B7E8B] hover:text-[#0B2A3C] transition"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="p-6">
          <div class="mb-4">
            <p class="text-sm text-[#6B7E8B]">{{ t('cardRequests.documentViewer.clientId') }}: {{ selectedDocument.client_id }}</p>
            <p class="text-sm text-[#6B7E8B]">{{ t('cardRequests.documentViewer.status') }}: 
              <span
                class="px-2 py-1 rounded-full text-xs font-semibold"
                :class="getDocumentStatusBadgeClass(selectedDocument.status)"
              >
                {{ selectedDocument.status }}
              </span>
            </p>
            <p class="text-sm text-[#6B7E8B]">{{ t('cardRequests.documentViewer.uploaded') }}: {{ new Date(selectedDocument.uploaded_at).toLocaleString() }}</p>
          </div>

          <div class="space-y-6">
            <!-- Front Side -->
            <div v-if="selectedDocument.front_side" class="border border-black/10 rounded-xl overflow-hidden">
              <div class="p-3 bg-[#F7FBFF] border-b border-black/10">
                <h3 class="text-sm font-semibold text-[#0B2A3C]">{{ t('cardRequests.documentViewer.frontSide') }}</h3>
              </div>
              <div class="w-full">
                <!-- For images -->
                <img
                  v-if="isImageFile(selectedDocument.front_side)"
                  :src="getDocumentUrl(selectedDocument.front_side)"
                  :alt="t('cardRequests.documentViewer.frontSide')"
                  class="w-full h-auto max-h-[600px] object-contain"
                />
                <!-- For PDF and other files -->
                <iframe
                  v-else
                  :src="getDocumentUrl(selectedDocument.front_side)"
                  class="w-full h-[600px]"
                  frameborder="0"
                ></iframe>
                <div class="p-4 border-t border-black/10 bg-[#F7FBFF]">
                  <a
                    :href="getDocumentUrl(selectedDocument.front_side)"
                    target="_blank"
                    class="text-[#006AC7] hover:underline text-sm font-semibold"
                  >
                    {{ t('cardRequests.documentViewer.openInNewTab') }}
                  </a>
                </div>
              </div>
            </div>

            <!-- Back Side -->
            <div v-if="selectedDocument.back_side" class="border border-black/10 rounded-xl overflow-hidden">
              <div class="p-3 bg-[#F7FBFF] border-b border-black/10">
                <h3 class="text-sm font-semibold text-[#0B2A3C]">{{ t('cardRequests.documentViewer.backSide') }}</h3>
              </div>
              <div class="w-full">
                <!-- For images -->
                <img
                  v-if="isImageFile(selectedDocument.back_side)"
                  :src="getDocumentUrl(selectedDocument.back_side)"
                  :alt="t('cardRequests.documentViewer.backSide')"
                  class="w-full h-auto max-h-[600px] object-contain"
                />
                <!-- For PDF and other files -->
                <iframe
                  v-else
                  :src="getDocumentUrl(selectedDocument.back_side)"
                  class="w-full h-[600px]"
                  frameborder="0"
                ></iframe>
                <div class="p-4 border-t border-black/10 bg-[#F7FBFF]">
                  <a
                    :href="getDocumentUrl(selectedDocument.back_side)"
                    target="_blank"
                    class="text-[#006AC7] hover:underline text-sm font-semibold"
                  >
                    {{ t('cardRequests.documentViewer.openInNewTab') }}
                  </a>
                </div>
              </div>
            </div>

            <!-- Bank Statement -->
            <div v-if="selectedDocument.bank_statement" class="border border-black/10 rounded-xl overflow-hidden">
              <div class="p-3 bg-[#F7FBFF] border-b border-black/10">
                <h3 class="text-sm font-semibold text-[#0B2A3C]">{{ t('cardRequests.documentViewer.bankStatement') }}</h3>
              </div>
              <div class="w-full">
                <!-- For images -->
                <img
                  v-if="isImageFile(selectedDocument.bank_statement)"
                  :src="getDocumentUrl(selectedDocument.bank_statement)"
                  :alt="t('cardRequests.documentViewer.bankStatement')"
                  class="w-full h-auto max-h-[600px] object-contain"
                />
                <!-- For PDF and other files -->
                <iframe
                  v-else
                  :src="getDocumentUrl(selectedDocument.bank_statement)"
                  class="w-full h-[600px]"
                  frameborder="0"
                ></iframe>
                <div class="p-4 border-t border-black/10 bg-[#F7FBFF]">
                  <a
                    :href="getDocumentUrl(selectedDocument.bank_statement)"
                    target="_blank"
                    class="text-[#006AC7] hover:underline text-sm font-semibold"
                  >
                    {{ t('cardRequests.documentViewer.openInNewTab') }}
                  </a>
                </div>
              </div>
            </div>

            <!-- Legacy file field (for backward compatibility) -->
            <div v-if="selectedDocument.file && !selectedDocument.front_side && !selectedDocument.back_side && !selectedDocument.bank_statement" class="border border-black/10 rounded-xl overflow-hidden">
              <div class="w-full">
                <!-- For images -->
                <img
                  v-if="isImageFile(selectedDocument.file)"
                  :src="getDocumentUrl(selectedDocument.file)"
                  :alt="t('cardRequests.documentViewer.title')"
                  class="w-full h-auto max-h-[600px] object-contain"
                />
                <!-- For PDF and other files -->
                <iframe
                  v-else
                  :src="getDocumentUrl(selectedDocument.file)"
                  class="w-full h-[600px]"
                  frameborder="0"
                ></iframe>
                <div class="p-4 border-t border-black/10 bg-[#F7FBFF]">
                  <a
                    :href="getDocumentUrl(selectedDocument.file)"
                    target="_blank"
                    class="text-[#006AC7] hover:underline text-sm font-semibold"
                  >
                    {{ t('cardRequests.documentViewer.openInNewTab') }}
                  </a>
                </div>
              </div>
            </div>

            <!-- No files available -->
            <div v-if="!selectedDocument.file && !selectedDocument.front_side && !selectedDocument.back_side && !selectedDocument.bank_statement" class="p-8 text-center text-[#6B7E8B] border border-black/10 rounded-xl">
              {{ t('cardRequests.documentViewer.fileNotAvailable') }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Review Document Modal -->
    <div
      v-if="showReviewModal && reviewingDocument"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      @click.self="closeReviewModal"
    >
      <div class="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div class="p-6 border-b border-black/10 flex-shrink-0">
          <h2 class="text-[24px] font-bold text-[#0B2A3C]">{{ t('cardRequests.reviewModal.title') }}</h2>
          <p class="text-sm text-[#6B7E8B] mt-1">{{ t('cardRequests.reviewModal.subtitle') }}</p>
        </div>

        <form @submit.prevent="submitReview" class="p-6 space-y-4 overflow-y-auto flex-1">
          <!-- Review Status -->
          <div>
            <label class="block text-sm font-semibold text-[#0B2A3C] mb-2">
              {{ t('cardRequests.reviewModal.reviewStatus') }} <span class="text-[#CC0000]">*</span>
            </label>
            <select
              v-model="reviewStatus"
              class="w-full px-4 py-2.5 rounded-xl border border-black/10 bg-white text-[#0B2A3C] focus:outline-none focus:ring-2 focus:ring-[#006AC7]/20 focus:border-[#006AC7]"
            >
              <option value="approved">{{ t('common.approved') }}</option>
              <option value="rejected">{{ t('common.rejected') }}</option>
            </select>
          </div>

          <!-- Review Comment -->
          <div>
            <label class="block text-sm font-semibold text-[#0B2A3C] mb-2">{{ t('cardRequests.reviewModal.reviewComment') }}</label>
            <textarea
              v-model="reviewComment"
              rows="4"
              class="w-full px-4 py-2.5 rounded-xl border border-black/10 bg-white text-[#0B2A3C] focus:outline-none focus:ring-2 focus:ring-[#006AC7]/20 focus:border-[#006AC7]"
              :placeholder="t('cardRequests.reviewModal.commentPlaceholder')"
            ></textarea>
          </div>

          <!-- Approve Card Request (only if document is approved) -->
          <div v-if="reviewStatus === 'approved' && reviewingClient?.card_status === 'pending'" class="space-y-4">
            <div class="flex items-center gap-3 p-4 bg-[#F7FBFF] rounded-xl border border-black/10">
              <input
                v-model="approveCardRequest"
                type="checkbox"
                id="approve_card"
                class="w-5 h-5 rounded border-black/10 text-[#006AC7] focus:ring-2 focus:ring-[#006AC7]/20"
              />
              <label for="approve_card" class="text-sm font-semibold text-[#0B2A3C] cursor-pointer">
                {{ t('cardRequests.reviewModal.approveCard') }}
              </label>
              <p class="text-xs text-[#6B7E8B] ml-2">
                {{ t('cardRequests.reviewModal.approveCardHint') }}
              </p>
            </div>

            <!-- Card Data Form (shown when approveCardRequest is checked) -->
            <div v-if="approveCardRequest" class="p-6 bg-[#F7FBFF] rounded-xl border-2 border-[#006AC7]/20 space-y-4">
              <h3 class="text-[18px] font-bold text-[#0B2A3C] mb-4">{{ t('cardRequests.cardForm.title') }}</h3>
              
              <!-- Bank Name -->
              <div>
                <label class="block text-sm font-semibold text-[#0B2A3C] mb-2">
                  {{ t('cardRequests.cardForm.bankName') }} <span class="text-[#CC0000]">*</span>
                </label>
                <input
                  v-model="cardData.bank_name"
                  type="text"
                  class="w-full px-4 py-2.5 rounded-xl border border-black/10 bg-white text-[#0B2A3C] focus:outline-none focus:ring-2 focus:ring-[#006AC7]/20 focus:border-[#006AC7]"
                  :class="{ 'border-[#CC0000]': cardDataErrors.bank_name }"
                />
                <p v-if="cardDataErrors.bank_name" class="mt-1 text-sm text-[#CC0000]">{{ cardDataErrors.bank_name }}</p>
              </div>

              <!-- Full Name -->
              <div>
                <label class="block text-sm font-semibold text-[#0B2A3C] mb-2">
                  {{ t('cardRequests.cardForm.fullName') }} <span class="text-[#CC0000]">*</span>
                </label>
                <input
                  v-model="cardData.full_name"
                  type="text"
                  class="w-full px-4 py-2.5 rounded-xl border border-black/10 bg-white text-[#0B2A3C] focus:outline-none focus:ring-2 focus:ring-[#006AC7]/20 focus:border-[#006AC7]"
                  :class="{ 'border-[#CC0000]': cardDataErrors.full_name }"
                />
                <p v-if="cardDataErrors.full_name" class="mt-1 text-sm text-[#CC0000]">{{ cardDataErrors.full_name }}</p>
              </div>

              <!-- Card Number -->
              <div>
                <label class="block text-sm font-semibold text-[#0B2A3C] mb-2">
                  {{ t('cardRequests.cardForm.cardNumber') }} <span class="text-[#CC0000]">*</span>
                </label>
                <input
                  v-model="cardData.card_number"
                  type="text"
                  maxlength="19"
                  placeholder="0000 0000 0000 0000"
                  @input="cardData.card_number = cardData.card_number.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim()"
                  class="w-full px-4 py-2.5 rounded-xl border border-black/10 bg-white text-[#0B2A3C] focus:outline-none focus:ring-2 focus:ring-[#006AC7]/20 focus:border-[#006AC7] font-mono"
                  :class="{ 'border-[#CC0000]': cardDataErrors.card_number }"
                />
                <p v-if="cardDataErrors.card_number" class="mt-1 text-sm text-[#CC0000]">{{ cardDataErrors.card_number }}</p>
                <p class="mt-1 text-xs text-[#6B7E8B]">{{ t('cardRequests.cardForm.cardNumberHint') }}</p>
              </div>
              <!-- cvv -->
              <br>
              <div>
                <label class="block text-sm font-semibold text-[#0B2A3C] mb-2">
                  {{ t('cardRequests.cardForm.cvv') }} <span class="text-[#CC0000]">*</span>
                </label>
                <input
                  v-model="cardData.cvv"
                  type="text"
                  inputmode="numeric"
                  maxlength="4"
                  class="w-full px-4 py-2.5 rounded-xl border border-black/10 bg-white text-[#0B2A3C] focus:outline-none focus:ring-2 focus:ring-[#006AC7]/20 focus:border-[#006AC7] font-mono"
                  :class="{ 'border-[#CC0000]': cardDataErrors.cvv }"
                  @input="cardData.cvv = cardData.cvv.replace(/\\D/g, '').slice(0,4)"
                />
                <p v-if="cardDataErrors.cvv" class="mt-1 text-sm text-[#CC0000]">{{ cardDataErrors.cvv }}</p>
              </div>

              <!-- IBAN -->
              <div>
                <label class="block text-sm font-semibold text-[#0B2A3C] mb-2">
                  {{ t('cardRequests.cardForm.iban') }}
                </label>
                <input
                  v-model="cardData.iban"
                  type="text"
                  class="w-full px-4 py-2.5 rounded-xl border border-black/10 bg-white text-[#0B2A3C] focus:outline-none focus:ring-2 focus:ring-[#006AC7]/20 focus:border-[#006AC7] font-mono"
                  @input="cardData.iban = cardData.iban.toUpperCase()"
                  :class="{ 'border-[#CC0000]': cardDataErrors.iban }"
                />
                <p v-if="cardDataErrors.iban" class="mt-1 text-sm text-[#CC0000]">{{ cardDataErrors.iban }}</p>
              </div>

              <!-- BIC -->
              <div>
                <label class="block text-sm font-semibold text-[#0B2A3C] mb-2">
                  {{ t('cardRequests.cardForm.bic') }}
                </label>
                <input
                  v-model="cardData.bank_bic"
                  type="text"
                  class="w-full px-4 py-2.5 rounded-xl border border-black/10 bg-white text-[#0B2A3C] focus:outline-none focus:ring-2 focus:ring-[#006AC7]/20 focus:border-[#006AC7] font-mono"
                  @input="cardData.bank_bic = cardData.bank_bic.toUpperCase()"
                  :class="{ 'border-[#CC0000]': cardDataErrors.bank_bic }"
                />
                <p v-if="cardDataErrors.bank_bic" class="mt-1 text-sm text-[#CC0000]">{{ cardDataErrors.bank_bic }}</p>
              </div>

              <!-- LIMIT -->
              <div>
                <label class="block text-sm font-semibold text-[#0B2A3C] mb-2">
                  {{ t('cardRequests.cardForm.limit') }}
                </label>
                <input
                  v-model="cardData.limit"
                  type="text"
                  placeholder="- or 100000"
                  class="w-full px-4 py-2.5 rounded-xl border border-black/10 bg-white text-[#0B2A3C] focus:outline-none focus:ring-2 focus:ring-[#006AC7]/20 focus:border-[#006AC7]"
                  :class="{ 'border-[#CC0000]': cardDataErrors.limit }"
                />
                <p v-if="cardDataErrors.limit" class="mt-1 text-sm text-[#CC0000]">{{ cardDataErrors.limit }}</p>
              </div>

              <!-- Expiration Date -->
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-semibold text-[#0B2A3C] mb-2">
                    {{ t('cardRequests.cardForm.expMonth') }} <span class="text-[#CC0000]">*</span>
                  </label>
                  <input
                    v-model.number="cardData.exp_month"
                    type="number"
                    min="1"
                    max="12"
                    :placeholder="t('cardRequests.placeholders.expMonth')"
                    class="w-full px-4 py-2.5 rounded-xl border border-black/10 bg-white text-[#0B2A3C] focus:outline-none focus:ring-2 focus:ring-[#006AC7]/20 focus:border-[#006AC7]"
                    :class="{ 'border-[#CC0000]': cardDataErrors.exp_month }"
                  />
                  <p v-if="cardDataErrors.exp_month" class="mt-1 text-sm text-[#CC0000]">{{ cardDataErrors.exp_month }}</p>
                </div>
                <div>
                  <label class="block text-sm font-semibold text-[#0B2A3C] mb-2">
                    {{ t('cardRequests.cardForm.expYear') }} <span class="text-[#CC0000]">*</span>
                  </label>
                  <input
                    v-model.number="cardData.exp_year"
                    type="number"
                    :min="new Date().getFullYear()"
                    :placeholder="t('cardRequests.placeholders.expYear')"
                    class="w-full px-4 py-2.5 rounded-xl border border-black/10 bg-white text-[#0B2A3C] focus:outline-none focus:ring-2 focus:ring-[#006AC7]/20 focus:border-[#006AC7]"
                    :class="{ 'border-[#CC0000]': cardDataErrors.exp_year }"
                  />
                  <p v-if="cardDataErrors.exp_year" class="mt-1 text-sm text-[#CC0000]">{{ cardDataErrors.exp_year }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Info message for rejected documents -->
          <div v-if="reviewStatus === 'rejected'" class="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
            <p class="text-sm text-yellow-800">
              <strong>{{ t('common.note') }}:</strong> {{ t('cardRequests.reviewModal.rejectNote') }}
            </p>
          </div>

          <!-- Info message for approved documents without card approval -->
          <div v-if="reviewStatus === 'approved' && !approveCardRequest && reviewingClient?.card_status === 'pending'" class="p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <p class="text-sm text-blue-800">
              <strong>{{ t('common.note') }}:</strong> {{ t('cardRequests.reviewModal.approveNote') }}
            </p>
          </div>

          <!-- Form Actions -->
          <div class="flex items-center justify-end gap-3 pt-4 border-t border-black/10">
            <button
              type="button"
              @click="closeReviewModal"
              class="px-6 py-2.5 rounded-xl border border-black/10 text-[#0B2A3C] font-semibold hover:bg-black/5 transition"
            >
              {{ t('cardRequests.reviewModal.cancel') }}
            </button>
            <button
              type="submit"
              :disabled="loading"
              class="px-6 py-2.5 bg-[#006AC7] text-white rounded-xl font-semibold hover:bg-[#0055A3] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ loading ? t('cardRequests.reviewModal.submitting') : t('cardRequests.reviewModal.submitReview') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Create Card Modal -->
    <div
      v-if="showCreateCardModal && creatingCardClient"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      @click.self="closeCreateCardModal"
    >
      <div class="bg-white rounded-2xl shadow-xl max-w-2xl w-full">
        <div class="p-6 border-b border-black/10">
          <h2 class="text-[24px] font-bold text-[#0B2A3C]">{{ t('cardRequests.createCardModal.title') }}</h2>
          <p class="text-sm text-[#6B7E8B] mt-1">{{ t('cardRequests.createCardModal.subtitle', { name: `${creatingCardClient.first_name} ${creatingCardClient.last_name}`.trim() }) }}</p>
        </div>

        <form @submit.prevent="createCard" class="p-6 space-y-4">
          <!-- Bank Name -->
          <div>
            <label class="block text-sm font-semibold text-[#0B2A3C] mb-2">
              {{ t('cardRequests.createCardModal.bankName') }} <span class="text-[#CC0000]">*</span>
            </label>
            <input
              v-model="cardFormData.bank_name"
              type="text"
              required
              class="w-full px-4 py-2.5 rounded-xl border border-black/10 bg-white text-[#0B2A3C] focus:outline-none focus:ring-2 focus:ring-[#006AC7]/20 focus:border-[#006AC7]"
            />
          </div>

          <!-- Full Name -->
          <div>
            <label class="block text-sm font-semibold text-[#0B2A3C] mb-2">
              {{ t('cardRequests.createCardModal.fullName') }} <span class="text-[#CC0000]">*</span>
            </label>
            <input
              v-model="cardFormData.full_name"
              type="text"
              required
              class="w-full px-4 py-2.5 rounded-xl border border-black/10 bg-white text-[#0B2A3C] focus:outline-none focus:ring-2 focus:ring-[#006AC7]/20 focus:border-[#006AC7]"
            />
          </div>

          <!-- Card Number -->
          <div>
            <label class="block text-sm font-semibold text-[#0B2A3C] mb-2">
              {{ t('cardRequests.createCardModal.cardNumber') }} <span class="text-[#CC0000]">*</span>
            </label>
            <input
              v-model="cardFormData.card_number"
              type="text"
              required
              pattern="[0-9]{13,19}"
              :placeholder="t('cardRequests.createCardModal.cardNumberPlaceholder')"
              class="w-full px-4 py-2.5 rounded-xl border border-black/10 bg-white text-[#0B2A3C] focus:outline-none focus:ring-2 focus:ring-[#006AC7]/20 focus:border-[#006AC7]"
            />
            <p class="text-xs text-[#6B7E8B] mt-1">{{ t('cardRequests.createCardModal.cardNumberHint') }}</p>
          </div>
          <!-- cvv -->
           <div>
            <label class="block text-sm font-semibold text-[#0B2A3C] mb-2">{{ t('cardRequests.cardForm.cvv') }}</label>
            <input
              v-model="cardFormData.cvv"
              type="text"
              inputmode="numeric"
              maxlength="4"
              class="w-full px-4 py-2.5 rounded-xl border border-black/10 bg-white text-[#0B2A3C] focus:outline-none focus:ring-2 focus:ring-[#006AC7]/20 focus:border-[#006AC7] font-mono"
              @input="cardFormData.cvv = cardFormData.cvv.replace(/\\D/g, '').slice(0,4)"
            />
          </div>
          <!-- IBAN -->
           <div>
            <label class="block text-sm font-semibold text-[#0B2A3C] mb-2">{{ t('cardRequests.cardForm.iban') }}</label>
            <input
              v-model="cardFormData.iban"
              type="text"
              class="w-full px-4 py-2.5 rounded-xl border border-black/10 bg-white text-[#0B2A3C] focus:outline-none focus:ring-2 focus:ring-[#006AC7]/20 focus:border-[#006AC7] font-mono"
              @input="cardFormData.iban = cardFormData.iban.toUpperCase()"
            />
          </div>
          <!-- BIC -->
           <div>
            <label class="block text-sm font-semibold text-[#0B2A3C] mb-2">{{ t('cardRequests.cardForm.bic') }}</label>
            <input
              v-model="cardFormData.bank_bic"
              type="text"
              class="w-full px-4 py-2.5 rounded-xl border border-black/10 bg-white text-[#0B2A3C] focus:outline-none focus:ring-2 focus:ring-[#006AC7]/20 focus:border-[#006AC7] font-mono"
              @input="cardFormData.bank_bic = cardFormData.bank_bic.toUpperCase()"
            />
          </div>
          <!-- LIMIT -->
           <div>
            <label class="block text-sm font-semibold text-[#0B2A3C] mb-2">{{ t('cardRequests.cardForm.limit') }}</label>
            <input
              v-model="cardFormData.limit"
              type="text"
              class="w-full px-4 py-2.5 rounded-xl border border-black/10 bg-white text-[#0B2A3C] focus:outline-none focus:ring-2 focus:ring-[#006AC7]/20 focus:border-[#006AC7]"
              placeholder='- or 100000'
            />
          </div>
          <!-- Exp Month -->
          <div>
            <label class="block text-sm font-semibold text-[#0B2A3C] mb-2">{{ t('cardRequests.createCardModal.expMonth') }}</label>
            <input
              v-model.number="cardFormData.exp_month"
              type="number"
              min="1"
              max="12"
              class="w-full px-4 py-2.5 rounded-xl border border-black/10 bg-white text-[#0B2A3C] focus:outline-none focus:ring-2 focus:ring-[#006AC7]/20 focus:border-[#006AC7]"
            />
          </div>

          <!-- Exp Year -->
          <div>
            <label class="block text-sm font-semibold text-[#0B2A3C] mb-2">{{ t('cardRequests.createCardModal.expYear') }}</label>
            <input
              v-model.number="cardFormData.exp_year"
              type="number"
              min="2024"
              max="2099"
              class="w-full px-4 py-2.5 rounded-xl border border-black/10 bg-white text-[#0B2A3C] focus:outline-none focus:ring-2 focus:ring-[#006AC7]/20 focus:border-[#006AC7]"
            />
          </div>

          <!-- Actions -->
          <div class="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              @click="closeCreateCardModal"
              class="px-5 py-2.5 rounded-xl font-semibold transition border border-black/10 bg-white hover:bg-[#F3F7FB] text-[#0B2A3C]"
            >
              {{ t('cardRequests.createCardModal.cancel') }}
            </button>
            <button
              type="submit"
              :disabled="loading"
              class="px-5 py-2.5 rounded-xl font-semibold transition bg-[#006AC7] hover:bg-[#0055A3] text-white disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span v-if="loading">{{ t('cardRequests.createCardModal.creating') }}</span>
              <span v-else>{{ t('cardRequests.createCardModal.createCard') }}</span>
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
          <h2 class="text-[24px] font-bold text-[#0B2A3C]">{{ currentCardId ? 'Edit Card' : 'View Card' }}</h2>
          <p class="text-sm text-[#6B7E8B] mt-1">
            {{ `${viewingCardClient.first_name || ''} ${viewingCardClient.last_name || ''}`.trim() || viewingCardClient.email || `ID: ${viewingCardClient.id}` }}
          </p>
        </div>

        <div v-if="cardLoading" class="p-6 text-center text-[#6B7E8B]">
          {{ t('common.loading') || 'Loading...' }}
        </div>

        <form v-else @submit.prevent="saveCard" class="p-6 space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Bank Name -->
            <div>
              <label class="block text-sm font-semibold text-[#0B2A3C] mb-2">{{ t('cardRequests.cardForm.bankName') }} <span class="text-[#CC0000]">*</span></label>
              <input
                v-model="cardViewData.bank_name"
                type="text"
                class="w-full px-4 py-2.5 rounded-xl border border-black/10 bg-white text-[#0B2A3C] focus:outline-none focus:ring-2 focus:ring-[#006AC7]/20 focus:border-[#006AC7]"
                :class="{ 'border-[#CC0000]': cardViewErrors.bank_name }"
              />
              <p v-if="cardViewErrors.bank_name" class="mt-1 text-sm text-[#CC0000]">{{ cardViewErrors.bank_name }}</p>
            </div>

            <!-- Full Name -->
            <div>
              <label class="block text-sm font-semibold text-[#0B2A3C] mb-2">{{ t('cardRequests.cardForm.fullName') }} <span class="text-[#CC0000]">*</span></label>
              <input
                v-model="cardViewData.full_name"
                type="text"
                class="w-full px-4 py-2.5 rounded-xl border border-black/10 bg-white text-[#0B2A3C] focus:outline-none focus:ring-2 focus:ring-[#006AC7]/20 focus:border-[#006AC7]"
                :class="{ 'border-[#CC0000]': cardViewErrors.full_name }"
              />
              <p v-if="cardViewErrors.full_name" class="mt-1 text-sm text-[#CC0000]">{{ cardViewErrors.full_name }}</p>
            </div>

            <!-- Card Number -->
            <div>
              <label class="block text-sm font-semibold text-[#0B2A3C] mb-2">{{ t('cardRequests.cardForm.cardNumber') }} <span class="text-[#CC0000]">*</span></label>
              <input
                v-model="cardViewData.card_number"
                @input="cardViewData.card_number = formatCardNumber(cardViewData.card_number)"
                type="text"
                maxlength="19"
                placeholder="0000 0000 0000 0000"
                class="w-full px-4 py-2.5 rounded-xl border border-black/10 bg-white text-[#0B2A3C] focus:outline-none focus:ring-2 focus:ring-[#006AC7]/20 focus:border-[#006AC7] font-mono"
                :class="{ 'border-[#CC0000]': cardViewErrors.card_number }"
              />
              <p v-if="cardViewErrors.card_number" class="mt-1 text-sm text-[#CC0000]">{{ cardViewErrors.card_number }}</p>
            </div>

            <!-- CVV -->
            <div>
              <label class="block text-sm font-semibold text-[#0B2A3C] mb-2">{{ t('cardRequests.cardForm.cvv') }} <span class="text-[#CC0000]">*</span></label>
              <input
                v-model="cardViewData.cvv"
                type="text"
                maxlength="4"
                placeholder="000"
                @input="cardViewData.cvv = cardViewData.cvv.replace(/\D/g, '').slice(0, 4)"
                class="w-full px-4 py-2.5 rounded-xl border border-black/10 bg-white text-[#0B2A3C] focus:outline-none focus:ring-2 focus:ring-[#006AC7]/20 focus:border-[#006AC7] font-mono"
                :class="{ 'border-[#CC0000]': cardViewErrors.cvv }"
              />
              <p v-if="cardViewErrors.cvv" class="mt-1 text-sm text-[#CC0000]">{{ cardViewErrors.cvv }}</p>
            </div>

            <!-- Exp Month -->
            <div>
              <label class="block text-sm font-semibold text-[#0B2A3C] mb-2">{{ t('cardRequests.cardForm.expMonth') }} <span class="text-[#CC0000]">*</span></label>
              <input
                v-model.number="cardViewData.exp_month"
                type="number"
                min="1"
                max="12"
                placeholder="12"
                class="w-full px-4 py-2.5 rounded-xl border border-black/10 bg-white text-[#0B2A3C] focus:outline-none focus:ring-2 focus:ring-[#006AC7]/20 focus:border-[#006AC7]"
                :class="{ 'border-[#CC0000]': cardViewErrors.exp_month }"
              />
              <p v-if="cardViewErrors.exp_month" class="mt-1 text-sm text-[#CC0000]">{{ cardViewErrors.exp_month }}</p>
            </div>

            <!-- Exp Year -->
            <div>
              <label class="block text-sm font-semibold text-[#0B2A3C] mb-2">{{ t('cardRequests.cardForm.expYear') }} <span class="text-[#CC0000]">*</span></label>
              <input
                v-model.number="cardViewData.exp_year"
                type="number"
                :min="new Date().getFullYear()"
                placeholder="2026"
                class="w-full px-4 py-2.5 rounded-xl border border-black/10 bg-white text-[#0B2A3C] focus:outline-none focus:ring-2 focus:ring-[#006AC7]/20 focus:border-[#006AC7]"
                :class="{ 'border-[#CC0000]': cardViewErrors.exp_year }"
              />
              <p v-if="cardViewErrors.exp_year" class="mt-1 text-sm text-[#CC0000]">{{ cardViewErrors.exp_year }}</p>
            </div>
          </div>

          <!-- Balance -->
          <div>
            <label class="block text-sm font-semibold text-[#0B2A3C] mb-2">{{ t('cardRequests.cardForm.balance') || 'Balance' }}</label>
            <input
              v-model="cardViewData.balance"
              type="text"
              placeholder="0.00"
              class="w-full px-4 py-2.5 rounded-xl border border-black/10 bg-white text-[#0B2A3C] focus:outline-none focus:ring-2 focus:ring-[#006AC7]/20 focus:border-[#006AC7]"
              :class="{ 'border-[#CC0000]': cardViewErrors.balance }"
            />
            <p v-if="cardViewErrors.balance" class="mt-1 text-sm text-[#CC0000]">{{ cardViewErrors.balance }}</p>
          </div>

          <div class="flex items-center justify-end gap-3 pt-4 border-t border-black/10">
            <button
              type="button"
              @click="closeCardModal"
              class="px-6 py-2.5 rounded-xl border border-black/10 text-[#0B2A3C] font-semibold hover:bg-black/5 transition"
            >
              {{ t('cardRequests.createCardModal.cancel') || 'Cancel' }}
            </button>
            <button
              type="submit"
              :disabled="cardSaving"
              class="px-6 py-2.5 bg-[#006AC7] text-white rounded-xl font-semibold hover:bg-[#0055A3] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ cardSaving ? (t('cardRequests.createCardModal.creating') || 'Saving...') : (currentCardId ? 'Update Card' : 'Create Card') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

