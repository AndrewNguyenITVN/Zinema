<template>
  <div class="food-edit-page">
    <div class="page-header">
      <div class="container">
        <h1 class="page-title"><i class="fas fa-edit me-2"></i>Chỉnh sửa món ăn</h1>
      </div>
    </div>

    <div class="container py-4">
      <div v-if="isLoading" class="loading-container">
        <div class="spinner"></div>
      </div>
      <div v-else-if="error" class="error-container">
        <p>Không thể tải dữ liệu món ăn. Vui lòng thử lại.</p>
        <button @click="refetch">Tải lại</button>
      </div>
      <div v-else-if="food" class="form-container">
         <div class="form-grid">
          <div class="image-section">
            <div class="image-preview-container">
              <img :src="imagePreview || food.image_url" alt="Food image" class="food-image" />
              <div class="image-overlay">
                <label for="image-upload" class="btn-upload">
                  <i class="fas fa-camera"></i>
                  {{ imageFile ? 'Thay đổi hình' : 'Chọn hình' }}
                </label>
                <input
                  type="file"
                  id="image-upload"
                  accept="image/*"
                  @change="handleImageChange"
                  class="hidden-input"
                />
              </div>
            </div>
          </div>

          <div class="form-section">
            <form @submit.prevent="handleSubmit">
              <div class="form-group">
                <label for="name">Tên món ăn <span class="required">*</span></label>
                <input type="text" v-model="form.name" required />
              </div>

              <div class="form-group">
                <label for="description">Mô tả <span class="required">*</span></label>
                <textarea v-model="form.description" rows="4" required></textarea>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="price">Giá (VND) <span class="required">*</span></label>
                  <input type="number" v-model.number="form.price" required min="0" />
                </div>
                <div class="form-group">
                  <label for="category">Danh mục <span class="required">*</span></label>
                  <input type="text" v-model="form.category" required />
                </div>
              </div>

              <div class="form-group">
                <label>Trạng thái</label>
                <div class="radio-group">
                    <label>
                        <input type="radio" v-model="form.is_available" :value="true" />
                        Đang bán
                    </label>
                    <label>
                        <input type="radio" v-model="form.is_available" :value="false" />
                        Ngừng bán
                    </label>
                </div>
              </div>

              <div class="form-actions">
                <button type="submit" class="btn-save" :disabled="isUpdatingFood">
                  <i class="fas fa-save"></i>
                  {{ isUpdatingFood ? 'Đang lưu...' : 'Lưu thay đổi' }}
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
import { ref, reactive, watch, defineProps } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useFoodById, useFoods } from '@/composables/useFoods'
import foodService from '@/services/food.service'

const props = defineProps({
  id: {
    type: [String, Number],
    required: true,
  },
})

const router = useRouter()
const { updateFood, isUpdatingFood } = useFoods()
const { data: foodData, isLoading, error, refetch } = useFoodById(props.id)

const food = ref(null)
const imageFile = ref(null)
const imagePreview = ref('')

const form = reactive({
  name: '',
  description: '',
  price: null,
  category: '',
  is_available: true,
})

watch(foodData, (newData) => {
  if (newData && newData.food) {
    food.value = newData.food
    form.name = newData.food.name
    form.description = newData.food.description
    form.price = newData.food.price
    form.category = newData.food.category
    form.is_available = newData.food.is_available
  }
}, { immediate: true })


function handleImageChange(event) {
  const file = event.target.files[0]
  if (file) {
    imageFile.value = file
    const reader = new FileReader()
    reader.onload = (e) => {
      imagePreview.value = e.target.result
    }
    reader.readAsDataURL(file)
  }
}

async function handleSubmit() {
  try {
    // Update food details
    await updateFood.mutateAsync({ id: props.id, data: form })

    // Upload new image if selected
    if (imageFile.value) {
      const formData = new FormData()
      formData.append('image', imageFile.value)
      await foodService.uploadFoodImage(props.id, formData)
    }

    alert('Cập nhật món ăn thành công!')
    router.push('/admin/foods')
  } catch (err) {
    console.error('Lỗi khi cập nhật món ăn:', err)
    alert(err.message || 'Có lỗi xảy ra.')
  }
}

function goBack() {
  router.push('/admin/foods')
}
</script>

<style scoped>
/* Scoped styles are the same as AdminFoodAdd.vue */
.page-header {
  background: var(--cinema-gradient-dark);
  padding: 2rem 0;
  margin-bottom: 1rem;
}
.page-title {
  color: var(--cinema-primary);
  font-size: 2.2rem;
}

.form-container {
  background: rgba(15, 23, 42, 0.7);
  border-radius: 12px;
  padding: 2rem;
}

.form-grid {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 2rem;
}

.image-section .image-preview-container {
  width: 100%;
  padding-top: 100%;
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.2);
}
.food-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.image-overlay {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}
.image-preview-container:hover .image-overlay {
  opacity: 1;
}
.btn-upload {
  background: var(--cinema-gradient-gold);
  color: var(--cinema-darker);
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
}
.hidden-input { display: none; }

.form-section { padding: 1rem; }
.form-group { margin-bottom: 1.5rem; }
.form-group label { display: block; font-weight: 600; margin-bottom: 0.5rem; }
.required { color: #ef4444; margin-left: 0.25rem; }
.form-group input[type="text"],
.form-group input[type="number"],
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(15, 23, 42, 0.6);
  color: var(--cinema-text);
}
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.radio-group { display: flex; gap: 1rem; }
.radio-group label { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; }

.form-actions { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 2rem; }
.btn-save, .btn-cancel { padding: 0.75rem 1.5rem; border-radius: 8px; border: none; cursor: pointer; font-weight: 600; }
.btn-save { background: var(--cinema-gradient-gold); color: var(--cinema-darker); }
.btn-save:disabled { opacity: 0.7; cursor: not-allowed; }
.btn-cancel { background: rgba(255, 255, 255, 0.1); color: var(--cinema-text); }
.loading-container, .error-container { text-align: center; padding: 4rem; }
</style>

