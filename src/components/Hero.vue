<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import Banner from "@/assets/blue_week.png";

const openQuiz = () => {
  window.location.href = '/quiz';
};

const { t, locale } = useI18n();
</script>

<template>
  <div class="relative w-full">
    <section class="relative min-h-[50vh]">
      <img
        :src="Banner"
        alt="Blue Week Banner"
        class="absolute inset-0 w-full h-full object-cover"
      />
      <div class="absolute bottom-0 right-0 w-full h-20 bg-[#006AC7] z-10 clip-right-bottom-triangle"></div>
    </section>

    <section class="bg-[#006AC7] mt-[-1px] pb-18 pt-10 md:pt-10 md:pb-20 md:px-12 lg:px-24 relative z-0">
      <div class="max-w-7xl mx-auto flex flex-col lg:flex-row items-center px-4 gap-12">

        <!-- Левая колонка: текст -->
        <div class="flex-1 text-white space-y-6">
          <p class="text-[20px] font-medium opacity-80">
            {{ t('hero.blue_week') }}
          </p>

          <h1 class="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
            {{ t('hero.loan') }}
            <span class="text-[#2AD1C9]">{{ t('hero.discount') }}</span>
          </h1>

          <ul class="space-y-6 text-sm md:text-[20px] py-4">
            <li class="flex items-center gap-2 leading-relaxed">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-[#2AD1C9] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              {{ t('hero.first_point') }}
            </li>
            <li class="flex items-center gap-2 leading-relaxed">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-[#2AD1C9] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              {{ t('hero.second_point') }}
            </li>
            <li class="flex items-center gap-2 leading-relaxed">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-[#2AD1C9] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              {{ t('hero.third_point') }}
            </li>
          </ul>

          <div class="flex w-full justify-center md:justify-start">
            <button
              @click="openQuiz"
              class="px-8 py-4 bg-white text-[24px] font-semibold rounded-md"
              style="color: #006AC7 !important; font-weight: 600 !important;"
            >
              {{ t('header.loon_now') }}
            </button>
          </div>
        </div>

        <!-- Правая колонка: цифры -->
        <div class="flex flex-col">
          <p class="text-[40px] font-medium text-white md:mb-[-40px] ml-4">
            {{ t('hero.only') }}
          </p>
          <div class="flex items-end">
            <span class="text-8xl md:text-9xl lg:text-[300px] font-bold text-[#2AD1C9] leading-none">96</span>
            <div class="flex flex-col items-start -mt-2">
              <div class="flex items-end">
                <span class="text-6xl md:text-8xl lg:text-[168px] font-bold text-[#2AD1C9] leading-none">99</span>
              </div>
              <div class="flex items-end mt-1">
                <span class="text-2xl md:text-3xl lg:text-[400px] text-[#2AD1C9] leading-none relative md:-top-[160px] md:-left-[20px]">,</span>
                <span class="text-4xl md:text-6xl lg:text-[84px] font-bold text-[#2AD1C9] leading-none relative md:-left-[20px]">%</span>
                <span class="text-xs md:text-[22px] font-bold text-[#2AD1C9] ml-1 relative md:-left-[20px] md:-top-[60px]">p. a.</span>
              </div>
            </div>
          </div>
          <p class="text-[40px] font-medium text-white md:mb-[-40px] ml-4">
            {{ t('hero.of_loans') }}
          </p>
        </div>
        
      </div>
    </section>
  </div>
</template>

<style scoped>
.clip-right-bottom-triangle {
  clip-path: polygon(0 100%, 100% 0, 100% 100%);
}
</style>