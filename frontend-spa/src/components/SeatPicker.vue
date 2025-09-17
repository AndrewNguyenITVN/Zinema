<template>
  <div class="seat-picker">
    <div v-if="loading" class="loading">Đang tải sơ đồ ghế...</div>
    <div v-if="error" class="error">{{ error }}</div>

    <div v-if="!loading && !error && seatData" class="seat-map-container">
      <div class="screen">MÀN HÌNH</div>
      <div class="seat-grid" :style="gridStyle">
        <div
          v-for="seat in seatData.seats"
          :key="seat.id"
          :class="['seat', seat.status, seat.type, { selected: isSelected(seat) }]"
          @click="toggleSeat(seat)"
        >
          {{ seat.name }}
        </div>
      </div>

      <div class="legend">
        <div class="legend-section">
          <strong class="legend-title">Loại Ghế</strong>
          <div class="legend-item">
            <div class="seat standard available"></div>
            <span>Ghế Thường</span>
          </div>
          <div class="legend-item">
            <div class="seat vip available"></div>
            <span>Ghế VIP</span>
          </div>
        </div>
        <div class="legend-section">
          <strong class="legend-title">Trạng Thái</strong>
          <div class="legend-item">
            <div class="seat selected"></div>
            <span>Đang chọn</span>
          </div>
          <div class="legend-item">
            <div class="seat booked"></div>
            <span>Đã đặt</span>
          </div>
        </div>
      </div>

      <div class="selection-summary">
        <p>
          Đã chọn:
          <span class="selected-count">{{ selectedSeats.length }}</span> ghế
        </p>
        <p>Ghế: {{ selectedSeatNames }}</p>
        <p>Tổng tiền: {{ formatPrice(totalPrice) }}</p>
        <button @click="confirmSelection" :disabled="selectedSeats.length === 0">
          Xác nhận chọn ghế
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, computed, onBeforeUnmount } from 'vue'
import showtimeService from '@/services/showtime.service'

const props = defineProps({
  showtimeId: {
    type: [String, Number],
    required: true,
  },
  showtime: {
    type: Object,
    required: false, // sẽ truyền từ BookingPage
    default: null,
  },
})

const emit = defineEmits(['seats-selected'])

const loading = ref(false)
const error = ref(null)
const seatData = ref(null)
const selectedSeats = ref([])
let pollInterval = null // Polling interval

async function fetchSeatMap() {
  if (!props.showtimeId) return
  // Chỉ hiển thị loading lần đầu
  if (!seatData.value) {
    loading.value = true
  }
  error.value = null

  try {
    const data = await showtimeService.getSeatsForShowtime(props.showtimeId)
    seatData.value = data

    // Loại bỏ các ghế đã chọn nhưng giờ đã bị khóa hoặc đặt
    const currentSelectedIds = selectedSeats.value.map(s => s.id)
    const validSelectedSeats = []
    currentSelectedIds.forEach(id => {
      const seatFromServer = data.seats.find(s => s.id === id)
      // Giữ lại ghế nếu nó vẫn available và đang được chính mình chọn
      if (seatFromServer && seatFromServer.status === 'available' && isSelected({ id })) {
        validSelectedSeats.push(seatFromServer)
      }
    })
    selectedSeats.value = validSelectedSeats

  } catch (err) {
    error.value = 'Không thể tải sơ đồ ghế. Vui lòng thử lại.'
    console.error(err)
    stopPolling() // Dừng lại nếu có lỗi
  } finally {
    loading.value = false
  }
}

// --- Polling Logic ---
function startPolling() {
  stopPolling() // Đảm bảo không có interval nào đang chạy
  if (props.showtimeId) {
    pollInterval = setInterval(fetchSeatMap, 5000) // Lấy dữ liệu mỗi 5 giây
  }
}

function stopPolling() {
  if (pollInterval) {
    clearInterval(pollInterval)
    pollInterval = null
  }
}

// Fetch khi component được mount hoặc khi showtimeId thay đổi
onMounted(() => {
  fetchSeatMap()
  startPolling()
})

onBeforeUnmount(() => {
  stopPolling()
})

watch(() => props.showtimeId, () => {
  selectedSeats.value = [] // Reset khi đổi suất chiếu
  fetchSeatMap()
  startPolling() // Khởi động lại polling cho showtime mới
})
// --- End Polling Logic ---

const gridStyle = computed(() => {
  if (!seatData.value?.room) return {}
  return {
    gridTemplateColumns: `repeat(${seatData.value.room.columns}, 1fr)`,
  }
})

