<template>
  <div class="food-list-page">
    <div class="page-header">
      <div class="container">
        <div class="header-content">
          <div class="header-title">
            <h1 class="page-title">
              <i class="fas fa-utensils me-2"></i>
              Quản lý đồ ăn
            </h1>
            <p class="page-subtitle">Thêm, sửa, xóa thông tin đồ ăn</p>
          </div>
          <div class="header-actions">
            <button class="action-btn" @click="resetFilters">
              <i class="fas fa-sync-alt"></i>
              <span>Làm mới</span>
            </button>
            <router-link to="/admin/foods/add" class="action-btn-primary">
              <i class="fas fa-plus"></i>
              <span>Thêm món mới</span>
            </router-link>
          </div>
        </div>

        <div class="search-filters-bar">
          <div class="search-box">
            <input
              type="text"
              v-model="searchName"
              placeholder="Tìm theo tên món ăn..."
              @input="debounceSearch"
            />
            <i class="fas fa-search"></i>
          </div>

          <div class="filter-group">
            <select v-model="filters.is_available" @change="applyFilters">
              <option :value="null">Tất cả trạng thái</option>
              <option :value="true">Đang bán</option>
              <option :value="false">Ngừng bán</option>
            </select>
            <input
              type="text"
              v-model="filters.category"
              placeholder="Lọc theo danh mục..."
              @input="debounceSearch"
            />
          </div>
        </div>
      </div>
    </div>

    <div class="container py-4">
      <div v-if="isLoading" class="loading-container">
        <div class="spinner"></div>
        <p>Đang tải dữ liệu...</p>
      </div>
      <div v-else-if="error" class="error-container">
        <i class="fas fa-exclamation-circle"></i>
        <p>{{ error.message || 'Đã có lỗi xảy ra.' }}</p>
        <button @click="refetch" class="btn-retry">Thử lại</button>
      </div>
      <div v-else-if="foods.length === 0" class="empty-container">
        <i class="fas fa-utensils"></i>
        <p>Không có món ăn nào</p>
        <router-link to="/admin/foods/add" class="btn-add"> Thêm món ăn mới </router-link>
      </div>
      <div v-else class="table-container">
        <table class="food-table">
          <thead>
            <tr>
              <th>Hình ảnh</th>
              <th>Tên món ăn</th>
              <th>Danh mục</th>
              <th>Giá</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="food in foods" :key="food.id">
              <td>
                <img :src="food.image_url" :alt="food.name" class="food-image" />
              </td>
              <td>{{ food.name }}</td>
              <td>{{ food.category }}</td>
              <td>{{ formatCurrency(food.price) }}</td>
              <td>
                <span :class="['status-badge', food.is_available ? 'status-active' : 'status-inactive']">
                  {{ food.is_available ? 'Đang bán' : 'Ngừng bán' }}
                </span>
              </td>
              <td>
                <div class="action-buttons">
                  <router-link :to="`/admin/foods/${food.id}/edit`" class="btn-edit">
                    <i class="fas fa-edit"></i>
                  </router-link>
                  <button @click="confirmDelete(food.id)" class="btn-delete">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <main-pagination
        v-if="foods.length > 0"
        :current-page="metadata.page"
        :total-pages="totalPages"
        @update:current-page="changePage"
      />
    </div>

    <div v-if="showDeleteModal" class="modal-overlay" @click="showDeleteModal = false">
      <div class="modal-content" @click.stop>
        <h3 class="modal-title">Xác nhận xóa món ăn</h3>
        <p class="modal-text">
          Bạn có chắc chắn muốn xóa món ăn này không? Hành động này không thể hoàn tác.
        </p>
        <div class="modal-actions">
          <button class="btn-cancel" @click="showDeleteModal = false">Hủy</button>
          <button class="btn-confirm" @click="handleDelete" :disabled="isDeletingFood">
            <i v-if="!isDeletingFood" class="fas fa-trash"></i>
            <span v-if="isDeletingFood" class="spinner-sm"></span>
            Xóa
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useFoods, useFoodsList } from '@/composables/useFoods'
import MainPagination from '@/components/MainPagination.vue'
import { formatCurrency } from '@/utils/formatters' // Assuming you have this utility

