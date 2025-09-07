<script setup>
import { useAuth } from '@/composables/useAuth'
import { onMounted, ref } from 'vue'
import statisticsService from '@/services/statistics.service'

const { isAdmin } = useAuth()
const stats = ref({
  ticketsSoldToday: 0,
})
const isLoading = ref(true)
const error = ref(null)

onMounted(async () => {
  try {
    isLoading.value = true
    error.value = null
    const response = await statisticsService.getDashboardStatistics()
    stats.value.ticketsSoldToday = response.ticketsSoldToday || 0
  } catch (err) {
    error.value = err.message || 'Không thể tải dữ liệu thống kê.'
    console.error(err)
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div class="admin-dashboard">
    <div class="dashboard-header">
      <div class="container">
        <h1 class="dashboard-title">
          <i class="fas fa-tachometer-alt me-2"></i>
          Bảng Điều Khiển
        </h1>
        <p class="dashboard-subtitle">Quản lý rạp chiếu phim</p>
      </div>
    </div>

    <div class="container py-5">
      <!-- Thống kê tổng quan -->
      <div class="stats-row mb-5">
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-ticket-alt"></i>
          </div>
          <div class="stat-content">
            <h3 v-if="!isLoading">{{ stats.ticketsSoldToday }}</h3>
            <p>Vé đã bán hôm nay</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-film"></i>
          </div>
          <div class="stat-content">
            <h3>12</h3>
            <p>Phim đang chiếu</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-users"></i>
          </div>
          <div class="stat-content">
            <h3>256</h3>
            <p>Khách hàng đăng ký</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-dollar-sign"></i>
          </div>
          <div class="stat-content">
            <h3>15.8M</h3>
            <p>Doanh thu tháng</p>
          </div>
        </div>
      </div>

      <h2 class="section-title mb-4">
        <i class="fas fa-th-large me-2"></i>
        Quản Lý Nhanh
      </h2>

      <!-- Danh sách chức năng quản lý -->
      <div class="management-cards">
        <div class="management-card" v-if="isAdmin">
          <div class="card-icon">
            <i class="fas fa-users"></i>
          </div>
          <div class="card-content">
            <h3>Quản lý nhân viên</h3>
            <p>Thêm, xóa, sửa thông tin nhân viên rạp</p>
            <router-link to="/employees" class="dashboard-btn">
              <span>Truy cập</span>
              <i class="fas fa-arrow-right"></i>
            </router-link>
          </div>
        </div>

        <div class="management-card">
          <div class="card-icon">
            <i class="fas fa-user-friends"></i>
          </div>
          <div class="card-content">
            <h3>Quản lý khách hàng</h3>
            <p>Xem và cập nhật thông tin khách hàng</p>
            <router-link to="/customers" class="dashboard-btn">
              <span>Truy cập</span>
              <i class="fas fa-arrow-right"></i>
            </router-link>
          </div>
        </div>

        <div class="management-card">
          <div class="card-icon">
            <i class="fas fa-film"></i>
          </div>
          <div class="card-content">
            <h3>Quản lý phim</h3>
            <p>Thêm, xóa, sửa thông tin phim chiếu</p>
            <router-link to="/admin/movies" class="dashboard-btn">
              <span>Truy cập</span>
              <i class="fas fa-arrow-right"></i>
            </router-link>
          </div>
        </div>

        <div class="management-card">
          <div class="card-icon">
            <i class="fas fa-couch"></i>
          </div>
          <div class="card-content">
            <h3>Quản lý phòng chiếu</h3>
            <p>Quản lý suất chiếu và sắp xếp phòng</p>
            <button class="dashboard-btn disabled">
              <span>Đang phát triển</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Header phần dashboard */
.dashboard-header {
  background: var(--cinema-gradient-dark);
  padding: 2rem 0;
  margin-bottom: 2rem;
  position: relative;
  border-bottom: 1px solid rgba(247, 197, 72, 0.2);
}

.dashboard-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: url("data:image/svg+xml,%3Csvg width='6' height='6' viewBox='0 0 6 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.05' fill-rule='evenodd'%3E%3Cpath d='M5 0h1L0 5v1H0V0h5z'/%3E%3C/g%3E%3C/svg%3E");
  opacity: 0.3;
}

.dashboard-title {
  color: var(--cinema-primary);
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.dashboard-subtitle {
  color: var(--cinema-text-muted);
  font-size: 1.1rem;
}

/* Thống kê tổng quan */
.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  background: linear-gradient(145deg, rgba(27, 38, 59, 0.8), rgba(13, 27, 42, 0.8));
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: var(--cinema-gradient-gold);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  margin-right: 1.5rem;
  color: var(--cinema-darker);
  flex-shrink: 0;
}

.stat-content h3 {
  font-size: 1.8rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
  color: var(--cinema-text);
}

.stat-content p {
  color: var(--cinema-text-muted);
  margin: 0;
  font-size: 0.9rem;
}

/* Tiêu đề phần */
.section-title {
  color: var(--cinema-primary);
  font-size: 1.5rem;
  margin-bottom: 2rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

/* Card quản lý */
.management-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.management-card {
  background: rgba(4, 4, 4, 0.3);
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.management-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
  border-color: rgba(247, 197, 72, 0.3);
}

.management-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 5px;
  background: var(--cinema-gradient-gold);
  opacity: 0.7;
}

.card-icon {
  width: 50px;
  height: 50px;
  border-radius: 10px;
  background: rgba(247, 197, 72, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  margin-bottom: 1.2rem;
  color: var(--cinema-primary);
}

.card-content h3 {
  color: var(--cinema-text);
  font-size: 1.25rem;
  margin-bottom: 0.75rem;
}

.card-content p {
  color: var(--cinema-text-muted);
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
  min-height: 2.5rem;
}

/* Button truy cập */
.dashboard-btn {
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 1rem;
  background: var(--cinema-gradient-gold);
  color: var(--cinema-darker);
  border: none;
  border-radius: 6px;
  font-weight: 600;
  transition: all 0.3s ease;
  text-decoration: none;
  box-shadow: 0 4px 10px rgba(247, 197, 72, 0.3);
}

.dashboard-btn i {
  margin-left: 0.5rem;
  transition: transform 0.3s ease;
}

.dashboard-btn:hover {
  box-shadow: 0 6px 15px rgba(247, 197, 72, 0.4);
  filter: brightness(1.05);
  color: var(--cinema-darker);
}

.dashboard-btn:hover i {
  transform: translateX(4px);
}

.dashboard-btn.disabled {
  background: rgba(255, 255, 255, 0.1);
  color: var(--cinema-text-muted);
  cursor: not-allowed;
  box-shadow: none;
}

/* Responsive */
@media (max-width: 768px) {
  .stats-row,
  .management-cards {
    grid-template-columns: 1fr;
  }

  .dashboard-header {
    padding: 1.5rem 0;
  }

  .dashboard-title {
    font-size: 2rem;
  }
}
</style>
