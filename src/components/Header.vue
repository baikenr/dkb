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

const mustChangePassword = computed(
  () => appStore.authType === "client" && appStore.firstLoginRequired === true
);

const showChangePasswordModal = ref(false);
const newPassword = ref("");
const confirmPassword = ref("");
const pwdError = ref("");
const pwdLoading = ref(false);

onMounted(async () => {
  // подтянем me (чтобы имя было)
  if (appStore.isAuthenticated) {
    if (appStore.authType === "staff") await appStore.staffMe();
    if (appStore.authType === "client") await appStore.clientMe();
  }

  if (mustChangePassword.value) {
    showChangePasswordModal.value = true;
  }
});

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
</script>

<template>
  <header class="w-full bg-white border-b">
    <div class="max-w-[1320px] mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
      <router-link to="/" class="flex items-center">
        <img :src="Logo" alt="DKB" class="h-10 sm:h-12 cursor-pointer" />
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
  </header>
</template>