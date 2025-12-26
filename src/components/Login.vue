<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { useAppStore } from "@/stores/app.js";
const { t, locale } = useI18n();
const router = useRouter();
const appStore = useAppStore();

const changeLanguage = (lang: string) => {
  locale.value = lang;
  sessionStorage.setItem("lang", lang);
};
const toggleLanguage = () => changeLanguage(locale.value === "de" ? "en" : "de");
const langLabel = computed(() => (locale.value === "de" ? "EN" : "DE"));

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
      await router.replace("/");
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
      router.push("/");
    }

    await router.replace("/");
  } catch {
    errorText.value = t("login.errors.fillAll");
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <section class="relative min-h-[91vh] flex items-center justify-center bg-[#F5F7FA]">
    <div
      class="bg-white p-8 rounded-[14px] w-full max-w-lg"
      style="border: 1px solid #CBD9E4;"
    >
      <div class="flex justify-end mb-2">
        <button
          @click="toggleLanguage"
          class="text-[#006ACA] hover:text-[#134E8A] underline text-sm font-semibold"
        >
          {{ langLabel }}
        </button>
      </div>

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
</template>
