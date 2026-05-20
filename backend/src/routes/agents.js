const express = require('express');
const { authenticate } = require('../middleware/auth');
const agentService = require('../services/agentService');

const router = express.Router();

/**
 * GET /api/agents/status
 * Returns current status for all configured agents.
 * 
 * Response: {
 *   agents: [{
 *     id: string,
 *     name: string,
 *     role: string,
 *     status: 'active' | 'idle' | 'error',
 *     lastActivity: string (ISO 8601),
 *     updatedAt: string (ISO 8601)
 *   }]
 * }
 */
router.get('/status', authenticate, async (req, res, next) => {
  try {
    const agents = await agentService.getAllAgentStatuses();
    res.json({ agents });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
