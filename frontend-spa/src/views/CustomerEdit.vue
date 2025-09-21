<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'
import { useCustomers } from '@/composables/useCustomers'
import { useAuth } from '@/composables/useAuth'
import CustomerForm from '@/components/CustomerForm.vue'
import authService from '@/services/auth.service'

const router = useRouter()
const route = useRoute()
const customerId = computed(() => route.params.id)

const { currentUser, canManageCustomers, isCustomer } = useAuth()
const { updateCustomer } = useCustomers()

const {
  data: customerData,
  isLoading,
  isError,
} = useQuery({
  queryKey: ['customers', { id: customerId.value }],
  queryFn: () => authService.getCustomerById(customerId.value),
  enabled: !!customerId.value,
})

const isEditing = ref(false)

// Check permissions
const canEdit = computed(() => {
  if (canManageCustomers.value) return true
  if (isCustomer.value && customerData.value?.customer) {
    return customerData.value.customer.account_id === currentUser.value?.id
  }
  return false
})

// Redirect if not authorized
onMounted(() => {
  if (!canEdit.value && !isLoading.value) {
    router.push('/403')
  }
})

// Form initial values
const initialValues = computed(() => {
  if (!customerData.value?.customer) return {}

  const customer = customerData.value.customer
  return {
    full_name: customer.full_name || '',
    phone_number: customer.phone_number || '',
    address: customer.address || '',
    date_of_birth: customer.date_of_birth ? customer.date_of_birth.slice(0, 10) : '',
    gender: customer.gender || '',
    email: customer.email || '',
    loyalty_points: customer.loyalty_points || '',
  }
})

async function handleUpdateCustomer(values) {
  try {
    updateCustomer.mutate({
      id: parseInt(customerId.value),
      data: values,
    })

    isEditing.value = false
    alert('Cập nhật thông tin khách hàng thành công!')
  } catch (error) {
    console.error('Update customer error:', error)
    alert('Có lỗi xảy ra khi cập nhật thông tin!')
  }
}

function goBack() {
  router.push({ name: 'customer.list' })
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
</script>

<template>
  <div class="customer-detail-page">
    <!-- Page header -->
    <div class="page-header">
      <div class="container">
        <div class="header-content">
          <div class="header-title">
            <h1><i class="fas fa-user"></i> Chi Tiết Khách Hàng</h1>
            <p>Xem và cập nhật thông tin khách hàng</p>
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
          <p>Đang tải thông tin khách hàng...</p>
        </div>

        <!-- Error state -->
        <div v-else-if="isError" class="error-state">
          <div class="error-icon">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <h3>Đã xảy ra lỗi!</h3>
          <p>Không thể tải thông tin khách hàng. Vui lòng thử lại.</p>
          <button class="btn-cinema" @click="goBack">
            <i class="fas fa-arrow-left"></i>
            Quay lại
          </button>
        </div>

        <!-- Customer Info -->
        <div v-else-if="customerData?.customer" class="detail-card">
          <!-- Edit Form -->
          <CustomerForm
            v-if="isEditing && canEdit"
            :initial-values="initialValues"
            :is-loading="updateCustomer.isLoading"
            :allow-phone-edit="true"
            @submit="handleUpdateCustomer"
            @cancel="isEditing = false"
          />

          <!-- View Mode -->
          <div v-else class="customer-view">
            <!-- Customer header -->
            <div class="customer-header">
              <div class="customer-avatar badge-customer">
                {{ getInitials(customerData.customer.full_name) }}
              </div>
              <div class="customer-title">
                <h2>{{ customerData.customer.full_name }}</h2>
                <span class="customer-badge badge-customer">Khách hàng</span>
              </div>
            </div>

            <!-- Customer details -->
            <div class="detail-section">
              <h3 class="section-title">Thông tin cá nhân</h3>

              <div class="detail-grid">
                <div class="detail-item">
                  <div class="detail-label">
                    <i class="fas fa-phone"></i>
                    <span>Số điện thoại</span>
                  </div>
                  <div class="detail-value">
                    {{ customerData.customer.phone_number || 'Chưa cập nhật' }}
                  </div>
                </div>

                <div class="detail-item">
                  <div class="detail-label">
                    <i class="fas fa-envelope"></i>
                    <span>Email</span>
                  </div>
                  <div class="detail-value">
                    {{ customerData.customer.email || 'Chưa cập nhật' }}
                  </div>
                </div>

                <div class="detail-item">
                  <div class="detail-label">
                    <i class="fas fa-venus-mars"></i>
                    <span>Giới tính</span>
                  </div>
                  <div class="detail-value">{{ formatGender(customerData.customer.gender) }}</div>
                </div>

                <div class="detail-item">
                  <div class="detail-label">
                    <i class="fas fa-birthday-cake"></i>
                    <span>Ngày sinh</span>
                  </div>
                  <div class="detail-value">
                    {{
                      customerData.customer.date_of_birth
                        ? new Date(customerData.customer.date_of_birth).toLocaleDateString('vi-VN')
                        : 'Chưa cập nhật'
                    }}
                  </div>
                </div>

                <div class="detail-item">
                  <div class="detail-label">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>Địa chỉ</span>
                  </div>
                  <div class="detail-value">
                    {{ customerData.customer.address || 'Chưa cập nhật' }}
                  </div>
                </div>

                <div class="detail-item">
                  <div class="detail-label">
                    <i class="fas fa-star"></i>
                    <span>Điểm thưởng</span>
                  </div>
                  <div class="detail-value loyalty-points">
                    {{ customerData.customer.loyalty_points || 0 }} điểm
                  </div>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="detail-actions">
              <button v-if="canEdit" class="btn-edit" @click="isEditing = true">
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
.customer-detail-page {
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

/* Customer view */
.customer-view {
  padding: 2rem;
}

/* Customer header */
.customer-header {
  display: flex;
  align-items: center;
  margin-bottom: 2rem;
}

.customer-avatar {
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
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: #fff;
}

.customer-title {
  flex: 1;
}

.customer-title h2 {
  color: var(--cinema-text);
  margin-bottom: 0.5rem;
  font-size: 1.5rem;
}

.customer-badge {
  font-size: 0.8rem;
  padding: 0.25rem 0.75rem;
  border-radius: 50px;
  font-weight: 600;
  display: inline-block;
}

.badge-customer {
  background-color: rgba(52, 152, 219, 0.1);
  color: #3498db;
  border: 1px solid rgba(52, 152, 219, 0.3);
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

.loyalty-points {
  color: var(--cinema-primary);
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

  .customer-header {
    flex-direction: column;
    text-align: center;
  }

  .customer-avatar {
    margin-right: 0;
    margin-bottom: 1rem;
  }
}
</style>
