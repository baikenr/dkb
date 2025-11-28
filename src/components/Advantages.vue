<template>
  <section class="py-12 px-16 md:px-12 lg:px-24 bg-white">
    <div class="mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-2">
      <div
        v-for="(item, index) in benefits"
        :key="index"
        class="flex flex-col items-start p-6"
      >
        <div class="mb-4 flex justify-center w-full">
          <component :is="item.icon" class="text-blue-600 w-[100px] h-[100px] mx-auto" />
        </div>

        <h3 class="text-[20px] font-bold">{{ item.title }}</h3>
        <p class="text-[18px] leading-relaxed" v-html="item.description"></p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import TopInterestIcon from '@/components/icons/TopInterestIcon.vue'
import Fast from '@/components/icons/Fast.vue'
import Flexible from '@/components/icons/Flexible.vue'
import FreeRefunds from '@/components/icons/FreeRefunds.vue'
import Sure from '@/components/icons/Sure.vue'
import Rescheduling from '@/components/icons/Rescheduling.vue'

const { t } = useI18n()

const icons = [
  TopInterestIcon,
  Fast,
  Flexible,
  FreeRefunds,
  Sure,
  Rescheduling
]

// benefits строится динамически и реагирует на смену языка
const benefits = computed(() => {
  return Array.from({ length: 6 }).map((_, i) => ({
    title: t(`benefits.title${i + 1}`),
    description: t(`benefits.description${i + 1}`),
    icon: icons[i]
  }))
})
</script>
