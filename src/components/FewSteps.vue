<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const steps = computed(() => [
  {
    number: 1,
    title: t('fewSteps.step1.title'),
    text: t('fewSteps.step1.text'),
  },
  {
    number: 2,
    title: t('fewSteps.step2.title'),
    text: t('fewSteps.step2.text'),
  },
  {
    number: 3,
    title: t('fewSteps.step3.title'),
    text: t('fewSteps.step3.text'),
  },
  {
    number: 4,
    title: t('fewSteps.step4.title'),
    text: t('fewSteps.step4.text'),
  },
]);
</script>

<template>
  <section class="w-full bg-[#f2f6fb] py-16 md:py-20">
    <div class="max-w-4xl mx-auto px-4">
      <h2 class="text-[32px] leading-[1.2] md:text-[44px] md:leading-[1.25] font-bold text-slate-900 mb-10 md:mb-12">
        {{ $t('fewSteps.title') }}
      </h2>
      <div class="space-y-8 md:space-y-10">
        <div
          v-for="step in steps"
          :key="step.number"
          class="flex gap-6 md:gap-8"
        >
          <div class="flex flex-col items-center pt-1 shrink-0">
            <span
              class="text-[28px] md:text-[34px] font-bold text-slate-900 leading-none"
            >
              {{ step.number }}.
            </span>
            <span class="mt-3 h-1 w-10 rounded-full bg-[#00c3b6] rotate " />
          </div>
          <div class="space-y-1 text-[15px] md:text-[18px] text-slate-800">
            <h3 class="font-bold text-[18px] md:text-[20px]">
              {{ step.title }}
            </h3>
            <p class="leading-relaxed">
              {{ step.text }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>