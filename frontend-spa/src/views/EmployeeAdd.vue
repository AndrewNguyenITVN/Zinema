<script setup>
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { useEmployees } from '@/composables/useEmployees'
import EmployeeForm from '@/components/EmployeeForm.vue'

const router = useRouter()
const { registerEmployee, isRegistering } = useEmployees()
const { canManageEmployees } = useAuth()

// Redirect if not authorized
if (!canManageEmployees.value) {
  router.push({ name: 'notfound' })
}

async function handleSubmit(values) {
  try {
    await registerEmployee(values)

    alert('Đăng ký nhân viên thành công!')
    router.push({ name: 'employee.list' })
  } catch (error) {
    console.error('Register employee error:', error)
    alert('Có lỗi xảy ra khi đăng ký nhân viên!')
  }
}

function goBack() {
  router.go(-1)
}
</script>

<template>
  <div class="employee-add-page">
    <div class="form-container">
      <div class="form-header">
        <h1>
          <i class="fas fa-user-plus"></i>
          Đăng ký nhân viên mới
        </h1>
      </div>
      <div class="form-body">
        <EmployeeForm :is-loading="isRegistering" @submit="handleSubmit" @cancel="goBack" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.employee-add-page {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 2rem 1rem;
  background-color: var(--cinema-dark);
  min-height: calc(100vh - 80px); /* Adjust based on header height */
}

.form-container {
  width: 100%;
  max-width: 800px;
  background: rgba(13, 27, 42, 0.8);
  border-radius: 10px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
}

.form-header {
  background: var(--cinema-gradient-gold);
  padding: 1.5rem;
  text-align: center;
}

.form-header h1 {
  font-size: 1.8rem;
  color: var(--cinema-darker);
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
}

.form-body {
  padding: 2rem;
}

/* You might need to adjust styles in EmployeeForm.vue to match this new theme */
/* For example, make form inputs have a dark background */
</style>
