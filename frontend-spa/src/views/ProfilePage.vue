<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia' // Import storeToRefs
import { useAuthStore } from '@/stores/auth.store'
import CustomerForm from '@/components/CustomerForm.vue'
import ChangePasswordForm from '@/components/ChangePasswordForm.vue'

// Only import updateCustomer mutation, not the whole useCustomers (which calls getAllCustomers)
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import authService from '@/services/auth.service'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// Sử dụng storeToRefs để đảm bảo reactivity
const { currentUser, userRole, isCustomer, isEmployee, isAdmin } = storeToRefs(authStore)
const { setCurrentUser } = authStore // Actions có thể được destructure trực tiếp

const {
  mutateAsync: changePassword,
  isLoading: isPasswordLoading,
  error: changePasswordError,
} = useMutation({
  mutationFn: authService.changePassword,
})

const queryClient = useQueryClient()
const updateCustomerMutation = useMutation({
  mutationFn: ({ id, data }) => authService.updateCustomer(id, data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['auth'] })
  },
})

const linkPhoneMutation = useMutation({
  mutationFn: (phoneNumber) => authService.linkPhoneNumber(phoneNumber),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['auth'] })
  },
})

const isEditingProfile = ref(false)
const isChangingPassword = ref(false)
const isFirstTimeUser = ref(false)
const isLinkingPhone = ref(false)
const phoneNumber = ref('')

// Check if this is a first-time user from Google registration
onMounted(() => {
  if (route.query.firstTime === 'true') {
    isFirstTimeUser.value = true
    isEditingProfile.value = true // Automatically enable edit mode
    // Clear the query parameter from URL
    router.replace({ path: route.path })
  }
})

const isGoogleAccount = computed(() => !!currentUser.value?.google_id)

const customerInitialValues = computed(() => {
  if (!currentUser.value) return {}
  const user = currentUser.value
  return {
    ...user,
    date_of_birth: user.date_of_birth ? user.date_of_birth.slice(0, 10) : '',
  }
})

// Customer profile update
async function handleUpdateProfile(values) {
  try {
    const userId = currentUser.value.id
    const resp = await updateCustomerMutation.mutateAsync({
      id: userId,
      data: values,
    })

    // resp has shape { customer: {...} } from backend
    const newProfile = resp?.customer ?? values
    setCurrentUser(newProfile)

    isEditingProfile.value = false

    if (isFirstTimeUser.value) {
      alert('Chào mừng bạn đến với Zinema! Thông tin của bạn đã được cập nhật thành công.')
      isFirstTimeUser.value = false
      router.push('/')
    } else {
      alert('Cập nhật thông tin thành công!')
    }
  } catch (error) {
    console.error('Update profile error:', error)
    alert('Có lỗi xảy ra khi cập nhật thông tin!')
  }
}

// Password change
async function handleChangePassword(values) {
  try {
    await changePassword(values)
    isChangingPassword.value = false
    alert('Đổi mật khẩu thành công!')
  } catch (error) {
    console.error('Change password error:', changePasswordError.value || error)
    alert('Có lỗi xảy ra khi đổi mật khẩu: ' + (changePasswordError.value?.message || error.message))
  }
}

function formatRole(role) {
  const roleMap = {
    admin: 'Quản trị viên',
    staff: 'Nhân viên',
    customer: 'Khách hàng',
  }
  return roleMap[role] || role
}

function formatGender(gender) {
  const genderMap = {
    male: 'Nam',
    female: 'Nữ',
    other: 'Khác',
  }
  return genderMap[gender] || gender
}

// Phone linking
async function handleLinkPhone() {
  try {
    if (!phoneNumber.value.trim()) {
      alert('Vui lòng nhập số điện thoại')
      return
    }

    const result = await linkPhoneMutation.mutateAsync(phoneNumber.value.trim())
    setCurrentUser(result.customer)
    isLinkingPhone.value = false
    phoneNumber.value = ''
    alert('Liên kết số điện thoại thành công!')
  } catch (error) {
    console.error('Link phone error:', error)
    alert('Có lỗi xảy ra khi liên kết số điện thoại: ' + error.message)
  }
}

function cancelLinkPhone() {
  isLinkingPhone.value = false
  phoneNumber.value = ''
}

// Go back function based on user role
function goBack() {
  if (isAdmin.value) {
    router.push('/admin')
  } else if (isEmployee.value) {
    router.push('/staff')
  } else if (isCustomer.value) {
    // Customer goes to movies
    router.push('/')
  } else {
    // Fallback to login page
    router.push('/login')
  }
}
</script>

