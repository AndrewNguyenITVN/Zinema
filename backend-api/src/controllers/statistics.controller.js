const statisticsService = require('../services/statistics.service');
const JSend = require('../jsend');
const ApiError = require('../api-error');

/**
 * Controller để lấy các thống kê cho dashboard
 */
async function getDashboardStatistics(req, res, next) {
    try {
        const stats = await statisticsService.getDashboardStatistics();
        res.status(200).json(JSend.success(stats));
    } catch (error) {
        next(new ApiError());
    }
}

/**
 * Controller để lấy thống kê doanh thu tổng hợp
 */
async function getRevenueSummary(req, res, next) {
    try {
        const stats = await statisticsService.getRevenueSummary();
        res.status(200).json(JSend.success(stats));
    } catch (error) {
        next(new ApiError());
    }
}

/**
 * Controller để lấy thống kê doanh thu theo phim
 */
async function getRevenueByMovie(req, res, next) {
    try {
        const { period } = req.query; // e.g., 'today', 'week', 'month'
        const stats = await statisticsService.getRevenueByMovie({ period });
        res.status(200).json(JSend.success(stats));
    } catch (error) {
        next(new ApiError());
    }
}

/**
 * Controller để lấy thống kê vé bán ra
 */
async function getTicketsSoldSummary(req, res, next) {
    try {
        const stats = await statisticsService.getTicketsSoldSummary();
        res.status(200).json(JSend.success(stats));
    } catch (error) {
        next(new ApiError());
    }
}

/**
 * Controller để lấy thống kê món ăn bán chạy
 */
async function getTopSellingFoods(req, res, next) {
    try {
        const { limit } = req.query;
        const stats = await statisticsService.getTopSellingFoods({ limit });
        res.status(200).json(JSend.success(stats));
    } catch (error) {
        next(new ApiError());
    }
}

module.exports = {
    getDashboardStatistics,
    getRevenueSummary,
    getRevenueByMovie,
    getTicketsSoldSummary,
    getTopSellingFoods,
};
