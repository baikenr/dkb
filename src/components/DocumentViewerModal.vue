<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  show: boolean;
  document: any | null;
  title?: string;
  getDocumentUrl: (path: string) => string;
  isImageFile: (path: string) => boolean;
}>();

const emit = defineEmits<{ (e: "close"): void }>();

const hasAnyFiles = computed(() => {
  const d = props.document;
  if (!d) return false;
  return !!(d.file || d.front_side || d.back_side || d.bank_statement);
});
</script>

<template>
  <div
    v-if="show && document"
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    @click.self="emit('close')"
  >
    <div class="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
      <div class="p-6 border-b border-black/10 flex items-center justify-between">
        <h2 class="text-[24px] font-bold text-[#0B2A3C]">
          {{ title || "Document Viewer" }}
        </h2>
        <button
          @click="emit('close')"
          class="text-[#6B7E8B] hover:text-[#0B2A3C] transition"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="p-6">
        <div class="space-y-6">
          <!-- Front -->
          <div v-if="document.front_side" class="border border-black/10 rounded-xl overflow-hidden">
            <div class="p-3 bg-[#F7FBFF] border-b border-black/10">
              <h3 class="text-sm font-semibold text-[#0B2A3C]">Front side</h3>
            </div>

            <img
              v-if="isImageFile(document.front_side)"
              :src="getDocumentUrl(document.front_side)"
              class="w-full h-auto max-h-[600px] object-contain"
            />
            <iframe
              v-else
              :src="getDocumentUrl(document.front_side)"
              class="w-full h-[600px]"
              frameborder="0"
            ></iframe>

            <div class="p-4 border-t border-black/10 bg-[#F7FBFF]">
              <a
                :href="getDocumentUrl(document.front_side)"
                target="_blank"
                class="text-[#006AC7] hover:underline text-sm font-semibold"
              >
                Open in new tab
              </a>
            </div>
          </div>

          <!-- Back -->
          <div v-if="document.back_side" class="border border-black/10 rounded-xl overflow-hidden">
            <div class="p-3 bg-[#F7FBFF] border-b border-black/10">
              <h3 class="text-sm font-semibold text-[#0B2A3C]">Back side</h3>
            </div>

            <img
              v-if="isImageFile(document.back_side)"
              :src="getDocumentUrl(document.back_side)"
              class="w-full h-auto max-h-[600px] object-contain"
            />
            <iframe
              v-else
              :src="getDocumentUrl(document.back_side)"
              class="w-full h-[600px]"
              frameborder="0"
            ></iframe>

            <div class="p-4 border-t border-black/10 bg-[#F7FBFF]">
              <a
                :href="getDocumentUrl(document.back_side)"
                target="_blank"
                class="text-[#006AC7] hover:underline text-sm font-semibold"
              >
                Open in new tab
              </a>
            </div>
          </div>

          <!-- Bank statement -->
          <div v-if="document.bank_statement" class="border border-black/10 rounded-xl overflow-hidden">
            <div class="p-3 bg-[#F7FBFF] border-b border-black/10">
              <h3 class="text-sm font-semibold text-[#0B2A3C]">Bank statement</h3>
            </div>

            <img
              v-if="isImageFile(document.bank_statement)"
              :src="getDocumentUrl(document.bank_statement)"
              class="w-full h-auto max-h-[600px] object-contain"
            />
            <iframe
              v-else
              :src="getDocumentUrl(document.bank_statement)"
              class="w-full h-[600px]"
              frameborder="0"
            ></iframe>

            <div class="p-4 border-t border-black/10 bg-[#F7FBFF]">
              <a
                :href="getDocumentUrl(document.bank_statement)"
                target="_blank"
                class="text-[#006AC7] hover:underline text-sm font-semibold"
              >
                Open in new tab
              </a>
            </div>
          </div>

          <!-- Legacy -->
          <div
            v-if="document.file && !document.front_side && !document.back_side && !document.bank_statement"
            class="border border-black/10 rounded-xl overflow-hidden"
          >
            <img
              v-if="isImageFile(document.file)"
              :src="getDocumentUrl(document.file)"
              class="w-full h-auto max-h-[600px] object-contain"
            />
            <iframe
              v-else
              :src="getDocumentUrl(document.file)"
              class="w-full h-[600px]"
              frameborder="0"
            ></iframe>

            <div class="p-4 border-t border-black/10 bg-[#F7FBFF]">
              <a
                :href="getDocumentUrl(document.file)"
                target="_blank"
                class="text-[#006AC7] hover:underline text-sm font-semibold"
              >
                Open in new tab
              </a>
            </div>
          </div>

          <!-- none -->
          <div
            v-if="!hasAnyFiles"
            class="p-8 text-center text-[#6B7E8B] border border-black/10 rounded-xl"
          >
            File not available
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
