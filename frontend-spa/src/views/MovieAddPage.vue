<template>
  <div class="movie-add-page">
    <!-- Header -->
    <div class="page-header">
      <div class="container">
        <div class="header-content">
          <h1 class="page-title">
            <i class="fas fa-plus-circle me-2"></i>
            Thêm phim mới
          </h1>
        </div>
      </div>
    </div>

    <div class="container py-4">
      <div class="movie-form-container">
        <div class="movie-form-grid">
          <!-- Poster section -->
          <div class="poster-section">
            <div class="poster-container">
              <img :src="posterPreview || defaultPoster" alt="Movie poster" class="movie-poster" />

              <div class="poster-overlay">
                <label for="poster-upload" class="btn-upload">
                  <i class="fas fa-camera"></i>
                  {{ posterFile ? 'Thay đổi poster' : 'Chọn poster' }}
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

            <div v-if="posterFile" class="selected-poster-info">
              <div class="selected-file">
                <i class="fas fa-file-image"></i>
                <span>{{ posterFile.name }}</span>
              </div>
              <button @click="removePoster" class="btn-remove-poster">
                <i class="fas fa-times"></i>
              </button>
            </div>

            <div v-if="!posterFile" class="poster-note">
              <p>Vui lòng chọn poster cho phim</p>
              <p class="note-small">Kích thước khuyến nghị: 500x750px</p>
            </div>
          </div>

          <!-- Form section -->
          <div class="form-section">
            <form @submit.prevent="handleSubmit" class="movie-form">
              <!-- Tiêu đề -->
              <div class="form-group">
                <label for="title">Tiêu đề phim <span class="required">*</span></label>
                <input
                  type="text"
                  id="title"
                  v-model="form.title"
                  required
                  placeholder="Nhập tiêu đề phim"
                />
                <div v-if="errors.title" class="error-message">{{ errors.title }}</div>
              </div>

              <!-- Mô tả -->
              <div class="form-group">
                <label for="description">Mô tả <span class="required">*</span></label>
                <textarea
                  id="description"
                  v-model="form.description"
                  rows="5"
                  required
                  placeholder="Nhập mô tả phim"
                ></textarea>
                <div v-if="errors.description" class="error-message">{{ errors.description }}</div>
              </div>

              <!-- Thông tin cơ bản -->
              <div class="form-row">
                <div class="form-group">
                  <label for="duration">Thời lượng (phút) <span class="required">*</span></label>
                  <input
                    type="number"
                    id="duration"
                    v-model.number="form.duration"
                    min="1"
                    required
                    placeholder="120"
                  />
                  <div v-if="errors.duration" class="error-message">{{ errors.duration }}</div>
                </div>

                <div class="form-group">
                  <label for="rating">Phân loại <span class="required">*</span></label>
                  <select id="rating" v-model="form.rating" required>
                    <option value="" disabled selected>Chọn phân loại</option>
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
                  <div v-if="errors.rating" class="error-message">{{ errors.rating }}</div>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="release_date">Ngày công chiếu <span class="required">*</span></label>
                  <input type="date" id="release_date" v-model="form.release_date" required />
                  <div v-if="errors.release_date" class="error-message">
                    {{ errors.release_date }}
                  </div>
                </div>

                <div class="form-group">
                  <label for="end_date">Ngày kết thúc</label>
                  <input type="date" id="end_date" v-model="form.end_date" />
                </div>
              </div>

              <!-- Thông tin chi tiết -->
              <div class="form-group">
                <label for="genre">Thể loại <span class="required">*</span></label>
                <input
                  type="text"
                  id="genre"
                  v-model="form.genre"
                  required
                  placeholder="Hành động, Phiêu lưu, Khoa học viễn tưởng,..."
                />
                <div v-if="errors.genre" class="error-message">{{ errors.genre }}</div>
              </div>

              <div class="form-group">
                <label for="director">Đạo diễn <span class="required">*</span></label>
                <input
                  type="text"
                  id="director"
                  v-model="form.director"
                  required
                  placeholder="Tên đạo diễn"
                />
                <div v-if="errors.director" class="error-message">{{ errors.director }}</div>
              </div>

              <div class="form-group">
                <label for="cast">Diễn viên <span class="required">*</span></label>
                <textarea
                  id="cast"
                  v-model="form.cast"
                  rows="2"
                  required
                  placeholder="Danh sách diễn viên, ngăn cách bởi dấu phẩy"
                ></textarea>
                <div v-if="errors.cast" class="error-message">{{ errors.cast }}</div>
              </div>

              <div class="form-group">
                <label for="country">Quốc gia <span class="required">*</span></label>
                <input
                  type="text"
                  id="country"
                  v-model="form.country"
                  required
                  placeholder="Việt Nam, Mỹ, Hàn Quốc,..."
                />
                <div v-if="errors.country" class="error-message">{{ errors.country }}</div>
              </div>

              <div class="form-group">
                <label for="trailer_url">URL Trailer</label>
                <input
                  type="url"
                  id="trailer_url"
                  v-model="form.trailer_url"
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </div>

              <div class="form-group">
                <label for="status">Trạng thái <span class="required">*</span></label>
                <select id="status" v-model="form.status" required>
                  <option value="active">Đang chiếu</option>
                  <option value="inactive">Ngừng chiếu</option>
                </select>
              </div>

              <!-- Form actions -->
              <div class="form-actions">
                <button type="submit" class="btn-save" :disabled="isCreatingMovie">
                  <i class="fas fa-save"></i>
                  {{ isCreatingMovie ? 'Đang lưu...' : 'Tạo phim' }}
                </button>

                <button type="button" class="btn-cancel" @click="goBack">Hủy</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import movieService from '@/services/movie.service'
