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

const navItems = computed(() => {
  const isAdmin = appStore.staffRole === "admin";
  
  const baseItems = [
    { key: "dashboard", label: t("sidebar.dashboard"), to: "/staff", icon: "dashboard" },
    { key: "clients", label: t("sidebar.clients"), to: "/staff/clients", icon: "clients" },
    { key: "card-requests", label: t("sidebar.cardRequests"), to: "/staff/card-requests", icon: "card" },
    { key: "faq", label: t("sidebar.faq"), to: "/staff/faq", icon: "faq" },
  ];

  // Если админ, добавляем пункт Users (создание менеджеров и админов)
  if (isAdmin) {
    baseItems.splice(1, 0, { key: "users", label: t("sidebar.users"), to: "/staff/users", icon: "users" });
  }

  return baseItems;
});

const isActive = (to: string) => {
  // Для точного совпадения
  if (route.path === to) return true;
  // Для подмаршрутов (но не для корневого /staff, чтобы он не подсвечивался на других страницах)
  if (to !== "/staff" && route.path.startsWith(to + "/")) return true;
  return false;
};

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
        <router-link to="/staff" class="flex items-center justify-center">
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
          sidebarOpen ? 'gap-3 py-3' : 'px-2.5 py-3',
          sidebarOpen ? (isActive(it.to) ? 'px-0' : 'px-0') : '',
          isActive(it.to) ? 'bg-[#E8F3FF] text-[#006AC7]' : 'hover:bg-black/5 text-[#2E4A63]'
        ]"
        @click="go(it.to)"
      >
        <span
          class="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mx-2"
          :class="isActive(it.to) ? 'bg-white' : 'bg-[#F3F7FB]'"
        >
          <!-- Dashboard Icon -->
          <svg v-if="it.icon === 'dashboard'" width="18" height="18" viewBox="0 0 24 24" fill="none" class="flex-shrink-0"
            :class="isActive(it.to) ? 'text-[#006AC7]' : 'text-[#6B7E8B]'">
            <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/>
            <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/>
            <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/>
            <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/>
          </svg>
          <!-- Users Icon -->
          <svg v-else-if="it.icon === 'users'" width="18" height="18" viewBox="0 0 24 24" fill="none" class="flex-shrink-0"
            :class="isActive(it.to) ? 'text-[#006AC7]' : 'text-[#6B7E8B]'">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="9" cy="7" r="4" stroke="currentColor" stroke-width="2"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <!-- Clients Icon -->
          <svg v-else-if="it.icon === 'clients'" width="18" height="18" viewBox="0 0 24 24" fill="none" class="flex-shrink-0"
            :class="isActive(it.to) ? 'text-[#006AC7]' : 'text-[#6B7E8B]'">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="9" cy="7" r="4" stroke="currentColor" stroke-width="2"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <!-- Card Icon -->
          <svg v-else-if="it.icon === 'card'" width="18" height="18" viewBox="0 0 24 24" fill="none" class="flex-shrink-0"
            :class="isActive(it.to) ? 'text-[#006AC7]' : 'text-[#6B7E8B]'">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" stroke="currentColor" stroke-width="2"/>
            <line x1="1" y1="10" x2="23" y2="10" stroke="currentColor" stroke-width="2"/>
          </svg>
          <!-- FAQ Icon -->
          <svg v-else-if="it.icon === 'faq'" width="18" height="18" viewBox="0 0 24 24" fill="none" class="flex-shrink-0"
            :class="isActive(it.to) ? 'text-[#006AC7]' : 'text-[#6B7E8B]'">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M13 8H9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M17 12H9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
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

