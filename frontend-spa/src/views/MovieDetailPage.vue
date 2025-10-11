<template>
  <div class="movie-detail-page">
    <!-- Header -->
    <div class="page-header">
      <div class="container">
        <h1 class="page-title">
          <i class="fas fa-film me-2"></i>
          {{ isEditing ? 'Chỉnh sửa phim' : 'Chi tiết phim' }}
        </h1>
      </div>
    </div>

    <div class="container py-4">
      <!-- Loading state -->
      <div v-if="isLoading && !currentMovie" class="loading-container">
        <div class="spinner"></div>
        <p>Đang tải dữ liệu...</p>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="error-container">
        <i class="fas fa-exclamation-circle"></i>
        <p>{{ error }}</p>
        <button @click="refetch" class="btn-retry">Thử lại</button>
      </div>

      <!-- Movie detail -->
      <div v-else-if="currentMovie" class="movie-content-card">
        <div class="movie-detail-grid">
          <!-- Poster -->
          <div class="poster-section">
            <div class="poster-container">
              <img
                :src="posterUrl"
                :alt="currentMovie?.title"
                class="movie-poster"
                @error="handleImageError"
              />

              <!-- Chỉ hiển thị overlay upload cho Admin khi đang edit -->
              <div v-if="isEditing && canEditMovie" class="poster-overlay">
                <label for="poster-upload" class="btn-upload">
                  <i class="fas fa-camera"></i>
                  Thay đổi poster
                </label>
                <input
                  type="file"
                  id="poster-upload"
                  accept="image/*"
                  @change="handlePosterChange"
                  class="hidden-input"
                />
              </div>
            </div>

            <div class="movie-status" :class="statusClass">
              {{ statusText }}
            </div>

            <!-- Preview poster mới chỉ hiển thị khi đang edit -->
            <div v-if="selectedPoster && isEditing" class="selected-poster-preview">
              <p>Poster đã chọn:</p>
              <div class="preview-container">
                <img :src="selectedPosterPreview" alt="Preview" />
                <button @click="cancelPosterSelection" class="btn-cancel-upload">
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </div>
          </div>

          <!-- Form -->
          <div class="form-section">
            <form @submit.prevent="handleSubmit" class="movie-form">
              <!-- Tiêu đề -->
              <div class="form-group">
                <label for="title">Tiêu đề phim</label>
                <input
                  type="text"
                  id="title"
                  v-model="form.title"
                  :disabled="!isEditing || !canEditMovie"
                  required
                />
              </div>

              <!-- Mô tả -->
              <div class="form-group">
                <label for="description">Mô tả</label>
                <textarea
                  id="description"
                  v-model="form.description"
                  :disabled="!isEditing || !canEditMovie"
                  rows="5"
                  required
                ></textarea>
              </div>

              <!-- Thông tin cơ bản -->
              <div class="form-row">
                <div class="form-group">
                  <label for="duration">Thời lượng (phút)</label>
                  <input
                    type="number"
                    id="duration"
                    v-model.number="form.duration"
                    :disabled="!isEditing || !canEditMovie"
                    min="1"
                    required
                  />
                </div>

                <div class="form-group">
                  <label for="rating">Phân loại</label>
                  <select
                    id="rating"
                    v-model="form.rating"
                    :disabled="!isEditing || !canEditMovie"
                    required
                  >
                    <option value="G">G (Mọi lứa tuổi)</option>
                    <option value="PG">PG (Có phụ huynh hướng dẫn)</option>
                    <option value="PG-13">PG-13 (Dưới 13 tuổi xem với phụ huynh)</option>
                    <option value="R">R (Hạn chế)</option>
                    <option value="NC-17">NC-17 (Trên 17 tuổi)</option>
                    <option value="T13">T13 (13 tuổi trở lên)</option>
                    <option value="T16">T16 (16 tuổi trở lên)</option>
                    <option value="T18">T18 (18 tuổi trở lên)</option>
                    <option value="C">C (Cấm)</option>
                  </select>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="release_date">Ngày công chiếu</label>
                  <input
                    type="date"
                    id="release_date"
                    v-model="form.release_date"
                    :disabled="!isEditing || !canEditMovie"
                    required
                  />
                </div>

                <div class="form-group">
                  <label for="end_date">Ngày kết thúc (tùy chọn)</label>
                  <input
                    type="date"
                    id="end_date"
                    v-model="form.end_date"
                    :disabled="!isEditing || !canEditMovie"
                  />
                </div>
              </div>

              <!-- Thông tin chi tiết -->
              <div class="form-group">
                <label for="genre">Thể loại</label>
                <input
                  type="text"
                  id="genre"
                  v-model="form.genre"
                  :disabled="!isEditing || !canEditMovie"
                  required
                />
              </div>

              <div class="form-group">
                <label for="director">Đạo diễn</label>
                <input
                  type="text"
                  id="director"
                  v-model="form.director"
                  :disabled="!isEditing || !canEditMovie"
                  required
                />
              </div>

              <div class="form-group">
                <label for="cast">Diễn viên</label>
                <textarea
                  id="cast"
                  v-model="form.cast"
                  :disabled="!isEditing || !canEditMovie"
                  rows="2"
                  required
                ></textarea>
              </div>

              <div class="form-group">
                <label for="country">Quốc gia</label>
                <input
                  type="text"
                  id="country"
                  v-model="form.country"
                  :disabled="!isEditing || !canEditMovie"
                  required
                />
              </div>

              <div class="form-group">
                <label for="trailer_url">URL Trailer (tùy chọn)</label>
                <input
                  type="url"
                  id="trailer_url"
                  v-model="form.trailer_url"
                  :disabled="!isEditing || !canEditMovie"
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </div>

              <!-- Chỉ Admin mới thấy được trạng thái -->
              <div v-if="canEditMovie && isEditing" class="form-group">
                <label for="status">Trạng thái</label>
                <select id="status" v-model="form.status" required>
                  <option value="active">Đang chiếu</option>
                  <option value="inactive">Ngừng chiếu</option>
                </select>
              </div>
            </form>
          </div>
        </div>

        <!-- Bottom actions - Phân quyền theo role -->
        <div class="bottom-actions">
          <!-- Customer: Chỉ thấy button Đặt vé -->
          <button v-if="isCustomer && !isEditing" class="btn-book" @click="handleBookTicket">
            <i class="fas fa-ticket-alt"></i>
            Đặt vé
          </button>

          <!-- Admin: Thấy button Chỉnh sửa khi không đang edit -->
          <button v-if="canEditMovie && !isEditing" class="btn-edit" @click="startEdit">
            <i class="fas fa-edit"></i>
            Chỉnh sửa thông tin
          </button>

          <!-- Admin: Thấy button Save/Cancel khi đang edit -->
          <div v-if="canEditMovie && isEditing" class="editing-actions">
            <button type="button" class="btn-save" :disabled="isSubmitting" @click="handleSubmit">
              <i class="fas fa-save"></i>
              {{ isUpdatingMovie ? 'Đang lưu...' : 'Lưu thay đổi' }}
            </button>

            <button type="button" class="btn-cancel" @click="cancelEdit">Hủy</button>
          </div>

          <!-- Button Quay lại cho tất cả -->
          <button v-if="!isEditing" class="btn-back" @click="goBack">
            <i class="fas fa-arrow-left"></i>
            Quay lại
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import movieService from '@/services/movie.service'
import { useMovieById } from '@/composables/useMovieById'
import { useAuth } from '@/composables/useAuth'
import { STATIC_BASE_URL } from '@/constants'

