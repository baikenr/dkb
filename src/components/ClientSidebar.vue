<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter, useRoute } from "vue-router";
import { useAppStore } from "@/stores/app.js";
import Logo from "@/assets/logo_dkb.svg";

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const appStore = useAppStore();

const sidebarOpen = ref(true);
const isMobileMenuOpen = ref(false);
const unreadCount = ref(0);
let unreadCountInterval: any = null;

const me = computed(() => appStore.me as any);
const card = computed(() => me.value?.bank_card || null);
const hasCard = computed(() => !!card.value && me.value?.client_bank_status === "received");

const navItems = computed(() => {
  const items = [
    { key: "home", label: t("clientSidebar.home"), to: "/", icon: "home" },
    { key: "document", label: t("clientSidebar.document"), to: "/document", icon: "document" },
    { key: "messages", label: t("clientSidebar.messages"), to: "/messages", icon: "messages" },
    { key: "faq", label: t("clientSidebar.faq"), to: "/faq", icon: "faq" },
  ];
  
  // Показываем вкладку "Карты" только если карта создана
  if (hasCard.value) {
    items.splice(1, 0, { key: "card", label: t("clientSidebar.card"), to: "/card", icon: "card" });
  }
  
  return items;
});

const isActive = (to: string) => route.path === to || route.path.startsWith(to + "/");

const go = async (to: string) => {
  try {
    await router.push(to);
    // Закрываем мобильное меню после перехода
    if (window.innerWidth < 768) {
      isMobileMenuOpen.value = false;
    }
  } catch {}
};

const loadUnreadCount = async () => {
  if (appStore.authType !== "client") return;
  try {
    const res = await appStore.clientNotificationCount();
    if (res.ok) unreadCount.value = res.data?.count ?? 0;
  } catch {}
};

const handleWindowFocus = () => {
  loadUnreadCount();
};

const handleNotificationUpdate = () => {
  loadUnreadCount();
};

const handleResize = () => {
  // На мобильных устройствах скрываем сайдбар по умолчанию
  if (window.innerWidth >= 768) {
    isMobileMenuOpen.value = false;
  }
};

const openMobileMenu = () => {
  isMobileMenuOpen.value = true;
};

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false;
};

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
};

// Слушаем события для открытия/закрытия меню
const handleMobileMenuToggle = () => {
  toggleMobileMenu();
};

// Экспортируем функции для использования в родительском компоненте
defineExpose({
  openMobileMenu,
  closeMobileMenu,
  toggleMobileMenu,
  isMobileMenuOpen
});

onMounted(async () => {
  await loadUnreadCount();
  // Обновляем счетчик каждые 30 секунд
  unreadCountInterval = setInterval(loadUnreadCount, 30000);
  // Обновляем счетчик при возврате фокуса на окно
  window.addEventListener("focus", handleWindowFocus);
  // Обновляем счетчик при обновлении уведомлений
  window.addEventListener("notification-updated", handleNotificationUpdate);
  // Обработчик изменения размера окна
  window.addEventListener("resize", handleResize);
  // Слушаем событие для открытия мобильного меню
  window.addEventListener("toggle-mobile-menu", handleMobileMenuToggle);
  handleResize();
});

onMounted(async () => {
  await loadUnreadCount();
  // Обновляем счетчик каждые 30 секунд
  unreadCountInterval = setInterval(loadUnreadCount, 30000);
  // Обновляем счетчик при возврате фокуса на окно
  window.addEventListener("focus", handleWindowFocus);
  // Обновляем счетчик при обновлении уведомлений
  window.addEventListener("notification-updated", handleNotificationUpdate);
  // Обработчик изменения размера окна
  window.addEventListener("resize", handleResize);
  handleResize();
});

onBeforeUnmount(() => {
  if (unreadCountInterval) {
    clearInterval(unreadCountInterval);
  }
  window.removeEventListener("focus", handleWindowFocus);
  window.removeEventListener("notification-updated", handleNotificationUpdate);
  window.removeEventListener("resize", handleResize);
  window.removeEventListener("toggle-mobile-menu", handleMobileMenuToggle);
});

// Обновляем счетчик при переходе на страницу Messages
watch(() => route.path, (newPath) => {
  if (newPath === "/messages") {
    loadUnreadCount();
  }
});
</script>

