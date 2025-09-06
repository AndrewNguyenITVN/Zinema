import { createWebHistory, createRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

// Lazy loading cho performance
const LoginPage = () => import('@/views/LoginPage.vue')
const ProfilePage = () => import('@/views/ProfilePage.vue')
const EmployeeList = () => import('@/views/EmployeeList.vue')
const EmployeeAdd = () => import('@/views/EmployeeAdd.vue')
const EmployeeEdit = () => import('@/views/EmployeeEdit.vue')
const CustomerList = () => import('@/views/CustomerList.vue')
const CustomerEdit = () => import('@/views/CustomerEdit.vue')
const NotFound = () => import('@/views/NotFound.vue')
const ForbiddenPage = () => import('@/views/ForbiddenPage.vue')
const GoogleCallbackPage = () => import('@/views/GoogleCallbackPage.vue')
const AdminDashboard = () => import('@/views/AdminDashboard.vue')
const StaffDashboard = () => import('@/views/StaffDashboard.vue')
const BookingPage = () => import('@/views/BookingPage.vue')
const MyBookingsPage = () => import('@/views/MyBookingsPage.vue')
const StaffCheckBooking = () => import('@/views/StaffCheckBooking.vue')

// Movie Management
const AdminMovieList = () => import('@/views/AdminMovieList.vue')
const MovieAddPage = () => import('@/views/MovieAddPage.vue')
const MovieDetailPage = () => import('@/views/MovieDetailPage.vue')

const routes = [
  // Public routes
  {
    path: '/login',
    name: 'login',
    component: LoginPage,
    meta: { requiresGuest: true },
  },
  {
    path: '/auth/google/callback',
    name: 'google.callback',
    component: GoogleCallbackPage,
  },
  {
    path: '/movies/:id',
    name: 'movie.detail',
    component: MovieDetailPage,
    meta: { requiresAuth: true, roles: ['customer', 'staff', 'employee', 'admin'] },
    props: true,
  },

  // Booking Page (Customer/Staff/Admin)
  {
    path: '/movies/:id/book',
    name: 'BookingPage',
    component: BookingPage,
    meta: { requiresAuth: true, roles: ['admin', 'employee', 'customer', 'staff'] },
    props: true,
  },

  // Protected routes
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomePage.vue'),
    meta: { requiresAuth: true, roles: ['customer', 'staff', 'employee'] },
  },
  {
    path: '/profile',
    name: 'profile',
    component: ProfilePage,
    meta: { requiresAuth: true },
  },
  {
    path: '/my-bookings',
    name: 'my.bookings',
    component: MyBookingsPage,
    meta: { requiresAuth: true, roles: ['customer'] },
  },

  // Admin Dashboard (Admin/Employee main page)
  {
    path: '/admin',
    name: 'admin.dashboard',
    component: AdminDashboard,
    meta: { requiresAuth: true, roles: ['admin'] },
  },

  // Staff Dashboard (Staff only)
  {
    path: '/staff',
    name: 'staff.dashboard',
    component: StaffDashboard,
    meta: { requiresAuth: true, roles: ['staff'] },
  },
  {
    path: '/staff/check-booking',
    name: 'staff.check-booking',
    component: StaffCheckBooking,
    meta: { requiresAuth: true, roles: ['staff', 'admin'] },
  },

  // Employee Management (Admin only)
  {
    path: '/employees',
    name: 'employee.list',
    component: EmployeeList,
    meta: { requiresAuth: true, roles: ['admin'] },
  },
  {
    path: '/employees/add',
    name: 'employee.add',
    component: EmployeeAdd,
    meta: { requiresAuth: true, roles: ['admin'] },
  },
  {
    path: '/employees/:id',
    name: 'employee.detail',
    component: EmployeeEdit,
    meta: { requiresAuth: true, roles: ['admin'] },
    props: (route) => ({ employeeId: route.params.id }),
  },

  // Customer Management (Admin + Employee)
  {
    path: '/customers',
    name: 'customer.list',
    component: CustomerList,
    meta: { requiresAuth: true, roles: ['admin', 'employee'] },
  },
  {
    path: '/customers/:id',
    name: 'customer.detail',
    component: CustomerEdit,
    meta: { requiresAuth: true },
    props: (route) => ({ customerId: route.params.id }),
  },

  // Movie Management (Admin + Employee)
  {
    path: '/admin/movies',
    name: 'admin.movies',
    component: AdminMovieList,
    meta: { requiresAuth: true, roles: ['admin', 'employee', 'staff'] },
  },
  {
    path: '/admin/movies/add',
    name: 'admin.movies.add',
    component: MovieAddPage,
    meta: { requiresAuth: true, roles: ['admin', 'employee'] },
  },
  {
    path: '/admin/movies/:id',
    name: 'admin.movies.detail',
    component: MovieDetailPage,
    meta: { requiresAuth: true, roles: ['admin', 'employee', 'staff'] },
    props: (route) => ({ movieId: route.params.id }),
  },

  // Error pages
  {
    path: '/403',
    name: 'forbidden',
    component: ForbiddenPage,
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'notfound',
    component: NotFound,
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// Navigation guards
router.beforeEach(async (to, from, next) => {
  // Store phải được gọi bên trong guard
  const authStore = useAuthStore()

  // Đảm bảo rằng quá trình initAuth đã hoàn tất trước khi kiểm tra
  // Chỉ chạy initAuth nếu currentUser chưa được load
  if (!authStore.currentUser && localStorage.getItem('cinema_token')) {
    await authStore.initAuth()
  }

  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)
  const requiresGuest = to.matched.some((record) => record.meta.requiresGuest)

  if (requiresAuth && !authStore.isAuthenticated) {
    // Người dùng chưa đăng nhập, chuyển hướng đến trang login
    return next({ name: 'login', query: { redirect: to.fullPath } })
  }

  if (requiresGuest && authStore.isAuthenticated) {
    // Người dùng đã đăng nhập, không cho vào trang login/register
    if (authStore.userRole === 'admin') return next({ name: 'admin.dashboard' })
    if (authStore.userRole === 'employee' || authStore.userRole === 'staff')
      return next({ name: 'staff.dashboard' })
    return next('/') // Mặc định cho customer
  }

  // Kiểm tra quyền truy cập dựa trên vai trò
  if (requiresAuth && authStore.isAuthenticated) {
    const requiredRoles = to.meta.roles
    if (requiredRoles && requiredRoles.length > 0) {
      if (!requiredRoles.includes(authStore.userRole)) {
        // Vai trò không phù hợp, chuyển hướng đến trang cấm
        return next({ name: 'forbidden' })
      }
    }
  }

  // Nếu tất cả điều kiện đều ổn, cho phép truy cập
  next()
})

export default router