const route = useRoute()
const router = useRouter()
const movieId = computed(() => route.params.id)
const queryClient = useQueryClient()

// Mutations
const {
  mutateAsync: updateMovie,
  isPending: isUpdatingMovie,
  error: updateMovieError,
} = useMutation({
  mutationFn: ({ id, data }) => movieService.updateMovie(id, data),
  onSuccess: (data) => {
    queryClient.invalidateQueries({ queryKey: ['movies'] })
    if (data && data.movie) {
      queryClient.setQueryData(['movies', data.movie.id], data.movie)
    }
  },
})

// Composables
const { data: currentMovie, isLoading, error, refetch } = useMovieById(movieId)
const { isAdmin, isEmployee, isCustomer } = useAuth()

// Edit state
const isEditing = ref(false)
const selectedPoster = ref(null)
const selectedPosterPreview = ref('')
const imageError = ref(false)
const defaultPoster = `${STATIC_BASE_URL}/public/images/default-movie-poster.png`

// Form data
const form = reactive({
  title: '',
  description: '',
  duration: 0,
  release_date: '',
  end_date: '',
  genre: '',
  director: '',
  cast: '',
  country: '',
  rating: '',
  trailer_url: '',
  status: 'active',
})

// Computed properties
const posterUrl = computed(() => {
  if (imageError.value) {
    return defaultPoster
  }

  if (selectedPosterPreview.value) {
    return selectedPosterPreview.value
  }

  return currentMovie.value?.poster_url || defaultPoster
})

