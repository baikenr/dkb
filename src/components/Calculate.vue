<script setup lang="ts">
import { ref, computed } from "vue";
import { useI18n } from "vue-i18n";

const { t, locale } = useI18n();

const isSofort = ref(true);
const minAmount = 10000;
const maxAmount = 150000;
const minMonths = 12;
const maxMonths = 120;
const amount = ref(15000);
const months = ref(84);
const effectiveRate = computed(() => (isSofort.value ? 5.99 : 6.89));
const nominalRate = computed(() => (isSofort.value ? 5.83 : 6.70));
function calcMonthlyPayment(
  principal: number,
  months: number,
  annualRatePercent: number
): number {
  const r = annualRatePercent / 100 / 12;
  if (r === 0) return principal / months;
  const k = r * Math.pow(1 + r, months) / (Math.pow(1 + r, months) - 1);
  return principal * k;
}
const monthlyPayment = computed(() =>
  calcMonthlyPayment(amount.value, months.value, nominalRate.value)
);
const totalAmount = computed(() => monthlyPayment.value * months.value);
const totalCost = computed(() => totalAmount.value - amount.value);

const openQuiz = () => {
  window.open('/quiz', '_blank');
};

function formatCurrency(value: number): string {
  const localeStr = locale.value === 'en' ? 'en-US' : 'de-DE';
  return value.toLocaleString(localeStr, {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
function formatMonths(m: number): string {
  return `${m} ${t('calculate.months')}`;
}
function formatAmountRange(value: number): string {
  return value.toLocaleString(locale.value === 'en' ? 'en-US' : 'de-DE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}
function onAmountInput(e: Event) {
  const v = Number((e.target as HTMLInputElement).value || 0);
  if (Number.isNaN(v)) return;
  amount.value = Math.min(Math.max(v, minAmount), maxAmount);
}
function onMonthsInput(e: Event) {
  const v = Number((e.target as HTMLInputElement).value || 0);
  if (Number.isNaN(v)) return;
  months.value = Math.min(Math.max(v, minMonths), maxMonths);
}
</script>

<template>
  <section class="w-full flex justify-center bg-transparent">
    <div
      class="w-full max-w-[1322px] bg-[#006AC7] text-white mt-16 mb-20 px-8 md:px-[15px] pt-16 pb-10 relative"
    >
      <div
        class="absolute -top-10 -left-6 right-0 flex justify-start px-4 md:px-[15px]"
      >
        <div
          class="inline-flex items-center rounded-sm bg-[#2AD1C9] px-6 py-3 text-[18px] font-semibold leading-tight"
        >
          {{ $t('calculate.maxFlexibility') }}
          <span class="ml-2 underline underline-offset-4">
            {{ $t('calculate.upTo') }} 100.000 €
          </span>
          <span class="ml-2">{{ $t('calculate.and') }} 120 {{ $t('calculate.months') }}</span>
        </div>
      </div>

      <div class="space-y-10">
        <div
          class="flex flex-col gap-8 text-[18px] mb-6 md:flex-row md:items-center"
        >
          <div class="flex items-center gap-3">
            <span class="font-semibold">
              {{ $t('calculate.calculationAsInstant') }}
            </span>
            <button
              type="button"
              class="relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200"
              :class="isSofort ? 'bg-[#00c3b6]' : 'bg-white/20'"
              @click="isSofort = !isSofort"
            >
              <span
                class="inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200"
                :class="isSofort ? 'translate-x-5' : 'translate-x-1'"
              />
            </button>
          </div>
          <p class="text-[12px] text-[#75ADDE] font-bold">
            {{ $t('calculate.instantLoanDescription') }}
          </p>
        </div>
        <div
          class="grid grid-cols-1 gap-10 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.1fr)_minmax(0,1fr)]"
        >
          <div class="space-y-3">
            <div class="text-[16px] font-semibold">
              {{ $t('calculate.netLoanAmount') }}
            </div>

            <div class="flex items-baseline gap-3 text-[32px] md:text-[34px] font-semibold">
              <span>
                {{ formatAmountRange(amount) }}
              </span>
              <span class="text-[26px]">€</span>
            </div>
            <div class="mt-4">
              <input
                type="range"
                :min="minAmount"
                :max="maxAmount"
                step="500"
                v-model.number="amount"
                class="w-full cursor-pointer accent-[#00c3b6]"
              />
              <div
                class="mt-1 flex justify-between text-sm text-white"
              >
                <span class="">{{ formatAmountRange(minAmount) }}&nbsp;€</span>
                <span>{{ formatAmountRange(maxAmount) }}&nbsp;€</span>
              </div>
            </div>
          </div>
          <div class="space-y-3">
            <div class="text-[16px] font-semibold">{{ $t('calculate.runtime') }}</div>

            <div class="flex items-baseline gap-3 text-[32px] md:text-[32px] font-semibold">
              <span class="text-[34px]">{{ months }}</span>
              <span class="text-[30px]">{{ $t('calculate.months') }}</span>
            </div>

            <div class="mt-4">
              <input
                type="range"
                :min="minMonths"
                :max="maxMonths"
                step="1"
                v-model.number="months"
                class="w-full cursor-pointer accent-[#00c3b6]"
              />
              <div
                class="mt-1 flex justify-between text-sm text-white"
              >
                <span>{{ minMonths }}&nbsp;{{ $t('calculate.months') }}</span>
                <span>{{ maxMonths }}&nbsp;{{ $t('calculate.months') }}</span>
              </div>
            </div>
          </div>
          <div class="space-y-4 flex flex-col justify-between">
            <div>
              <div class="text-[16px] font-semibold">{{ $t('calculate.monthlyRate') }}</div>
              <div class="mt-3 text-[32px] md:text-[32px] font-semibold">
                {{ formatCurrency(monthlyPayment) }}
              </div>
            </div>

            <button
              @click="openQuiz"
              type="button"
              style="color: #006AC7 !important;"
              class="mt-4 w-full rounded-md bg-white py-3 text-center text-[#006AC7] text-[18px] font-semibold text-[#0074e8] hover:bg-white/90 transition"
            >
              {{ $t('convinced.btn') }}
            </button>
          </div>
        </div>
        <div
          class="mt-6 flex flex-wrap justify-around border-t border-white pt-4 text-[16px]"
          style="border: #FFFFFF;"
        >
          <div class="flex justify-around">
            <span>{{ $t('calculate.effectiveAnnualInterestRate') }}</span>
            <span class="font-semibold">
              {{ effectiveRate.toFixed(2) }} %
            </span>
          </div>

          <div class="flex items-baseline gap-2">
            <span>{{ $t('calculate.borrowingInterest') }}</span>
            <span class="font-semibold">
              {{ nominalRate.toFixed(2) }} %
            </span>
          </div>

          <div class="flex items-baseline gap-2">
            <span>{{ $t('calculate.totalCost') }}</span>
            <span class="font-semibold">
              {{ formatCurrency(totalCost) }}
            </span>
          </div>

          <div class="flex items-baseline gap-2">
            <span>{{ $t('calculate.total') }}</span>
            <span class="font-semibold">
              {{ formatCurrency(totalAmount) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
