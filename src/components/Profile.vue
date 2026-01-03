<script setup lang="ts">
import Header from "@/components/Header.vue";
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useAppStore } from "@/stores/app.js";
const { t } = useI18n();
const appStore = useAppStore();
const loading = ref(false);
const errorText = ref("");
const me = computed(() => appStore.me);

const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return null;
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    return date.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch (error) {
    return null;
  }
};

const fmtMoney = (v: any) => {
  if (v === null || v === undefined || v === "") return "-";
  const n = Number(v);
  if (Number.isNaN(n)) return String(v);
  return new Intl.NumberFormat("de-DE").format(n);
};

const statusText = (v: any) => {
  if (v === null || v === undefined || v === "") return "-";
  return String(v);
};

const maskedCard = (cardNumber: string | null | undefined) => {
  if (!cardNumber) return "-";
  const s = String(cardNumber).replace(/\s+/g, "");
  if (s.length < 8) return s;
  return `${s.slice(0, 4)} **** **** ${s.slice(-4)}`;
};

const loadMe = async () => {
  errorText.value = "";
  loading.value = true;
  try {
    if (appStore.authType === "client") {
      const r = await appStore.clientMe();
      if (!r.ok) errorText.value = t("profile.errorCannotLoad");
    } else {
      const r = await appStore.staffMe();
      if (!r.ok) errorText.value = t("profile.errorCannotLoad");
    }
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  if (!appStore.me) await loadMe();
});
</script>