const statusClass = computed(() => {
  return form.status === 'active' ? 'status-active' : 'status-inactive'
})

const statusText = computed(() => {
  return form.status === 'active' ? 'Đang chiếu' : 'Ngừng chiếu'
})

// Permission checks
const canEditMovie = computed(() => {
  return isAdmin.value
})

const isSubmitting = computed(() => {
  return isUpdatingMovie.value
})

// Methods
function handleImageError() {
  imageError.value = true
}

function handlePosterChange(event) {
  const file = event.target.files[0]
  if (!file) return

  // Validate file type
  if (!file.type.match('image.*')) {
    alert('Vui lòng chọn file hình ảnh')
    return
  }

  // Preview
  selectedPoster.value = file
  const reader = new FileReader()
  reader.onload = (e) => {
    selectedPosterPreview.value = e.target.result
  }
  reader.readAsDataURL(file)
}

function cancelPosterSelection() {
  selectedPoster.value = null
  selectedPosterPreview.value = ''
  document.getElementById('poster-upload').value = ''
}

function startEdit() {
  if (!canEditMovie.value) return
  isEditing.value = true
}

function cancelEdit() {
  isEditing.value = false
  selectedPoster.value = null
  selectedPosterPreview.value = ''

  // Reset form to current movie data
  if (currentMovie.value) {
    populateForm(currentMovie.value)
  }
}

function populateForm(movie) {
  form.title = movie.title || ''
  form.description = movie.description || ''
  form.duration = movie.duration_min || 0
  form.release_date = movie.release_date ? movie.release_date.split('T')[0] : ''
  form.end_date = movie.end_date ? movie.end_date.split('T')[0] : ''
  form.genre = movie.genre || ''
  form.director = movie.director || ''
  form.cast = movie.cast || ''
  form.country = movie.country || ''
  form.rating = movie.age_rating || ''
  form.trailer_url = movie.trailer_url || ''
  form.status = movie.status || 'active'
}

async function handleSubmit() {
  if (!canEditMovie.value) return

  try {
    const formData = new FormData()
    Object.keys(form).forEach((key) => {
      if (form[key] !== null && form[key] !== undefined && form[key] !== '') {
        formData.append(key, form[key])
      }
    })

    if (selectedPoster.value) {
      formData.append('posterFile', selectedPoster.value)
    }

    await updateMovie({ id: movieId.value, data: formData })

    isEditing.value = false
    selectedPoster.value = null
    selectedPosterPreview.value = ''
    alert('Cập nhật phim thành công!')

    // Refetch current movie data
    await refetch()
  } catch (err) {
    console.error('Lỗi khi cập nhật phim:', err)
    const errorMessage =
      updateMovieError.value?.message ||
      err.message ||
      'Có lỗi xảy ra khi cập nhật phim. Vui lòng thử lại sau.'
    alert(errorMessage)
  }
}

function handleBookTicket() {
  if (currentMovie.value) {
    router.push({ name: 'BookingPage', params: { id: currentMovie.value.id } })
  }
}

function goBack() {
  // Điều hướng về trang phù hợp với role
  if (isAdmin.value) {
    router.push('/admin/movies')
  } else if (isEmployee.value) {
    router.push('/admin/movies')
  } else {
    router.push('/')
  }
}

