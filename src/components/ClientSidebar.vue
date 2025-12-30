<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter, useRoute } from "vue-router";
import { useAppStore } from "@/stores/app.js";
import Logo from "@/assets/logo_dkb.svg";

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const appStore = useAppStore();

const sidebarOpen = ref(true);

const me = computed(() => appStore.me as any);
const card = computed(() => me.value?.bank_card || null);
const hasCard = computed(() => !!card.value && me.value?.client_bank_status === "received");

const navItems = computed(() => {
  const items = [
    { key: "home", label: t("clientSidebar.home"), to: "/", icon: "home" },
    { key: "document", label: t("clientSidebar.document"), to: "/document", icon: "document" },
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
  } catch {}
};
</script>

<template>
  <aside
    class="h-screen sticky top-0 bg-white border-r border-black/10 transition-all duration-300 ease-in-out"
    :class="sidebarOpen ? 'w-[280px]' : 'w-[90px]'"
  >
    <!-- Logo Section -->
    <div class="px-3 py-6 border-b border-black/10">
      <div class="flex items-center justify-center">
        <router-link to="/" class="flex items-center justify-center">
          <img :src="Logo" :alt="t('common.logoAlt')" class="cursor-pointer object-contain" style="width: 72px; height: 72px; min-width: 72px; min-height: 72px; max-width: 72px; max-height: 72px;" />
        </router-link>
      </div>
    </div>

    <!-- Menu Toggle Button -->
    <div class="px-3 py-4 border-b border-black/10 flex justify-center">
      <button
        class="w-9 h-9 rounded-lg hover:bg-black/5 flex items-center justify-center transition-colors duration-200"
        @click="sidebarOpen = !sidebarOpen"
        :title="t('common.menu')"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" class="text-[#2E4A63]">
          <path d="M4 7H20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <path d="M4 12H20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <path d="M4 17H20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
    </div>

    <nav class="pb-6 pt-4" :class="sidebarOpen ? 'px-1.5' : 'px-1.5'">
      <button
        v-for="it in navItems"
        :key="it.key"
        class="w-full flex items-center rounded-xl mb-2 transition-all duration-300"
        :class="[
          sidebarOpen ? 'gap-3 py-3' : 'px-3 py-3',
          sidebarOpen ? (isActive(it.to) ? 'px-0' : 'px-0') : '',
          isActive(it.to) ? 'bg-[#E8F3FF] text-[#006AC7]' : 'hover:bg-black/5 text-[#2E4A63]'
        ]"
        @click="go(it.to)"
      >
        <span
          class="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          :class="isActive(it.to) ? 'bg-white' : 'bg-[#F3F7FB]'"
        >
          <!-- Home Icon -->
          <svg v-if="it.icon === 'home'" width="18" height="18" viewBox="0 0 24 24" fill="none" class="flex-shrink-0"
            :class="isActive(it.to) ? 'text-[#006AC7]' : 'text-[#6B7E8B]'">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <!-- Card Icon -->
          <svg v-else-if="it.icon === 'card'" width="18" height="18" viewBox="0 0 24 24" fill="none" class="flex-shrink-0"
            :class="isActive(it.to) ? 'text-[#006AC7]' : 'text-[#6B7E8B]'">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" stroke="currentColor" stroke-width="2"/>
            <line x1="1" y1="10" x2="23" y2="10" stroke="currentColor" stroke-width="2"/>
          </svg>
          <!-- Document Icon -->
          <svg v-else-if="it.icon === 'document'" width="18" height="18" viewBox="0 0 24 24" fill="none" class="flex-shrink-0"
            :class="isActive(it.to) ? 'text-[#006AC7]' : 'text-[#6B7E8B]'">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <polyline points="14 2 14 8 20 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <polyline points="10 9 9 9 8 9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <!-- FAQ/Support Icon -->
          <svg v-else-if="it.icon === 'faq'" width="18" height="18" viewBox="0 0 24 24" fill="none" class="flex-shrink-0"
            :class="isActive(it.to) ? 'text-[#006AC7]' : 'text-[#6B7E8B]'">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M13 8H11a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h2v2h-2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <line x1="13" y1="8" x2="13" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <!-- Default Icon -->
          <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" class="flex-shrink-0"
            :class="isActive(it.to) ? 'text-[#006AC7]' : 'text-[#6B7E8B]'">
            <path d="M4 12h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M12 4v16" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.3"/>
          </svg>
        </span>

        <span 
          v-if="sidebarOpen" 
          class="font-semibold text-[15px] flex-1 min-w-0 truncate transition-opacity duration-300 opacity-100"
        >
          {{ it.label }}
        </span>
      </button>
    </nav>
  </aside>
</template>

