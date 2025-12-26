<script setup lang="ts">
import { onMounted, ref, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAppStore } from "@/stores/app.js";
import Logo from "@/assets/logo_dkb.svg";

const router = useRouter();
const route = useRoute();
const appStore = useAppStore();

const loading = ref(false);
const docLoading = ref(false);

const me = computed(() => appStore.me as any);
const card = computed(() => me.value?.bank_card || null);
const manager = computed(() => me.value?.manager || null);

const document = ref<any>(null);

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
    uploadError.value = `File is too large. Max ${maxMb} MB`;
    input.value = "";
    return;
  }

  uploadLoading.value = true;
  uploadError.value = "";
  try {
    const r = await appStore.clientUploadDocument(file);
    if (!r?.ok) {
      uploadError.value = "Upload failed";
      return;
    }
    await loadDocument();
  } finally {
    uploadLoading.value = false;
    input.value = "";
  }
};

// ===== sidebar =====
const sidebarOpen = ref(true);

const navItems = computed(() => [
  { key: "finanzstatus", label: "Finanzstatus", to: "/" },
  { key: "uberweisung", label: "Überweisung", to: "/transfer" },
  { key: "einstellungen", label: "Einstellungen", to: "/settings" },
  { key: "hilfe", label: "Hilfe & Kontakt", to: "/help" },
  { key: "rechtliches", label: "Rechtliches", to: "/legal" },
]);

const isActive = (to: string) => route.path === to || route.path.startsWith(to + "/");

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

const fullName = computed(() => {
  const fn = me.value?.first_name || "";
  const ln = me.value?.last_name || "";
  return `${fn} ${ln}`.trim() || "—";
});

const hasIssuedCard = computed(() => {
  return !!card.value;
});

const maskedCard = computed(() => {
  if (!card.value) return "—";
  const a = card.value.first_four_digits || "****";
  const b = card.value.last_four_digits || "****";
  return `${a} •••• •••• ${b}`;
});

const iban = computed(() => card.value?.iban || "—");
const balance = computed(() => Number(card.value?.balance ?? 0));
const limit = computed(() => Number(card.value?.limit ?? 0));

// ✅ request card only if:
// - no card yet
// - document exists
// - document not rejected
const canRequestCard = computed(() => {
  if (hasIssuedCard.value) return false;
  if (!document.value) return false;
  return document.value.status !== "rejected";
});

const go = async (to: string) => {
  try {
    await router.push(to);
  } catch {}
};

const showTurnovers = ref(true);
</script>

