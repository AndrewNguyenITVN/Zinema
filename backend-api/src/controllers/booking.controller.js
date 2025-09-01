const bookingService = require('../services/booking.service');
const JSend = require('../jsend');

/**
 * Lấy danh sách tất cả bookings
 * GET /api/bookings
 */
async function getAllBookings(req, res) {
    try {
        const queryParams = req.query;
        const user = req.user; // Từ auth middleware

        console.log('Get all bookings request:', {
            user: { id: user.id, role: user.role },
            queryParams
        });

        const result = await bookingService.getAllBookings(queryParams, user);

        console.log('Get all bookings success:', {
            totalRecords: result.metadata.totalRecords,
            page: result.metadata.page,
            bookingsCount: result.bookings.length
        });

        return res.status(200).json(JSend.success({
            message: 'Lấy danh sách booking thành công',
            data: result.bookings,
            metadata: result.metadata
        }));
    } catch (error) {
        console.error('Get all bookings error:', error);
        return res.status(500).json(JSend.error('Lỗi khi lấy danh sách booking', {
            error: error.message
        }));
    }
}

/**
 * Lấy thông tin chi tiết booking theo ID
 * GET /api/bookings/:id
 */
async function getBookingById(req, res) {
    try {
        const { id } = req.params;
        const user = req.user; // Từ auth middleware

        console.log('Get booking by ID request:', {
            bookingId: id,
            user: { id: user.id, role: user.role }
        });

        const booking = await bookingService.getBookingById(parseInt(id), user);

        if (!booking) {
            console.log('Booking not found or access denied:', { bookingId: id, userId: user.id });
            return res.status(404).json(JSend.fail('Không tìm thấy booking hoặc bạn không có quyền truy cập'));
        }

        console.log('Get booking by ID success:', {
            bookingId: id,
            status: booking.status
        });

        return res.status(200).json(JSend.success({
            message: 'Lấy thông tin booking thành công',
            data: booking
        }));
    } catch (error) {
        console.error('Get booking by ID error:', error);
        return res.status(500).json(JSend.error('Lỗi khi lấy thông tin booking', {
            error: error.message
        }));
    }
}

/**
 * Lấy thông tin chi tiết booking theo mã booking
 * GET /api/bookings/code/:code
 */
async function getBookingByCode(req, res) {
    try {
        const { code } = req.params;
        const user = req.user;

        const booking = await bookingService.getBookingByCode(code, user);

        if (!booking) {
            return res.status(404).json(JSend.fail('Không tìm thấy booking với mã này hoặc bạn không có quyền truy cập.'));
        }

        return res.status(200).json(JSend.success({
            message: 'Lấy thông tin booking thành công',
            data: booking
        }));
    } catch (error) {
        console.error('Get booking by code error:', error);
        return res.status(500).json(JSend.error('Lỗi khi lấy thông tin booking', {
            error: error.message
        }));
    }
}

/**
 * Cập nhật booking
 * PUT /api/bookings/:id
 */
async function updateBooking(req, res) {
    try {
        const { id } = req.params;
        const updateData = req.body.input;
        const user = req.user; // Từ auth middleware

        console.log('Update booking request:', {
            bookingId: id,
            updateData,
            user: { id: user.id, role: user.role }
        });

        const updatedBooking = await bookingService.updateBooking(parseInt(id), updateData, user);

        if (!updatedBooking) {
            console.log('Booking not found or access denied for update:', { bookingId: id, userId: user.id });
            return res.status(404).json(JSend.fail('Không tìm thấy booking hoặc bạn không có quyền cập nhật'));
        }

        console.log('Update booking success:', {
            bookingId: id,
            newStatus: updatedBooking.status
        });

        return res.status(200).json(JSend.success({
            message: 'Cập nhật booking thành công',
            data: updatedBooking
        }));
    } catch (error) {
        console.error('Update booking error:', error);
        return res.status(500).json(JSend.error('Lỗi khi cập nhật booking', {
            error: error.message
        }));
    }
}

/**
 * Xóa booking (chỉ admin)
 * DELETE /api/bookings/:id
 */
async function deleteBooking(req, res) {
    try {
        const { id } = req.params;
        const user = req.user; // Từ auth middleware

        console.log('Delete booking request:', {
            bookingId: id,
            user: { id: user.id, role: user.role }
        });

        const success = await bookingService.deleteBooking(parseInt(id), user);

        if (!success) {
            console.log('Booking not found or access denied for delete:', { bookingId: id, userId: user.id });
            return res.status(404).json(JSend.fail('Không tìm thấy booking hoặc bạn không có quyền xóa'));
        }

        console.log('Delete booking success:', { bookingId: id });

        return res.status(200).json(JSend.success({
            message: 'Xóa booking thành công'
        }));
    } catch (error) {
        console.error('Delete booking error:', error);
        return res.status(500).json(JSend.error('Lỗi khi xóa booking', {
            error: error.message
        }));
    }
}

/**
 * Tạo booking mới
 * POST /api/bookings
 */
