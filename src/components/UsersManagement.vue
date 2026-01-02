<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useAppStore } from "@/stores/app.js";

const { t } = useI18n();
const appStore = useAppStore();

const loading = ref(false);
const users = ref<any[]>([]);
const totalCount = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);

const searchQuery = ref("");
const roleFilter = ref(""); // '' | 'admin' | 'manager'
const showModal = ref(false);
const editingUser = ref<any>(null);
const formLoading = ref(false);
const showPassword = ref(false);

// Form fields
const formData = ref({
  email: "",
  first_name: "",
  last_name: "",
  phone: "",
  role: "manager",
  password: "",
  is_active: true,
});

const formErrors = ref<any>({});

const loadUsers = async () => {
  loading.value = true;
  try {
    const params: any = {
      page: currentPage.value,
      page_size: pageSize.value,
    };
    
    if (searchQuery.value.trim()) {
      params.search = searchQuery.value.trim();
    }
    
    if (roleFilter.value) {
      params.role = roleFilter.value;
    }

    const result = await appStore.staffUsersList(params);
    if (result.ok && result.data) {
      users.value = result.data.results || result.data;
      totalCount.value = result.data.count || result.data.length || 0;
    }
  } catch (error) {
    console.error("Error loading users:", error);
  } finally {
    loading.value = false;
  }
};

const resetForm = () => {
  formData.value = {
    email: "",
    first_name: "",
    last_name: "",
    phone: "",
    role: "manager",
    password: "",
    is_active: true,
  };
  formErrors.value = {};
  editingUser.value = null;
  showPassword.value = false;
};

const openCreateModal = () => {
  resetForm();
  showModal.value = true;
};

const openEditModal = (user: any) => {
  editingUser.value = user;
  formData.value = {
    email: user.email,
    first_name: user.first_name || "",
    last_name: user.last_name || "",
    phone: user.phone || "",
    role: user.role,
    password: "",
    is_active: user.is_active,
  };
  formErrors.value = {};
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  resetForm();
};

const validateForm = () => {
  formErrors.value = {};
  let valid = true;

  // Email validation
  if (!formData.value.email?.trim()) {
    formErrors.value.email = t("usersManagement.validation.emailRequired");
    valid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.value.email.trim())) {
    formErrors.value.email = t("usersManagement.validation.emailInvalid");
    valid = false;
  }

  // First name validation
  if (!formData.value.first_name?.trim()) {
    formErrors.value.first_name = t("usersManagement.validation.firstNameRequired");
    valid = false;
  } else if (formData.value.first_name.trim().length < 2) {
    formErrors.value.first_name = t("usersManagement.validation.firstNameMin");
    valid = false;
  } else if (formData.value.first_name.trim().length > 150) {
    formErrors.value.first_name = t("usersManagement.validation.firstNameMax");
    valid = false;
  }

  // Last name validation
  if (!formData.value.last_name?.trim()) {
    formErrors.value.last_name = t("usersManagement.validation.lastNameRequired");
    valid = false;
  } else if (formData.value.last_name.trim().length < 2) {
    formErrors.value.last_name = t("usersManagement.validation.lastNameMin");
    valid = false;
  } else if (formData.value.last_name.trim().length > 150) {
    formErrors.value.last_name = t("usersManagement.validation.lastNameMax");
    valid = false;
  }

  // Phone validation (optional but if provided, should be valid)
  if (formData.value.phone?.trim() && formData.value.phone.trim().length > 30) {
    formErrors.value.phone = t("usersManagement.validation.phoneMax");
    valid = false;
  }

  // Password validation
  if (!editingUser.value) {
    // For new users, password is required
    if (!formData.value.password) {
      formErrors.value.password = t("usersManagement.validation.passwordRequired");
      valid = false;
    } else if (formData.value.password.length < 8) {
      formErrors.value.password = t("usersManagement.validation.passwordMin");
      valid = false;
    } else if (!/(?=.*[a-z])/.test(formData.value.password)) {
      formErrors.value.password = t("usersManagement.validation.passwordLowercase");
      valid = false;
    } else if (!/(?=.*[A-Z])/.test(formData.value.password)) {
      formErrors.value.password = t("usersManagement.validation.passwordUppercase");
      valid = false;
    } else if (!/(?=.*\d)/.test(formData.value.password)) {
      formErrors.value.password = t("usersManagement.validation.passwordNumber");
      valid = false;
    }
  } else {
    // For editing, password is optional, but if provided, must be valid
    if (formData.value.password) {
      if (formData.value.password.length < 8) {
        formErrors.value.password = t("usersManagement.validation.passwordMin");
        valid = false;
      } else if (!/(?=.*[a-z])/.test(formData.value.password)) {
        formErrors.value.password = t("usersManagement.validation.passwordLowercase");
        valid = false;
      } else if (!/(?=.*[A-Z])/.test(formData.value.password)) {
        formErrors.value.password = t("usersManagement.validation.passwordUppercase");
        valid = false;
      } else if (!/(?=.*\d)/.test(formData.value.password)) {
        formErrors.value.password = t("usersManagement.validation.passwordNumber");
        valid = false;
      }
    }
  }

  // Role validation
  if (!formData.value.role) {
    formErrors.value.role = t("usersManagement.validation.roleRequired");
    valid = false;
  } else if (!["admin", "manager"].includes(formData.value.role)) {
    formErrors.value.role = t("usersManagement.validation.roleInvalid");
    valid = false;
  }

  return valid;
};

