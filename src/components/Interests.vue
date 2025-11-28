<template>
  <section class="bg-[#F1F9FF] py-12 px-4">
    <div class="md:pt-6 md:px-24">
      <h2 class="text-2xl md:text-[33px] font-bold text-gray-800 mb-6">
        {{ $t('interests.blue_week') }}
      </h2>

      <!-- Декоративная линия -->
      <div class="w-12 h-1 bg-[#2AD1C9] mb-6 mt-16"></div>

      <p class="mb-8 leading-relaxed text-[18px]">
        {{ $t('interests.loan') }} 
        <strong>{{ $t('interests.discount') }}</strong> 
        {{ $t('interests.text_after_discount') }}
      </p>

      <button class="bg-[#006AC7] hover:bg-[#005AA9] text-white text-[18px] font-medium py-2 px-6 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
        {{ $t('interests.button') }}
      </button>
    </div>
  </section>
</template>

<script>
import { useI18n } from 'vue-i18n';

const t = useI18n;
</script>