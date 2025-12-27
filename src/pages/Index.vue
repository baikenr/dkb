<script setup lang="ts">
import { computed } from "vue";
import Header from '@/components/Header.vue';
import ClientMain from '@/components/ClientMain.vue';
import StaffMain from '@/pages/StaffMain.vue';
import { useAppStore } from "@/stores/app.js";

const appStore = useAppStore();

const isClient = computed(() => appStore.authType === "client");
const isStaff = computed(() => appStore.authType === "staff");
</script>

<template>
  <div class="min-h-screen">
    <Header class="fixed top-0 left-0 right-0 z-50 bg-white shadow-md"/>
    <ClientMain v-if="isClient" />
    <StaffMain v-else-if="isStaff" />
    <div v-else class="pt-[96px] flex items-center justify-center min-h-[calc(100vh-96px)]">
      <div class="text-[#2E4A63]">Loading...</div>
    </div>
  </div>
</template>
