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

    // Thống kê doanh thu trong ngày
    const revenueTodayResult = await knex('invoices')
        .where('payment_status', 'paid')
        .whereRaw('DATE(payment_date) = CURDATE()')
        .sum('amount as total')
        .first();

    // Thống kê đơn đặt vé trong ngày
    const bookingsTodayResult = await knex('ticket_bookings')
        .whereRaw('DATE(booking_date) = CURDATE()')
        .count('id as count')
        .first();
    
    const ticketsSoldToday = ticketsSoldTodayResult ? Number(ticketsSoldTodayResult.count) : 0;
    const revenueToday = revenueTodayResult ? Number(revenueTodayResult.total) : 0;
    const bookingsToday = bookingsTodayResult ? Number(bookingsTodayResult.count) : 0;

    return {
        ticketsSoldToday,
        revenueToday,
        bookingsToday,
    };
}

/**
 * Lấy thống kê doanh thu tổng hợp theo ngày, tuần, tháng
 */
async function getRevenueSummary() {
    const revenueTodayResult = await knex('invoices')
        .where('payment_status', 'paid')
        .whereRaw('DATE(payment_date) = CURDATE()')
        .sum('amount as total')
        .first();

    const revenueThisWeekResult = await knex('invoices')
        .where('payment_status', 'paid')
        .whereRaw('YEARWEEK(payment_date, 1) = YEARWEEK(CURDATE(), 1)')
        .sum('amount as total')
        .first();
        
    const revenueThisMonthResult = await knex('invoices')
        .where('payment_status', 'paid')
        .whereRaw('YEAR(payment_date) = YEAR(CURDATE()) AND MONTH(payment_date) = MONTH(CURDATE())')
        .sum('amount as total')
        .first();

    return {
        revenueToday: Number(revenueTodayResult.total) || 0,
        revenueThisWeek: Number(revenueThisWeekResult.total) || 0,
        revenueThisMonth: Number(revenueThisMonthResult.total) || 0,
    };
}

/**
 * Lấy thống kê doanh thu theo từng phim
 * @param {object} options - Tùy chọn filter
 * @param {'today'|'week'|'month'|'all'} options.period - Khoảng thời gian
 */
async function getRevenueByMovie({ period = 'all' } = {}) {
    const query = knex('movies')
        .select('movies.title', 'movies.poster_url')
        .sum('invoices.amount as totalRevenue')
        .join('showtimes', 'movies.id', 'showtimes.movie_id')
        .join('ticket_bookings', 'showtimes.id', 'ticket_bookings.showtime_id')
        .join('invoices', 'ticket_bookings.id', 'invoices.ticket_booking_id')
        .where('invoices.payment_status', 'paid')
        .where('movies.status', 'active') // Chỉ lấy phim đang chiếu
        .groupBy('movies.id')
        .orderBy('totalRevenue', 'desc');

    if (period === 'today') {
        query.whereRaw('DATE(invoices.payment_date) = CURDATE()');
    } else if (period === 'week') {
        query.whereRaw('YEARWEEK(invoices.payment_date, 1) = YEARWEEK(CURDATE(), 1)');
    } else if (period === 'month') {
        query.whereRaw('YEAR(invoices.payment_date) = YEAR(CURDATE()) AND MONTH(invoices.payment_date) = MONTH(CURDATE())');
    }

    const result = await query;
    return result.map(r => ({ ...r, totalRevenue: Number(r.totalRevenue) }));
}

module.exports = {
    getDashboardStatistics,
    getRevenueSummary,
    getRevenueByMovie,
};
