import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import authService from '@/services/auth.service'

const AUTH_QUERY_KEY = 'auth'

/**
 * Composable chính cho việc xác thực và quản lý tài khoản người dùng.
 * Cung cấp state, getters và actions liên quan đến người dùng hiện tại,
 * cũng như chức năng thay đổi mật khẩu.
 */
export function useAuth() {
  const authStore = useAuthStore()
  const queryClient = useQueryClient()

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

  // --- Mutations (sử dụng Vue Query) ---
  const {
    mutate: changePassword,
    isLoading: isChangingPassword,
    isSuccess: isChangePasswordSuccess,
    isError: isChangePasswordError,
    error: changePasswordError,
    reset: resetChangePassword,
  } = useMutation({
    mutationFn: authService.changePassword,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [AUTH_QUERY_KEY] })
    },
  })

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

    // Password Change
    changePassword,
    isChangingPassword,
    isChangePasswordSuccess,
    isChangePasswordError,
    changePasswordError,
    resetChangePassword,
  }
}
