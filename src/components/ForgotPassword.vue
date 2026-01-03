<script setup lang="ts">
import { ref, computed } from "vue";
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

const phoneOrEmail = ref("");
const loading = ref(false);
const errorText = ref("");
const success = ref(false);

const submitResetPassword = async () => {
  errorText.value = "";
  success.value = false;

  const value = phoneOrEmail.value?.trim();
  if (!value) {
    errorText.value = t("forgotPassword.errors.fillField");
    return;
  }

  loading.value = true;
  try {
    // Determine if it's phone or email
    const isEmail = value.includes("@");
    const payload: any = {};
    
    if (isEmail) {
      payload.email = value;
    } else {
      // Remove all non-digit characters for phone
      const digitsOnly = value.replace(/\D/g, "");
      if (digitsOnly.length === 0) {
        errorText.value = t("forgotPassword.errors.invalidFormat");
        loading.value = false;
        return;
      }
      payload.phone = digitsOnly;
    }

    const result = await appStore.requestResetPassword(payload);
    if (result.ok) {
      success.value = true;
      phoneOrEmail.value = "";
    } else {
      errorText.value = result.data?.detail || t("forgotPassword.errors.failed");
    }
  } catch (error) {
    errorText.value = t("forgotPassword.errors.failed");
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
          <h2 class="text-[32px] font-bold text-center mb-2 text-[#31373D]">
            {{ t("forgotPassword.title") }}
          </h2>
          <p class="text-center text-[#6B7E8B] mb-6">
            {{ t("forgotPassword.subtitle") }}
          </p>

          <!-- Success Message -->
          <div
            v-if="success"
            class="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3"
          >
            {{ t("forgotPassword.success") }}
          </div>

          <!-- Error Message -->
          <div
            v-if="errorText"
            class="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-2"
          >
            {{ errorText }}
          </div>

          <form @submit.prevent="submitResetPassword" class="space-y-6">
            <v-text-field
              v-model="phoneOrEmail"
              :label="t('forgotPassword.phoneOrEmailPlaceholder')"
              variant="solo"
              hide-details
              bg-color="#F2F9FF"
              :disabled="loading || success"
            />

            <button
              type="submit"
              :disabled="loading || success"
              class="w-full mt-10 h-[50px] rounded-[5px] text-[19px] font-semibold
                     bg-[#006AC7] text-white hover:bg-[#134E8A]
                     transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {{ loading ? t("forgotPassword.submitting") : t("forgotPassword.submit") }}
            </button>
          </form>

          <div class="mt-6 text-center text-[17px] text-[#31373D]">
            <router-link
              to="/login"
              class="text-[#006ACA] hover:text-[#134E8A] underline"
            >
              {{ t("forgotPassword.backToLogin") }}
            </router-link>
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

