<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import Logo from "@/assets/logo_dkb.svg";
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

const showRestoreLogin = ref(false);
const showRestorePassword = ref(false);
const showFirstLogin = ref(false); // оставили (если вдруг вернёшь модалку тут)

const showSuccess = ref(false);
const successTitle = ref("");
const successText = ref("");

const restoreEmail = ref("");
const restoreLoginValue = ref("");
const restoreLoading = ref(false);

const newPassword = ref("");
const confirmPassword = ref("");
const firstLoginError = ref("");

const contactPhone = computed(() => "+49 999 888 77 66 55");

const openSuccess = (title: string, text: string) => {
  successTitle.value = title;
  successText.value = text;
  showSuccess.value = true;
};

const resetErrors = () => {
  errorText.value = "";
  firstLoginError.value = "";
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
    // staff
    if (raw.includes("@")) {
      const res = await appStore.staffLogin({ email: raw, password: pass });

      if (!res?.ok) {
        errorText.value = t("login.errors.fillAll");
        return;
      }

      await router.replace("/");
      return;
    }

    // client
    const digitsOnly = raw.replace(/\D/g, "");
    if (digitsOnly.length !== 11) {
      errorText.value = t("login.errors.fillAll");
      return;
    }

    const res = await appStore.clientLogin({ login_11: digitsOnly, password: pass });

    if (!res?.ok) {
      errorText.value = t("login.errors.fillAll");
      return;
    }

    // ⛔️ модалку смены пароля теперь показываем в Header.vue, тут просто на главную
    await router.replace("/");
  } catch (e) {
    errorText.value = t("login.errors.fillAll");
  } finally {
    loading.value = false;
  }
};

// restore login (UI)
const submitRestoreLogin = async () => {
  resetErrors();
  if (!restoreEmail.value) {
    errorText.value = t("login.errors.fillAll");
    return;
  }

  restoreLoading.value = true;
  try {
    // TODO endpoint
  } finally {
    restoreLoading.value = false;
    showRestoreLogin.value = false;
    restoreEmail.value = "";
    openSuccess(t("login.successTitle"), t("login.restoreSuccessText"));
  }
};

// restore password (UI)
const submitRestorePassword = async () => {
  resetErrors();
  if (!restoreLoginValue.value) {
    errorText.value = t("login.errors.fillAll");
    return;
  }

  restoreLoading.value = true;
  try {
    // TODO endpoint
  } finally {
    restoreLoading.value = false;
    showRestorePassword.value = false;
    restoreLoginValue.value = "";
    openSuccess(t("login.successTitle"), t("login.restoreSuccessText"));
  }
};

