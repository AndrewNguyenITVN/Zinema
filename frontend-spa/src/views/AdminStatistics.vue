<script setup>
import { ref } from 'vue';
import RevenueByMovieChart from '@/components/charts/RevenueByMovieChart.vue';
import TopSellingFoodsChart from '@/components/charts/TopSellingFoodsChart.vue';

const revenueChartPeriod = ref('all');
</script>

<template>
  <div class="admin-statistics-page">
    <div class="page-header">
      <div class="container">
        <h1 class="page-title">
          <i class="fas fa-chart-line me-2"></i>
          Thống kê & Báo cáo
        </h1>
        <p class="page-subtitle">Phân tích dữ liệu kinh doanh của rạp chiếu phim</p>
      </div>
    </div>

    <div class="container py-5">
      <div class="charts-grid">
        <div class="chart-card">
          <div class="chart-card-header">
            <h5>Doanh thu theo phim</h5>
            <div class="btn-group btn-group-sm">
              <button type="button" class="btn" :class="revenueChartPeriod === 'all' ? 'btn-primary' : 'btn-outline-primary'" @click="revenueChartPeriod = 'all'">Tất cả</button>
              <button type="button" class="btn" :class="revenueChartPeriod === 'month' ? 'btn-primary' : 'btn-outline-primary'" @click="revenueChartPeriod = 'month'">Tháng này</button>
              <button type="button" class="btn" :class="revenueChartPeriod === 'week' ? 'btn-primary' : 'btn-outline-primary'" @click="revenueChartPeriod = 'week'">Tuần này</button>
            </div>
          </div>
          <div class="chart-card-body">
            <RevenueByMovieChart :period="revenueChartPeriod" />
          </div>
        </div>
        <div class="chart-card">
          <div class="chart-card-header">
            <h5>Top 5 món ăn bán chạy</h5>
          </div>
          <div class="chart-card-body">
            <TopSellingFoodsChart :limit="5" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-header {
  background: var(--cinema-gradient-dark);
  padding: 2rem 0;
  margin-bottom: 2rem;
  border-bottom: 1px solid rgba(247, 197, 72, 0.2);
}

.page-title {
  color: var(--cinema-primary);
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.page-subtitle {
  color: var(--cinema-text-muted);
  font-size: 1.1rem;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
}

.chart-card {
  background: rgba(4, 4, 4, 0.3);
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.chart-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.chart-card-header h5 {
  margin: 0;
  color: var(--cinema-primary);
  font-size: 1.1rem;
}

@media (max-width: 992px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }
}
</style>
