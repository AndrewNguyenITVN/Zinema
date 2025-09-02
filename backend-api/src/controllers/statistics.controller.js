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

module.exports = {
    getDashboardStatistics,
};
