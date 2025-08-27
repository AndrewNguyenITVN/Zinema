import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import authService from '@/services/auth.service'

const EMPLOYEES_QUERY_KEY = 'employees'

/**
 * Composable để quản lý danh sách nhân viên và các thao tác liên quan.
 * Cung cấp danh sách nhân viên, cũng như các hàm để đăng ký và cập nhật thông tin nhân viên.
 */
export function useEmployees() {
    const queryClient = useQueryClient()

    // --- Query (lấy danh sách) ---
    const {
        data: employees,
        isLoading: isLoadingEmployees,
        isError: isEmployeesError,
        error: employeesError,
    } = useQuery({
        queryKey: [EMPLOYEES_QUERY_KEY],
        queryFn: authService.getAllEmployees,
    })

    // --- Mutations (thêm, sửa) ---
    const {
        mutate: registerEmployee,
        isLoading: isRegistering,
        isSuccess: isRegisterSuccess,
        reset: resetRegister,
    } = useMutation({
        mutationFn: authService.registerEmployee,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [EMPLOYEES_QUERY_KEY] })
        },
    })

    const {
        mutate: updateEmployee,
        isLoading: isUpdating,
        isSuccess: isUpdateSuccess,
        reset: resetUpdate,
    } = useMutation({
        mutationFn: ({ id, data }) => authService.updateEmployee(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: [EMPLOYEES_QUERY_KEY] })
            queryClient.invalidateQueries({ queryKey: [EMPLOYEES_QUERY_KEY, { id }] })
        },
    })

    // --- Trả về state và hàm để component có thể dùng ---
    return {
        // List
        employees,
        isLoadingEmployees,
        isEmployeesError,
        employeesError,

        // Register
        registerEmployee,
        isRegistering,
        isRegisterSuccess,
        resetRegister,

        // Update
        updateEmployee,
        isUpdating,
        isUpdateSuccess,
        resetUpdate,
    }
}

/**
 * Composable để lấy thông tin chi tiết của một nhân viên.
 * @param {import('vue').Ref<string|null>|string|null} employeeId - ID của nhân viên cần lấy.
 */
export function useEmployee(employeeId) {
    return useQuery({
        queryKey: [EMPLOYEES_QUERY_KEY, { id: employeeId }],
        queryFn: () => authService.getEmployeeById(employeeId),
        enabled: !!employeeId,
    })
}
