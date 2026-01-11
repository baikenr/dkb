<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useAppStore } from "@/stores/app.js";
import { useNotificationStore } from "@/stores/notification.js";

const { t } = useI18n();
const appStore = useAppStore();
const notificationStore = useNotificationStore();

// ---- send form (твоя логика) ----
const title = ref("");
const message = ref("");
const sending = ref(false);
const error = ref("");
const success = ref(false);

const sendFAQ = async () => {
  error.value = "";
  success.value = false;

  if (!title.value.trim()) {
    error.value = t("clientFAQ.errors.titleRequired");
    return;
  }
  if (!message.value.trim()) {
    error.value = t("clientFAQ.errors.messageRequired");
    return;
  }

  sending.value = true;
  try {
    const result = await appStore.clientSendFAQ(title.value.trim(), message.value.trim());
    if (result.ok) {
      success.value = true;
      title.value = "";
      message.value = "";
      setTimeout(() => (success.value = false), 3000);
    } else {
      error.value = result.data?.detail || t("clientFAQ.errors.sendFailed");
    }
  } catch {
    error.value = t("clientFAQ.errors.sendFailed");
  } finally {
    sending.value = false;
  }
};

</script>

<template>
  <div class="space-y-4 sm:space-y-6">
    <!-- Header -->
    <div class="bg-white rounded-2xl border border-black/10 shadow-sm p-4 sm:p-6 lg:p-8">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h2 class="text-2xl sm:text-3xl lg:text-[32px] font-bold text-[#0B2A3C] mb-2">{{ t('clientFAQ.title') }}</h2>
          <p class="text-sm sm:text-base lg:text-[16px] text-[#6B7E8B]">
            {{ t('clientFAQ.subtitle') }}
          </p>
        </div>

      </div>
    </div>

    <!-- Success Message -->
    <div v-if="success" class="bg-[#DDF7E9] border border-[#0E6B3B]/20 rounded-2xl p-4 sm:p-6">
      <div class="flex items-start gap-3 sm:gap-4">
        <div class="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#0E6B3B] flex items-center justify-center">
          <svg width="16" height="16" class="sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <div class="flex-1 min-w-0">
          <h3 class="text-base sm:text-lg lg:text-[18px] font-bold text-[#0E6B3B] mb-1">{{ t('clientFAQ.success.title') }}</h3>
          <p class="text-sm sm:text-base lg:text-[15px] text-[#0E6B3B]/90">{{ t('clientFAQ.success.message') }}</p>
        </div>
      </div>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="bg-[#FFE0E0] border border-[#B42318]/20 rounded-2xl p-4 sm:p-6">
      <div class="flex items-start gap-3 sm:gap-4">
        <div class="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#B42318] flex items-center justify-center">
          <svg width="16" height="16" class="sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm sm:text-base lg:text-[15px] text-[#B42318] break-words">{{ error }}</p>
        </div>
      </div>
    </div>

    <!-- Form -->
    <div class="bg-white rounded-2xl border border-black/10 shadow-sm p-4 sm:p-6 lg:p-8">
      <form @submit.prevent="sendFAQ" class="space-y-4 sm:space-y-6">
        <div>
          <label class="block text-sm font-semibold text-[#0B2A3C] mb-2">
            {{ t('clientFAQ.form.title') }} <span class="text-[#CC0000]">*</span>
          </label>
          <input
            v-model="title"
            type="text"
            maxlength="255"
            class="w-full px-4 py-2.5 rounded-xl border border-black/10 bg-white text-[#0B2A3C] focus:outline-none focus:ring-2 focus:ring-[#006AC7]/20 focus:border-[#006AC7]"
            :placeholder="t('clientFAQ.form.titlePlaceholder')"
          />
        </div>

        <div>
          <label class="block text-sm font-semibold text-[#0B2A3C] mb-2">
            {{ t('clientFAQ.form.message') }} <span class="text-[#CC0000]">*</span>
          </label>
          <textarea
            v-model="message"
            rows="8"
            class="w-full px-4 py-2.5 rounded-xl border border-black/10 bg-white text-[#0B2A3C] focus:outline-none focus:ring-2 focus:ring-[#006AC7]/20 focus:border-[#006AC7] resize-none"
            :placeholder="t('clientFAQ.form.messagePlaceholder')"
          ></textarea>
        </div>

        <div class="flex items-center justify-end gap-3 pt-4 border-t border-black/10">
          <button
            type="submit"
            :disabled="sending"
            class="w-full sm:w-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 rounded-xl font-semibold text-sm sm:text-base lg:text-[16px] transition
              bg-[#006AC7] text-white hover:bg-[#0055A3]
              disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 sm:gap-3"
          >
            <svg v-if="sending" class="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
            </svg>
            <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
            <span>{{ sending ? t('clientFAQ.form.sending') : t('clientFAQ.form.send') }}</span>
          </button>
        </div>
      </form>
    </div>

  </div>
</template>
