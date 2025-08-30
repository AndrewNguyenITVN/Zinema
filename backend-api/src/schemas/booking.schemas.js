const z = require('zod');

// Schema cơ bản cho booking
const bookingSchema = z.object({
  id: z.number().positive('ID phải là số dương'),
});

// Schema cho params (URL parameters - luôn là string cần convert)
const bookingParamsSchema = z.object({
  id: z.coerce.number().positive('ID phải là số dương'),
});

// Schema cho booking code (URL params)
const bookingCodeParamsSchema = z.object({
  code: z.string().min(1, 'Mã booking không được để trống'),
});

// Schema cho query parameters khi lấy danh sách bookings
const getBookingsQuerySchema = z.object({
  // Phân trang
  page: z.coerce.number().positive().default(1).optional(),
  limit: z.coerce.number().positive().max(100).default(10).optional(),
  
  // Lọc theo trạng thái (theo database schema)
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed'], {
    errorMap: () => ({ message: 'Trạng thái phải là pending, confirmed, cancelled hoặc completed' })
  }).optional(),
  
  // Lọc theo khách hàng (chỉ admin/staff mới dùng được)
  customer_id: z.coerce.number().positive().optional(),
  
  // Lọc theo suất chiếu
  showtime_id: z.coerce.number().positive().optional(),
  
  // Lọc theo ngày đặt
  booking_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Ngày đặt phải có định dạng YYYY-MM-DD'
  }).optional(),
}).strict();

// Schema cho tạo booking mới
const createBookingSchema = z.object({
  showtime_id: z.number().positive('ID suất chiếu phải là số dương'),
  
  seats: z.array(z.number().positive('ID ghế phải là số dương'))
    .min(1, 'Phải chọn ít nhất 1 ghế')
    .max(8, 'Không được chọn quá 8 ghế'),
  
  food_items: z.array(z.object({
    food_id: z.number().positive('ID đồ ăn phải là số dương'),
    quantity: z.number().positive('Số lượng phải là số dương').max(20, 'Số lượng không được quá 20')
  })).optional(),
  
  // Cho phép staff đặt vé hộ khách hàng
  customer_phone: z.string()
    .min(10, 'Số điện thoại phải có ít nhất 10 ký tự')
    .max(15, 'Số điện thoại không được quá 15 ký tự')
    .optional(),
}).strict();

// Schema cho cập nhật booking
const updateBookingSchema = z.object({
  // Chỉ cho phép cập nhật status trong ticket_bookings
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed'], {
    errorMap: () => ({ message: 'Trạng thái phải là pending, confirmed, cancelled hoặc completed' })
  }).optional(),
  
  // Các trường trong invoices
  payment_method: z.enum(['cash', 'credit_card', 'momo', 'zalopay', 'banking'], {
    errorMap: () => ({ message: 'Phương thức thanh toán phải là cash, credit_card, momo, zalopay hoặc banking' })
  }).optional(),
  
  payment_status: z.enum(['pending', 'paid', 'failed'], {
    errorMap: () => ({ message: 'Trạng thái thanh toán phải là pending, paid hoặc failed' })
  }).optional(),
}).strict();

// Schema cho xác nhận booking (thanh toán)
const confirmBookingSchema = z.object({
  payment_method: z.enum(['cash', 'credit_card', 'momo', 'zalopay', 'banking'], {
    errorMap: () => ({ message: 'Phương thức thanh toán phải là cash, credit_card, momo, zalopay hoặc banking' })
  }),
  
  payment_details: z.object({
    amount: z.number().positive('Số tiền phải là số dương').optional(),
    transaction_id: z.string().optional(),
    payment_gateway: z.string().optional(),
  }).optional(),
}).strict();

// Schema cho khóa/mở khóa ghế
const lockSeatsSchema = z.object({
  showtime_id: z.number().positive('ID suất chiếu phải là số dương'),
  seat_ids: z.array(z.number().positive('ID ghế phải là số dương'))
    .min(1, 'Phải chọn ít nhất 1 ghế')
    .max(8, 'Không được chọn quá 8 ghế'),
}).strict();

// Request schemas - bao bọc các schema cơ bản trong input object
const getBookingsRequestSchema = z.object({
  query: getBookingsQuerySchema,
});

const createBookingRequestSchema = z.object({
  body: createBookingSchema,
});

const updateBookingRequestSchema = z.object({
  body: updateBookingSchema,
  params: z.object({
    id: z.coerce.number().positive('ID phải là số dương'),
  }),
});

const confirmBookingRequestSchema = z.object({
  body: confirmBookingSchema,
  params: z.object({
    id: z.coerce.number().positive('ID phải là số dương'),
  }),
});

const getBookingByIdRequestSchema = z.object({
  params: z.object({
    id: z.coerce.number().positive('ID phải là số dương'),
  }),
});

module.exports = {
  bookingSchema,
  bookingParamsSchema,
  bookingCodeParamsSchema,
  getBookingsQuerySchema,
  createBookingSchema,
  updateBookingSchema,
  confirmBookingSchema,
  getBookingsRequestSchema,
  createBookingRequestSchema,
  updateBookingRequestSchema,
  confirmBookingRequestSchema,
  getBookingByIdRequestSchema,
  lockSeatsSchema,
}; 