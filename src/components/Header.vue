<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import Logo from '@/assets/logo_dkb.svg';

const { t, locale } = useI18n();

const changeLanguage = (lang: string) => {
  locale.value = lang;
  sessionStorage.setItem('lang', lang);
};

// Вспомогательная функция для отображения текущего языка
const getLanguageLabel = () => {
  return locale.value === 'de' ? 'DE' : 'EN';
};
</script>

<template>
  <header class="bg-white py-4">
    <div class="max-w-[1320px] mx-auto flex items-center justify-between">
      <div class="flex items-center space-x-16">
        <img :src="Logo" alt="DKB Das kann Bank" class="h-12" />

        <nav class="flex items-center space-x-8 text-[18px] text-[#006AC7] font-medium">
          <a href="#">{{ t("header.acc") }}</a>
          <a href="#">{{ t("header.credits") }}</a>
          <a href="#">{{ t("header.products") }}</a>
        </nav>
      </div>

      <div class="flex gap-8">

        <v-btn
          variant="text"
          append-icon="mdi-chevron-down"
          rounded="lg"
          class="font-semibold text-xs sm:text-base uppercase text-[#006AC7] pt-2"
        >
          {{ getLanguageLabel() }}
          <v-menu activator="parent">
            <v-list>
              <v-list-item
                title="DE"
                class="uppercase"
                @click="changeLanguage('de')"
              />
              <v-list-item
                title="EN"
                class="uppercase"
                @click="changeLanguage('en')"
              />
            </v-list>
          </v-menu>
        </v-btn>
  
        <button class="bg-[#006AC7] hover:bg-[#134E8A] text-white text-[18px] font-medium py-2 px-5 rounded-md transition-colors">
          {{ t("header.loon_now") }}
        </button>
      </div>

    </div>
  </header>
</template>