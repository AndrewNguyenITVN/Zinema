const express = require('express');
const router = express.Router();
const statisticsController = require('../controllers/statistics.controller');
const { authorizeRoles } = require('../middlewares/auth.middleware');
const { ROLES } = require('../constants');

/**
 * @openapi
 * /api/statistics/dashboard:
 *   get:
 *     summary: Lấy dữ liệu thống kê cho dashboard của admin/staff
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trả về các số liệu thống kê.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     ticketsSoldToday:
 *                       type: integer
 *                       description: "Số vé đã bán trong ngày hôm nay"
 *                       example: 154
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 */
router.get(
    '/dashboard',
    authorizeRoles([ROLES.ADMIN, ROLES.STAFF]),
    statisticsController.getDashboardStatistics
);

/**
 * @openapi
 * /api/statistics/revenue/summary:
 *   get:
 *     summary: Lấy thống kê doanh thu tổng hợp (ngày, tuần, tháng)
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trả về các số liệu doanh thu.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 */
router.get(
    '/revenue/summary',
    authorizeRoles([ROLES.ADMIN]),
    statisticsController.getRevenueSummary
);

/**
 * @openapi
 * /api/statistics/revenue/by-movie:
 *   get:
 *     summary: Lấy thống kê doanh thu theo từng phim
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [today, week, month, all]
 *           default: all
 *         description: Lọc theo khoảng thời gian
 *     responses:
 *       200:
 *         description: Trả về danh sách phim và doanh thu tương ứng.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 */
router.get(
    '/revenue/by-movie',
    authorizeRoles([ROLES.ADMIN]),
    statisticsController.getRevenueByMovie
);

module.exports.setup = (app) => {
    app.use('/api/statistics', router);
};
