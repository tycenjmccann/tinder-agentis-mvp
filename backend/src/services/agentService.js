/**
 * Agent Service
 * Manages agent status data and heartbeat tracking.
 * 
 * In production, this would interface with a database and
 * heartbeat monitoring system. For MVP, uses in-memory store
 * with configurable agent definitions.
 */

const { ApiError } = require('../middleware/errorHandler');

// Default agent configuration - in production, loaded from DB/config
const DEFAULT_AGENTS = [
  {
    id: 'team-backend-dev',
    name: 'Backend Developer',
    role: 'backend-dev'
  },
  {
    id: 'team-frontend-dev',
    name: 'Frontend Developer',
    role: 'frontend-dev'
  },
  {
    id: 'team-ios-designer',
    name: 'iOS Designer',
    role: 'designer'
  },
  {
    id: 'team-security-reviewer',
    name: 'Security Reviewer',
    role: 'security'
  },
  {
    id: 'team-qa-verifier',
    name: 'QA Verifier',
    role: 'qa'
  }
];

// Heartbeat timeout threshold (ms) - if no heartbeat within this period, agent is idle
const HEARTBEAT_TIMEOUT = 30000; // 30 seconds
// Error timeout - if no heartbeat for this long, consider agent in error state
const ERROR_TIMEOUT = 120000; // 2 minutes

class AgentService {
  constructor() {
    this.agents = new Map();
    this.initializeAgents();
  }

  initializeAgents() {
    const now = new Date().toISOString();
    DEFAULT_AGENTS.forEach(agent => {
      this.agents.set(agent.id, {
        ...agent,
        lastHeartbeat: new Date(),
        lastActivity: now,
        updatedAt: now
      });
    });
  }

  /**
   * Get status for all configured agents.
   * Status is derived from heartbeat/activity timestamps:
   *   - active: heartbeat within HEARTBEAT_TIMEOUT
   *   - idle: heartbeat between HEARTBEAT_TIMEOUT and ERROR_TIMEOUT
   *   - error: no heartbeat for longer than ERROR_TIMEOUT
   */
  async getAllAgentStatuses() {
    const now = Date.now();
    const statuses = [];

    for (const [, agent] of this.agents) {
      const timeSinceHeartbeat = now - new Date(agent.lastHeartbeat).getTime();
      let status;

      if (timeSinceHeartbeat < HEARTBEAT_TIMEOUT) {
        status = 'active';
      } else if (timeSinceHeartbeat < ERROR_TIMEOUT) {
        status = 'idle';
      } else {
        status = 'error';
      }

      statuses.push({
        id: agent.id,
        name: agent.name,
        role: agent.role,
        status,
        lastActivity: agent.lastActivity,
        updatedAt: agent.updatedAt
      });
    }

    return statuses;
  }

  /**
   * Update agent heartbeat - called by agents to report they are alive.
   */
  async updateHeartbeat(agentId) {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new ApiError(404, 'AGENT_NOT_FOUND', `Agent '${agentId}' not found`);
    }

    const now = new Date();
    agent.lastHeartbeat = now;
    agent.lastActivity = now.toISOString();
    agent.updatedAt = now.toISOString();

    return { id: agentId, status: 'active' };
  }

  /**
   * Get a single agent's status.
   */
  async getAgentStatus(agentId) {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new ApiError(404, 'AGENT_NOT_FOUND', `Agent '${agentId}' not found`);
    }

    const timeSinceHeartbeat = Date.now() - new Date(agent.lastHeartbeat).getTime();
    let status;

    if (timeSinceHeartbeat < HEARTBEAT_TIMEOUT) {
      status = 'active';
    } else if (timeSinceHeartbeat < ERROR_TIMEOUT) {
      status = 'idle';
    } else {
      status = 'error';
    }

    return {
      id: agent.id,
      name: agent.name,
      role: agent.role,
      status,
      lastActivity: agent.lastActivity,
      updatedAt: agent.updatedAt
    };
  }
}

// Export singleton instance
module.exports = new AgentService();
