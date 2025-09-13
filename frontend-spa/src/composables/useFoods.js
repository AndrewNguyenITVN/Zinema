import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { computed, ref } from 'vue'
import foodService from '@/services/food.service'

const FOOD_QUERY_KEY = 'foods'

function toVal(source) {
  return source && typeof source === 'object' && 'value' in source ? source.value : source
}

/**
 * Composable hook to manage foods
 */
export function useFoods() {
  const queryClient = useQueryClient()

  const _filtersRef = ref({
    name: '',
    category: '',
    is_available: null,
    page: 1,
    limit: 10,
  })

  const filters = new Proxy(_filtersRef.value, {
    get(target, prop) {
      return _filtersRef.value[prop]
    },
    set(target, prop, value) {
      _filtersRef.value[prop] = value
      return true
    },
  })

  // Mutations
  const createFoodMutation = useMutation({
    mutationFn: foodService.createFood,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [FOOD_QUERY_KEY] })
      if (data && data.food) {
        queryClient.setQueryData([FOOD_QUERY_KEY, data.food.id], data.food)
      }
    },
    onError: (error) => {
      console.error('Create food error:', error)
    },
  })

  const updateFoodMutation = useMutation({
    mutationFn: ({ id, data }) => foodService.updateFood(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: [FOOD_QUERY_KEY] })
      if (data && data.food) {
        queryClient.setQueryData([FOOD_QUERY_KEY, variables.id], data.food)
      }
    },
    onError: (error) => {
      console.error('Update food error:', error)
    },
  })

  const deleteFoodMutation = useMutation({
    mutationFn: foodService.deleteFood,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: [FOOD_QUERY_KEY] })
      queryClient.removeQueries({ queryKey: [FOOD_QUERY_KEY, variables] })
    },
  })

  function changePage(page) {
    _filtersRef.value.page = page
  }

  function applyFilters(newFilters) {
    Object.assign(_filtersRef.value, newFilters, { page: 1 })
  }

  function resetFilters() {
    Object.assign(_filtersRef.value, {
      name: '',
      category: '',
      is_available: null,
      page: 1,
      limit: 10,
    })
  }

  return {
    filters,
    createFood: createFoodMutation,
    updateFood: updateFoodMutation,
    deleteFood: deleteFoodMutation,
    isCreatingFood: computed(() => createFoodMutation.isPending.value),
    isUpdatingFood: computed(() => updateFoodMutation.isPending.value),
    isDeletingFood: computed(() => deleteFoodMutation.isPending.value),
    createFoodError: computed(() => createFoodMutation.error),
    updateFoodError: computed(() => updateFoodMutation.error),
    deleteFoodError: computed(() => deleteFoodMutation.error),
    changePage,
    applyFilters,
    resetFilters,
  }
}

/**
 * Composable to get a list of foods with filters and pagination
 */
export function useFoodsList(filters = {}) {
  const cleanFilters = computed(() => {
    const src = toVal(filters)
    return Object.fromEntries(
      Object.entries(src).filter(
        ([_, value]) => value !== '' && value !== null && value !== undefined
      )
    )
  })

  return useQuery({
    queryKey: [FOOD_QUERY_KEY, 'list', cleanFilters],
    queryFn: () => foodService.getAllFoods(cleanFilters.value),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    keepPreviousData: true,
  })
}

/**
 * Composable to get food details by ID
 */
export function useFoodById(foodId) {
  return useQuery({
    queryKey: [FOOD_QUERY_KEY, toVal(foodId)],
    queryFn: () => foodService.getFoodById(toVal(foodId)),
    enabled: computed(() => !!toVal(foodId)),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: (failureCount, error) => {
      if (error.response?.status === 404) {
        return false
      }
      return failureCount < 3
    },
  })
}

