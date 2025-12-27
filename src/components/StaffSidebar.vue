<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter, useRoute } from "vue-router";
import { useAppStore } from "@/stores/app.js";

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
  ];

  // Если админ, добавляем пункт Users (создание менеджеров и админов)
  if (isAdmin) {
    baseItems.splice(1, 0, { key: "users", label: t("sidebar.users"), to: "/staff/users", icon: "users" });
  }

  return baseItems;
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
    class="h-[calc(100vh-96px)] sticky top-[96px] bg-white border-l border-black/10"
    :class="sidebarOpen ? 'w-[280px]' : 'w-[76px]'"
  >
    <div class="px-5 py-4 flex items-center justify-start">
      <button
        class="mr-2 w-9 h-9 rounded-lg hover:bg-black/5 flex items-center justify-center"
        @click="sidebarOpen = !sidebarOpen"
        title="Menu"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" class="text-[#2E4A63]">
          <path d="M4 7H20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <path d="M4 12H20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <path d="M4 17H20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
    </div>

    <nav :class="sidebarOpen ? 'px-3 pb-6' : 'px-2 pb-6'">
      <button
        v-for="it in navItems"
        :key="it.key"
        class="w-full flex items-center rounded-xl mb-2 transition"
        :class="[
          sidebarOpen ? 'gap-3 px-3 py-3' : 'justify-center px-2 py-3',
          isActive(it.to) ? 'bg-[#E8F3FF] text-[#006AC7]' : 'hover:bg-black/5 text-[#2E4A63]'
        ]"
        @click="go(it.to)"
      >
        <span
          class="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
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
          <!-- Default Icon -->
          <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" class="flex-shrink-0"
            :class="isActive(it.to) ? 'text-[#006AC7]' : 'text-[#6B7E8B]'">
            <path d="M4 12h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M12 4v16" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.3"/>
          </svg>
        </span>

        <span v-if="sidebarOpen" class="font-semibold text-[15px] flex-shrink-0 whitespace-nowrap">{{ it.label }}</span>
      </button>
    </nav>
  </aside>
</template>

