<script setup lang="ts">
import { onMounted, ref, computed, onBeforeUnmount } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import { useAppStore } from "@/stores/app.js";
import StaffSidebar from "@/components/StaffSidebar.vue";
import UsersManagement from "@/components/UsersManagement.vue";
import ClientsManagement from "@/components/ClientsManagement.vue";
import CardRequests from "@/components/CardRequests.vue";
import StaffFAQ from "@/components/StaffFAQ.vue";

const router = useRouter();
const route = useRoute();
const appStore = useAppStore();
const { t, locale } = useI18n();

const loading = ref(false);
const me = computed(() => appStore.me as any);

const loadMe = async () => {
  loading.value = true;
  try {
    await appStore.staffMe();
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  await loadMe();
});

const fullName = computed(() => {
  const fn = me.value?.first_name || "";
  const ln = me.value?.last_name || "";
  return `${fn} ${ln}`.trim() || "—";
});

const staffRole = computed(() => appStore.staffRole || "—");

const pageTitle = computed(() => {
  const path = route.path;
  if (path.includes("/users")) return t("sidebar.users");
  if (path.includes("/clients")) return t("sidebar.clients");
  if (path.includes("/card-requests")) return t("sidebar.cardRequests");
  if (path.includes("/faq") || path === "/staff/faq") return t("sidebar.faq");
  return t("sidebar.dashboard");
});

// Language toggle
const changeLanguage = (lang: string) => {
  locale.value = lang;
  sessionStorage.setItem("lang", lang);
};
const toggleLanguage = () => changeLanguage(locale.value === "de" ? "en" : "de");
const langLabel = computed(() => (locale.value === "de" ? "EN" : "DE"));

// Profile menu
const profileMenuOpen = ref(false);
const goProfile = async () => {
  profileMenuOpen.value = false;
  await router.push("/profile");
};

const doLogout = async () => {
  profileMenuOpen.value = false;
  appStore.logout();
  await router.replace("/login");
};

const handleClickOutside = (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  if (!target.closest('.profile-menu-container')) {
    profileMenuOpen.value = false;
  }
};