const submitForm = async () => {
  if (!validateForm()) return;

  formLoading.value = true;
  try {
    const payload: any = {
      email: formData.value.email.trim(),
      first_name: formData.value.first_name.trim(),
      last_name: formData.value.last_name.trim(),
      phone: formData.value.phone?.trim() || "",
      role: formData.value.role,
      is_active: formData.value.is_active,
    };

    if (!editingUser.value) {
      // Create
      payload.password = formData.value.password;
      const result = await appStore.staffUserCreate(payload);
      if (result.ok) {
        closeModal();
        await loadUsers();
      } else {
        // Handle backend validation errors
        if (result.data) {
          const errors = result.data;
          if (errors.email) {
            formErrors.value.email = Array.isArray(errors.email) ? errors.email[0] : errors.email;
          }
          if (errors.password) {
            formErrors.value.password = Array.isArray(errors.password) ? errors.password[0] : errors.password;
          }
          if (errors.role) {
            formErrors.value.role = Array.isArray(errors.role) ? errors.role[0] : errors.role;
          }
        }
      }
    } else {
      // Update - don't send password if empty
      const result = await appStore.staffUserUpdate(editingUser.value.id, payload);
      if (!result.ok) {
        if (result.data) {
          const errors = result.data;
          if (errors.email) formErrors.value.email = Array.isArray(errors.email) ? errors.email[0] : errors.email;
          if (errors.first_name) formErrors.value.first_name = Array.isArray(errors.first_name) ? errors.first_name[0] : errors.first_name;
          if (errors.last_name) formErrors.value.last_name = Array.isArray(errors.last_name) ? errors.last_name[0] : errors.last_name;
          if (errors.phone) formErrors.value.phone = Array.isArray(errors.phone) ? errors.phone[0] : errors.phone;
          if (errors.role) formErrors.value.role = Array.isArray(errors.role) ? errors.role[0] : errors.role;
        }
        return;
      }
      if (formData.value.password) {
        const passRes = await appStore.staffUserChangePassword(
          editingUser.value.id,
          formData.value.password
        );

        if (!passRes.ok) {
          const e = passRes.data || {};
          
          if (e.new_password) {
            formErrors.value.password = Array.isArray(e.new_password) ? e.new_password[0] : e.new_password;
          } else if (e.detail) {
            formErrors.value.password = e.detail;
          } else {
            formErrors.value.password = "Не удалось сменить пароль";
          }

          return;
        }
      }

      closeModal();
      await loadUsers();
    }
  } catch (error) {
    console.error("Error submitting form:", error);
    // Handle network or other errors
    if (error?.response?.data) {
      const errors = error.response.data;
      Object.keys(errors).forEach((key) => {
        if (formData.value.hasOwnProperty(key)) {
          formErrors.value[key] = Array.isArray(errors[key]) ? errors[key][0] : errors[key];
        }
      });
    }
  } finally {
    formLoading.value = false;
  }
};

