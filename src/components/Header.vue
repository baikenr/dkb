<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
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
const goProfile = async () => {
  menuOpen.value = false;
  await router.push("/profile");
};
const doLogout = async () => {
  menuOpen.value = false;
  appStore.logout();
  await router.replace("/login");
};

onMounted(async () => {
  // подтянем me (чтобы имя было)
  if (appStore.isAuthenticated) {
    if (appStore.authType === "staff") await appStore.staffMe();
    if (appStore.authType === "client") await appStore.clientMe();
  }
});
</script>

<template>
  <header class="w-full bg-white border-b">
    <div class="max-w-[1320px] mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
      <router-link to="/" class="flex items-center">
        <img :src="Logo" :alt="t('common.logoAlt')" class="h-10 sm:h-12 cursor-pointer" />
      </router-link>

      <div class="flex items-center gap-3 relative">
        <button
          @click="toggleLanguage"
          class="text-gray-600 hover:text-black transition font-semibold uppercase text-sm sm:text-base"
        >
          {{ langLabel }}
        </button>
        <template v-if="!isAuthed">
          <button
            class="bg-[#006ac7] hover:bg-[#134e8a] text-white px-4 py-2 rounded-xl font-semibold"
            @click="router.push('/login')"
          >
            {{ t("header.loginBtn") }}
          </button>
        </template>

        <template v-else>
          <button
            class="px-4 py-2 rounded-xl border hover:bg-gray-50 font-semibold"
            @click="menuOpen = !menuOpen"
          >
            {{ fullName }}
          </button>

          <div
            v-if="menuOpen"
            class="absolute right-0 top-[48px] w-[220px] bg-white border rounded-xl shadow-lg overflow-hidden"
          >
            <button class="w-full text-left px-4 py-3 hover:bg-gray-50" @click="goProfile">
              {{ t("header.menu.profile") }}
            </button>
            <button
              class="w-full text-left px-4 py-3 hover:bg-gray-50 text-red-600"
              @click="doLogout"
            >
              {{ t("header.menu.logout") }}
            </button>
          </div>
        </template>
      </div>
    </div>
  </header>
</template>