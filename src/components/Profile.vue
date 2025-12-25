<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useAppStore } from "@/stores/app.js";

const appStore = useAppStore();

const loading = ref(false);
const errorText = ref("");

const me = computed(() => appStore.me);

const loadMe = async () => {
  errorText.value = "";
  loading.value = true;
  try {
    if (appStore.authType === "client") {
      const r = await appStore.clientMe();
      if (!r.ok) errorText.value = "Cannot load profile";
    } else {
      const r = await appStore.staffMe();
      if (!r.ok) errorText.value = "Cannot load profile";
    }
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  if (!appStore.me) await loadMe();
});
</script>

<template>
  <div class="max-w-[900px] mx-auto px-4 sm:px-6 py-8">
    <h1 class="text-2xl font-bold text-[#16324A] mb-6">Profile</h1>

    <div v-if="errorText" class="mb-4 p-3 rounded-lg bg-red-50 text-red-700 border border-red-200">
      {{ errorText }}
    </div>

    <div class="bg-white rounded-2xl border border-black/10 p-5 shadow-sm">
      <div class="flex items-center justify-between gap-4 mb-4">
        <div class="text-[#16324A] font-semibold">Your data</div>
        <button
          @click="loadMe"
          :disabled="loading"
          class="px-4 py-2 rounded-xl bg-[#E9F3FF] text-[#006AC7] font-semibold hover:bg-[#D8ECFF] transition
                 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {{ loading ? "Loading..." : "Refresh" }}
        </button>
      </div>

      <div v-if="!me" class="text-[#2E4A63]">No data</div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="p-4 rounded-xl bg-[#F3F7FB]">
          <div class="text-xs text-[#7A93A8] mb-1">First name</div>
          <div class="text-[#16324A] font-semibold">{{ me.first_name }}</div>
        </div>

        <div class="p-4 rounded-xl bg-[#F3F7FB]">
          <div class="text-xs text-[#7A93A8] mb-1">Last name</div>
          <div class="text-[#16324A] font-semibold">{{ me.last_name }}</div>
        </div>

        <div class="p-4 rounded-xl bg-[#F3F7FB]">
          <div class="text-xs text-[#7A93A8] mb-1">Email</div>
          <div class="text-[#16324A] font-semibold">{{ me.email || "-" }}</div>
        </div>

        <div class="p-4 rounded-xl bg-[#F3F7FB]">
          <div class="text-xs text-[#7A93A8] mb-1">Role / Type</div>
          <div class="text-[#16324A] font-semibold">
            {{ appStore.authType }}{{ appStore.staffRole ? ` (${appStore.staffRole})` : "" }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