const handleDelete = async (user: any) => {
  if (!confirm(t("usersManagement.delete.confirm", { email: user.email }))) {
    return;
  }

  loading.value = true;
  try {
    const result = await appStore.staffUserDelete(user.id);
    if (result.ok) {
      await loadUsers();
    }
  } catch (error) {
    console.error("Error deleting user:", error);
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  currentPage.value = 1;
  loadUsers();
};

const totalPages = computed(() => Math.ceil(totalCount.value / pageSize.value));

const changePage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
    loadUsers();
  }
};

onMounted(() => {
  loadUsers();
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header with Actions -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4 flex-1">
        <!-- Search -->
        <div class="flex-1 max-w-md">
          <div class="relative">
            <input
              v-model="searchQuery"
              @keyup.enter="handleSearch"
              type="text"
              :placeholder="t('usersManagement.searchPlaceholder')"
              class="w-full px-4 py-2.5 pl-10 pr-4 rounded-xl border border-black/10 bg-white text-[#0B2A3C] placeholder:text-[#6B7E8B] focus:outline-none focus:ring-2 focus:ring-[#006AC7]/20 focus:border-[#006AC7]"
            />
            <svg
              class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7E8B]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        <!-- Role Filter -->
        <select
          v-model="roleFilter"
          @change="handleSearch"
          class="px-4 py-2.5 rounded-xl border border-black/10 bg-white text-[#0B2A3C] focus:outline-none focus:ring-2 focus:ring-[#006AC7]/20 focus:border-[#006AC7]"
        >
          <option value="">{{ t('usersManagement.allRoles') }}</option>
          <option value="admin">Admin</option>
          <option value="manager">Manager</option>
        </select>
      </div>

      <!-- Create Button -->
      <button
        @click="openCreateModal"
        class="px-6 py-2.5 bg-[#006AC7] text-white rounded-xl font-semibold hover:bg-[#0055A3] transition flex items-center gap-2"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 5v14M5 12h14" />
        </svg>
        {{ t('usersManagement.createUser') }}
      </button>
    </div>

    <!-- Users Table -->
    <div class="bg-white rounded-2xl border border-black/10 shadow-sm overflow-hidden">
      <div v-if="loading" class="p-8 text-center text-[#6B7E8B]">{{ t('usersManagement.loading') }}</div>
      
      <div v-else-if="users.length === 0" class="p-8 text-center text-[#6B7E8B]">
        {{ t('usersManagement.noUsers') }}
      </div>

      <table v-else class="w-full">
        <thead class="bg-[#F7FBFF] border-b border-black/10">
          <tr>
            <th class="px-6 py-4 text-left text-sm font-semibold text-[#0B2A3C]">{{ t('usersManagement.table.id') }}</th>
            <th class="px-6 py-4 text-left text-sm font-semibold text-[#0B2A3C]">{{ t('usersManagement.table.email') }}</th>
            <th class="px-6 py-4 text-left text-sm font-semibold text-[#0B2A3C]">{{ t('usersManagement.table.name') }}</th>
            <th class="px-6 py-4 text-left text-sm font-semibold text-[#0B2A3C]">{{ t('usersManagement.table.phone') }}</th>
            <th class="px-6 py-4 text-left text-sm font-semibold text-[#0B2A3C]">{{ t('usersManagement.table.role') }}</th>
            <th class="px-6 py-4 text-left text-sm font-semibold text-[#0B2A3C]">{{ t('usersManagement.table.status') }}</th>
            <th class="px-6 py-4 text-right text-sm font-semibold text-[#0B2A3C]">{{ t('usersManagement.table.actions') }}</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-black/5">
          <tr v-for="user in users" :key="user.id" class="hover:bg-[#F7FBFF]/50">
            <td class="px-6 py-4 text-sm text-[#0B2A3C]">{{ user.id }}</td>
            <td class="px-6 py-4 text-sm text-[#0B2A3C]">{{ user.email }}</td>
            <td class="px-6 py-4 text-sm text-[#0B2A3C]">
              {{ `${user.first_name || ''} ${user.last_name || ''}`.trim() || '—' }}
            </td>
            <td class="px-6 py-4 text-sm text-[#0B2A3C]">{{ user.phone || '—' }}</td>
            <td class="px-6 py-4">
              <span
                class="px-3 py-1 rounded-full text-xs font-semibold"
                :class="
                  user.role === 'admin'
                    ? 'bg-[#FFE5E5] text-[#CC0000]'
                    : 'bg-[#E8F3FF] text-[#006AC7]'
                "
              >
                {{ user.role }}
              </span>
            </td>
            <td class="px-6 py-4">
              <span
                class="px-3 py-1 rounded-full text-xs font-semibold"
                :class="
                  user.is_active
                    ? 'bg-[#E6F7E6] text-[#00AA00]'
                    : 'bg-[#FFE5E5] text-[#CC0000]'
                "
              >
                {{ user.is_active ? t('usersManagement.status.active') : t('usersManagement.status.inactive') }}
              </span>
            </td>
            <td class="px-6 py-4 text-right">
              <div class="flex items-center justify-end gap-2">
                <button
                  @click="openEditModal(user)"
                  class="px-3 py-1.5 text-sm text-[#006AC7] hover:bg-[#E8F3FF] rounded-lg transition"
                >
                  {{ t('usersManagement.actions.edit') }}
                </button>
                <button
                  @click="handleDelete(user)"
                  class="px-3 py-1.5 text-sm text-[#CC0000] hover:bg-[#FFE5E5] rounded-lg transition"
                >
                  {{ t('usersManagement.actions.delete') }}
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="px-6 py-4 border-t border-black/10 flex items-center justify-between">
        <div class="text-sm text-[#6B7E8B]">
          {{ t('usersManagement.pagination.showing', { from: (currentPage - 1) * pageSize + 1, to: Math.min(currentPage * pageSize, totalCount), total: totalCount }) }}
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="changePage(currentPage - 1)"
            :disabled="currentPage === 1"
            class="px-4 py-2 rounded-lg border border-black/10 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black/5 transition"
          >
            {{ t('usersManagement.pagination.previous') }}
          </button>
          <span class="px-4 py-2 text-sm text-[#0B2A3C]">
            {{ t('usersManagement.pagination.page', { current: currentPage, total: totalPages }) }}
          </span>
          <button
            @click="changePage(currentPage + 1)"
            :disabled="currentPage === totalPages"
            class="px-4 py-2 rounded-lg border border-black/10 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black/5 transition"
          >
            {{ t('usersManagement.pagination.next') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <div
      v-if="showModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      @click.self="closeModal"
    >
      <div class="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div class="p-6 border-b border-black/10">
          <h2 class="text-[24px] font-bold text-[#0B2A3C]">
            {{ editingUser ? t('usersManagement.modal.editUser') : t('usersManagement.modal.createUser') }}
          </h2>
        </div>

        <form @submit.prevent="submitForm" class="p-6 space-y-4">
          <!-- Email -->
          <div>
            <label class="block text-sm font-semibold text-[#0B2A3C] mb-2">
              {{ t('usersManagement.modal.email') }} <span class="text-[#CC0000]">*</span>
            </label>
            <input
              v-model="formData.email"
              type="email"
              :disabled="!!editingUser"
              class="w-full px-4 py-2.5 rounded-xl border border-black/10 bg-white text-[#0B2A3C] focus:outline-none focus:ring-2 focus:ring-[#006AC7]/20 focus:border-[#006AC7] disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            <p v-if="formErrors.email" class="mt-1 text-sm text-[#CC0000]">{{ formErrors.email }}</p>
          </div>

          <!-- First Name -->
          <div>
            <label class="block text-sm font-semibold text-[#0B2A3C] mb-2">
              {{ t('usersManagement.modal.firstName') }} <span class="text-[#CC0000]">*</span>
            </label>
            <input
              v-model="formData.first_name"
              type="text"
              class="w-full px-4 py-2.5 rounded-xl border border-black/10 bg-white text-[#0B2A3C] focus:outline-none focus:ring-2 focus:ring-[#006AC7]/20 focus:border-[#006AC7]"
            />
            <p v-if="formErrors.first_name" class="mt-1 text-sm text-[#CC0000]">{{ formErrors.first_name }}</p>
          </div>

          <!-- Last Name -->
          <div>
            <label class="block text-sm font-semibold text-[#0B2A3C] mb-2">
              {{ t('usersManagement.modal.lastName') }} <span class="text-[#CC0000]">*</span>
            </label>
            <input
              v-model="formData.last_name"
              type="text"
              class="w-full px-4 py-2.5 rounded-xl border border-black/10 bg-white text-[#0B2A3C] focus:outline-none focus:ring-2 focus:ring-[#006AC7]/20 focus:border-[#006AC7]"
            />
            <p v-if="formErrors.last_name" class="mt-1 text-sm text-[#CC0000]">{{ formErrors.last_name }}</p>
          </div>

          <!-- Phone -->
          <div>
            <label class="block text-sm font-semibold text-[#0B2A3C] mb-2">{{ t('usersManagement.modal.phone') }}</label>
            <input
              v-model="formData.phone"
              type="tel"
              class="w-full px-4 py-2.5 rounded-xl border border-black/10 bg-white text-[#0B2A3C] focus:outline-none focus:ring-2 focus:ring-[#006AC7]/20 focus:border-[#006AC7]"
            />
          </div>

          <!-- Role -->
          <div>
            <label class="block text-sm font-semibold text-[#0B2A3C] mb-2">
              {{ t('usersManagement.modal.role') }} <span class="text-[#CC0000]">*</span>
            </label>
            <select
              v-model="formData.role"
              class="w-full px-4 py-2.5 rounded-xl border border-black/10 bg-white text-[#0B2A3C] focus:outline-none focus:ring-2 focus:ring-[#006AC7]/20 focus:border-[#006AC7]"
            >
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
            <p v-if="formErrors.role" class="mt-1 text-sm text-[#CC0000]">{{ formErrors.role }}</p>
          </div>

          <!-- Password -->
          <div>
            <label class="block text-sm font-semibold text-[#0B2A3C] mb-2">
              {{ t('usersManagement.modal.password') }} <span class="text-[#CC0000]">*</span>
              <span v-if="editingUser" class="text-xs font-normal text-[#6B7E8B]">{{ t('usersManagement.modal.passwordHint') }}</span>
            </label>
            <div class="relative">
              <input
                v-model="formData.password"
                :type="showPassword ? 'text' : 'password'"
                class="w-full px-4 py-2.5 pr-12 rounded-xl border border-black/10 bg-white text-[#0B2A3C] focus:outline-none focus:ring-2 focus:ring-[#006AC7]/20 focus:border-[#006AC7]"
                :placeholder="t('usersManagement.modal.passwordPlaceholder')"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7E8B] hover:text-[#0B2A3C] transition"
                tabindex="-1"
              >
                <svg
                  v-if="showPassword"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
                <svg
                  v-else
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
            </div>
            <p v-if="formErrors.password" class="mt-1 text-sm text-[#CC0000]">{{ formErrors.password }}</p>
            <p v-else-if="!editingUser" class="mt-1 text-xs text-[#6B7E8B]">
              {{ t('usersManagement.modal.passwordRequirement') }}
            </p>
          </div>

          <!-- Is Active -->
          <div class="flex items-center gap-3">
            <input
              v-model="formData.is_active"
              type="checkbox"
              id="is_active"
              class="w-5 h-5 rounded border-black/10 text-[#006AC7] focus:ring-2 focus:ring-[#006AC7]/20"
            />
            <label for="is_active" class="text-sm font-semibold text-[#0B2A3C]">{{ t('usersManagement.modal.active') }}</label>
          </div>

          <!-- Form Actions -->
          <div class="flex items-center justify-end gap-3 pt-4 border-t border-black/10">
            <button
              type="button"
              @click="closeModal"
              class="px-6 py-2.5 rounded-xl border border-black/10 text-[#0B2A3C] font-semibold hover:bg-black/5 transition"
            >
              {{ t('usersManagement.modal.cancel') }}
            </button>
            <button
              type="submit"
              :disabled="formLoading"
              class="px-6 py-2.5 bg-[#006AC7] text-white rounded-xl font-semibold hover:bg-[#0055A3] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ formLoading ? t('usersManagement.modal.saving') : (editingUser ? t('usersManagement.modal.update') : t('usersManagement.modal.create')) }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