function toggleSeat(seat) {
  if (seat.status === 'booked' || seat.status === 'locked') return

  const index = selectedSeats.value.findIndex((s) => s.id === seat.id)
  if (index > -1) {
    selectedSeats.value.splice(index, 1)
  } else {
    if (selectedSeats.value.length < 7) {
      selectedSeats.value.push(seat)
    } else {
      alert('Bạn chỉ có thể chọn tối đa 7 ghế.')
    }
  }
}

const isSelected = (seat) => selectedSeats.value.some((s) => s.id === seat.id)

const selectedSeatNames = computed(() => selectedSeats.value.map((s) => s.name).join(', '))

const totalPrice = computed(() => {
  let basePrice = null
  if (props.showtime && props.showtime.price !== undefined && props.showtime.price !== null) {
    basePrice = Number(props.showtime.price)
  }
  if (
    (basePrice === null || isNaN(basePrice)) &&
    seatData.value &&
    seatData.value.showtimePrice !== undefined
  ) {
    basePrice = Number(seatData.value.showtimePrice)
  }
  if (basePrice !== null && !isNaN(basePrice)) {
    return selectedSeats.value.reduce((total, seat) => {
      const seatSurcharge = Number(seat.surcharge) || 0
      return total + basePrice + seatSurcharge
    }, 0)
  }
  // Fallback: chỉ cộng surcharge
  return selectedSeats.value.reduce((total, seat) => {
    const seatPrice = Number(seat.surcharge) || 0
    return total + seatPrice
  }, 0)
})

function confirmSelection() {
  emit('seats-selected', selectedSeats.value)
}

const formatPrice = (price) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)
</script>

<style scoped>
.seat-picker {
  padding: 1rem 0;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}
.screen {
  background-color: #333;
  color: white;
  padding: 0.75rem;
  text-align: center;
  margin: 0 auto 2.5rem auto;
  border-radius: 4px;
  font-weight: bold;
  letter-spacing: 0.2em;
  max-width: 50%;
  box-shadow: 0 5px 10px rgba(0, 0, 0, 0.2);
}
.seat-grid {
  display: grid;
  gap: 8px 12px;
  justify-content: center;
  margin-bottom: 2.5rem;
}
.seat {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 500;
  color: #4b5563;
  transition:
    all 0.2s ease-in-out,
    transform 0.1s;
}
.seat:not(.booked):hover {
  transform: scale(1.1);
  box-shadow: 0 0 15px rgba(239, 68, 68, 0.5);
}

/* Base Available Styles */
.seat.standard.available {
  background-color: #f3f4f6;
  border: 1px solid #d1d5db;
}
.seat.vip.available {
  background-color: #fef9c3;
  border: 1px solid #facc15;
}

/* Status Override Styles */
.seat.booked,
.seat.locked {
  background-color: #6b7280;
  color: #d1d5db;
  cursor: not-allowed;
}
.seat.selected {
  background-color: #ef4444;
  color: white;
  border: 1px solid #dc2626;
  font-weight: bold;
}

/* VIP Star Icon */
.seat.vip {
  position: relative;
}
.seat.vip::after {
  content: '★';
  position: absolute;
  top: 1px;
  right: 3px;
  font-size: 0.8rem;
  color: #f59e0b;
}
.seat.selected.vip::after,
.seat.booked.vip::after {
  color: rgba(255, 255, 255, 0.7);
}

/* Legend Styling */
.legend {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 2.5rem;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background-color: #f9fafb;
  border-radius: 8px;
  border: 1px solid #f3f4f6;
}
.legend-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
}
.legend-title {
  font-weight: bold;
  font-size: 1rem;
  color: #374151;
  margin-bottom: 0.5rem;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.9rem;
}
.legend-item .seat {
  width: 28px;
  height: 28px;
  cursor: default;
}
.legend-item .seat:hover {
  transform: none;
  box-shadow: none;
}

/* Summary Styling */
.selection-summary {
  margin-top: 2rem;
  padding: 1.5rem 2rem;
  background: #fef2f2;
  border-top: 3px solid #ef4444;
  color: #374151;
  border-radius: 8px;
  text-align: center;
}
.selection-summary p {
  margin: 0.5rem 0;
  font-size: 1.1rem;
}
.selection-summary .selected-count {
  font-weight: bold;
  color: #ef4444;
  font-size: 1.2rem;
}
.selection-summary button {
  margin-top: 1rem;
  padding: 0.8rem 2rem;
  background-color: #ef4444;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition:
    background-color 0.2s,
    transform 0.1s;
}
.selection-summary button:hover:not(:disabled) {
  background-color: #dc2626;
  transform: translateY(-2px);
}
.selection-summary button:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
  transform: none;
}

.error,
.loading {
  text-align: center;
  padding: 2rem;
  color: #6b7280;
  font-size: 1.2rem;
}
</style>
