<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import Logo from '@/assets/logo_dkb.svg';

const { t, locale } = useI18n();

const openQuiz = () => {
  window.location.href = '/quiz';
};

const changeLanguage = (lang: string) => {
  locale.value = lang;
  sessionStorage.setItem('lang', lang);
};

const getLanguageLabel = () => {
  return locale.value === 'de' ? 'DE' : 'EN';
};

// Для десктопа — выпадающее меню продуктов
const productsMenuOpen = ref(false);
let hideTimeout: ReturnType<typeof setTimeout> | null = null;

const showProductsMenu = () => {
  if (hideTimeout) {
    clearTimeout(hideTimeout);
    hideTimeout = null;
  }
  productsMenuOpen.value = true;
};

const hideProductsMenu = () => {
  hideTimeout = setTimeout(() => {
    productsMenuOpen.value = false;
  }, 200);
};
</script>

<template>
  <header class="bg-white py-4">
    <div class="max-w-[1320px] mx-auto flex items-center justify-between px-4 sm:px-6">
       <div class="flex gap-20">
         <img :src="Logo" alt="DKB Das kann Bank" class="h-10 sm:h-12" />
         <nav class="d-none d-md-flex items-center space-x-8 text-[18px] text-[#006AC7] font-medium">
           <a href="#" class="nav-link">{{ t("header.acc") }}</a>
           <a href="#" class="nav-link">{{ t("header.credits") }}</a>
   
           <div 
             class="relative products-menu-container"
             @mouseenter="showProductsMenu"
             @mouseleave="hideProductsMenu"
           >
             <a href="#" class="nav-link cursor-pointer">
               {{ t("header.products") }}
             </a>
   
             <div 
               v-if="productsMenuOpen"
               @mouseenter="showProductsMenu"
               @mouseleave="hideProductsMenu"
               class="absolute top-full left-0 mt-6 bg-white shadow-2xl rounded-b-lg p-8 z-50 min-w-[740px]"
               style="box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);"
             >
               <div class="grid grid-cols-3 gap-8">
                 <div>
                   <h3 class="font-bold text-black text-[16px] mb-1">{{ t("footer.account_title") }}</h3>
                   <ul class="space-y-1 font-light text-[#0A0A0A]">
                     <li><a href="#" class="text-[14px]">{{ t("footer.account_text1") }}</a></li>
                     <li><a href="#" class="text-[14px]">{{ t("footer.account_text2") }}</a></li>
                     <li><a href="#" class="text-[14px]">{{ t("footer.account_text3") }}</a></li>
                     <li><a href="#" class="text-[14px]">{{ t("footer.account_text4") }}</a></li>
                   </ul>
                 </div>
   
                 <div>
                   <h3 class="font-bold text-[#333] text-[16px] mb-1">{{ t("footer.investing_title") }}</h3>
                   <ul class="space-y-1 font-light text-[#0A0A0A]">
                     <li><a href="#" class="text-[14px]">{{ t("footer.investing_text1") }}</a></li>
                     <li><a href="#" class="text-[14px]">{{ t("footer.investing_text2") }}</a></li>
                     <li><a href="#" class="text-[14px]">{{ t("footer.investing_text3") }}</a></li>
                     <li><a href="#" class="text-[14px]">{{ t("footer.investing_text4") }}</a></li>
                   </ul>
                 </div>
   
                 <div>
                   <h3 class="font-bold text-[#333] text-[16px] mb-1">{{ t("footer.credits_title") }}</h3>
                   <ul class="space-y-1 font-light text-[#0A0A0A]">
                     <li><a href="#" class="text-[14px]">{{ t("footer.credits_text1") }}</a></li>
                     <li><a href="#" class="text-[14px]">{{ t("footer.credits_text2") }}</a></li>
                     <li><a href="#" class="text-[14px]">{{ t("footer.credits_text3") }}</a></li>
                   </ul>
                 </div>
   
                 <div class="col-span-full">
                   <h3 class="font-bold text-[#333] text-[16px] mb-1">{{ t("footer.cards_title") }}</h3>
                   <ul class="space-y-1 font-light text-[#0A0A0A]">
                     <li><a href="#" class="text-[14px]">{{ t("footer.cards_text1") }}</a></li>
                     <li><a href="#" class="text-[14px]">{{ t("footer.cards_text2") }}</a></li>
                     <li><a href="#" class="text-[14px]">{{ t("footer.cards_text3") }}</a></li>
                     <li><a href="#" class="text-[14px]">{{ t("footer.cards_text4") }}</a></li>
                   </ul>
                 </div>
               </div>
             </div>
           </div>
         </nav>
       </div>

      <div class="flex items-center gap-4 align-center">
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

        <!-- Кнопка -->
        <div>
          <button 
            @click="openQuiz"
            class="bg-[#006AC7] hover:bg-[#134E8A] text-white text-[14px] sm:text-[16px] font-medium py-2 px-2 sm:px-5 rounded-md transition-colors whitespace-nowrap"
          >
            {{ t("header.loon_now") }}
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.nav-link {
  position: relative;
  padding-bottom: 4px;
}

.nav-link::after {
  content: '';
  position: absolute;
  bottom: -12px;
  left: 0;
  width: 0;
  height: 4px;
  background-color: #2AD1C9;
  transition: width 0.4s ease;
}

.nav-link:hover::after {
  width: 100%;
}
</style>