const {
  filters,
  changePage,
  applyFilters: applyFoodFilters,
  resetFilters: resetFoodFilters,
  deleteFood,
  isDeletingFood,
} = useFoods()

const { data: foodsResponse, isLoading, error, refetch } = useFoodsList(filters)

const foods = computed(() => foodsResponse.value?.foods || [])
const metadata = computed(() => foodsResponse.value?.metadata || {})
const totalPages = computed(() => metadata.value.lastPage || 1)

const searchName = ref('')
const searchTimeout = ref(null)

const showDeleteModal = ref(false)
const foodToDelete = ref(null)

function debounceSearch() {
  clearTimeout(searchTimeout.value)
  searchTimeout.value = setTimeout(() => {
    applyFilters()
  }, 300)
}

function applyFilters() {
  applyFoodFilters({
    name: searchName.value,
    category: filters.category,
    is_available: filters.is_available,
  })
}

function resetFilters() {
  searchName.value = ''
  resetFoodFilters()
}

function confirmDelete(id) {
  foodToDelete.value = id
  showDeleteModal.value = true
}

async function handleDelete() {
  if (!foodToDelete.value) return

  try {
    await deleteFood.mutateAsync(foodToDelete.value)
    showDeleteModal.value = false
    foodToDelete.value = null
  } catch (err) {
    console.error('Lỗi khi xóa món ăn:', err)
    // Optionally, show an error toast to the user
  }
}
</script>

<style scoped>
/* Using similar styles to AdminMovieList but adapted for a table view */
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
  margin-bottom: 1.5rem;
}

.page-title {
  color: var(--cinema-primary);
  font-size: 2.2rem;
  margin-bottom: 0.5rem;
}

.page-subtitle {
  color: var(--cinema-text-muted);
  font-size: 1.1rem;
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
  text-decoration: none;
}

.action-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: var(--cinema-text);
}

.action-btn-primary {
  background: var(--cinema-gradient-gold);
  border: 1px solid rgba(247, 197, 72, 0.5);
  color: var(--cinema-darker);
}

.search-filters-bar {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: rgba(0, 0, 0, 0.2);
  padding: 1rem;
  border-radius: 8px;
}

.search-box, .filter-group {
  display: flex;
  gap: 1rem;
}

.search-box input, .filter-group input, .filter-group select {
  width: 100%;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(15, 23, 42, 0.6);
  color: var(--cinema-text);
  font-size: 0.9rem;
}

.search-box {
  position: relative;
  min-width: 300px;
}
.search-box i {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--cinema-text-muted);
}
.search-box input {
    padding-left: 2.5rem;
}


/* Table Styles */
.table-container {
  background-color: var(--cinema-darker);
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.food-table {
  width: 100%;
  border-collapse: collapse;
}

.food-table th,
.food-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.food-table th {
  background-color: rgba(0, 0, 0, 0.2);
  color: var(--cinema-primary);
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.8rem;
}

.food-image {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 8px;
}

.status-badge {
  padding: 0.25rem 0.6rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
  text-transform: capitalize;
}

.status-active {
  background-color: rgba(16, 185, 129, 0.2);
  color: #10b981;
}

.status-inactive {
  background-color: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.action-buttons {
  display: flex;
  gap: 0.75rem;
}

.btn-edit, .btn-delete {
  padding: 0.5rem;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-edit {
  background-color: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
}

.btn-delete {
  background-color: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

/* Loading, Error, Empty states */
.loading-container, .error-container, .empty-container {
  text-align: center;
  padding: 4rem 0;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(247, 197, 72, 0.1);
  border-left-color: var(--cinema-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-container i, .empty-container i {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: var(--cinema-text-muted);
}
.error-container { color: #ef4444; }
.error-container i { color: #ef4444; }


/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: var(--cinema-darker);
  border-radius: 12px;
  padding: 2rem;
  width: 90%;
  max-width: 500px;
}
.modal-title {
    font-size: 1.5rem;
    margin-bottom: 1rem;
}
.modal-text {
    margin-bottom: 1.5rem;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.btn-cancel {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
}

.btn-confirm {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.spinner-sm {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255,255,255,0.3);
    border-left-color: #fff;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    display: inline-block;
}
</style>

