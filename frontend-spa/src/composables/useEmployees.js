import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { computed } from 'vue'
import authService from '@/services/auth.service'
import { toVal } from '@/utils/helpers'

const EMPLOYEES_QUERY_KEY = 'employees'

/**
 * Composable to manage employees list and related operations.
 * Provides reactive state for employees list and mutation functions for registration and updates.
 */
export function useEmployees() {
    const queryClient = useQueryClient()

    // --- Query (lấy danh sách) ---
    const employeesQuery = useQuery({
        queryKey: [EMPLOYEES_QUERY_KEY],
        queryFn: authService.getAllEmployees,
    })

    // --- Mutations (thêm, sửa) ---
    const registerMutation = useMutation({
        mutationFn: authService.registerEmployee,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [EMPLOYEES_QUERY_KEY] })
        },
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => authService.updateEmployee(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: [EMPLOYEES_QUERY_KEY] })
            queryClient.invalidateQueries({ queryKey: [EMPLOYEES_QUERY_KEY, { id }] })
        },
    })

    // --- Return reactive state and functions ---
    return {
        // List query state
        employees: computed(() => employeesQuery.data.value),
        isLoadingEmployees: computed(() => employeesQuery.isLoading.value),
        isEmployeesError: computed(() => employeesQuery.isError.value),
        employeesError: computed(() => employeesQuery.error.value),
        refetchEmployees: employeesQuery.refetch,

        // Register mutation
        registerEmployee: registerMutation.mutate,
        isRegistering: computed(() => registerMutation.isPending.value),
        isRegisterSuccess: computed(() => registerMutation.isSuccess.value),
        registerError: computed(() => registerMutation.error.value),
        resetRegister: registerMutation.reset,

        // Update mutation
        updateEmployee: updateMutation.mutate,
        isUpdating: computed(() => updateMutation.isPending.value),
        isUpdateSuccess: computed(() => updateMutation.isSuccess.value),
        updateError: computed(() => updateMutation.error.value),
        resetUpdate: updateMutation.reset,
    }
}

/**
 * Composable to get employee details by ID.
 * Returns reactive state for a specific employee.
 * 
 * @param {import('vue').Ref<string|null>|string|null} employeeId - The ID of the employee to retrieve.
 */
export function useEmployee(employeeId) {
    const eid = computed(() => toVal(employeeId))
    
    return useQuery({
        queryKey: [EMPLOYEES_QUERY_KEY, { id: eid }],
        queryFn: () => authService.getEmployeeById(eid.value),
        enabled: computed(() => !!eid.value),
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 30 * 60 * 1000, // 30 minutes
    })
}