<template>
  <Header class="fixed top-0 left-0 right-0 z-50 bg-white shadow-md" />
  <div class="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 pt-24">
    <!-- Header Section -->
    <div class="mb-8">
      <h1 class="text-[36px] font-bold text-[#0B2A3C] tracking-tight mb-2">{{ t("profile.title") }}</h1>
      <div class="h-px bg-black/10 mt-4"></div>
    </div>

    <!-- Error Message -->
    <div
      v-if="errorText"
      class="mb-6 bg-[#FFE0E0] border border-[#B42318]/20 rounded-2xl p-6"
    >
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 w-10 h-10 rounded-full bg-[#B42318] flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
        <div class="flex-1">
          <p class="text-[15px] text-[#B42318]">{{ errorText }}</p>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading && !me" class="bg-white rounded-2xl border border-black/10 shadow-sm p-12 text-center">
      <div class="text-[#6B7E8B]">{{ t("profile.loading") }}</div>
    </div>

    <!-- No Data State -->
    <div v-else-if="!me" class="bg-white rounded-2xl border border-black/10 shadow-sm p-12 text-center">
      <div class="text-[#6B7E8B]">{{ t("profile.noData") }}</div>
    </div>

    <!-- Profile Content -->
    <div v-else class="space-y-6">
      <!-- Profile Header Card -->
      <div class="bg-white rounded-2xl border border-black/10 shadow-sm p-8">
        <div class="flex items-center justify-between gap-6 mb-6">
          <div class="flex items-center gap-6">
            <!-- Avatar -->
            <div class="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#006AC7] to-[#0055A3] flex items-center justify-center text-white text-[36px] font-bold shadow-lg">
              {{ `${me.first_name?.charAt(0) || ''}${me.last_name?.charAt(0) || ''}`.toUpperCase() }}
            </div>
            
            <!-- Name and Role -->
            <div>
              <h2 class="text-[28px] font-bold text-[#0B2A3C] mb-1">
                {{ `${me.first_name || ''} ${me.last_name || ''}`.trim() || t("profile.noData") }}
              </h2>
              <div v-if="appStore.authType === 'staff'" class="flex items-center gap-2">
                <span class="px-3 py-1 rounded-full text-sm font-semibold bg-[#E8F3FF] text-[#006AC7]">
                  {{ appStore.staffRole || appStore.authType }}
                </span>
              </div>
              <div v-else class="text-sm text-[#6B7E8B]">
                {{ t("profile.fields.email") }}: {{ me.email || "-" }}
              </div>
            </div>
          </div>

          <!-- Refresh Button -->
          <button
            @click="loadMe"
            :disabled="loading"
            class="px-6 py-3 rounded-xl bg-[#E8F3FF] text-[#006AC7] font-semibold hover:bg-[#D8ECFF] transition flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <svg v-if="loading" class="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
            </svg>
            <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
            <span>{{ loading ? t("profile.loading") : t("profile.refresh") }}</span>
          </button>
        </div>
      </div>

      <!-- Personal Information Section -->
      <div class="bg-white rounded-2xl border border-black/10 shadow-sm p-8">
        <h3 class="text-[20px] font-bold text-[#0B2A3C] mb-6 flex items-center gap-3">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          {{ t("profile.yourData") }}
        </h3>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- First Name -->
          <div class="p-6 rounded-xl bg-[#F7FBFF] border border-black/5 hover:border-[#006AC7]/20 transition">
            <div class="flex items-center gap-3 mb-3">
              <div class="w-10 h-10 rounded-lg bg-[#E8F3FF] flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#006AC7" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
              <div class="text-sm font-semibold text-[#6B7E8B] uppercase tracking-wide">{{ t("profile.fields.firstName") }}</div>
            </div>
            <div class="text-[18px] font-bold text-[#0B2A3C]">{{ me.first_name || "-" }}</div>
          </div>

          <!-- Last Name -->
          <div class="p-6 rounded-xl bg-[#F7FBFF] border border-black/5 hover:border-[#006AC7]/20 transition">
            <div class="flex items-center gap-3 mb-3">
              <div class="w-10 h-10 rounded-lg bg-[#E8F3FF] flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#006AC7" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
              <div class="text-sm font-semibold text-[#6B7E8B] uppercase tracking-wide">{{ t("profile.fields.lastName") }}</div>
            </div>
            <div class="text-[18px] font-bold text-[#0B2A3C]">{{ me.last_name || "-" }}</div>
          </div>

          <!-- Email -->
          <div class="p-6 rounded-xl bg-[#F7FBFF] border border-black/5 hover:border-[#006AC7]/20 transition">
            <div class="flex items-center gap-3 mb-3">
              <div class="w-10 h-10 rounded-lg bg-[#E8F3FF] flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#006AC7" stroke-width="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
              </div>
              <div class="text-sm font-semibold text-[#6B7E8B] uppercase tracking-wide">{{ t("profile.fields.email") }}</div>
            </div>
            <div class="text-[18px] font-bold text-[#0B2A3C] break-all">{{ me.email || "-" }}</div>
          </div>

          <!-- Role field only for staff -->
          <div v-if="appStore.authType === 'staff'" class="p-6 rounded-xl bg-[#F7FBFF] border border-black/5 hover:border-[#006AC7]/20 transition">
            <div class="flex items-center gap-3 mb-3">
              <div class="w-10 h-10 rounded-lg bg-[#E8F3FF] flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#006AC7" stroke-width="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <div class="text-sm font-semibold text-[#6B7E8B] uppercase tracking-wide">{{ t("profile.fields.roleType") }}</div>
            </div>
            <div class="text-[18px] font-bold text-[#0B2A3C]">
              {{ appStore.authType }}{{ appStore.staffRole ? ` (${appStore.staffRole})` : "" }}
            </div>
          </div>

          <!-- Client-specific fields -->
          <template v-if="appStore.authType === 'client'">

            <!-- Bank Name -->
            <div class="p-6 rounded-xl bg-[#F7FBFF] border border-black/5 hover:border-[#006AC7]/20 transition">
              <div class="text-sm font-semibold text-[#6B7E8B] uppercase tracking-wide mb-2">
                {{ t("profile.fields.bankName") }}
              </div>
              <div class="text-[18px] font-bold text-[#0B2A3C]">
                {{ me.bank_card?.bank_name || me.bank_name || "-" }}
              </div>
            </div>

            <!-- IBAN -->
            <div class="p-6 rounded-xl bg-[#F7FBFF] border border-black/5 hover:border-[#006AC7]/20 transition">
              <div class="text-sm font-semibold text-[#6B7E8B] uppercase tracking-wide mb-2">
                {{ t("profile.fields.iban") }}
              </div>
              <div class="text-[18px] font-bold text-[#0B2A3C] break-all">{{ me.iban || "-" }}</div>
            </div>

            <!-- Bank BIC -->
            <div class="p-6 rounded-xl bg-[#F7FBFF] border border-black/5 hover:border-[#006AC7]/20 transition">
              <div class="text-sm font-semibold text-[#6B7E8B] uppercase tracking-wide mb-2">
                {{ t("profile.fields.bankBic") }}
              </div>
              <div class="text-[18px] font-bold text-[#0B2A3C]">{{ me.bank_bic || "-" }}</div>
            </div>

            <!-- Limit -->
            <div class="p-6 rounded-xl bg-[#F7FBFF] border border-black/5 hover:border-[#006AC7]/20 transition">
              <div class="text-sm font-semibold text-[#6B7E8B] uppercase tracking-wide mb-2">
                {{ t("profile.fields.limit") }}
              </div>
              <div class="text-[18px] font-bold text-[#0B2A3C]">{{ fmtMoney(me.limit) }}</div>
            </div>

            <!-- Amount To Activate -->
            <div class="p-6 rounded-xl bg-[#F7FBFF] border border-black/5 hover:border-[#006AC7]/20 transition">
              <div class="text-sm font-semibold text-[#6B7E8B] uppercase tracking-wide mb-2">
                {{ t("profile.fields.amountToActivate") }}
              </div>
              <div class="text-[18px] font-bold text-[#0B2A3C]">{{ fmtMoney(me.amount_to_activate) }}</div>
            </div>

            <!-- Client Bank Status -->
            <div class="p-6 rounded-xl bg-[#F7FBFF] border border-black/5 hover:border-[#006AC7]/20 transition">
              <div class="text-sm font-semibold text-[#6B7E8B] uppercase tracking-wide mb-2">
                {{ t("profile.fields.clientBankStatus") }}
              </div>
              <div class="text-[18px] font-bold text-[#0B2A3C]">{{ statusText(me.client_bank_status) }}</div>
            </div>

            <!-- Bank Card -->
            <div class="p-6 rounded-xl bg-[#F7FBFF] border border-black/5 hover:border-[#006AC7]/20 transition md:col-span-2">
              <div class="text-sm font-semibold text-[#6B7E8B] uppercase tracking-wide mb-3">
                {{ t("profile.fields.bankCard") }}
              </div>

              <div v-if="me.bank_card" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div class="text-xs text-[#6B7E8B] mb-1">{{ t("profile.fields.cardNumber") }}</div>
                  <div class="text-[16px] font-bold text-[#0B2A3C]">{{ maskedCard(me.bank_card.card_number) }}</div>
                </div>

                <div>
                  <div class="text-xs text-[#6B7E8B] mb-1">{{ t("profile.fields.exp") }}</div>
                  <div class="text-[16px] font-bold text-[#0B2A3C]">
                    {{ me.bank_card.exp_month ?? "-" }}/{{ me.bank_card.exp_year ?? "-" }}
                  </div>
                </div>

                <div>
                  <div class="text-xs text-[#6B7E8B] mb-1">{{ t("profile.fields.cardId") }}</div>
                  <div class="text-[16px] font-bold text-[#0B2A3C]">{{ me.bank_card.unique_card_id ?? "-" }}</div>
                </div>

                <!-- CVV обычно лучше НЕ показывать в профиле -->
                <!-- если прям надо, раскомментируй -->
                <!--
                <div>
                  <div class="text-xs text-[#6B7E8B] mb-1">{{ t("profile.fields.cvv") }}</div>
                  <div class="text-[16px] font-bold text-[#0B2A3C]">{{ me.bank_card.cvv ?? "-" }}</div>
                </div>
                -->
              </div>

              <div v-else class="text-[#6B7E8B]">-</div>
            </div>

            <!-- Manager -->
            <div class="p-6 rounded-xl bg-[#F7FBFF] border border-black/5 hover:border-[#006AC7]/20 transition md:col-span-2">
              <div class="text-sm font-semibold text-[#6B7E8B] uppercase tracking-wide mb-3">
                {{ t("profile.fields.manager") }}
              </div>

              <div v-if="me.manager">
                <div class="text-[18px] font-bold text-[#0B2A3C]">
                  {{ `${me.manager.first_name || ""} ${me.manager.last_name || ""}`.trim() || "-" }}
                </div>
                <div class="text-sm text-[#6B7E8B] mt-1">
                  {{ t("profile.fields.phone") }}: {{ me.manager.phone || "-" }}
                </div>
              </div>
              <div v-else class="text-[#6B7E8B]">-</div>
            </div>
            <!-- Phone -->
            <div class="p-6 rounded-xl bg-[#F7FBFF] border border-black/5 hover:border-[#006AC7]/20 transition">
              <div class="flex items-center gap-3 mb-3">
                <div class="w-10 h-10 rounded-lg bg-[#E8F3FF] flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#006AC7" stroke-width="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                </div>
                <div class="text-sm font-semibold text-[#6B7E8B] uppercase tracking-wide">{{ t("profile.fields.phone") }}</div>
              </div>
              <div class="text-[18px] font-bold text-[#0B2A3C]">{{ me.phone || "-" }}</div>
            </div>

            <!-- Work Place -->
            <div class="p-6 rounded-xl bg-[#F7FBFF] border border-black/5 hover:border-[#006AC7]/20 transition">
              <div class="flex items-center gap-3 mb-3">
                <div class="w-10 h-10 rounded-lg bg-[#E8F3FF] flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#006AC7" stroke-width="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                </div>
                <div class="text-sm font-semibold text-[#6B7E8B] uppercase tracking-wide">{{ t("profile.fields.workPlace") }}</div>
              </div>
              <div class="text-[18px] font-bold text-[#0B2A3C]">{{ me.work_place || "-" }}</div>
            </div>

            <!-- Birth Date -->
            <div class="p-6 rounded-xl bg-[#F7FBFF] border border-black/5 hover:border-[#006AC7]/20 transition">
              <div class="flex items-center gap-3 mb-3">
                <div class="w-10 h-10 rounded-lg bg-[#E8F3FF] flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#006AC7" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                </div>
                <div class="text-sm font-semibold text-[#6B7E8B] uppercase tracking-wide">{{ t("profile.fields.birthDate") }}</div>
              </div>
              <div class="text-[18px] font-bold text-[#0B2A3C]">{{ formatDate(me.birthday) || "-" }}</div>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>