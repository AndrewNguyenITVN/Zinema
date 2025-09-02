const knex = require('../database/knex');

/**
 * Lấy các thống kê cho trang dashboard
 */
async function getDashboardStatistics() {
    // Lưu ý: CURDATE() là hàm của MySQL. Nếu đổi database, cần xem lại.
    // Thống kê số vé đã bán trong ngày (status: confirmed hoặc completed)
    const ticketsSoldTodayResult = await knex('tickets')
        .join('ticket_bookings', 'tickets.ticket_booking_id', 'ticket_bookings.id')
        .whereIn('ticket_bookings.status', ['confirmed', 'completed'])
        .whereRaw('DATE(ticket_bookings.booking_date) = CURDATE()')
        .count('tickets.id as count')
        .first();
    
    const ticketsSoldToday = ticketsSoldTodayResult ? Number(ticketsSoldTodayResult.count) : 0;

    return {
        ticketsSoldToday,
        // Tương lai có thể thêm các thống kê khác ở đây
        // moviesShowing: 0,
        // newCustomers: 0,
        // monthlyRevenue: 0,
    };
}

module.exports = {
    getDashboardStatistics,
};
