<template>
  <section class="bg-[#006AC7] py-16 px-4">
    <div class="max-w-7xl mx-auto flex items-center gap-12">

      <h2 class="text-xl md:text-[33px] font-bold text-white leading-tight min-w-0">
        {{ $t('convinced.title') }}
      </h2>

      <button
        @click="openQuiz"
        style="color: #006AC7 !important;"
        class="bg-white hover:bg-[#E8F5FF] text-[#006AC7] text-base md:text-[22px] font-medium py-4 rounded-md w-[300px] flex-shrink-0"
      >
        {{ $t('convinced.btn') }}
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const openQuiz = () => {
  window.open('/quiz', '_blank');
};

const { t } = useI18n()
</script>