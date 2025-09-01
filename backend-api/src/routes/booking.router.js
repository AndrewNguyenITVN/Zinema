const express = require("express");
const { z } = require("zod");

const bookingController = require("../controllers/booking.controller");
const {
  authenticateToken,
  authorizeRoles,
} = require("../middlewares/auth.middleware");
const {
  validateRequest,
} = require("../middlewares/validator.middleware");
const {
  getBookingsQuerySchema,
  bookingParamsSchema,
  createBookingSchema,
  confirmBookingSchema,
  updateBookingSchema,
  bookingCodeParamsSchema,
  lockSeatsSchema
} = require("../schemas/booking.schemas");
const { ROLES } = require("../constants");

const router = express.Router();

/**
 * @route POST /api/bookings
 * @desc Tạo booking mới
 * @access Private (All authenticated users)
 * @permission Customer: tạo booking cho mình, Admin/Staff: tạo booking cho bất kỳ ai
 */
router.post(
  "/",
  authenticateToken,
  authorizeRoles([ROLES.ADMIN, ROLES.STAFF, ROLES.CUSTOMER]),
  validateRequest(
    z.object({
      input: createBookingSchema.strict(),
    })
  ),
  bookingController.createBooking
);

/**
 * @route GET /api/bookings
 * @desc Lấy danh sách tất cả bookings với phân trang và lọc
 * @access Private (All authenticated users)
 * @permission Customer: chỉ xem booking của mình, Admin/Staff: xem tất cả
 */
router.get(
  "/",
  authenticateToken,
  authorizeRoles([ROLES.ADMIN, ROLES.STAFF, ROLES.CUSTOMER]),
  validateRequest(
    z.object({
      input: getBookingsQuerySchema.strict(),
    })
  ),
  bookingController.getAllBookings
);

/**
 * @route GET /api/bookings/:id
 * @desc Lấy thông tin chi tiết booking theo ID
 * @access Private (All authenticated users)
 * @permission Customer: chỉ xem booking của mình, Admin/Staff: xem tất cả
 */
router.get(
  "/:id",
  authenticateToken,
  authorizeRoles([ROLES.ADMIN, ROLES.STAFF, ROLES.CUSTOMER]),
  validateRequest(
    z.object({
      input: bookingParamsSchema.strict(),
    })
  ),
  bookingController.getBookingById
);

/**
 * @route GET /api/bookings/code/:code
 * @desc Lấy thông tin chi tiết booking theo mã code
 * @access Private (Admin, Staff)
 */
router.get(
  "/code/:code",
  authenticateToken,
  authorizeRoles([ROLES.ADMIN, ROLES.STAFF]),
  validateRequest(
    z.object({
      input: bookingCodeParamsSchema.strict(),
    })
  ),
  bookingController.getBookingByCode
);

/**
 * @route POST /api/bookings/lock-seats
 * @desc Khóa ghế tạm thời
 * @access Private (All authenticated users)
 */
router.post(
  "/lock-seats",
  authenticateToken,
  authorizeRoles([ROLES.ADMIN, ROLES.STAFF, ROLES.CUSTOMER]),
  validateRequest(
    z.object({
      input: lockSeatsSchema.strict(),
    })
  ),
  bookingController.lockSeats
);

/**
 * @route POST /api/bookings/unlock-seats
 * @desc Mở khóa ghế
 * @access Private (All authenticated users)
 */
router.post(
  "/unlock-seats",
  authenticateToken,
  authorizeRoles([ROLES.ADMIN, ROLES.STAFF, ROLES.CUSTOMER]),
  validateRequest(
    z.object({
      input: lockSeatsSchema.strict(),
    })
  ),
  bookingController.unlockSeats
);

/**
 * @route POST /api/bookings/:id/confirm
 * @desc Xác nhận booking và thanh toán
 * @access Private (All authenticated users)
 * @permission Customer: xác nhận booking của mình, Admin/Staff: xác nhận bất kỳ booking nào
 */
router.post(
  "/:id/confirm",
  authenticateToken,
  authorizeRoles([ROLES.ADMIN, ROLES.STAFF, ROLES.CUSTOMER]),
  validateRequest(
    z.object({
      input: confirmBookingSchema.strict(),
      id: z.coerce.number().positive("ID phải là số dương"),
    })
  ),
  bookingController.confirmBooking
);

/**
 * @route PUT /api/bookings/:id
 * @desc Cập nhật booking (trạng thái, thanh toán, etc.)
 * @access Private (Admin, Staff, Customer owner)
 * @permission Customer: chỉ cập nhật booking của mình, Admin/Staff: cập nhật tất cả
 */
router.put(
  "/:id",
  authenticateToken,
  authorizeRoles([ROLES.ADMIN, ROLES.STAFF, ROLES.CUSTOMER]),
  validateRequest(
    z.object({
      input: updateBookingSchema.strict(),
      id: z.coerce.number().positive("ID phải là số dương"),
    })
  ),
  bookingController.updateBooking
);

/**
 * @route POST /api/bookings/cleanup
 * @desc Dọn dẹp các booking pending đã hết hạn
 * @access Private (Admin only)
 */
router.post(
  "/cleanup",
  authenticateToken,
  authorizeRoles([ROLES.ADMIN]),
  bookingController.cleanupExpiredBookings
);

/**
 * @route DELETE /api/bookings/:id
 * @desc Xóa booking (chỉ admin)
 * @access Private (Admin only)
 */
router.delete(
  "/:id",
  authenticateToken,
  authorizeRoles([ROLES.ADMIN, ROLES.CUSTOMER]),
  bookingController.deleteBooking
);

// Export router setup function theo pattern của project
module.exports.setup = (app) => {
  app.use("/api/bookings", router);
};
