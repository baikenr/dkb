<template>
  <footer class="bg-[#002E5C] text-white py-12 px-6 md:px-12 lg:px-24">
    <div class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 pt-14">

      <!-- Column 1: Konto -->
      <div>
        <h3 class="font-bold mb-4 text-white">{{ t('footer.account_title') }}</h3>
        <ul class="space-y-3 text-sm">
          <li><a href="#" class="text-[#8299AF] hover:text-gray-300 font-semibold">{{ t('footer.account_text1') }}</a></li>
          <li><a href="#" class="text-[#8299AF] hover:text-gray-300 font-semibold">{{ t('footer.account_text2') }}</a></li>
          <li><a href="#" class="text-[#8299AF] hover:text-gray-300 font-semibold">{{ t('footer.account_text3') }}</a></li>
          <li><a href="#" class="text-[#8299AF] hover:text-gray-300 font-semibold">{{ t('footer.account_text4') }}</a></li>
        </ul>
      </div>

      <!-- Column 2: Sparen & Anlegen -->
      <div>
        <h3 class="font-bold mb-4 text-white">{{ t('footer.investing_title') }}</h3>
        <ul class="space-y-2 text-sm font-medium">
          <li><a href="#" class="text-[#8299AF] hover:text-gray-300">{{ t('footer.investing_text1') }}</a></li>
          <li><a href="#" class="text-[#8299AF] hover:text-gray-300">{{ t('footer.investing_text2') }}</a></li>
          <li><a href="#" class="text-[#8299AF] hover:text-gray-300">{{ t('footer.investing_text3') }}</a></li>
          <li><a href="#" class="text-[#8299AF] hover:text-gray-300">{{ t('footer.investing_text4') }}</a></li>
        </ul>
      </div>

      <!-- Column 3: Kredite -->
      <div>
        <h3 class="font-bold mb-4 text-white">{{ t('footer.credits_title') }}</h3>
        <ul class="space-y-2 text-sm font-medium">
          <li>
            <a href="#" class="bg-[#33587D] text-[#C2CDD8] hover:text-gray-300 px-3 py-1 rounded inline-block ml-[-4] w-full">
              {{ t('footer.credits_text1') }}
            </a>
          </li>
          <li><a href="#" class="text-[#8299AF] hover:text-gray-300">{{ t('footer.credits_text2') }}</a></li>
          <li><a href="#" class="text-[#8299AF] hover:text-gray-300">{{ t('footer.credits_text3') }}</a></li>
        </ul>
      </div>

      <!-- Column 4: Karten -->
      <div>
        <h3 class="font-bold mb-4 text-white">{{ t('footer.cards_title') }}</h3>
        <ul class="space-y-2 text-sm font-medium">
          <li><a href="#" class="text-[#8299AF] hover:text-gray-300">{{ t('footer.cards_text1') }}</a></li>
          <li><a href="#" class="text-[#8299AF] hover:text-gray-300">{{ t('footer.cards_text2') }}</a></li>
          <li><a href="#" class="text-[#8299AF] hover:text-gray-300">{{ t('footer.cards_text3') }}</a></li>
          <li><a href="#" class="text-[#8299AF] hover:text-gray-300">{{ t('footer.cards_text4') }}</a></li>
        </ul>
      </div>

    </div>

    <div class="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mt-14">
      <div class="flex items-center">
        <Logo class="h-14 text-white" />
      </div>
      <!-- СОЦ-СЕТИ -->
    </div>

    <div class="max-w-7xl mx-auto mt-8 h-[0.4px] bg-[#8299AF]"></div>

    <div class="max-w-7xl mx-auto mt-6 flex flex-col md:flex-row items-start md:items-center justify-between text-[18px] text-[#FFFFFF] font-medium">
      <div class="flex gap-14">
        <p>© DKB 1990 – 2025</p>
        <a href="#" class="hover:text-">{{ t('footer.privacy') }}</a>
        <a href="#" class="hover:text-">{{ t('footer.impressum') }}</a>
        <a href="#" class="hover:text-">{{ t('footer.cookies') }}</a>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import Logo from '@/components/icons/Logo.vue'

const { t } = useI18n()
</script>
