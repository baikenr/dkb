<script setup lang="ts">
import { useI18n } from "vue-i18n";

const { t } = useI18n();
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="bg-white rounded-2xl border border-black/10 shadow-sm p-4 sm:p-6 lg:p-8">
      <h2 class="text-2xl sm:text-3xl lg:text-[32px] font-bold text-[#0B2A3C] mb-2">{{ t('security.title') }}</h2>
      <p class="text-sm sm:text-base lg:text-[16px] text-[#6B7E8B]">
        {{ t('security.subtitle') }}
      </p>
    </div>

    <!-- Security Status -->
    <div class="bg-white rounded-2xl border border-black/10 shadow-sm p-6 sm:p-8 lg:p-12">
      <div class="flex flex-col items-center justify-center text-center">
        <!-- Success Icon -->
        <div class="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-full bg-[#DDF7E9] flex items-center justify-center mb-4 sm:mb-6">
          <svg width="32" height="32" class="sm:w-10 sm:h-10 lg:w-12 lg:h-12" viewBox="0 0 24 24" fill="none" stroke="#0E6B3B" stroke-width="3">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>

        <!-- Success Message -->
        <h3 class="text-xl sm:text-2xl lg:text-[24px] font-bold text-[#0E6B3B] mb-2 sm:mb-3">{{ t('security.allGood') }}</h3>
        <p class="text-sm sm:text-base lg:text-[16px] text-[#6B7E8B] max-w-md mb-3 sm:mb-4 px-4">
          {{ t('security.message') }}
        </p>
        <p class="text-xs sm:text-sm lg:text-[14px] text-[#0E6B3B] font-semibold max-w-md px-4">
          {{ t('security.confirmed') }}
        </p>
      </div>
    </div>

    <!-- Security Features -->
    <div class="bg-white rounded-2xl border border-black/10 shadow-sm p-4 sm:p-6 lg:p-8">
      <h3 class="text-lg sm:text-xl lg:text-[20px] font-bold text-[#0B2A3C] mb-4 sm:mb-6">{{ t('security.features.title') }}</h3>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <!-- Feature 1 -->
        <div class="flex items-start gap-3 sm:gap-4 p-4 sm:p-6 rounded-xl bg-[#F7FBFF] border border-black/5">
          <div class="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-[#DDF7E9] flex items-center justify-center">
            <svg width="20" height="20" class="sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none" stroke="#0E6B3B" stroke-width="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <h4 class="text-sm sm:text-base lg:text-[16px] font-bold text-[#0B2A3C] mb-1 sm:mb-2">{{ t('security.features.encryption.title') }}</h4>
            <p class="text-xs sm:text-sm text-[#6B7E8B]">{{ t('security.features.encryption.description') }}</p>
          </div>
        </div>

        <!-- Feature 2 -->
        <div class="flex items-start gap-4 p-6 rounded-xl bg-[#F7FBFF] border border-black/5">
          <div class="flex-shrink-0 w-12 h-12 rounded-lg bg-[#DDF7E9] flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0E6B3B" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          <div>
            <h4 class="text-sm sm:text-base lg:text-[16px] font-bold text-[#0B2A3C] mb-1">{{ t('security.features.authentication.title') }}</h4>
            <p class="text-sm text-[#6B7E8B]">{{ t('security.features.authentication.description') }}</p>
          </div>
        </div>

        <!-- Feature 3 -->
        <div class="flex items-start gap-4 p-6 rounded-xl bg-[#F7FBFF] border border-black/5">
          <div class="flex-shrink-0 w-12 h-12 rounded-lg bg-[#DDF7E9] flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0E6B3B" stroke-width="2">
              <path d="M9 12l2 2 4-4"></path>
              <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"></path>
              <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"></path>
              <path d="M12 21c0-1-1-3-3-3s-3 2-3 3 2 3 3 3 3-2 3-3"></path>
              <path d="M12 3c0 1-1 3-3 3S6 4 6 3s2-3 3-3 3 2 3 3"></path>
            </svg>
          </div>
          <div>
            <h4 class="text-[16px] font-bold text-[#0B2A3C] mb-1">{{ t('security.features.monitoring.title') }}</h4>
            <p class="text-sm text-[#6B7E8B]">{{ t('security.features.monitoring.description') }}</p>
          </div>
        </div>

        <!-- Feature 4 -->
        <div class="flex items-start gap-4 p-6 rounded-xl bg-[#F7FBFF] border border-black/5">
          <div class="flex-shrink-0 w-12 h-12 rounded-lg bg-[#DDF7E9] flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0E6B3B" stroke-width="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              <line x1="12" y1="2" x2="12" y2="22"></line>
            </svg>
          </div>
          <div>
            <h4 class="text-[16px] font-bold text-[#0B2A3C] mb-1">{{ t('security.features.compliance.title') }}</h4>
            <p class="text-sm text-[#6B7E8B]">{{ t('security.features.compliance.description') }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