<template>
  <div class="pt-[96px] flex">
    <aside
      class="h-[calc(100vh-96px)] sticky top-[96px] bg-white border-r border-black/10"
      :class="sidebarOpen ? 'w-[280px]' : 'w-[76px]'"
    >
      <div class="px-5 py-4 flex items-center justify-between">
        <button
          class="ml-2 w-9 h-9 rounded-lg hover:bg-black/5 flex items-center justify-center"
          @click="sidebarOpen = !sidebarOpen"
          title="Menu"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" class="text-[#2E4A63]">
            <path d="M4 7H20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M4 12H20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M4 17H20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>

      <nav class="px-3 pb-6">
        <button
          v-for="it in navItems"
          :key="it.key"
          class="w-full flex items-center gap-3 rounded-xl px-3 py-3 mb-2 transition"
          :class="isActive(it.to) ? 'bg-[#E8F3FF] text-[#006AC7]' : 'hover:bg-black/5 text-[#2E4A63]'"
          @click="go(it.to)"
        >
          <span
            class="w-10 h-10 rounded-xl flex items-center justify-center"
            :class="isActive(it.to) ? 'bg-white' : 'bg-[#F3F7FB]'"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              :class="isActive(it.to) ? 'text-[#006AC7]' : 'text-[#6B7E8B]'">
              <path d="M4 12h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <path d="M12 4v16" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.3"/>
            </svg>
          </span>

          <span v-if="sidebarOpen" class="font-semibold text-[15px]">{{ it.label }}</span>
        </button>
      </nav>
    </aside>

    <main class="flex-1">
      <div class="max-w-[1200px] mx-auto px-6 py-8">
        <div class="mb-6">
          <h1 class="text-[36px] font-bold text-[#0B2A3C] tracking-tight">Finanzstatus</h1>
          <div class="h-px bg-black/10 mt-4"></div>
        </div>

        <div v-if="loading" class="text-[#2E4A63]">Loading...</div>

        <div v-else class="grid grid-cols-12 gap-6">
          <section class="col-span-12 lg:col-span-8 space-y-6">
            <!-- Konto -->
            <div class="bg-white rounded-2xl border border-black/10 shadow-sm">
              <div class="px-6 py-5 flex items-center justify-between">
                <div>
                  <div class="text-sm text-[#6B7E8B] font-semibold">Konten &amp; Karten</div>
                  <div class="text-[18px] font-bold text-[#0B2A3C] mt-1">Girokonto</div>
                  <div class="text-xs text-[#6B7E8B] mt-1 break-all">{{ iban }}</div>
                </div>

                <div class="text-right">
                  <div class="text-xs text-[#6B7E8B]">Saldo</div>
                  <div class="text-[18px] font-bold text-[#0B2A3C]">
                    {{ balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }} €
                  </div>
                </div>
              </div>

              <div class="px-6 pb-6">
                <div class="flex gap-2 mb-4">
                  <button class="px-4 py-2 rounded-xl bg-[#006AC7] text-white font-semibold">
                    Überweisung
                  </button>
                  <button class="px-4 py-2 rounded-xl bg-[#E8F3FF] text-[#006AC7] font-semibold">
                    Umsatzliste
                  </button>
                  <button class="px-4 py-2 rounded-xl bg-[#E8F3FF] text-[#006AC7] font-semibold">
                    Kontodetails
                  </button>
                </div>

                <div class="space-y-4">
                  <div
                    v-for="i in 3"
                    :key="i"
                    class="flex items-center justify-between rounded-xl bg-[#F7FBFF] border border-black/5 px-4 py-3"
                  >
                    <div class="flex items-center gap-3">
                      <span class="w-9 h-9 rounded-xl bg-white border border-black/5 flex items-center justify-center text-[#6B7E8B]">
                        ⇅
                      </span>
                      <div>
                        <div class="font-semibold text-[#0B2A3C]">Vorgemerkt</div>
                        <div class="text-xs text-[#6B7E8B]">01.11.21 • Ausgang</div>
                      </div>
                    </div>
                    <div class="text-[#0B2A3C] font-bold">- 90,00 €</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- VISA -->
            <div class="bg-white rounded-2xl border border-black/10 shadow-sm">
              <div class="px-6 py-5 flex items-center justify-between">
                <div class="text-[18px] font-bold text-[#0B2A3C]">
                  VISA-Card DKB-Cash
                </div>
                <div class="text-sm text-[#6B7E8B] font-semibold">
                  {{ hasIssuedCard ? maskedCard : "—" }}
                </div>
              </div>

              <div class="px-6 pb-6">
                <div class="flex gap-2 mb-4">
                  <button class="px-4 py-2 rounded-xl bg-[#E8F3FF] text-[#006AC7] font-semibold">
                    Umsatzliste
                  </button>
                  <button class="px-4 py-2 rounded-xl bg-[#E8F3FF] text-[#006AC7] font-semibold">
                    Kartendetails
                  </button>
                </div>

                <div class="rounded-2xl bg-[#F7FBFF] border border-black/5 p-5">
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div class="p-4 rounded-xl bg-white border border-black/5">
                      <div class="text-xs text-[#6B7E8B] mb-1">Karteninhaber*in</div>
                      <div class="font-bold text-[#0B2A3C]">{{ fullName }}</div>
                    </div>

                    <div class="p-4 rounded-xl bg-white border border-black/5">
                      <div class="text-xs text-[#6B7E8B] mb-1">Kartennummer</div>
                      <div class="font-bold text-[#0B2A3C]">{{ hasIssuedCard ? maskedCard : "—" }}</div>
                    </div>

                    <div class="p-4 rounded-xl bg-white border border-black/5">
                      <div class="text-xs text-[#6B7E8B] mb-1">Limit</div>
                      <div class="font-bold text-[#0B2A3C]">
                        {{ limit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }} €
                      </div>
                    </div>

                    <div class="p-4 rounded-xl bg-white border border-black/5">
                      <div class="text-xs text-[#6B7E8B] mb-1">Ablauf</div>
                      <div class="font-bold text-[#0B2A3C]">
                        {{ card ? `${String(card.exp_month).padStart(2, '0')}/${card.exp_year}` : "—" }}
                      </div>
                    </div>
                  </div>

                  <div v-if="!hasIssuedCard" class="mt-4 text-sm text-[#6B7E8B]">
                    You don’t have a card yet.
                  </div>
                </div>
              </div>
            </div>

            <!-- Document + Request -->
            <div class="bg-white rounded-2xl border border-black/10 shadow-sm p-6">
              <div class="flex items-center justify-between gap-4">
                <div>
                  <div class="text-[18px] font-bold text-[#0B2A3C]">Identity document</div>
                  <div class="text-sm text-[#6B7E8B] mt-1">
                    Document will be checked after you submit a card request.
                  </div>
                </div>

                <div class="flex items-center gap-2">
                  <div v-if="docLoading" class="text-sm text-[#6B7E8B]">Loading...</div>

                  <span
                    v-else
                    class="px-3 py-1 rounded-full text-sm font-semibold"
                    :class="{
                      'bg-[#FFF3CD] text-[#7A5D00]': !document || document.status === 'pending',
                      'bg-[#DDF7E9] text-[#0E6B3B]': document?.status === 'approved',
                      'bg-[#FFE0E0] text-[#B42318]': document?.status === 'rejected',
                    }"
                  >
                    {{ document ? document.status : "not uploaded" }}
                  </span>
                </div>
              </div>

              <div v-if="document?.status === 'rejected'" class="mt-3 text-sm text-[#B42318]">
                {{ document.review_comment || "Document was rejected" }}
              </div>

              <div
                v-if="uploadError"
                class="mt-3 text-sm text-[#B42318] bg-[#FFE0E0] border border-black/5 rounded-xl px-4 py-3"
              >
                {{ uploadError }}
              </div>

              <div class="mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div class="text-sm text-[#6B7E8B]">
                  <template v-if="document">
                    Uploaded
                    <span v-if="document?.status === 'pending'"> • will be checked after card request</span>
                  </template>
                  <template v-else>
                    Please upload your document to continue.
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

                  <!-- upload button -->
                  <button
                    v-if="!document || document?.status === 'rejected'"
                    :disabled="uploadLoading"
                    class="px-5 py-3 rounded-xl font-semibold transition border border-black/10
                           bg-white hover:bg-[#F3F7FB]
                           disabled:opacity-60 disabled:cursor-not-allowed"
                    @click="openFilePicker"
                  >
                    <span v-if="uploadLoading">Uploading...</span>
                    <span v-else>{{ document?.status === 'rejected' ? 'Re-upload' : 'Upload' }}</span>
                  </button>

                  <!-- request card -->
                  <button
                    :disabled="!canRequestCard"
                    class="px-6 py-3 rounded-xl font-semibold transition
                      bg-[#006AC7] text-white hover:bg-[#134e8a]
                      disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Request card
                  </button>
                </div>
              </div>
            </div>
          </section>

          <!-- RIGHT -->
          <aside class="col-span-12 lg:col-span-4 space-y-6">
            <div class="rounded-2xl bg-gradient-to-br from-[#0A3C63] to-[#062A46] text-white shadow-sm border border-black/5 p-6">
              <div class="text-sm opacity-80">
                Guten Morgen, {{ fullName }}
              </div>
              <div class="text-[16px] font-bold mt-3">
                der Gesamtsaldo beträgt
              </div>
              <div class="text-[26px] font-extrabold mt-2">
                {{ balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }} €
              </div>

              <div class="mt-4 text-xs opacity-80">
                Personal manager:
                {{ manager ? `${manager.first_name} ${manager.last_name}` : "—" }}
                <span v-if="manager?.phone"> · {{ manager.phone }}</span>
              </div>
            </div>

            <div class="bg-white rounded-2xl border border-black/10 shadow-sm p-6">
              <div class="text-[16px] font-bold text-[#0B2A3C] mb-3">Ansicht</div>

              <div class="flex items-center justify-between rounded-xl bg-[#F7FBFF] border border-black/5 px-4 py-4">
                <div class="text-[#2E4A63] font-semibold">Umsätze ausklappen</div>

                <button
                  class="w-12 h-7 rounded-full relative transition"
                  :class="showTurnovers ? 'bg-[#19B6A6]' : 'bg-[#C7D4DE]'"
                  @click="showTurnovers = !showTurnovers"
                >
                  <span
                    class="w-6 h-6 bg-white rounded-full absolute top-[2px] transition"
                    :class="showTurnovers ? 'left-[22px]' : 'left-[2px]'"
                  />
                </button>
              </div>
            </div>

            <div class="bg-white rounded-2xl border border-black/10 shadow-sm p-6">
              <div class="text-[16px] font-bold text-[#0B2A3C] mb-3">Sonstiges</div>

              <button class="w-full text-left rounded-xl bg-[#F7FBFF] border border-black/5 px-4 py-4 hover:bg-[#EEF6FF] transition">
                <div class="font-semibold text-[#0B2A3C]">Feedback geben</div>
                <div class="text-sm text-[#6B7E8B] mt-1">Hilf uns dein Banking zu verbessern</div>
              </button>
            </div>
          </aside>
        </div>
      </div>
    </main>
  </div>
</template>