<template>
  <div class="profile-page">
    <!-- Header -->
    <div class="page-header">
      <div class="container">
        <div class="header-content">
          <h1 class="page-title">
            <i class="fas fa-user-circle me-2"></i>
            Thông tin cá nhân
          </h1>
          <button class="btn-back" @click="goBack">
            <i class="fas fa-arrow-left me-2"></i>
            Quay lại
          </button>
        </div>
      </div>
    </div>

    <div class="container py-4">
      <!-- Loading state -->
      <div v-if="!currentUser" class="loading-container">
        <div class="spinner"></div>
        <p>Đang tải thông tin...</p>
      </div>

      <!-- Profile Content -->
      <div v-else class="profile-content-card">
        <!-- Welcome message for first-time users -->
        <div v-if="isFirstTimeUser" class="welcome-alert" role="alert">
          <i class="fas fa-info-circle me-2"></i>
          <strong>Chào mừng bạn đến với Zinema!</strong>
          <p class="mb-0 mt-2">
            Vui lòng cập nhật đầy đủ thông tin cá nhân để có trải nghiệm tốt nhất.
          </p>
        </div>

        <div class="profile-grid">
          <!-- Left Panel: User Info -->
          <div class="user-info-panel">
            <div class="avatar-section">
              <i class="fas fa-user-circle avatar-icon"></i>
              <h4 class="user-name">{{ currentUser.full_name }}</h4>
              <span class="user-role">{{ formatRole(userRole) }}</span>
            </div>
            <div class="actions-panel">
              <button
                v-if="isCustomer && !isEditingProfile && !isChangingPassword"
                class="btn-action-primary"
                @click="isEditingProfile = true"
              >
                <i class="fas fa-edit me-2"></i>
                Chỉnh sửa thông tin
              </button>
              <button
                v-if="(isAdmin || isEmployee) && !isGoogleAccount && !isChangingPassword"
                class="btn-action"
                @click="isChangingPassword = true"
              >
                <i class="fas fa-key me-2"></i>
                Đổi mật khẩu
              </button>
            </div>
          </div>

          <!-- Right Panel: Forms or Details -->
          <div class="details-panel">
            <!-- Password Change Form -->
            <div v-if="(isAdmin || isEmployee) && isChangingPassword">
              <h5 class="panel-title">
                <i class="fas fa-key me-2"></i>
                Tạo mật khẩu mới
              </h5>
              <ChangePasswordForm
                :is-loading="isPasswordLoading"
                @submit="handleChangePassword"
                @cancel="isChangingPassword = false"
              />
            </div>

            <!-- All other views are wrapped in a v-else -->
            <div v-else>
              <!-- Phone Linking Form -->
              <div v-if="isLinkingPhone">
                <h5 class="panel-title">
                  <i class="fas fa-link me-2"></i>
                  Liên kết số điện thoại
                </h5>
                <div class="phone-link-form">
                  <p class="form-description">
                    Nhập số điện thoại để liên kết với tài khoản Google của bạn. Nếu số điện thoại
                    này đã được sử dụng để đặt vé trước đó, hệ thống sẽ tự động gộp thông tin lại.
                  </p>
                  <div class="form-group">
                    <label for="phone-input">Số điện thoại:</label>
                    <input
                      id="phone-input"
                      v-model="phoneNumber"
                      type="tel"
                      class="form-control"
                      placeholder="Nhập số điện thoại"
                      :disabled="linkPhoneMutation.isLoading"
                    />
                  </div>
                  <div class="form-actions">
                    <button
                      type="button"
                      class="btn-primary"
                      :disabled="linkPhoneMutation.isLoading"
                      @click="handleLinkPhone"
                    >
                      <i v-if="linkPhoneMutation.isLoading" class="fas fa-spinner fa-spin me-2"></i>
                      <i v-else class="fas fa-link me-2"></i>
                      {{ linkPhoneMutation.isLoading ? 'Đang liên kết...' : 'Liên kết' }}
                    </button>
                    <button
                      type="button"
                      class="btn-secondary"
                      :disabled="linkPhoneMutation.isLoading"
                      @click="cancelLinkPhone"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              </div>

              <!-- Customer or Admin/Employee Profile -->
              <div v-else>
                <h5 class="panel-title">
                  <i class="fas fa-info-circle me-2"></i>
                  Chi tiết tài khoản
                </h5>
                <!-- Customer Profile -->
                <div v-if="isCustomer">
                  <!-- Edit Mode -->
                  <CustomerForm
                    v-if="isEditingProfile"
                    :initial-values="customerInitialValues"
                    :is-loading="updateCustomerMutation.isLoading"
                    :allow-phone-edit="true"
                    @submit="handleUpdateProfile"
                    @cancel="isEditingProfile = false"
                  />
                  <!-- View Mode -->
                  <div v-else class="details-view">
                    <div class="detail-item">
                      <span class="detail-label">Số điện thoại:</span>
                      <span v-if="currentUser.phone_number" class="detail-value">{{
                        currentUser.phone_number
                      }}</span>
                      <div v-else class="detail-value-missing">
                        <span class="text-muted">Chưa cập nhật</span>
                        <button
                          v-if="isGoogleAccount"
                          class="btn-link-phone"
                          @click="isLinkingPhone = true"
                        >
                          <i class="fas fa-link me-1"></i>
                          Liên kết số điện thoại
                        </button>
                      </div>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">Email:</span>
                      <span class="detail-value">{{ currentUser.email || 'Chưa cập nhật' }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">Giới tính:</span>
                      <span class="detail-value">{{
                        formatGender(currentUser.gender) || 'Chưa cập nhật'
                      }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">Ngày sinh:</span>
                      <span class="detail-value">{{
                        currentUser.date_of_birth
                          ? new Date(currentUser.date_of_birth).toLocaleDateString('vi-VN')
                          : 'Chưa cập nhật'
                      }}</span>
                    </div>
                    <div class="detail-item full-width">
                      <span class="detail-label">Địa chỉ:</span>
                      <span class="detail-value">{{ currentUser.address || 'Chưa cập nhật' }}</span>
                    </div>
                  </div>
                </div>

                <!-- Employee/Admin Profile (Read-only) -->
                <div v-if="isEmployee || isAdmin">
                  <div class="details-view">
                    <div class="detail-item">
                      <span class="detail-label">Số điện thoại:</span>
                      <span class="detail-value">{{
                        currentUser.phone_number || 'Chưa cập nhật'
                      }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">Email:</span>
                      <span class="detail-value">{{ currentUser.email || 'Chưa cập nhật' }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">Giới tính:</span>
                      <span class="detail-value">{{
                        formatGender(currentUser.gender) || 'Chưa cập nhật'
                      }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">Ngày sinh:</span>
                      <span class="detail-value">{{
                        currentUser.date_of_birth
                          ? new Date(currentUser.date_of_birth).toLocaleDateString('vi-VN')
                          : 'Chưa cập nhật'
                      }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">Chức vụ:</span>
                      <span class="detail-value">{{
                        currentUser.position || 'Chưa cập nhật'
                      }}</span>
                    </div>
                    <div class="detail-item full-width">
                      <span class="detail-label">Địa chỉ:</span>
                      <span class="detail-value">{{ currentUser.address || 'Chưa cập nhật' }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Header */
.page-header {
  background: var(--cinema-gradient-dark);
  padding: 2rem 0;
  margin-bottom: 1rem;
  border-bottom: 1px solid rgba(247, 197, 72, 0.2);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  color: var(--cinema-primary);
  font-size: 2.2rem;
  margin: 0;
}

.btn-back {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: var(--cinema-text);
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-back:hover {
  background: rgba(255, 255, 255, 0.15);
}

/* Loading */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 0;
  color: var(--cinema-text);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(247, 197, 72, 0.1);
  border-left-color: var(--cinema-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Profile Card */
.profile-content-card {
  background: rgba(15, 23, 42, 0.7);
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.welcome-alert {
  background-color: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.3);
  color: #60a5fa;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 2rem;
}

.profile-grid {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 2rem;
}

/* Left Panel */
.user-info-panel {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  padding: 1.5rem;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
}

.avatar-icon {
  font-size: 6rem;
  color: var(--cinema-primary);
  margin-bottom: 1rem;
}

.user-name {
  font-size: 1.5rem;
  color: var(--cinema-text);
  margin-bottom: 0.5rem;
}

.user-role {
  display: inline-block;
  background: rgba(247, 197, 72, 0.1);
  color: var(--cinema-primary);
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.9rem;
  font-weight: 500;
}

.actions-panel {
  margin-top: auto;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.btn-action,
.btn-action-primary {
  padding: 0.75rem;
  border-radius: 8px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn-action-primary {
  background: var(--cinema-gradient-gold);
  color: var(--cinema-darker);
}
.btn-action-primary:hover {
  filter: brightness(1.1);
}

.btn-action {
  background: rgba(255, 255, 255, 0.1);
  color: var(--cinema-text);
}
.btn-action:hover {
  background: rgba(255, 255, 255, 0.15);
}

/* Right Panel */
.details-panel {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  padding: 2rem;
}

.panel-title {
  color: var(--cinema-text);
  margin-bottom: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 1rem;
  font-size: 1.25rem;
}

.details-view {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detail-item.full-width {
  grid-column: span 2;
}

.detail-label {
  font-size: 0.9rem;
  color: var(--cinema-text-muted);
  font-weight: 500;
}

.detail-value {
  font-size: 1rem;
  color: var(--cinema-text);
}

.detail-value-missing {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.text-muted {
  color: #6b7280;
}

.btn-link-phone {
  background: var(--cinema-primary);
  color: var(--cinema-dark);
  border: none;
  padding: 0.4rem 0.8rem;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.btn-link-phone:hover {
  background: #e6b800;
  transform: translateY(-1px);
}

/* Phone Link Form */
.phone-link-form {
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.form-description {
  color: #9ca3af;
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  color: var(--cinema-text);
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-control {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.05);
  color: var(--cinema-text);
  font-size: 1rem;
  transition: all 0.3s ease;
}

.form-control:focus {
  outline: none;
  border-color: var(--cinema-primary);
  box-shadow: 0 0 0 3px rgba(247, 197, 72, 0.1);
}

.form-control:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.btn-primary {
  background: var(--cinema-primary);
  color: var(--cinema-dark);
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-primary:hover:not(:disabled) {
  background: #e6b800;
  transform: translateY(-1px);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: var(--cinema-text);
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-secondary:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.15);
}

.btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Responsive */
@media (max-width: 992px) {
  .profile-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  .details-view {
    grid-template-columns: 1fr;
  }
  .detail-item.full-width {
    grid-column: span 1;
  }
}
</style>
