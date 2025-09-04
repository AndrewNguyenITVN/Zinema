<template>
  <div class="booking-page-container">
    <h1>Đặt vé xem phim: {{ movie?.title }}</h1>
    <div class="booking-steps">
      <!-- Step 0: Customer Info (for Staff/Admin) -->
      <div v-if="isStaffOrAdmin" class="step">
        <h2>Thông tin khách hàng</h2>

        <!-- Phone Input and Search -->
        <div v-if="!selectedCustomer" class="customer-search">
          <div class="customer-phone-input">
            <label for="customer-phone">Số điện thoại khách hàng:</label>
            <div class="phone-input-group">
              <input
                type="tel"
                id="customer-phone"
                v-model="customerPhone"
                placeholder="Nhập SĐT để tìm khách hàng"
                @keyup.enter="handleCheckCustomer"
              />
              <button
                type="button"
                @click="handleCheckCustomer"
                :disabled="isCheckingCustomer || !customerPhone.trim()"
                class="check-btn"
              >
                <i v-if="!isCheckingCustomer" class="fas fa-search"></i>
                <i v-else class="fas fa-spinner fa-spin"></i>
                {{ isCheckingCustomer ? 'Đang tìm...' : 'Kiểm tra' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Customer Found -->
        <div v-if="selectedCustomer" class="customer-found">
          <div class="customer-info">
            <h3>
              <i class="fas fa-user-check"></i>
              Thông tin khách hàng
            </h3>
            <div class="customer-details">
              <p><strong>Tên:</strong> {{ selectedCustomer.full_name }}</p>
              <p><strong>SĐT:</strong> {{ selectedCustomer.phone_number }}</p>
              <p v-if="selectedCustomer.address">
                <strong>Địa chỉ:</strong> {{ selectedCustomer.address }}
              </p>
            </div>
            <button type="button" @click="resetCustomerSelection" class="change-customer-btn">
              <i class="fas fa-edit"></i>
              Thay đổi khách hàng
            </button>
          </div>
        </div>

        <!-- Customer Not Found - Show Form -->
        <CustomerForm
          v-if="showCustomerForm"
          :phone-number="customerPhone"
          @submit="handleCreateCustomer"
          @cancel="handleCancelCreateCustomer"
        />
      </div>

      <!-- Step 1: Chọn Lịch chiếu -->
      <div class="step">
        <h2>1. Chọn lịch chiếu</h2>
        <ShowtimeSelector :movie-id="movieId" @showtime-selected="handleShowtimeSelected" />
      </div>

      <!-- Step 2: Chọn ghế -->
      <div v-if="selectedShowtime" class="step">
        <h2>2. Chọn ghế</h2>
        <SeatPicker :showtime-id="selectedShowtime.id" @seats-selected="handleSeatsSelected" />
      </div>

      <!-- Step 3: Chọn đồ ăn -->
      <div v-if="selectedSeats.length > 0" class="step">
        <h2>3. Chọn đồ ăn (Tùy chọn)</h2>
        <FoodPicker @food-selection-changed="handleFoodSelected" />
      </div>

      <!-- Step 4: Tóm tắt và Thanh toán -->
      <div v-if="selectedSeats.length > 0" class="step">
        <h2>4. Tóm tắt và Thanh toán</h2>
        <BookingSummary
          :details="bookingDetails"
          :movie-title="movie?.title"
          :loading="isBooking"
          @confirm-booking="handleConfirmBooking"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import ShowtimeSelector from '@/components/ShowtimeSelector.vue'
import SeatPicker from '@/components/SeatPicker.vue'
import FoodPicker from '@/components/FoodPicker.vue'
import BookingSummary from '@/components/BookingSummary.vue'
import CustomerForm from '@/components/CustomerForm.vue'
import bookingService from '@/services/booking.service'
import { useMovieById } from '@/composables/useMovies'
import { useAuth } from '@/composables/useAuth'

const props = defineProps({
  id: {
    type: [String, Number],
    required: true,
  },
})

const { isAdmin, isEmployee, currentUser } = useAuth()
const isStaffOrAdmin = computed(() => isAdmin.value || isEmployee.value)
const router = useRouter()
const movieId = computed(() => props.id)
const { data: movie } = useMovieById(movieId)

const selectedShowtime = ref(null)
const selectedSeats = ref([])
const selectedFood = ref([])
const isBooking = ref(false)
const customerPhone = ref('')
const selectedCustomer = ref(null)
const isCheckingCustomer = ref(false)
const showCustomerForm = ref(false)
const lockedSeatIds = ref([]) // Track locked seats

// --- SEAT LOCKING ---
let lockTimeout = null

async function updateSeatLock() {
  clearTimeout(lockTimeout)
  const newSeatIds = selectedSeats.value.map((s) => s.id)

  // Determine seats to unlock
  const seatsToUnlock = lockedSeatIds.value.filter((id) => !newSeatIds.includes(id))
  if (seatsToUnlock.length > 0 && selectedShowtime.value) {
    try {
      await bookingService.unlockSeats(selectedShowtime.value.id, seatsToUnlock)
    } catch (error) {
      console.warn('Could not unlock seats:', error.message)
    }
  }

  // Lock new seats if there are any
  if (newSeatIds.length > 0 && selectedShowtime.value) {
    try {
      const response = await bookingService.lockSeats(selectedShowtime.value.id, newSeatIds)
      lockedSeatIds.value = newSeatIds
      console.log('Seats locked until:', response.locked_until)
      // Set a timeout to warn the user before the lock expires
      const lockTime = new Date(response.locked_until).getTime() - Date.now() - 30000 // 30s warning
      if (lockTime > 0) {
        lockTimeout = setTimeout(() => {
          alert('Ghế bạn chọn sắp hết hạn giữ. Vui lòng hoàn tất đặt vé.')
        }, lockTime)
      }
    } catch (error) {
      alert(`Lỗi khi giữ ghế: ${error.message}. Vui lòng thử chọn lại.`)
      // Deselect seats on the frontend if locking fails
      selectedSeats.value = selectedSeats.value.filter((s) => !newSeatIds.includes(s.id))
    }
  } else {
    lockedSeatIds.value = []
  }
}

// Watch for changes in seat selection
watch(selectedSeats, updateSeatLock, { deep: true })

// Watch for showtime changes to unlock previous seats
watch(selectedShowtime, async (newShowtime, oldShowtime) => {
  clearTimeout(lockTimeout)
  if (oldShowtime && lockedSeatIds.value.length > 0) {
    try {
      await bookingService.unlockSeats(oldShowtime.id, lockedSeatIds.value)
      console.log('Unlocked seats from previous showtime')
    } catch (error) {
      console.warn('Could not unlock old seats:', error)
    } finally {
      lockedSeatIds.value = []
    }
  }
})

// Unlock seats when user leaves the page
onBeforeUnmount(async () => {
  clearTimeout(lockTimeout)
  if (lockedSeatIds.value.length > 0 && selectedShowtime.value) {
    try {
      await bookingService.unlockSeats(selectedShowtime.value.id, lockedSeatIds.value)
    } catch (error) {
      // Non-critical error, just log it
      console.log('Could not unlock seats before leaving page:', error.message)
    }
  }
})
// --- END SEAT LOCKING ---

function handleShowtimeSelected(showtime) {
  selectedShowtime.value = showtime
  selectedSeats.value = [] // Reset ghế khi đổi lịch chiếu
  selectedFood.value = []
}

function handleSeatsSelected(seats) {
  selectedSeats.value = seats
}

function handleFoodSelected(food) {
  selectedFood.value = food
}

const bookingDetails = computed(() => ({
  showtime: selectedShowtime.value,
  seats: selectedSeats.value,
  food: selectedFood.value,
}))

// Customer handling functions
async function handleCheckCustomer() {
  if (!customerPhone.value.trim()) {
    alert('Vui lòng nhập số điện thoại')
    return
  }

  isCheckingCustomer.value = true
  selectedCustomer.value = null
  showCustomerForm.value = false

  try {
    const response = await bookingService.checkCustomerByPhone(customerPhone.value.trim())

    if (response.exists) {
      selectedCustomer.value = response.customer
      alert(response.message)
    } else {
      // Khách hàng không tồn tại, hiển thị form tạo mới
      showCustomerForm.value = true
      alert(response.message + '. Vui lòng nhập thông tin để tạo khách hàng mới.')
    }
  } catch (error) {
    console.error('Check customer error:', error)
    alert('Lỗi khi kiểm tra khách hàng: ' + error.message)
  } finally {
    isCheckingCustomer.value = false
  }
}

async function handleCreateCustomer(customerData) {
  try {
    const response = await bookingService.createCustomerWithoutAccount(customerData)
    selectedCustomer.value = response.customer
    showCustomerForm.value = false
    alert('Tạo khách hàng mới thành công!')
  } catch (error) {
    console.error('Create customer error:', error)
    alert('Lỗi khi tạo khách hàng: ' + error.message)
  }
}

function handleCancelCreateCustomer() {
  showCustomerForm.value = false
  customerPhone.value = ''
}

function resetCustomerSelection() {
  selectedCustomer.value = null
  customerPhone.value = ''
  showCustomerForm.value = false
}

async function handleConfirmBooking() {
  if (!selectedShowtime.value || selectedSeats.value.length === 0) {
    alert('Vui lòng chọn suất chiếu và ghế ngồi.')
    return
  }

  if (isStaffOrAdmin.value && !selectedCustomer.value) {
    alert('Vui lòng kiểm tra thông tin khách hàng trước khi đặt vé.')
    return
  }

  // Validation cho customer: bắt buộc phải có phone number
  if (!isStaffOrAdmin.value && !currentUser.value?.phone_number) {
    alert('Vui lòng cập nhật số điện thoại trong thông tin cá nhân trước khi đặt vé.')
    router.push('/profile')
    return
  }

  isBooking.value = true
  try {
    const bookingPayload = {
      showtime_id: selectedShowtime.value.id,
      seats: selectedSeats.value.map((s) => s.id),
      food_items: selectedFood.value.map((f) => ({ food_id: f.food_id, quantity: f.quantity })),
    }

    if (isStaffOrAdmin.value && selectedCustomer.value) {
      bookingPayload.customer_phone = selectedCustomer.value.phone_number
    }

    // Create booking - backend will now verify the lock
    const createdBookingResponse = await bookingService.createBooking(bookingPayload)

    // The backend now returns the created booking directly, no more .data nesting from old code
    const bookingData = createdBookingResponse
    const bookingId = bookingData.id

    if (!bookingId) {
      throw new Error('Không nhận được ID booking sau khi tạo.')
    }

    // Confirm booking
    await bookingService.confirmBooking(bookingId, {
      payment_method: 'cash', // Giả sử thanh toán tiền mặt
    })

    alert('Đặt vé thành công!')
    // No need to manually unlock, createBooking on backend does it
    lockedSeatIds.value = []
    // Chuyển hướng đến trang chi tiết booking hoặc trang cá nhân
    if (isStaffOrAdmin.value) {
      router.push({ name: 'staff.dashboard' })
    } else {
      router.push({ name: 'home' })
    }
  } catch (error) {
    console.error('Lỗi khi đặt vé:', error)
    alert(`Đã có lỗi xảy ra: ${error.message}. Vui lòng thử lại.`)
  } finally {
    isBooking.value = false
  }
}
</script>

<style scoped>
.booking-page-container {
  padding: 2rem 1rem;
  max-width: 900px;
  margin: 2rem auto;
  background-color: #f9fafb;
  border-radius: 12px;
  box-shadow:
    0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

h1 {
  text-align: center;
  margin-bottom: 2rem;
  color: #111827;
  font-size: 2rem;
}

.booking-steps .step {
  background-color: #ffffff;
  border-radius: 8px;
  padding: 2rem;
  margin-bottom: 2.5rem;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  border: 1px solid #e5e7eb;
}

.step h2 {
  font-size: 1.5rem;
  color: #ef4444;
  margin-bottom: 1.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #f3f4f6;
}

.customer-phone-input {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.customer-phone-input label {
  font-weight: 600;
  color: #374151;
}

.phone-input-group {
  display: flex;
  gap: 0.75rem;
  align-items: stretch;
}

.customer-phone-input input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 1rem;
}

.check-btn {
  padding: 0.75rem 1.5rem;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;
}

.check-btn:hover:not(:disabled) {
  background-color: #2563eb;
  transform: translateY(-1px);
}

.check-btn:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
  transform: none;
}

.customer-found {
  margin-top: 1rem;
  padding: 1.5rem;
  background-color: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 8px;
}

.customer-info h3 {
  color: #0369a1;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.customer-details {
  margin-bottom: 1rem;
}

.customer-details p {
  margin: 0.5rem 0;
  color: #374151;
}

.change-customer-btn {
  padding: 0.5rem 1rem;
  background-color: #f59e0b;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.change-customer-btn:hover {
  background-color: #d97706;
}
</style>
