<template>
  <section class="bg-[#F1F9FF] py-12 px-4 md:px-8 lg:px-16">
    <div class="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-8 py-12 px-4 md:px-8">
      <div class="w-full md:w-1/3 flex justify-center">
        <img :src="Plane" alt="Paper plane flying from hand" class="w-full max-w-[350px] h-auto" />
      </div>

      <div class="w-full md:w-2/3 space-y-4">
        <h2 class="text-[33px] md:text-3xl font-bold text-gray-800">
          {{ t('interestSection.title') }}
        </h2>

        <p class="text-[18px] leading-relaxed" v-html="t('interestSection.paragraph1')"></p>

        <p class="text-[18px] py-4" v-html="t('interestSection.paragraph2')"></p>

        <button class="bg-[#006AC7] hover:bg-[#005AA9] text-white text-[18px] font-medium py-2 px-6 rounded-md transition-colors">
          {{ t('interestSection.button') }}
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import Plane from '@/assets/paper_plane.svg'

const { t } = useI18n()
</script>
