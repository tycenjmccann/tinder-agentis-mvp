/**
 * Workflow Service
 * Manages workflow data with search, filter, and pagination.
 * 
 * In production, this would interface with a database (e.g., PostgreSQL)
 * with indexed queries. For MVP, uses in-memory store with efficient filtering.
 */

const { ApiError } = require('../middleware/errorHandler');

// Sample workflow data - in production, this comes from the database
const SAMPLE_WORKFLOWS = [
  {
    id: 'wf_001',
    title: 'Sidebar Navigation Feature',
    description: 'Implement sidebar navigation with agent status and workflow history',
    status: 'running',
    createdAt: '2026-05-20T06:50:00.000Z',
    updatedAt: '2026-05-20T07:30:00.000Z'
  },
  {
    id: 'wf_002',
    title: 'User Authentication System',
    description: 'Implement JWT-based authentication with OAuth2 support',
    status: 'completed',
    createdAt: '2026-05-18T10:00:00.000Z',
    updatedAt: '2026-05-19T15:30:00.000Z'
  },
  {
    id: 'wf_003',
    title: 'Dashboard Analytics',
    description: 'Build analytics dashboard with real-time metrics',
    status: 'completed',
    createdAt: '2026-05-15T08:00:00.000Z',
    updatedAt: '2026-05-17T12:00:00.000Z'
  },
  {
    id: 'wf_004',
    title: 'API Rate Limiting',
    description: 'Implement rate limiting middleware for all API endpoints',
    status: 'failed',
    createdAt: '2026-05-14T09:00:00.000Z',
    updatedAt: '2026-05-14T11:45:00.000Z'
  },
  {
    id: 'wf_005',
    title: 'Agent Communication Protocol',
    description: 'Design and implement inter-agent messaging system',
    status: 'running',
    createdAt: '2026-05-13T14:00:00.000Z',
    updatedAt: '2026-05-20T06:00:00.000Z'
  },
  {
    id: 'wf_006',
    title: 'Database Migration Tool',
    description: 'Build automated database migration and seeding tool',
    status: 'completed',
    createdAt: '2026-05-10T07:00:00.000Z',
    updatedAt: '2026-05-12T16:30:00.000Z'
  },
  {
    id: 'wf_007',
    title: 'Error Monitoring Integration',
    description: 'Integrate Sentry for error tracking and alerting',
    status: 'completed',
    createdAt: '2026-05-08T11:00:00.000Z',
    updatedAt: '2026-05-09T14:00:00.000Z'
  },
  {
    id: 'wf_008',
    title: 'CI/CD Pipeline Setup',
    description: 'Configure GitHub Actions for automated testing and deployment',
    status: 'completed',
    createdAt: '2026-05-05T09:00:00.000Z',
    updatedAt: '2026-05-06T18:00:00.000Z'
  },
  {
    id: 'wf_009',
    title: 'WebSocket Real-time Updates',
    description: 'Implement WebSocket server for real-time UI updates',
    status: 'failed',
    createdAt: '2026-05-03T13:00:00.000Z',
    updatedAt: '2026-05-04T10:00:00.000Z'
  },
  {
    id: 'wf_010',
    title: 'Performance Optimization Sprint',
    description: 'Optimize API response times and database queries',
    status: 'running',
    createdAt: '2026-05-01T08:00:00.000Z',
    updatedAt: '2026-05-20T05:00:00.000Z'
  }
];

class WorkflowService {
  constructor() {
    // In production, this would be backed by a database
    this.workflows = [...SAMPLE_WORKFLOWS];
  }

  /**
   * Get workflows with search, filter, and pagination.
   * 
   * @param {Object} options
   * @param {string} options.search - Search query (matches title, ID, description)
   * @param {string} options.status - Status filter ('running', 'completed', 'failed', 'all')
   * @param {number} options.page - Page number (1-indexed)
   * @param {number} options.limit - Items per page
   * @returns {{ workflows: Array, total: number, page: number, hasMore: boolean }}
   */
  async getWorkflows({ search = '', status = 'all', page = 1, limit = 20 }) {
    let filtered = [...this.workflows];

    // Apply status filter
    if (status && status !== 'all') {
      filtered = filtered.filter(wf => wf.status === status);
    }

    // Apply search filter (case-insensitive across title, ID, description)
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(wf =>
        wf.title.toLowerCase().includes(searchLower) ||
        wf.id.toLowerCase().includes(searchLower) ||
        wf.description.toLowerCase().includes(searchLower)
      );
    }

    // Sort by most recent first (descending createdAt)
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Calculate pagination
    const total = filtered.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedWorkflows = filtered.slice(startIndex, endIndex);
    const hasMore = endIndex < total;

    // Return only the fields specified in the API contract
    const workflows = paginatedWorkflows.map(wf => ({
      id: wf.id,
      title: wf.title,
      status: wf.status,
      createdAt: wf.createdAt,
      updatedAt: wf.updatedAt
    }));

    return {
      workflows,
      total,
      page,
      hasMore
    };
  }

  /**
   * Add a workflow (for testing/seeding).
   */
  async addWorkflow(workflow) {
    if (!workflow.id || !workflow.title || !workflow.status) {
      throw new ApiError(400, 'INVALID_WORKFLOW', 'Workflow must have id, title, and status');
    }

    const now = new Date().toISOString();
    const newWorkflow = {
      id: workflow.id,
      title: workflow.title,
      description: workflow.description || '',
      status: workflow.status,
      createdAt: workflow.createdAt || now,
      updatedAt: workflow.updatedAt || now
    };

    this.workflows.push(newWorkflow);
    return newWorkflow;
  }
}

// Export singleton instance
module.exports = new WorkflowService();