// Watch for movie data and populate form
onMounted(() => {
  if (currentMovie.value) {
    populateForm(currentMovie.value)
  }
})

// Also watch for changes to currentMovie (when data is loaded)
watch(currentMovie, (newMovie) => {
  if (newMovie) {
    populateForm(newMovie)
  }
})
</script>

<style scoped>
/* Header */
.page-header {
  background: var(--cinema-gradient-dark);
  padding: 2rem 0;
  margin-bottom: 1rem;
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
}

.header-content {
  display: flex;
  align-items: center;
}

.page-title {
  color: var(--cinema-primary);
  font-size: 2.2rem;
  margin: 0;
  margin-left: 1rem;
}

/* Loading & Error */
.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 0;
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

.error-container {
  color: #ef4444;
}

.error-container i {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.btn-retry {
  margin-top: 1rem;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-retry:hover {
  background: rgba(239, 68, 68, 0.2);
}

/* Movie detail */
.movie-detail-grid {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 2rem;
}

/* Poster section */
.poster-section {
  position: relative;
}

.poster-container {
  width: 100%;
  padding-top: 150%; /* Tỷ lệ 2:3 cho poster phim */
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  margin-bottom: 1rem;
}

.movie-poster {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.poster-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.poster-container:hover .poster-overlay {
  opacity: 1;
}

.btn-upload {
  background: var(--cinema-gradient-gold);
  color: var(--cinema-darker);
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
}

.btn-upload:hover {
  filter: brightness(1.1);
  box-shadow: 0 4px 12px rgba(247, 197, 72, 0.3);
}

.hidden-input {
  display: none;
}

.movie-status {
  display: inline-block;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 600;
  margin-bottom: 1rem;
}

.status-active {
  background-color: rgba(34, 197, 94, 0.2);
  color: #22c55e;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.status-inactive {
  background-color: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.selected-poster-preview {
  margin-top: 1rem;
}

.preview-container {
  position: relative;
  margin-top: 0.5rem;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
}

.preview-container img {
  width: 100%;
  display: block;
}

.btn-cancel-upload {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.3s ease;
}

.btn-cancel-upload:hover {
  background: rgba(0, 0, 0, 0.7);
}

/* Form section */
.form-section {
  padding: 1rem;
  display: flex;
  flex-direction: column;
}

.movie-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  flex-grow: 1;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group label {
  font-weight: 600;
  color: var(--cinema-text);
  font-size: 0.9rem;
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: 0.75rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(15, 23, 42, 0.6);
  color: var(--cinema-text);
  font-size: 0.9rem;
  width: 100%;
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
}

.form-group input:disabled,
.form-group select:disabled,
.form-group textarea:disabled {
  background: rgba(15, 23, 42, 0.3);
  cursor: not-allowed;
}

/* Actions */
.btn-save {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  background: var(--cinema-gradient-gold);
  color: var(--cinema-darker);
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-save:hover {
  filter: brightness(1.1);
  box-shadow: 0 4px 12px rgba(247, 197, 72, 0.3);
}

.btn-save:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  filter: grayscale(0.5);
}

.btn-cancel {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: var(--cinema-text);
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-cancel:hover {
  background: rgba(255, 255, 255, 0.15);
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

.btn-book {
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
  margin-right: auto;
}

.btn-book:hover {
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

/* Bottom actions */
.bottom-actions {
  margin-top: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.editing-actions {
  display: flex;
  gap: 1rem;
  margin-left: auto;
}

/* Content card */
.movie-content-card {
  background: rgba(13, 27, 42, 0.7);
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.05);
  padding: 2rem;
  max-width: 1100px;
  margin: 0 auto;
}

/* Responsive */
@media (max-width: 992px) {
  .movie-detail-grid {
    grid-template-columns: 1fr;
  }

  .poster-section {
    max-width: 300px;
    margin: 0 auto;
  }
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }

  .bottom-actions {
    flex-direction: column;
    gap: 1rem;
  }

  .bottom-actions button {
    width: 100%;
  }
}
</style>
