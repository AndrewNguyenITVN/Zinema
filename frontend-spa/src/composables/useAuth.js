import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth.store'

/**
 * Composable chính cho việc xác thực và quản lý trạng thái người dùng.
 * Wrapper cho Pinia store để cung cấp state và actions một cách nhất quán
 * trong toàn bộ ứng dụng.
 */
export function useAuth() {
  const authStore = useAuthStore()

  // --- State and Getters (từ Pinia store) ---
  const isAuthenticated = computed(() => authStore.isAuthenticated)
  const currentUser = computed(() => authStore.currentUser)
  const isLoading = computed(() => authStore.isLoading)
  const userRole = computed(() => authStore.userRole)
  const isAdmin = computed(() => authStore.isAdmin)
  const isEmployee = computed(() => authStore.isEmployee)
  const isCustomer = computed(() => authStore.isCustomer)
  const canManageEmployees = computed(() => authStore.canManageEmployees)
  const canManageCustomers = computed(() => authStore.canManageCustomers)

  // --- Actions (từ Pinia store) ---
  const { logout, setCurrentUser, setAuthenticated, initAuth } = authStore

  // --- Trả về state và hàm để component có thể dùng ---
  return {
    // State
    isAuthenticated,
    currentUser,
    isLoading,

    // Getters
    userRole,
    isAdmin,
    isEmployee,
    isCustomer,
    canManageEmployees,
    canManageCustomers,

    // Actions
    logout,
    setCurrentUser,
    setAuthenticated,
    initAuth,
  }
}
