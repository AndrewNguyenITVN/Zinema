const statisticsService = require('../services/statistics.service');
const { Jsend, JsendError } = require('../jsend');

/**
 * Controller để lấy các thống kê cho dashboard
 */
async function getDashboardStatistics(req, res, next) {
    try {
        const stats = await statisticsService.getDashboardStatistics();
        res.status(200).json(new Jsend(stats));
    } catch (error) {
        next(new JsendError(error.message));
    }
}

/**
 * Controller để lấy thống kê doanh thu tổng hợp
 */
async function getRevenueSummary(req, res, next) {
    try {
        const stats = await statisticsService.getRevenueSummary();
        res.status(200).json(new Jsend(stats));
    } catch (error) {
        next(new JsendError(error.message));
    }
}

/**
 * Controller để lấy thống kê doanh thu theo phim
 */
async function getRevenueByMovie(req, res, next) {
    try {
        const { period } = req.query; // e.g., 'today', 'week', 'month'
        const stats = await statisticsService.getRevenueByMovie({ period });
        res.status(200).json(new Jsend(stats));
    } catch (error) {
        next(new JsendError(error.message));
    }
}

module.exports = {
    getDashboardStatistics,
    getRevenueSummary,
    getRevenueByMovie,
};