import { STATIC_BASE_URL } from '@/constants'

const router = useRouter()
const queryClient = useQueryClient()

const {
  mutateAsync: createMovie,
  isPending: isCreatingMovie,
  error: createMovieError,
} = useMutation({
  mutationFn: movieService.createMovie,
  onSuccess: (data) => {
    // Invalidate and refetch the movies list
    queryClient.invalidateQueries({ queryKey: ['movies'] })
    // Optionally, pre-populate the cache for the new movie
    if (data && data.movie) {
      queryClient.setQueryData(['movies', data.movie.id], data.movie)
    }
  },
})

// State
const posterFile = ref(null)
const posterPreview = ref('')
const defaultPoster = `${STATIC_BASE_URL}/public/images/default-movie-poster.png`
const errors = reactive({})

// Form data
const form = reactive({
  title: '',
  description: '',
  duration: null,
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

// Methods
function handlePosterChange(event) {
  const file = event.target.files[0]
  if (!file) return

  // Validate file type
  if (!file.type.match('image.*')) {
    alert('Vui lòng chọn file hình ảnh')
    return
  }

  // Preview
  posterFile.value = file
  const reader = new FileReader()
  reader.onload = (e) => {
    posterPreview.value = e.target.result
  }
  reader.readAsDataURL(file)
}

function removePoster() {
  posterFile.value = null
  posterPreview.value = ''
  document.getElementById('poster-upload').value = ''
}

function validateForm() {
  const newErrors = {}

  if (!form.title.trim()) {
    newErrors.title = 'Tiêu đề không được để trống'
  } else if (form.title.length > 255) {
    newErrors.title = 'Tiêu đề quá dài (tối đa 255 ký tự)'
  }

  if (!form.description.trim()) {
    newErrors.description = 'Mô tả không được để trống'
  } else if (form.description.length > 2000) {
    newErrors.description = 'Mô tả quá dài (tối đa 2000 ký tự)'
  }

  if (!form.duration) {
    newErrors.duration = 'Thời lượng không được để trống'
  } else if (form.duration < 1 || form.duration > 600) {
    newErrors.duration = 'Thời lượng phải từ 1 đến 600 phút'
  }

  if (!form.release_date) {
    newErrors.release_date = 'Ngày công chiếu không được để trống'
  }

  if (!form.genre.trim()) {
    newErrors.genre = 'Thể loại không được để trống'
  } else if (form.genre.length > 100) {
    newErrors.genre = 'Thể loại quá dài (tối đa 100 ký tự)'
  }

  if (!form.director.trim()) {
    newErrors.director = 'Đạo diễn không được để trống'
  } else if (form.director.length > 255) {
    newErrors.director = 'Tên đạo diễn quá dài (tối đa 255 ký tự)'
  }

  if (!form.cast.trim()) {
    newErrors.cast = 'Danh sách diễn viên không được để trống'
  } else if (form.cast.length > 1000) {
    newErrors.cast = 'Danh sách diễn viên quá dài (tối đa 1000 ký tự)'
  }

  if (!form.country.trim()) {
    newErrors.country = 'Quốc gia không được để trống'
  } else if (form.country.length > 100) {
    newErrors.country = 'Quốc gia quá dài (tối đa 100 ký tự)'
  }

  if (!form.rating) {
    newErrors.rating = 'Phân loại không được để trống'
  }

  Object.assign(errors, newErrors)
  return Object.keys(newErrors).length === 0
}

async function handleSubmit() {
  // Reset errors
  Object.keys(errors).forEach((key) => {
    errors[key] = undefined
  })

  // Validate form
  if (!validateForm()) {
    return
  }

  try {
    const formData = new FormData()
    Object.keys(form).forEach((key) => {
      if (form[key] !== null && form[key] !== undefined && form[key] !== '') {
        formData.append(key, form[key])
      }
    })

    if (posterFile.value) {
      formData.append('posterFile', posterFile.value)
    }

    const result = await createMovie(formData)

    if (result && result.movie) {
      alert('Tạo phim mới thành công')
      router.push(`/admin/movies`) // Redirect to list page after creation
    } else {
      throw new Error('Invalid response structure')
    }
  } catch (err) {
    console.error('Lỗi khi tạo phim:', err)
    // Show error from composable if available
    const errorMessage =
      createMovieError.value?.message ||
      err.message ||
      'Có lỗi xảy ra khi tạo phim. Vui lòng thử lại sau.'
    alert(errorMessage)
  }
}

function goBack() {
  router.push('/admin/movies')
}
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

/* Form container */
.movie-form-container {
  background: rgba(15, 23, 42, 0.7);
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.movie-form-grid {
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
  background: rgba(0, 0, 0, 0.2);
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

.selected-poster-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(255, 255, 255, 0.05);
  padding: 0.75rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.selected-file {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--cinema-text);
  font-size: 0.9rem;
  overflow: hidden;
}

.selected-file i {
  color: var(--cinema-primary);
  flex-shrink: 0;
}

.selected-file span {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.btn-remove-poster {
  background: none;
  border: none;
  color: var(--cinema-text-muted);
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.3s ease;
}

.btn-remove-poster:hover {
  color: #ef4444;
}

.poster-note {
  text-align: center;
  color: var(--cinema-text-muted);
  font-size: 0.9rem;
}

.note-small {
  font-size: 0.8rem;
  opacity: 0.7;
  margin-top: 0.5rem;
}

/* Form section */
.form-section {
  padding: 1rem;
}

.movie-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
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
  display: flex;
  align-items: center;
}

.required {
  color: #ef4444;
  margin-left: 0.25rem;
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

.error-message {
  color: #ef4444;
  font-size: 0.8rem;
  margin-top: 0.25rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
}

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

/* Responsive */
@media (max-width: 992px) {
  .movie-form-grid {
    grid-template-columns: 1fr;
  }

  .poster-section {
    max-width: 300px;
    margin: 0 auto 2rem;
  }
}

@media (max-width: 768px) {
  .movie-form-container {
    padding: 1.5rem;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-direction: column;
  }

  .form-actions button {
    width: 100%;
  }
}
</style>
