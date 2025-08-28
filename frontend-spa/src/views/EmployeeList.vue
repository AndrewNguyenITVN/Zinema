<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import UserCard from '@/components/UserCard.vue'
import InputSearch from '@/components/InputSearch.vue'
import { useAuth } from '@/composables/useAuth'
import { useEmployees } from '@/composables/useEmployees'

const router = useRouter()
const { canManageEmployees } = useAuth()
const {
  employees: employeesData,
  isLoadingEmployees,
  isEmployeesError,
  refetchEmployees,
} = useEmployees()

const employees = computed(() => employeesData.value?.employees || [])

const searchText = ref('')

// Search functionality
const searchableEmployees = computed(() =>
  employees.value.map((employee) => {
    const { full_name, employee_code, phone_number, email } = employee
    return [full_name, employee_code, phone_number, email].join('').toLowerCase()
  }),
)

const filteredEmployees = computed(() => {
  if (!searchText.value) return employees.value

  return employees.value.filter((employee, index) =>
    searchableEmployees.value[index].includes(searchText.value.toLowerCase()),
  )
})

function goToAddEmployee() {
  router.push({ name: 'employee.add' })
}

function goToEmployeeDetail(employee) {
  router.push({
    name: 'employee.detail',
    params: { id: employee.id },
  })
}
</script>

<template>
  <div class="cinema-page employee-list">
    <!-- Page header -->
    <div class="page-header">
      <div class="container">
        <div class="header-content">
          <div class="header-title">
            <h1><i class="fas fa-users-cog"></i> Quản lý nhân viên</h1>
            <p>Quản lý danh sách nhân viên và phân quyền hệ thống</p>
          </div>

          <div class="header-actions">
            <button class="action-btn" @click="refetchEmployees" :disabled="isLoadingEmployees">
              <i class="fas fa-sync-alt" :class="{ 'fa-spin': isLoadingEmployees }"></i>
              <span>Làm mới</span>
            </button>
            <button v-if="canManageEmployees" class="action-btn-primary" @click="goToAddEmployee">
              <i class="fas fa-plus"></i>
              <span>Thêm nhân viên</span>
            </button>
          </div>
        </div>

        <!-- Search bar -->
        <div class="search-container">
          <InputSearch
            v-model="searchText"
            placeholder="Tìm kiếm nhân viên theo tên, email, số điện thoại..."
          />
        </div>
      </div>
    </div>

    <!-- Page content -->
    <div class="page-content">
      <div class="container">
        <!-- Loading State -->
        <div v-if="isLoadingEmployees" class="loading-state">
          <div class="loader"><i class="fas fa-circle-notch fa-spin"></i></div>
          <p>Đang tải danh sách nhân viên...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="isEmployeesError" class="error-state">
          <div class="error-icon"><i class="fas fa-exclamation-triangle"></i></div>
          <h3>Đã xảy ra lỗi!</h3>
          <p>Không thể tải danh sách nhân viên. Vui lòng thử lại.</p>
          <button class="action-btn-primary" @click="refetchEmployees">
            <i class="fas fa-redo"></i> Thử lại
          </button>
        </div>

        <!-- Employee List -->
        <div v-else-if="filteredEmployees.length > 0" class="employee-grid">
          <UserCard
            v-for="employee in filteredEmployees"
            :key="employee.id"
            :user="employee"
            :show-actions="true"
            :can-edit="canManageEmployees"
            @view-details="goToEmployeeDetail"
          />
        </div>

        <!-- Empty State -->
        <div v-else class="empty-state">
          <div class="empty-icon"><i class="fas fa-users-cog"></i></div>
          <h3>Không tìm thấy nhân viên</h3>
          <p v-if="searchText">Không có nhân viên nào khớp với từ khóa "{{ searchText }}".</p>
          <p v-else>Chưa có nhân viên nào trong hệ thống.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Page container */
.cinema-page {
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
  pointer-events: none;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.header-title h1 {
  color: var(--cinema-primary);
  font-size: 1.8rem;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.header-title p {
  color: var(--cinema-text-muted);
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
}

.action-btn,
.action-btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.3s ease;
  cursor: pointer;
}

.action-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: var(--cinema-text);
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.15);
}

.action-btn-primary {
  background: var(--cinema-gradient-gold);
  border: 1px solid rgba(247, 197, 72, 0.5);
  color: var(--cinema-darker);
}

.action-btn-primary:hover {
  filter: brightness(1.1);
}

.action-btn:disabled,
.action-btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  filter: grayscale(0.5);
}

/* Search container */
.search-container {
  max-width: 600px;
}

/* Content */
.page-content {
  flex: 1;
  padding: 0 0 3rem;
}

.employee-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

/* States */
.loading-state,
.error-state,
.empty-state {
  text-align: center;
  padding: 4rem 0;
  color: var(--cinema-text-muted);
  max-width: 500px;
  margin: 0 auto;
}

.loader,
.error-icon,
.empty-icon {
  font-size: 3rem;
  color: var(--cinema-primary);
  margin-bottom: 1.5rem;
  opacity: 0.8;
}

.error-icon {
  color: #ef4444;
}
.empty-icon {
  opacity: 0.5;
}

h3 {
  color: var(--cinema-text);
  margin-bottom: 1rem;
}

/* Responsive */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
