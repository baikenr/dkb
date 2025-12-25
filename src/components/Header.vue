<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref } from "vue";
import { useRouter } from "vue-router";
import { useAppStore } from "@/stores/app.js";
import { useI18n } from "vue-i18n";
import Logo from "@/assets/logo_dkb.svg";

const router = useRouter();
const appStore = useAppStore();

const { locale } = useI18n();

// ===== language =====
const changeLanguage = (lang: string) => {
  locale.value = lang;
  sessionStorage.setItem("lang", lang);
};
const toggleLanguage = () => changeLanguage(locale.value === "de" ? "en" : "de");
// на DKB обычно показывается язык, НА КОТОРЫЙ переключаемся
const langLabel = computed(() => (locale.value === "de" ? "EN" : "DE"));

onMounted(() => {
  const saved = sessionStorage.getItem("lang");
  if (saved === "de" || saved === "en") locale.value = saved;
});

// ===== menu/auth =====
const menuOpen = ref(false);

const isAuth = computed(() => appStore.isAuthenticated && !!appStore.access);

const fullName = computed(() => {
  const fn = appStore.me?.first_name || "";
  const ln = appStore.me?.last_name || "";
  const name = `${fn} ${ln}`.trim();
  return name || "User";
});

async function ensureMeLoaded() {
  if (!appStore.access) return;
  if (appStore.me) return;

  if (appStore.authType === "client") await appStore.clientMe();
  else await appStore.staffMe();
}

const goLogin = async () => {
  menuOpen.value = false;
  await router.push("/login");
};

const goProfile = async () => {
  menuOpen.value = false;
  await ensureMeLoaded();
  await router.push("/profile");
};

const doLogout = async () => {
  menuOpen.value = false;
  appStore.logout();
  await router.replace("/login");
};

const onDocClick = (e: MouseEvent) => {
  const el = e.target as HTMLElement | null;
  if (!el?.closest("[data-user-menu]")) menuOpen.value = false;
};

onMounted(async () => {
  document.addEventListener("click", onDocClick);
  await ensureMeLoaded();
});

onBeforeUnmount(() => {
  document.removeEventListener("click", onDocClick);
});
</script>

<template>
  <header class="w-full shadow-[0px_4px_8px_0px_rgba(1,84,166,0.16)]">
    <!-- TOP BAR -->
    <div class="bg-white">
      <div class="max-w-[1320px] mx-auto px-4 sm:px-6">
        <div class="h-[70px] flex items-center justify-between gap-4">
          <!-- left -->
          <div class="flex items-center gap-6 min-w-0">
            <img :src="Logo" alt="DKB" class="h-10 w-auto shrink-0" />

            <nav class="hidden md:flex items-center gap-6 text-[16px] text-[#2E4A63] font-medium">
              <a href="#" class="hover:text-[#006AC7] transition">Privat</a>
              <a href="#" class="hover:text-[#006AC7] transition">Geschäftlich</a>
              <a href="#" class="hover:text-[#006AC7] transition">Nachhaltig</a>
            </nav>
          </div>

          <!-- right -->
          <div class="flex items-center gap-3 shrink-0">
            <!-- language toggle -->
            <button
              @click="toggleLanguage"
              class="h-12 px-4 rounded-xl border border-black/10 bg-white
                     text-[#2E4A63] font-semibold hover:bg-[#F3F7FB] transition"
              aria-label="toggle language"
            >
              {{ langLabel }}
            </button>

            <!-- search -->
            <div
              class="hidden sm:flex items-center gap-2 border border-[#006AC7]/40 rounded-xl px-4 h-12
                     min-w-[240px] md:min-w-[420px] bg-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" stroke="#006AC7" stroke-width="1.8"/>
                <path d="M16.5 16.5 21 21" stroke="#006AC7" stroke-width="1.8" stroke-linecap="round"/>
              </svg>
              <input
                class="w-full outline-none text-[#2E4A63] placeholder:text-[#7A93A8]"
                type="search"
                placeholder="Intelligente Suche ..."
              />
            </div>

            <!-- NOT AUTH -->
            <button
              v-if="!isAuth"
              @click="goLogin"
              class="h-12 px-4 sm:px-5 rounded-xl bg-[#E9F3FF] text-[#006AC7] font-semibold
                     flex items-center gap-2 hover:bg-[#D8ECFF] transition"
            >
              <span class="hidden lg:inline">Anmelden</span>
              <span class="lg:hidden">Login</span>
            </button>

            <!-- AUTH -->
            <div v-else class="relative" data-user-menu>
              <button
                @click="menuOpen = !menuOpen"
                class="h-12 px-4 sm:px-5 rounded-xl bg-[#E9F3FF] text-[#006AC7] font-semibold
                       flex items-center gap-2 hover:bg-[#D8ECFF] transition"
              >
                <span class="max-w-[180px] truncate">{{ fullName }}</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M6 9l6 6 6-6" stroke="#006AC7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>

              <div
                v-if="menuOpen"
                class="absolute right-0 mt-2 w-56 rounded-xl border border-black/10 bg-white shadow-lg overflow-hidden"
              >
                <button
                  class="w-full text-left px-4 py-3 hover:bg-[#F3F7FB] text-[#16324A] font-medium"
                  @click="goProfile"
                >
                  Profil
                </button>
                <button
                  class="w-full text-left px-4 py-3 hover:bg-[#F3F7FB] text-[#16324A] font-medium"
                  @click="doLogout"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- SECOND BAR -->
    <div class="bg-[#F3F7FB]">
      <div class="max-w-[1320px] mx-auto px-4 sm:px-6">
        <nav class="h-[56px] flex items-center gap-8 text-[18px] text-[#2E4A63] font-medium overflow-x-auto">
          <a href="#" class="whitespace-nowrap hover:text-[#006AC7] transition">Konten &amp; Karten</a>
          <a href="#" class="whitespace-nowrap hover:text-[#006AC7] transition">Kredite</a>
          <a href="#" class="whitespace-nowrap hover:text-[#006AC7] transition">Investieren &amp; Sparen</a>
          <a href="#" class="whitespace-nowrap hover:text-[#006AC7] transition">Finanzierung &amp; Immobilie</a>
          <a href="#" class="whitespace-nowrap hover:text-[#006AC7] transition">Service</a>
          <a href="#" class="whitespace-nowrap hover:text-[#006AC7] transition">Hilfe</a>
        </nav>
      </div>
    </div>
  </header>
</template>
