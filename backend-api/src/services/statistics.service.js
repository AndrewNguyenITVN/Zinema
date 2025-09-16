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
        .whereRaw("DATE(ticket_bookings.booking_date) = DATE('now')")
        .count('tickets.id as count')
        .first();

    // Thống kê doanh thu trong ngày
    const revenueTodayResult = await knex('invoices')
        .where('payment_status', 'paid')
        .whereRaw("DATE(payment_date) = DATE('now')")
        .sum('amount as total')
        .first();

    // Thống kê đơn đặt vé trong ngày
    const bookingsTodayResult = await knex('ticket_bookings')
        .whereRaw("DATE(booking_date) = DATE('now')")
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
        .whereRaw("DATE(payment_date) = DATE('now')")
        .sum('amount as total')
        .first();

    const revenueThisWeekResult = await knex('invoices')
        .where('payment_status', 'paid')
        .whereRaw("strftime('%Y-%W', payment_date) = strftime('%Y-%W', 'now')")
        .sum('amount as total')
        .first();
        
    const revenueThisMonthResult = await knex('invoices')
        .where('payment_status', 'paid')
        .whereRaw("strftime('%Y-%m', payment_date) = strftime('%Y-%m', 'now')")
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
        query.whereRaw("DATE(invoices.payment_date) = DATE('now')");
    } else if (period === 'week') {
        query.whereRaw("strftime('%Y-%W', invoices.payment_date) = strftime('%Y-%W', 'now')");
    } else if (period === 'month') {
        query.whereRaw("strftime('%Y-%m', invoices.payment_date) = strftime('%Y-%m', 'now')");
    }

    const result = await query;
    return result.map(r => ({ ...r, totalRevenue: Number(r.totalRevenue) }));
}

/**
 * Lấy thống kê số vé bán ra theo ngày, tuần, tháng
 */
async function getTicketsSoldSummary() {
    const commonQuery = (queryBuilder) => {
        return queryBuilder
            .join('ticket_bookings', 'tickets.ticket_booking_id', 'ticket_bookings.id')
            .whereIn('ticket_bookings.status', ['confirmed', 'completed']);
    };

    const ticketsTodayResult = await commonQuery(knex('tickets'))
        .whereRaw("DATE(ticket_bookings.booking_date) = DATE('now')")
        .count('tickets.id as count')
        .first();

    const ticketsThisWeekResult = await commonQuery(knex('tickets'))
        .whereRaw("strftime('%Y-%W', ticket_bookings.booking_date) = strftime('%Y-%W', 'now')")
        .count('tickets.id as count')
        .first();
        
    const ticketsThisMonthResult = await commonQuery(knex('tickets'))
        .whereRaw("strftime('%Y-%m', ticket_bookings.booking_date) = strftime('%Y-%m', 'now')")
        .count('tickets.id as count')
        .first();

    return {
        ticketsToday: Number(ticketsTodayResult.count) || 0,
        ticketsThisWeek: Number(ticketsThisWeekResult.count) || 0,
        ticketsThisMonth: Number(ticketsThisMonthResult.count) || 0,
    };
}

/**
 * Lấy thống kê tỷ lệ lấp đầy phòng chiếu
 * @param {object} options - Tùy chọn filter
 * @param {'today'|'week'|'month'|'all'} options.period - Khoảng thời gian
 */
async function getOccupancyRateSummary({ period = 'all' } = {}) {
    // 1. Lấy tổng số vé đã bán (tickets sold)
    const ticketsQuery = knex('tickets')
        .join('ticket_bookings', 'tickets.ticket_booking_id', 'ticket_bookings.id')
        .join('showtimes', 'ticket_bookings.showtime_id', 'showtimes.id')
        .whereIn('ticket_bookings.status', ['confirmed', 'completed']);

    // 2. Lấy tổng sức chứa (total capacity)
    const capacityQuery = knex('showtimes')
        .join('cinema_rooms', 'showtimes.cinema_room_id', 'cinema_rooms.id');

    // Áp dụng filter thời gian cho cả 2 query
    if (period === 'today') {
        ticketsQuery.whereRaw("DATE(showtimes.start_time) = DATE('now')");
        capacityQuery.whereRaw("DATE(showtimes.start_time) = DATE('now')");
    } else if (period === 'week') {
        ticketsQuery.whereRaw("strftime('%Y-%W', showtimes.start_time) = strftime('%Y-%W', 'now')");
        capacityQuery.whereRaw("strftime('%Y-%W', showtimes.start_time) = strftime('%Y-%W', 'now')");
    } else if (period === 'month') {
        ticketsQuery.whereRaw("strftime('%Y-%m', showtimes.start_time) = strftime('%Y-%m', 'now')");
        capacityQuery.whereRaw("strftime('%Y-%m', showtimes.start_time) = strftime('%Y-%m', 'now')");
    }

    const totalTicketsSoldResult = await ticketsQuery.count('tickets.id as count').first();
    const totalCapacityResult = await capacityQuery.sum('cinema_rooms.capacity as total').first();

    const totalTicketsSold = Number(totalTicketsSoldResult.count) || 0;
    const totalCapacity = Number(totalCapacityResult.total) || 0;

    const occupancyRate = totalCapacity > 0 ? (totalTicketsSold / totalCapacity) * 100 : 0;

    return {
        totalTicketsSold,
        totalCapacity,
        occupancyRate: occupancyRate.toFixed(2), // Làm tròn 2 chữ số thập phân
    };
}

module.exports = {
    getDashboardStatistics,
    getRevenueSummary,
    getRevenueByMovie,
    getTicketsSoldSummary,
    getOccupancyRateSummary,
};
