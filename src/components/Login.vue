<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { useAppStore } from "@/stores/app.js";
import Logo from "@/assets/logo_dkb.svg";

const { t, locale } = useI18n();
const router = useRouter();
const appStore = useAppStore();

const changeLanguage = (lang: string) => {
  locale.value = lang;
  sessionStorage.setItem("lang", lang);
};
const toggleLanguage = () => changeLanguage(locale.value === "de" ? "en" : "de");
const langLabel = computed(() => (locale.value === "de" ? "EN" : "DE"));
const getLanguageLabel = () => {
  return locale.value === "de" ? "DE" : "EN";
};

onMounted(() => {
  const saved = sessionStorage.getItem("lang");
  if (saved === "de" || saved === "en") locale.value = saved;
});

const login = ref("");
const password = ref("");
const showPassword = ref(false);
const loading = ref(false);
const errorText = ref("");

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value;
};

const resetErrors = () => {
  errorText.value = "";
};

const submitLogin = async () => {
  resetErrors();

  const raw = login.value?.trim();
  const pass = password.value;

  if (!raw || !pass) {
    errorText.value = t("login.errors.fillAll");
    return;
  }

  loading.value = true;
  try {
    if (raw.includes("@")) {
      const res = await appStore.staffLogin({ email: raw, password: pass });
      if (!res?.ok) {
        errorText.value = t("login.errors.fillAll");
        return;
      }
      await router.replace("/staff");
      return;
    }

    const digitsOnly = raw.replace(/\D/g, "");
    if (digitsOnly.length !== 11) {
      errorText.value = t("login.errors.fillAll");
      return;
    }

    const res = await appStore.clientLogin({
      login_11: digitsOnly,
      password: pass,
    });

    if (!res?.ok) {
      errorText.value = t("login.errors.fillAll");
      return;
    }
    if (res.ok) {
      await router.replace("/");
    }
  } catch {
    errorText.value = t("login.errors.fillAll");
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen flex flex-col bg-[#F5F7FA]">
    <!-- Header -->
    <header class="py-4 flex-shrink-0">
      <div class="mx-auto flex justify-between px-8">
        <div>
          <img :src="Logo" :alt="t('common.logoAlt')" class="h-10 sm:h-12" />
        </div>

        <div class="flex items-center">
          <v-btn
            variant="text"
            append-icon="mdi-chevron-down"
            rounded="lg"
            class="font-semibold text-xs sm:text-base uppercase text-[#006AC7]"
          >
            {{ getLanguageLabel() }}
            <v-menu activator="parent">
              <v-list>
                <v-list-item title="DE" class="uppercase" @click="changeLanguage('de')" />
                <v-list-item title="EN" class="uppercase" @click="changeLanguage('en')" />
              </v-list>
            </v-menu>
          </v-btn>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 flex items-center justify-center py-8">
      <section class="w-full">
    <div
          class="bg-white p-8 rounded-[14px] w-full max-w-lg mx-auto"
      style="border: 1px solid #CBD9E4;"
        >
      <h2 class="text-[32px] font-bold text-center mb-6 text-[#31373D]">
        {{ t("login.title") }}
      </h2>

      <div
        v-if="errorText"
        class="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-2"
      >
        {{ errorText }}
      </div>

      <form @submit.prevent="submitLogin" class="space-y-6">
        <v-text-field
          v-model="login"
          :label="t('login.loginPlaceholder')"
          variant="solo"
          hide-details
          bg-color="#F2F9FF"
        />

        <v-text-field
          v-model="password"
          :label="t('login.passwordPlaceholder')"
          :type="showPassword ? 'text' : 'password'"
          :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
          @click:append-inner="togglePasswordVisibility"
          variant="solo"
          hide-details
          bg-color="#F2F9FF"
        />

        <button
          type="submit"
          :disabled="loading"
          class="w-full mt-10 h-[50px] rounded-[5px] text-[19px] font-semibold
                 bg-[#006AC7] text-white hover:bg-[#134E8A]
                 transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {{ t("login.signIn") }}
        </button>
      </form>

      <div class="mt-6 text-center text-[17px] text-[#31373D]">
        <span>
          {{ t("login.restoreLogin") }}
          <router-link
            to="/forgot-login"
            class="text-[#006ACA] hover:text-[#134E8A] underline"
          >
            {{ t("login.restoreLoginLink") }}
          </router-link>
          {{ t("login.restoreMiddle") }}
          <router-link
            to="/forgot-password"
            class="text-[#006ACA] hover:text-[#134E8A] underline"
          >
            {{ t("login.restorePasswordLink") }}
          </router-link>
        </span>
      </div>
    </div>
  </section>
    </main>

    <!-- Footer -->
    <footer class="bg-[#1D2C40] text-white py-2 px-8 flex-shrink-0">
      <div class="mx-auto flex items-center justify-between">
        <div class="flex-shrink-0"></div>

        <div class="flex flex-wrap justify-end gap-x-6 gap-y-2 text-sm">
          <a
            href="#"
            class="decoration-[#3E757C] underline decoration-1 underline-offset-4 hover:text-[#3E757C] transition"
          >
            {{ t("login.cookiePolicy") }}
          </a>
        </div>
      </div>
    </footer>
  </div>
</template>
