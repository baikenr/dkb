<script setup lang="ts">
import { onMounted, ref, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAppStore } from "@/stores/app.js";
import StaffSidebar from "@/components/StaffSidebar.vue";
import UsersManagement from "@/components/UsersManagement.vue";
import ClientsManagement from "@/components/ClientsManagement.vue";
import CardRequests from "@/components/CardRequests.vue";

const router = useRouter();
const route = useRoute();
const appStore = useAppStore();

const loading = ref(false);
const me = computed(() => appStore.me as any);

const loadMe = async () => {
  loading.value = true;
  try {
    await appStore.staffMe();
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  await loadMe();
});

const fullName = computed(() => {
  const fn = me.value?.first_name || "";
  const ln = me.value?.last_name || "";
  return `${fn} ${ln}`.trim() || "—";
});

const staffRole = computed(() => appStore.staffRole || "—");

const pageTitle = computed(() => {
  const path = route.path;
  if (path.includes("/users")) return "Users";
  if (path.includes("/clients")) return "Clients";
  if (path.includes("/card-requests")) return "Card Requests";
  return "Dashboard";
});
</script>

<template>
  <div class="pt-[96px] flex">
  <!-- Right Sidebar -->
  <StaffSidebar />
    <main class="flex-1">
      <div class="max-w-[1200px] mx-auto px-6 py-8">
        <div class="mb-6">
          <h1 class="text-[36px] font-bold text-[#0B2A3C] tracking-tight">{{ pageTitle }}</h1>
          <div class="h-px bg-black/10 mt-4"></div>
        </div>

        <div v-if="loading" class="text-[#2E4A63]">Loading...</div>

        <div v-else>
          <!-- Dashboard Content -->
          <template v-if="route.path === '/staff' || route.path === '/'">
            <div class="grid grid-cols-12 gap-6">
              <section class="col-span-12 lg:col-span-8 space-y-6">
                <!-- Welcome Card -->
                <div class="bg-white rounded-2xl border border-black/10 shadow-sm p-6">
                  <div class="text-[18px] font-bold text-[#0B2A3C] mb-2">
                    Welcome, {{ fullName }}
                  </div>
                  <div class="text-sm text-[#6B7E8B]">
                    Role: <span class="font-semibold">{{ staffRole }}</span>
                  </div>
                </div>

                <!-- Stats Cards -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div class="bg-white rounded-2xl border border-black/10 shadow-sm p-6">
                    <div class="text-sm text-[#6B7E8B] font-semibold mb-2">Total Clients</div>
                    <div class="text-[24px] font-bold text-[#0B2A3C]">—</div>
                  </div>

                  <div class="bg-white rounded-2xl border border-black/10 shadow-sm p-6">
                    <div class="text-sm text-[#6B7E8B] font-semibold mb-2">Pending Documents</div>
                    <div class="text-[24px] font-bold text-[#0B2A3C]">—</div>
                  </div>
                </div>

                <!-- Recent Activity -->
                <div class="bg-white rounded-2xl border border-black/10 shadow-sm p-6">
                  <div class="text-[18px] font-bold text-[#0B2A3C] mb-4">Recent Activity</div>
                  <div class="text-sm text-[#6B7E8B]">No recent activity</div>
                </div>
              </section>

              <!-- RIGHT SIDEBAR -->
              <aside class="col-span-12 lg:col-span-4 space-y-6">
                <div class="rounded-2xl bg-gradient-to-br from-[#0A3C63] to-[#062A46] text-white shadow-sm border border-black/5 p-6">
                  <div class="text-sm opacity-80">
                    Guten Tag, {{ fullName }}
                  </div>
                  <div class="text-[16px] font-bold mt-3">
                    Staff Dashboard
                  </div>
                  <div class="text-xs opacity-80 mt-2">
                    Role: {{ staffRole }}
                  </div>
                </div>

                <div class="bg-white rounded-2xl border border-black/10 shadow-sm p-6">
                  <div class="text-[16px] font-bold text-[#0B2A3C] mb-3">Quick Actions</div>

                  <button 
                    @click="router.push('/staff/clients')"
                    class="w-full text-left rounded-xl bg-[#F7FBFF] border border-black/5 px-4 py-4 hover:bg-[#EEF6FF] transition mb-2"
                  >
                    <div class="font-semibold text-[#0B2A3C]">View Clients</div>
                    <div class="text-sm text-[#6B7E8B] mt-1">Manage client accounts</div>
                  </button>

                  <button 
                    @click="router.push('/staff/card-requests')"
                    class="w-full text-left rounded-xl bg-[#F7FBFF] border border-black/5 px-4 py-4 hover:bg-[#EEF6FF] transition"
                  >
                    <div class="font-semibold text-[#0B2A3C]">Card Requests</div>
                    <div class="text-sm text-[#6B7E8B] mt-1">Review card issuance requests</div>
                  </button>
                </div>
              </aside>
            </div>
          </template>

          <!-- Other Pages Content -->
          <template v-else>
            <UsersManagement v-if="route.path.includes('/users')" />
            <ClientsManagement v-else-if="route.path.includes('/clients')" />
            <CardRequests v-else-if="route.path.includes('/card-requests')" />
            <div v-else class="bg-white rounded-2xl border border-black/10 shadow-sm p-6">
              <div class="text-[#6B7E8B]">
                <p>Page content - coming soon</p>
              </div>
            </div>
          </template>
        </div>
      </div>
    </main>
  </div>
</template>

