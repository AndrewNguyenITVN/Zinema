<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { useEmployees, useEmployee } from '@/composables/useEmployees'
import EmployeeForm from '@/components/EmployeeForm.vue'

const router = useRouter()
const route = useRoute()
const employeeId = computed(() => route.params.id)

const { canManageEmployees } = useAuth()
const { updateEmployee, isUpdating } = useEmployees()
const { data: employeeData, isLoading, isError } = useEmployee(employeeId)

const isEditing = ref(false)

// Redirect if not authorized
if (!canManageEmployees.value) {
  router.push('/403')
}

// Form initial values
const initialValues = computed(() => {
  if (!employeeData.value?.employee) return {}

  const employee = employeeData.value.employee
  return {
    full_name: employee.full_name || '',
    phone_number: employee.phone_number || '',
    email: employee.email || '',
    address: employee.address || '',
    date_of_birth: employee.date_of_birth ? employee.date_of_birth.slice(0, 10) : '',
    gender: employee.gender || '',
    position: employee.position || '',
  }
})

async function handleUpdateEmployee(values) {
  try {
    updateEmployee({
      id: parseInt(employeeId.value),
      data: values,
    })

    isEditing.value = false
    alert('Cập nhật thông tin nhân viên thành công!')
  } catch (error) {
    console.error('Update employee error:', error)
    alert('Có lỗi xảy ra khi cập nhật thông tin!')
  }
}

function goBack() {
  router.push({ name: 'employee.list' })
}

function formatRole(role) {
  const roleMap = {
    admin: 'Quản trị viên',
    employee: 'Nhân viên',
  }
  return roleMap[role] || role
}

function getInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

function formatGender(gender) {
  const genderMap = {
    male: 'Nam',
    female: 'Nữ',
    other: 'Khác',
  }
  return genderMap[gender] || 'Chưa cập nhật'
}

function getRoleClass(role) {
  const classMap = {
    admin: 'badge-admin',
    employee: 'badge-employee',
  }
  return classMap[role] || 'badge-default'
}
</script>

<template>
  <div class="employee-detail-page">
    <!-- Page header -->
    <div class="page-header">
      <div class="container">
        <div class="header-content">
          <div class="header-title">
            <h1><i class="fas fa-user-tie"></i> Chi Tiết Nhân Viên</h1>
            <p>Xem và cập nhật thông tin nhân viên</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Page content -->
    <div class="page-content">
      <div class="container">
        <!-- Loading state -->
        <div v-if="isLoading" class="loading-state">
          <div class="loader">
            <i class="fas fa-circle-notch fa-spin"></i>
          </div>
          <p>Đang tải thông tin nhân viên...</p>
        </div>

        <!-- Error state -->
        <div v-else-if="isError" class="error-state">
          <div class="error-icon">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <h3>Đã xảy ra lỗi!</h3>
          <p>Không thể tải thông tin nhân viên. Vui lòng thử lại.</p>
          <button class="btn-cinema" @click="goBack">
            <i class="fas fa-arrow-left"></i>
            Quay lại
          </button>
        </div>

        <!-- Employee Info -->
        <div v-else-if="employeeData?.employee" class="detail-card">
          <!-- Edit Form -->
          <EmployeeForm
            v-if="isEditing"
            is-edit-mode
            :initial-values="initialValues"
            :is-loading="isUpdating"
            @submit="handleUpdateEmployee"
            @cancel="isEditing = false"
          />

          <!-- View Mode -->
          <div v-else class="employee-view">
            <!-- Employee header -->
            <div class="employee-header">
              <div class="employee-avatar" :class="getRoleClass(employeeData.employee.role)">
                {{ getInitials(employeeData.employee.full_name) }}
              </div>
              <div class="employee-title">
                <h2>{{ employeeData.employee.full_name }}</h2>
                <span class="employee-badge" :class="getRoleClass(employeeData.employee.role)">
                  {{ formatRole(employeeData.employee.role) }}
                </span>
              </div>
            </div>

            <!-- Employee details -->
            <div class="detail-section">
              <h3 class="section-title">Thông tin cá nhân</h3>

              <div class="detail-grid">
                <div class="detail-item">
                  <div class="detail-label">
                    <i class="fas fa-id-card"></i>
                    <span>Mã nhân viên</span>
                  </div>
                  <div class="detail-value">{{ employeeData.employee.id }}</div>
                </div>

                <div class="detail-item">
                  <div class="detail-label">
                    <i class="fas fa-phone"></i>
                    <span>Số điện thoại</span>
                  </div>
                  <div class="detail-value">
                    {{ employeeData.employee.phone_number || 'Chưa cập nhật' }}
                  </div>
                </div>

                <div class="detail-item">
                  <div class="detail-label">
                    <i class="fas fa-envelope"></i>
                    <span>Email</span>
                  </div>
                  <div class="detail-value">
                    {{ employeeData.employee.email || 'Chưa cập nhật' }}
                  </div>
                </div>

                <div class="detail-item">
                  <div class="detail-label">
                    <i class="fas fa-venus-mars"></i>
                    <span>Giới tính</span>
                  </div>
                  <div class="detail-value">{{ formatGender(employeeData.employee.gender) }}</div>
                </div>

                <div class="detail-item">
                  <div class="detail-label">
                    <i class="fas fa-birthday-cake"></i>
                    <span>Ngày sinh</span>
                  </div>
                  <div class="detail-value">
                    {{
                      employeeData.employee.date_of_birth
                        ? new Date(employeeData.employee.date_of_birth).toLocaleDateString('vi-VN')
                        : 'Chưa cập nhật'
                    }}
                  </div>
                </div>

                <div class="detail-item">
                  <div class="detail-label">
                    <i class="fas fa-briefcase"></i>
                    <span>Vị trí</span>
                  </div>
                  <div class="detail-value position-value">
                    {{ employeeData.employee.position || 'Chưa cập nhật' }}
                  </div>
                </div>

                <div class="detail-item full-width">
                  <div class="detail-label">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>Địa chỉ</span>
                  </div>
                  <div class="detail-value">
                    {{ employeeData.employee.address || 'Chưa cập nhật' }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="detail-actions">
              <button class="btn-edit" @click="isEditing = true">
                <i class="fas fa-edit"></i>
                <span>Chỉnh sửa thông tin</span>
              </button>

              <button class="btn-back" @click="goBack">
                <i class="fas fa-arrow-left"></i>
                <span>Quay lại</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Page container */
.employee-detail-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Header */
.page-header {
  background: var(--cinema-gradient-dark);
  padding: 2rem 0;
  margin-bottom: 1.5rem;
  position: relative;
  border-bottom: 1px solid rgba(247, 197, 72, 0.2);
  z-index: 1;
}

.page-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: url("data:image/svg+xml,%3Csvg width='6' height='6' viewBox='0 0 6 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.05' fill-rule='evenodd'%3E%3Cpath d='M5 0h1L0 5v1H0V0h5z'/%3E%3C/g%3E%3C/svg%3E");
  opacity: 0.3;
  z-index: -1;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 1rem;
  position: relative;
  z-index: 2;
}

