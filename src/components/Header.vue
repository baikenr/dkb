<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useAppStore } from "@/stores/app.js";
import Logo from "@/assets/logo_dkb.svg";

const router = useRouter();
const { t, locale } = useI18n();
const appStore = useAppStore();

const changeLanguage = (lang: string) => {
  locale.value = lang;
  sessionStorage.setItem("lang", lang);
};
const toggleLanguage = () => changeLanguage(locale.value === "de" ? "en" : "de");
const langLabel = computed(() => (locale.value === "de" ? "EN" : "DE"));

const isAuthed = computed(() => appStore.isAuthenticated);

const fullName = computed(() => {
  const fn = appStore.me?.first_name || "";
  const ln = appStore.me?.last_name || "";
  const name = `${fn} ${ln}`.trim();
  return name || t("header.userFallback");
});

const menuOpen = ref(false);

// ✅ мобильное меню (для authed/non-authed)
const mobileMenuOpen = ref(false);

const closeAllMenus = () => {
  menuOpen.value = false;
  mobileMenuOpen.value = false;
};

const goProfile = async () => {
  closeAllMenus();
  await router.push("/profile");
};

const doLogout = async () => {
  closeAllMenus();
  appStore.logout();
  await router.replace("/login");
};

const goLogin = async () => {
  closeAllMenus();
  await router.push("/login");
};

// ✅ закрывать при клике вне меню
const handleClickOutside = (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  if (!target.closest(".header-menu-container")) {
    closeAllMenus();
  }
};

onMounted(async () => {
  document.addEventListener("click", handleClickOutside);

  // подтянем me (чтобы имя было)
  if (appStore.isAuthenticated) {
    if (appStore.authType === "staff") await appStore.staffMe();
    if (appStore.authType === "client") await appStore.clientMe();
  }
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>

<template>
  <header class="w-full bg-white border-b">
    <div class="max-w-[1320px] mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3 header-menu-container">
      <!-- Logo -->
      <router-link to="/" class="flex items-center shrink-0" @click="closeAllMenus">
        <img :src="Logo" :alt="t('common.logoAlt')" class="h-9 sm:h-12 cursor-pointer" />
      </router-link>

      <!-- Right controls (desktop) -->
      <div class="hidden sm:flex items-center gap-3 relative">
        <button
          @click="toggleLanguage"
          class="text-gray-600 hover:text-black transition font-semibold uppercase text-sm sm:text-base"
        >
          {{ langLabel }}
        </button>

        <template v-if="!isAuthed">
          <button
            class="bg-[#006ac7] hover:bg-[#134e8a] text-white px-4 py-2 rounded-xl font-semibold"
            @click="goLogin"
          >
            {{ t("header.loginBtn") }}
          </button>
        </template>

        <template v-else>
          <button
            class="max-w-[260px] px-4 py-2 rounded-xl border hover:bg-gray-50 font-semibold truncate"
            @click="menuOpen = !menuOpen"
          >
            {{ fullName }}
          </button>

          <div
            v-if="menuOpen"
            class="absolute right-0 top-[52px] w-[220px] bg-white border rounded-xl shadow-lg overflow-hidden z-50"
          >
            <button class="w-full text-left px-4 py-3 hover:bg-gray-50" @click="goProfile">
              {{ t("header.menu.profile") }}
            </button>
            <button class="w-full text-left px-4 py-3 hover:bg-gray-50 text-red-600" @click="doLogout">
              {{ t("header.menu.logout") }}
            </button>
          </div>
        </template>
      </div>

      <!-- Right controls (mobile) -->
      <div class="sm:hidden flex items-center gap-2 relative">
        <!-- Language -->
        <button
          @click="toggleLanguage"
          class="px-3 py-2 rounded-xl border border-black/10 bg-white hover:bg-black/5 transition font-semibold text-sm text-[#0B2A3C]"
        >
          {{ langLabel }}
        </button>

        <!-- Burger -->
        <button
          class="w-10 h-10 rounded-xl border border-black/10 bg-white hover:bg-black/5 transition flex items-center justify-center"
          @click="mobileMenuOpen = !mobileMenuOpen"
          aria-label="Open menu"
        >
          <svg v-if="!mobileMenuOpen" width="20" height="20" viewBox="0 0 24 24" fill="none" class="text-[#2E4A63]">
            <path d="M4 7H20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M4 12H20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M4 17H20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" class="text-[#2E4A63]">
            <path d="M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>

        <!-- Mobile dropdown -->
        <div
          v-if="mobileMenuOpen"
          class="absolute right-0 top-[48px] w-[240px] bg-white border rounded-xl shadow-lg overflow-hidden z-50"
        >
          <template v-if="!isAuthed">
            <button
              class="w-full text-left px-4 py-3 hover:bg-gray-50 font-semibold text-[#0B2A3C]"
              @click="goLogin"
            >
              {{ t("header.loginBtn") }}
            </button>
          </template>

          <template v-else>
            <div class="px-4 py-3 border-b bg-gray-50">
              <div class="text-xs text-gray-500">{{ t("header.userFallback") }}</div>
              <div class="font-semibold text-[#0B2A3C] truncate">{{ fullName }}</div>
            </div>

            <button class="w-full text-left px-4 py-3 hover:bg-gray-50" @click="goProfile">
              {{ t("header.menu.profile") }}
            </button>
            <button class="w-full text-left px-4 py-3 hover:bg-gray-50 text-red-600" @click="doLogout">
              {{ t("header.menu.logout") }}
            </button>
          </template>
        </div>
      </div>
    </div>
  </header>
</template>
