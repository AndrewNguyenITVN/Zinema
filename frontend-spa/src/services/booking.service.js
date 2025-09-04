import { API_BASE_URL } from '@/constants'

/**
 * Custom fetch wrapper with error handling
 * @param {string} url
 * @param {RequestInit} options
 * @returns {Promise<any>}
 */
async function efetch(url, options = {}) {
  let result = {}
  let json = {}

  try {
    result = await fetch(url, options)
    json = await result.json()
  } catch (error) {
    throw new Error(error.message)
  }

  if (!result.ok || json.status !== 'success') {
    throw new Error(json.message || 'Request failed')
  }

  return json.data
}

function makeBookingService() {
  const baseUrl = `${API_BASE_URL}/bookings`

  function getAuthHeaders() {
    const token = localStorage.getItem('cinema_token')
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  /**
   * Creates a new booking
   * @param {Object} bookingData - Data to create a booking
   * @returns {Promise<Object>} - The created booking data
   */
  async function createBooking(bookingData) {
    const response = await efetch(baseUrl, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ input: bookingData }),
    })
    return response.data ?? response // unwrap if nested
  }

  /**
   * Gets detailed information of a booking
   * @param {number} id - Booking ID
   * @returns {Promise<Object>} - Detailed booking data
   */
  async function getBookingById(id) {
    const data = await efetch(`${baseUrl}/${id}`, {
      headers: getAuthHeaders(),
    })
    return data.booking
  }

  /**
   * Confirms and pays for a booking
   * @param {number} id - Booking ID
   * @param {Object} confirmData - Confirmation data (e.g., payment method)
   * @returns {Promise<Object>} - Booking data after confirmation
   */
  async function confirmBooking(id, confirmData) {
    return efetch(`${baseUrl}/${id}/confirm`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ input: confirmData, id }),
    })
  }

  /**
   * Get bookings for the current user
   * @param {{status: string}} [params] - Optional params like status
   * @returns {Promise<Array<Object>>} - List of bookings
   */
  async function getMyBookings(params = {}) {
    const url = new URL(baseUrl)
    if (params.status) {
      url.searchParams.append('status', params.status)
    }

    const data = await efetch(url.toString(), {
      headers: getAuthHeaders(),
    })
    return data
  }

  /**
   * Get booking details by booking code (for staff/admin)
   * @param {string} code - The booking code
   * @returns {Promise<Object>} - The detailed booking data
   */
  async function getBookingByCode(code) {
    return efetch(`${baseUrl}/code/${code}`, {
      headers: getAuthHeaders(),
    })
  }

  /**
   * Kiểm tra khách hàng theo số điện thoại (Staff/Admin only)
   * @param {string} phoneNumber - Số điện thoại cần kiểm tra
   * @returns {Promise<Object>} - Response chứa thông tin khách hàng nếu có
   */
  async function checkCustomerByPhone(phoneNumber) {
    try {
      const response = await efetch(`${API_BASE_URL}/auth/check-customer/${phoneNumber}`, {
        headers: getAuthHeaders(),
      })
      return response
    } catch (error) {
      console.error('Check customer by phone error:', error)
      throw new Error(error.message || 'Lỗi khi kiểm tra khách hàng')
    }
  }

  /**
   * Tạo khách hàng mới không có tài khoản (Staff/Admin only)
   * @param {Object} customerData - Dữ liệu khách hàng mới
   * @returns {Promise<Object>} - Response chứa thông tin khách hàng vừa tạo
   */
  async function createCustomerWithoutAccount(customerData) {
    try {
      const response = await efetch(`${API_BASE_URL}/auth/create-customer`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input: customerData }),
      })
      return response
    } catch (error) {
      console.error('Create customer without account error:', error)
      throw new Error(error.message || 'Lỗi khi tạo khách hàng mới')
    }
  }

  /**
   * Hủy một booking
   * @param {number} id - ID của booking cần hủy
   * @returns {Promise<Object>} - Thông báo hủy thành công
   */
  async function cancelBooking(id) {
    return efetch(`${baseUrl}/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })
  }

  /**
   * Khóa ghế tạm thời
   * @param {number} showtimeId ID suất chiếu
   * @param {number[]} seatIds Mảng ID các ghế
   * @returns {Promise<Object>}
   */
  async function lockSeats(showtimeId, seatIds) {
    const response = await efetch(`${baseUrl}/lock-seats`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ input: { showtime_id: showtimeId, seat_ids: seatIds } }),
    })
    return response.data ?? response
  }

  /**
   * Mở khóa ghế
   * @param {number} showtimeId ID suất chiếu
   * @param {number[]} seatIds Mảng ID các ghế
   * @returns {Promise<Object>}
   */
  async function unlockSeats(showtimeId, seatIds) {
    const response = await efetch(`${baseUrl}/unlock-seats`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ input: { showtime_id: showtimeId, seat_ids: seatIds } }),
    })
    return response.data ?? response
  }

  return {
    createBooking,
    getBookingById,
    confirmBooking,
    getMyBookings,
    getBookingByCode,
    checkCustomerByPhone,
    createCustomerWithoutAccount,
    cancelBooking,
    lockSeats,
    unlockSeats,
  }
}

export default makeBookingService()
