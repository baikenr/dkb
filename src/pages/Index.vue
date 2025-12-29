<script setup lang="ts">
import { computed } from "vue";
import ClientMain from '@/components/ClientMain.vue';
import StaffMain from '@/pages/StaffMain.vue';
import { useAppStore } from "@/stores/app.js";

const appStore = useAppStore();

const isClient = computed(() => appStore.authType === "client");
const isStaff = computed(() => appStore.authType === "staff");
</script>

<template>
  <div class="min-h-screen">
    <ClientMain v-if="isClient" />
    <StaffMain v-else-if="isStaff" />
    <div v-else class="flex items-center justify-center min-h-screen">
      <div class="text-[#2E4A63]">Loading...</div>
    </div>
  </div>
</template>