.header-title {
  flex: 1;
}

.header-title h1 {
  color: var(--cinema-primary);
  font-size: 1.8rem;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.header-title p {
  color: var(--cinema-text-muted);
  margin: 0;
}

/* Page content */
.page-content {
  flex: 1;
  padding: 0 0 3rem;
}

/* Loading state */
.loading-state {
  text-align: center;
  padding: 4rem 0;
  color: var(--cinema-text-muted);
}

.loader {
  font-size: 3rem;
  color: var(--cinema-primary);
  margin-bottom: 1.5rem;
}

/* Error state */
.error-state {
  text-align: center;
  padding: 4rem 0;
  color: var(--cinema-text-muted);
}

.error-icon {
  font-size: 3rem;
  color: var(--cinema-secondary);
  margin-bottom: 1rem;
}

.error-state h3 {
  color: var(--cinema-text);
  margin-bottom: 1rem;
}

.btn-cinema {
  background: var(--cinema-gradient-gold);
  border: none;
  color: var(--cinema-darker);
  padding: 0.5rem 1.5rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-cinema:hover {
  filter: brightness(1.1);
  transform: translateY(-2px);
}

/* Detail card */
.detail-card {
  background: rgba(13, 27, 42, 0.7);
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.05);
  max-width: 800px;
  margin: 0 auto;
}

/* Employee view */
.employee-view {
  padding: 2rem;
}

/* Employee header */
.employee-header {
  display: flex;
  align-items: center;
  margin-bottom: 2rem;
}

.employee-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: 600;
  margin-right: 1.5rem;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
  flex-shrink: 0;
  color: #fff;
}

.badge-admin {
  background: linear-gradient(135deg, var(--cinema-secondary) 0%, #aa1c1c 100%);
}

.badge-employee {
  background: linear-gradient(135deg, #eb9c38 0%, #c66f00 100%);
}

.employee-title {
  flex: 1;
}

.employee-title h2 {
  color: var(--cinema-text);
  margin-bottom: 0.5rem;
  font-size: 1.5rem;
}

.employee-badge {
  font-size: 0.8rem;
  padding: 0.25rem 0.75rem;
  border-radius: 50px;
  font-weight: 600;
  display: inline-block;
}

.badge-admin {
  background-color: rgba(254, 65, 65, 0.1);
  color: var(--cinema-secondary);
  border: 1px solid rgba(254, 65, 65, 0.3);
}

.badge-employee {
  background-color: rgba(247, 197, 72, 0.1);
  color: #eb9c38;
  border: 1px solid rgba(247, 197, 72, 0.3);
}

/* Detail section */
.detail-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.section-title {
  font-size: 1.2rem;
  color: var(--cinema-primary);
  margin-bottom: 1.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(247, 197, 72, 0.2);
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.full-width {
  grid-column: 1 / -1;
}

.detail-item {
  display: flex;
  flex-direction: column;
}

.detail-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--cinema-text-muted);
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.detail-label i {
  color: var(--cinema-primary);
}

.detail-value {
  color: var(--cinema-text);
  font-weight: 500;
}

.position-value {
  color: #eb9c38;
  font-weight: 600;
}

/* Actions */
.detail-actions {
  margin-top: 2rem;
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.btn-edit {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: var(--cinema-gradient-gold);
  border: none;
  color: var(--cinema-darker);
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-edit:hover {
  filter: brightness(1.1);
  transform: translateY(-2px);
}

.btn-back {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: var(--cinema-text);
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-back:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-2px);
}

@media (max-width: 768px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }

  .employee-header {
    flex-direction: column;
    text-align: center;
  }

  .employee-avatar {
    margin-right: 0;
    margin-bottom: 1rem;
  }
}
</style>