async function createBooking(req, res) {
    try {
        // Extract booking data from req.body.input (not req.body)
        const bookingData = req.body.input;
        const user = req.user; // Từ auth middleware

        console.log('Create booking request:', {
            user: { id: user.id, role: user.role },
            bookingData
        });

        const newBooking = await bookingService.createBooking(bookingData, user);

        console.log('Create booking success:', {
            bookingId: newBooking.id,
            totalAmount: newBooking.invoice ? newBooking.invoice.amount : 'N/A'
        });

        return res.status(201).json(JSend.success({
            message: 'Tạo booking thành công',
            data: newBooking
        }));
    } catch (error) {
        console.error('Create booking error:', error);
        return res.status(500).json(JSend.error('Lỗi khi tạo booking', {
            error: error.message
        }));
    }
}

/**
 * Xác nhận booking và thanh toán
 * POST /api/bookings/:id/confirm
 */
async function confirmBooking(req, res) {
    try {
        const { id } = req.params;
        // Extract confirm data from req.body.input
        const confirmData = req.body.input;
        const user = req.user; // Từ auth middleware

        console.log('Confirm booking request:', {
            bookingId: id,
            confirmData,
            user: { id: user.id, role: user.role }
        });

        const confirmedBooking = await bookingService.confirmBooking(parseInt(id), confirmData, user);

        if (!confirmedBooking) {
            console.log('Booking not found or access denied for confirm:', { bookingId: id, userId: user.id });
            return res.status(404).json(JSend.fail('Không tìm thấy booking hoặc bạn không có quyền xác nhận'));
        }

        console.log('Confirm booking success:', {
            bookingId: id,
            status: confirmedBooking.status,
            paymentStatus: confirmedBooking.invoice ? confirmedBooking.invoice.payment_status : 'N/A'
        });

        return res.status(200).json(JSend.success({
            message: 'Xác nhận booking thành công',
            data: confirmedBooking
        }));
    } catch (error) {
        console.error('Confirm booking error:', error);
        return res.status(500).json(JSend.error('Lỗi khi xác nhận booking', {
            error: error.message
        }));
    }
}

/**
 * Dọn dẹp các booking pending đã hết hạn
 * POST /api/bookings/cleanup
 */
async function cleanupExpiredBookings(req, res) {
    try {
        const user = req.user; // Từ auth middleware

        // Chỉ admin mới có quyền cleanup
        if (user.role !== 'admin') {
            return res.status(403).json(JSend.fail('Bạn không có quyền thực hiện thao tác này'));
        }

        console.log('Cleanup expired bookings request:', {
            user: { id: user.id, role: user.role }
        });

        const cleanedCount = await bookingService.cleanupExpiredBookings();

        console.log('Cleanup expired bookings success:', {
            cleanedCount
        });

        return res.status(200).json(JSend.success({
            message: `Đã dọn dẹp ${cleanedCount} booking hết hạn`,
            data: { cleanedCount }
        }));
    } catch (error) {
        console.error('Cleanup expired bookings error:', error);
        return res.status(500).json(JSend.error('Lỗi khi dọn dẹp booking hết hạn', {
            error: error.message
        }));
    }
}

/**
 * Khóa ghế tạm thời
 * POST /api/bookings/lock-seats
 */
async function lockSeats(req, res) {
    try {
        const { showtime_id, seat_ids } = req.body.input;
        const user = req.user;

        console.log('Lock seats request:', {
            showtime_id,
            seat_ids,
            user: { id: user.id }
        });

        const result = await bookingService.lockSeats(showtime_id, seat_ids, user);

        console.log('Lock seats success:', { showtime_id, seat_ids, userId: user.id });

        return res.status(200).json(JSend.success({
            message: 'Khóa ghế thành công',
            data: result
        }));
    } catch (error) {
        console.error('Lock seats error:', error);
        return res.status(500).json(JSend.error('Lỗi khi khóa ghế', {
            error: error.message
        }));
    }
}

/**
 * Mở khóa ghế
 * POST /api/bookings/unlock-seats
 */
async function unlockSeats(req, res) {
    try {
        const { showtime_id, seat_ids } = req.body.input;
        const user = req.user;

        console.log('Unlock seats request:', {
            showtime_id,
            seat_ids,
            user: { id: user.id }
        });

        await bookingService.unlockSeats(showtime_id, seat_ids, user);

        console.log('Unlock seats success:', { showtime_id, seat_ids, userId: user.id });

        return res.status(200).json(JSend.success({
            message: 'Mở khóa ghế thành công'
        }));
    } catch (error) {
        console.error('Unlock seats error:', error);
        return res.status(500).json(JSend.error('Lỗi khi mở khóa ghế', {
            error: error.message
        }));
    }
}


module.exports = {
    getAllBookings,
    getBookingById,
    updateBooking,
    deleteBooking,
    createBooking,
    confirmBooking,
    cleanupExpiredBookings,
    getBookingByCode,
    lockSeats,
    unlockSeats
}; 