// если ты захочешь вернуть first-login модалку на Login.vue — оставил функцию
const submitFirstPassword = async () => {
  firstLoginError.value = "";

  if (!newPassword.value || !confirmPassword.value) {
    firstLoginError.value = t("login.errors.fillAll");
    return;
  }
  if (newPassword.value.length < 8) {
    firstLoginError.value = t("login.errors.min8");
    return;
  }
  if (newPassword.value !== confirmPassword.value) {
    firstLoginError.value = t("login.errors.notMatch");
    return;
  }

  loading.value = true;
  try {
    const res = await appStore.clientChangePasswordFirst({ new_password: newPassword.value });

    if (!res?.ok) {
      firstLoginError.value = t("login.errors.fillAll");
      return;
    }

    showFirstLogin.value = false;
    newPassword.value = "";
    confirmPassword.value = "";
    await router.replace("/");
  } catch (e) {
    firstLoginError.value = t("login.errors.fillAll");
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen bg-[#071821] flex flex-col">
    <header class="w-full border-b border-white/10">
      <div class="max-w-[1320px] mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <img :src="Logo" alt="DKB" class="h-10 sm:h-12" />

        <button
          @click="toggleLanguage"
          class="text-[#9FB3C1] hover:text-white transition font-semibold uppercase text-sm sm:text-base"
        >
          {{ langLabel }}
        </button>
      </div>
    </header>

    <main class="flex-1 flex items-center justify-center px-4 py-10">
      <div
        class="w-full max-w-[520px] rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-[0_20px_60px_rgba(0,0,0,0.45)] px-6 sm:px-10 py-10"
      >
        <h1 class="text-center text-white text-[32px] sm:text-[40px] font-semibold tracking-tight mb-8">
          {{ t("login.title") }}
        </h1>

        <div
          v-if="errorText"
          class="mb-5 text-sm text-red-200 bg-red-500/10 border border-red-400/20 rounded-lg px-4 py-3"
        >
          {{ errorText }}
        </div>

        <form @submit.prevent="submitLogin" class="space-y-5">
          <input v-model="login" type="text" class="dkb-input" :placeholder="t('login.loginPlaceholder')" />

          <div class="relative">
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              class="dkb-input pr-12"
              :placeholder="t('login.passwordPlaceholder')"
            />
            <button
              type="button"
              class="absolute right-4 top-1/2 -translate-y-1/2 text-[#B8C7D3] hover:text-white transition"
              @click="showPassword = !showPassword"
              aria-label="toggle password"
            >
              👁
            </button>
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full bg-[#0C5AA6] hover:bg-[#0A4E92] disabled:opacity-60 disabled:cursor-not-allowed text-white text-[18px] sm:text-[20px] font-semibold py-4 rounded-xl transition"
          >
            {{ t("login.signIn") }}
          </button>

          <div class="text-center text-[#C6D3DD] text-sm sm:text-base">
            <button
              type="button"
              class="text-[#2AD1C9] hover:text-white underline underline-offset-4"
              @click="showRestoreLogin = true"
            >
              {{ t("login.restoreLogin") }}
            </button>
            <span class="mx-2">oder</span>
            <button
              type="button"
              class="text-[#2AD1C9] hover:text-white underline underline-offset-4"
              @click="showRestorePassword = true"
            >
              {{ t("login.restorePassword") }}
            </button>
          </div>

          <div class="text-center text-[#9FB3C1] text-sm">
            <span class="font-medium">{{ t("login.contact") }}</span>
            <a :href="`tel:${contactPhone}`" class="ml-1 text-[#2AD1C9] hover:text-white">
              {{ contactPhone }}
            </a>
          </div>

          <div class="pt-4 text-center">
            <a href="/cookie-policy" class="text-[#9FB3C1] hover:text-white text-sm">
              {{ t("login.cookiePolicy") }}
            </a>
          </div>
        </form>
      </div>
    </main>

    <!-- Restore Login -->
    <div v-if="showRestoreLogin" class="modal-backdrop">
      <div class="modal-card">
        <div class="modal-title">{{ t("login.restoreLoginTitle") }}</div>

        <input v-model="restoreEmail" type="email" class="modal-input" :placeholder="t('login.emailPlaceholder')" />

        <div class="modal-actions">
          <button class="btn-secondary" @click="showRestoreLogin = false">Cancel</button>
          <button class="btn-primary" :disabled="restoreLoading" @click="submitRestoreLogin">
            {{ t("login.submit") }}
          </button>
        </div>
      </div>
    </div>

    <!-- Restore Password -->
    <div v-if="showRestorePassword" class="modal-backdrop">
      <div class="modal-card">
        <div class="modal-title">{{ t("login.restorePasswordTitle") }}</div>

        <input v-model="restoreLoginValue" type="text" class="modal-input" :placeholder="t('login.loginPlaceholder')" />

        <div class="modal-actions">
          <button class="btn-secondary" @click="showRestorePassword = false">Cancel</button>
          <button class="btn-primary" :disabled="restoreLoading" @click="submitRestorePassword">
            {{ t("login.submit") }}
          </button>
        </div>
      </div>
    </div>

    <!-- First login (если вернёшь) -->
    <div v-if="showFirstLogin" class="modal-backdrop">
      <div class="modal-card">
        <div class="modal-title">{{ t("login.firstLoginTitle") }}</div>
        <div class="text-sm text-gray-700 mb-4">
          {{ t("login.firstLoginText") }}
        </div>

        <div
          v-if="firstLoginError"
          class="mb-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2"
        >
          {{ firstLoginError }}
        </div>

        <input v-model="newPassword" type="password" class="modal-input" :placeholder="t('login.newPassword')" />
        <input
          v-model="confirmPassword"
          type="password"
          class="modal-input mt-3"
          :placeholder="t('login.confirmPassword')"
        />

        <div class="modal-actions">
          <button class="btn-secondary" @click="showFirstLogin = false">Cancel</button>
          <button class="btn-primary" :disabled="loading" @click="submitFirstPassword">
            {{ t("login.save") }}
          </button>
        </div>
      </div>
    </div>

    <!-- Success -->
    <div v-if="showSuccess" class="modal-backdrop">
      <div class="modal-card">
        <div class="modal-title">{{ successTitle }}</div>
        <div class="text-sm text-gray-700 mb-5">
          {{ successText }}
        </div>
        <button class="btn-primary w-full" @click="showSuccess = false">OK</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dkb-input {
  width: 100%;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(9, 28, 40, 0.55);
  padding: 16px 16px;
  color: white;
  font-size: 18px;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.dkb-input::placeholder {
  color: rgba(190, 206, 218, 0.75);
}

.dkb-input:focus {
  border-color: rgba(42, 209, 201, 0.65);
  box-shadow: 0 0 0 4px rgba(42, 209, 201, 0.14);
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  z-index: 50;
}

.modal-card {
  width: 100%;
  max-width: 460px;
  background: white;
  border-radius: 14px;
  padding: 20px;
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.2);
}

.modal-title {
  font-size: 18px;
  font-weight: 700;
  color: #0a0a0a;
  margin-bottom: 14px;
}

.modal-input {
  width: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 12px 14px;
  outline: none;
}

.modal-input:focus {
  border-color: #006ac7;
  box-shadow: 0 0 0 4px rgba(0, 106, 199, 0.15);
}

.modal-actions {
  display: flex;
  gap: 10px;
  margin-top: 16px;
}

.btn-primary {
  background: #006ac7;
  color: white;
  padding: 10px 14px;
  border-radius: 10px;
  font-weight: 600;
  width: 100%;
}

.btn-primary:hover {
  background: #134e8a;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f3f4f6;
  color: #111827;
  padding: 10px 14px;
  border-radius: 10px;
  font-weight: 600;
  width: 100%;
}
</style>