<template>
  <!-- Mobile Overlay -->
  <div
    v-if="isMobileMenuOpen"
    class="fixed inset-0 bg-black/50 z-40 lg:hidden"
    @click="isMobileMenuOpen = false"
  ></div>

  <aside
    class="h-screen sticky top-0 bg-white transition-all duration-300 ease-in-out z-50
           fixed lg:relative
           transform lg:transform-none
           -translate-x-full lg:translate-x-0
           md:-translate-x-full md:translate-x-0
           border-r border-black/5 lg:border-black/10"
    :class="[
      sidebarOpen ? 'w-[275px] lg:w-[280px]' : 'w-[85px] lg:w-[90px]',
      isMobileMenuOpen ? 'translate-x-0' : 'lg:translate-x-0'
    ]"
  >
    <!-- Logo Section -->
    <div class="px-2 py-3 sm:px-3 sm:py-4 lg:py-6 border-b border-black/10">
      <div class="flex items-center justify-center">
        <router-link to="/" class="flex items-center justify-center">
          <img :src="Logo" :alt="t('common.logoAlt')" class="cursor-pointer object-contain w-12 h-12 sm:w-16 sm:h-16 lg:w-18 lg:h-18" />
        </router-link>
      </div>
    </div>

    <!-- Menu Toggle Button -->
    <div class="px-2 py-2 sm:px-3 sm:py-3 border-b border-black/10 flex justify-center">
      <button
        class="w-9 h-9 rounded-lg hover:bg-black/5 flex items-center justify-center transition-colors duration-200 lg:block hidden"
        @click="sidebarOpen = !sidebarOpen"
        :title="t('common.menu')"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" class="text-[#2E4A63]">
          <path d="M4 7H20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <path d="M4 12H20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <path d="M4 17H20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
      <!-- Close button for mobile -->
      <button
        class="w-9 h-9 rounded-lg hover:bg-black/5 flex items-center justify-center transition-colors duration-200 lg:hidden"
        @click="closeMobileMenu"
        :title="t('common.close')"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" class="text-[#2E4A63]">
          <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
    </div>

    <nav class="pb-3 pt-2 sm:pb-4 sm:pt-3 lg:pb-6 lg:pt-4" :class="sidebarOpen ? 'px-1 sm:px-1.5' : 'px-1 sm:px-1.5'">
      <button
        v-for="it in navItems"
        :key="it.key"
        class="w-full flex items-center rounded-xl mb-1.5 sm:mb-2 transition-all duration-300"
        :class="[
          sidebarOpen ? 'gap-2 sm:gap-3 py-2 sm:py-2.5 lg:py-3' : 'px-2 sm:px-2.5 py-2 sm:py-2.5 lg:py-3',
          sidebarOpen ? (isActive(it.to) ? 'px-0.5 sm:px-1' : 'px-0.5 sm:px-1') : '',
          isActive(it.to) ? 'bg-[#E8F3FF] text-[#006AC7]' : 'hover:bg-black/5 text-[#2E4A63]'
        ]"
        @click="go(it.to)"
      >
        <span
          class="relative flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-xl flex items-center justify-center flex-shrink-0 mx-1 sm:mx-1.5 lg:mx-2"
          :class="isActive(it.to) ? 'bg-white' : 'bg-[#F3F7FB]'"
        >
          <!-- Home Icon -->
          <svg v-if="it.icon === 'home'" class="w-4 h-4 sm:w-[16px] sm:h-[16px] lg:w-[18px] lg:h-[18px] flex-shrink-0" viewBox="0 0 24 24" fill="none"
            :class="isActive(it.to) ? 'text-[#006AC7]' : 'text-[#6B7E8B]'">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <!-- Card Icon -->
          <svg v-else-if="it.icon === 'card'" class="w-4 h-4 sm:w-[16px] sm:h-[16px] lg:w-[18px] lg:h-[18px] flex-shrink-0" viewBox="0 0 24 24" fill="none"
            :class="isActive(it.to) ? 'text-[#006AC7]' : 'text-[#6B7E8B]'">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" stroke="currentColor" stroke-width="2"/>
            <line x1="1" y1="10" x2="23" y2="10" stroke="currentColor" stroke-width="2"/>
          </svg>
          <!-- Document Icon -->
          <svg v-else-if="it.icon === 'document'" class="w-4 h-4 sm:w-[16px] sm:h-[16px] lg:w-[18px] lg:h-[18px] flex-shrink-0" viewBox="0 0 24 24" fill="none"
            :class="isActive(it.to) ? 'text-[#006AC7]' : 'text-[#6B7E8B]'">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <polyline points="14 2 14 8 20 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <polyline points="10 9 9 9 8 9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <!-- Messages Icon -->
          <svg v-else-if="it.icon === 'messages'" class="w-4 h-4 sm:w-[16px] sm:h-[16px] lg:w-[18px] lg:h-[18px] flex-shrink-0" viewBox="0 0 24 24" fill="none"
            :class="isActive(it.to) ? 'text-[#006AC7]' : 'text-[#6B7E8B]'">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <!-- FAQ/Support Icon -->
          <svg v-else-if="it.icon === 'faq'" class="w-4 h-4 sm:w-[16px] sm:h-[16px] lg:w-[18px] lg:h-[18px] flex-shrink-0" viewBox="0 0 24 24" fill="none"
            :class="isActive(it.to) ? 'text-[#006AC7]' : 'text-[#6B7E8B]'">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M13 8H11a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h2v2h-2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <line x1="13" y1="8" x2="13" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <!-- Default Icon -->
          <svg v-else class="w-4 h-4 sm:w-[16px] sm:h-[16px] lg:w-[18px] lg:h-[18px] flex-shrink-0" viewBox="0 0 24 24" fill="none"
            :class="isActive(it.to) ? 'text-[#006AC7]' : 'text-[#6B7E8B]'">
            <path d="M4 12h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M12 4v16" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.3"/>
          </svg>
          
          <!-- Notification Badge -->
          <span 
            v-if="it.key === 'messages' && unreadCount > 0" 
            class="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 z-10"
          >
            <span class="relative inline-flex items-center justify-center min-w-[14px] h-[14px] sm:min-w-[16px] sm:h-[16px] lg:min-w-[18px] lg:h-[18px] px-0.5 sm:px-1 bg-red-500 text-white text-[9px] sm:text-[10px] font-bold rounded-full shadow-sm">
              <span class="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-15"></span>
              <span class="relative z-10">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
            </span>
          </span>
        </span>

        <span 
          v-if="sidebarOpen" 
          class="font-semibold text-xs sm:text-sm lg:text-[15px] flex-1 min-w-0 truncate transition-opacity duration-300 opacity-100"
        >
          {{ it.label }}
        </span>
      </button>
    </nav>
  </aside>
</template>