onMounted(async () => {
  await loadMe();
  // Close profile menu when clicking outside
  document.addEventListener('click', handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<template>
  <div class="flex min-h-screen">
  <!-- Left Sidebar -->
  <StaffSidebar />
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
                {{ t("header.menu.profile") }}
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
                {{ t("header.menu.logout") }}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div class="max-w-[1200px] mx-auto px-6 py-8">
        <div class="mb-6">
          <h1 class="text-[36px] font-bold text-[#0B2A3C] tracking-tight">{{ pageTitle }}</h1>
          <div class="h-px bg-black/10 mt-4"></div>
        </div>

        <div v-if="loading" class="text-[#2E4A63]">{{ t('common.loading') }}</div>

        <div v-else>
          <!-- Dashboard Content -->
          <template v-if="route.path === '/staff' || (route.path === '/' && appStore.authType === 'staff')">
            <div class="grid grid-cols-12 gap-6">
              <section class="col-span-12 lg:col-span-8 space-y-6">
                <!-- Welcome Card -->
                <div class="bg-white rounded-2xl border border-black/10 shadow-sm p-6">
                  <div class="text-[18px] font-bold text-[#0B2A3C] mb-2">
                    {{ fullName && fullName !== '—' ? t('staffDashboard.welcome', { name: fullName }) : t('staffDashboard.welcomeNoName') }}
                  </div>
                  <div class="text-sm text-[#6B7E8B]">
                    {{ t('staffDashboard.role') }}: <span class="font-semibold">{{ staffRole }}</span>
                  </div>
                </div>

                <!-- Stats Cards -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div class="bg-white rounded-2xl border border-black/10 shadow-sm p-6">
                    <div class="text-sm text-[#6B7E8B] font-semibold mb-2">{{ t('staffDashboard.totalClients') }}</div>
                    <div class="text-[24px] font-bold text-[#0B2A3C]">{{ t('common.dash') }}</div>
                  </div>

                  <div class="bg-white rounded-2xl border border-black/10 shadow-sm p-6">
                    <div class="text-sm text-[#6B7E8B] font-semibold mb-2">{{ t('staffDashboard.pendingDocuments') }}</div>
                    <div class="text-[24px] font-bold text-[#0B2A3C]">{{ t('common.dash') }}</div>
                  </div>
                </div>

                <!-- Recent Activity -->
                <div class="bg-white rounded-2xl border border-black/10 shadow-sm p-6">
                  <div class="text-[18px] font-bold text-[#0B2A3C] mb-4">{{ t('staffDashboard.recentActivity') }}</div>
                  <div class="text-sm text-[#6B7E8B]">{{ t('staffDashboard.noRecentActivity') }}</div>
                </div>
              </section>

              <!-- RIGHT SIDEBAR -->
              <aside class="col-span-12 lg:col-span-4 space-y-6">
                <div class="rounded-2xl bg-gradient-to-br from-[#0A3C63] to-[#062A46] text-white shadow-sm border border-black/5 p-6">
                  <div class="text-sm opacity-80">
                    {{ fullName && fullName !== '—' ? t('staffDashboard.greeting', { name: fullName }) : t('staffDashboard.greetingNoName') }}
                  </div>
                  <div class="text-[16px] font-bold mt-3">
                    {{ t('staffDashboard.staffDashboard') }}
                  </div>
                  <div class="text-xs opacity-80 mt-2">
                    {{ t('staffDashboard.role') }}: {{ staffRole }}
                  </div>
                </div>

                <div class="bg-white rounded-2xl border border-black/10 shadow-sm p-6">
                  <div class="text-[16px] font-bold text-[#0B2A3C] mb-3">{{ t('staffDashboard.quickActions') }}</div>

                  <button 
                    @click="router.push('/staff/clients')"
                    class="w-full text-left rounded-xl bg-[#F7FBFF] border border-black/5 px-4 py-4 hover:bg-[#EEF6FF] transition mb-2"
                  >
                    <div class="font-semibold text-[#0B2A3C]">{{ t('staffDashboard.viewClients') }}</div>
                    <div class="text-sm text-[#6B7E8B] mt-1">{{ t('staffDashboard.manageClientAccounts') }}</div>
                  </button>

                  <button 
                    @click="router.push('/staff/card-requests')"
                    class="w-full text-left rounded-xl bg-[#F7FBFF] border border-black/5 px-4 py-4 hover:bg-[#EEF6FF] transition mb-2"
                  >
                    <div class="font-semibold text-[#0B2A3C]">{{ t('staffDashboard.cardRequests') }}</div>
                    <div class="text-sm text-[#6B7E8B] mt-1">{{ t('staffDashboard.reviewCardRequests') }}</div>
                  </button>

                  <button 
                    @click="router.push('/staff/faq')"
                    class="w-full text-left rounded-xl bg-[#F7FBFF] border border-black/5 px-4 py-4 hover:bg-[#EEF6FF] transition"
                  >
                    <div class="font-semibold text-[#0B2A3C]">{{ t('staffDashboard.notificationsMessages') }}</div>
                    <div class="text-sm text-[#6B7E8B] mt-1">{{ t('staffDashboard.viewNotifications') }}</div>
                  </button>
                </div>
              </aside>
            </div>
          </template>

          <!-- Other Pages Content -->
          <template v-else>
            <template v-if="route.path.includes('/faq')">
              <StaffFAQ />
            </template>
            <template v-else-if="route.path.includes('/users')">
              <UsersManagement />
            </template>
            <template v-else-if="route.path.includes('/clients')">
              <ClientsManagement />
            </template>
            <template v-else-if="route.path.includes('/card-requests')">
              <CardRequests />
            </template>
            <template v-else>
              <div class="bg-white rounded-2xl border border-black/10 shadow-sm p-6">
                <div class="text-[#6B7E8B]">
                  <p>{{ t('common.comingSoon') }}</p>
                </div>
              </div>
            </template>
          </template>
        </div>
      </div>
    </main>
  </div>
</template>

