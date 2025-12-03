<template>
  <section class="bg-[#006AC7] py-12 sm:py-16 px-4">
    <div class="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-12">
      <h2 class="text-xl sm:text-2xl md:text-[33px] font-bold text-white leading-tight text-center sm:text-left">
        {{ $t('convinced.title') }}
      </h2>

      <button
        @click="openQuiz"
        style="color: #006AC7 !important;"
        class="bg-white hover:bg-[#E8F5FF] text-[#006AC7] font-medium py-3 sm:py-4 px-4 rounded-md w-full sm:w-[300px] md:w-[320px] text-base md:text-[22px] transition-colors"
      >
        {{ $t('convinced.btn') }}
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const openQuiz = () => {
  window.location.href = '/quiz';
};

const { t } = useI18n();
</script>