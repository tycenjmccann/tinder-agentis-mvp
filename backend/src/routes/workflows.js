const express = require('express');
const { query } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const workflowService = require('../services/workflowService');

const router = express.Router();

/**
 * GET /api/workflows
 * Returns paginated workflow list with search and filter support.
 *
 * Query Parameters:
 *   - search (string, optional): Search by title, ID, or description (case-insensitive)
 *   - status (string, optional): Filter by status ('running', 'completed', 'failed', 'all')
 *   - page (number, optional): Page number (default: 1, min: 1)
 *   - limit (number, optional): Items per page (default: 20, min: 1, max: 100)
 *
 * Response: {
 *   workflows: [{ id, title, status, createdAt, updatedAt }],
 *   total: number,
 *   page: number,
 *   hasMore: boolean
 * }
 */
router.get(
  '/',
  authenticate,
  [
    query('search')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Search query must be a string with max 200 characters'),
    query('status')
      .optional()
      .isIn(['running', 'completed', 'failed', 'all'])
      .withMessage('Status must be one of: running, completed, failed, all'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .toInt()
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .toInt()
      .withMessage('Limit must be between 1 and 100')
  ],
  validate,
  async (req, res, next) => {
    try {
      const { search, status, page = 1, limit = 20 } = req.query;

      const result = await workflowService.getWorkflows({
        search: search || '',
        status: status || 'all',
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
