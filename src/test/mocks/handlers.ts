import { http, HttpResponse } from 'msw';
import type { Agent, WorkflowSummary } from '../../components/sidebar/sidebar.types';

export const mockAgents: Agent[] = [
  {
    id: 'agent-frontend-dev',
    name: 'Frontend Developer',
    role: 'Frontend',
    status: 'active',
    lastActivity: new Date().toISOString(),
  },
  {
    id: 'agent-backend-dev',
    name: 'Backend Developer',
    role: 'Backend',
    status: 'active',
    lastActivity: new Date().toISOString(),
  },
  {
    id: 'agent-qa-verifier',
    name: 'QA Verifier',
    role: 'Quality Assurance',
    status: 'idle',
    lastActivity: new Date(Date.now() - 300000).toISOString(),
  },
  {
    id: 'agent-security-reviewer',
    name: 'Security Reviewer',
    role: 'Security',
    status: 'error',
    lastActivity: new Date(Date.now() - 600000).toISOString(),
  },
];

export const mockWorkflows: WorkflowSummary[] = [
  {
    id: 'wf-001',
    title: 'Deploy API v2.1',
    status: 'running',
    createdAt: new Date(Date.now() - 120000).toISOString(),
    updatedAt: new Date(Date.now() - 60000).toISOString(),
  },
  {
    id: 'wf-002',
    title: 'Build Frontend Dashboard',
    status: 'completed',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: 'wf-003',
    title: 'Database Migration v3',
    status: 'failed',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    updatedAt: new Date(Date.now() - 7000000).toISOString(),
  },
  {
    id: 'wf-004',
    title: 'Security Scan Pipeline',
    status: 'completed',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 85000000).toISOString(),
  },
  {
    id: 'wf-005',
    title: 'Deploy Staging Environment',
    status: 'running',
    createdAt: new Date(Date.now() - 180000).toISOString(),
    updatedAt: new Date(Date.now() - 90000).toISOString(),
  },
];

export const handlers = [
  // Agent status endpoint
  http.get('/api/agents/status', () => {
    return HttpResponse.json({ agents: mockAgents });
  }),

  // Workflow list endpoint with search, filter, pagination
  http.get('/api/workflows', ({ request }) => {
    const url = new URL(request.url);
    const search = url.searchParams.get('search') || '';
    const status = url.searchParams.get('status') || 'all';
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);

    let filtered = [...mockWorkflows];

    // Apply search filter
    if (search) {
      filtered = filtered.filter((w) =>
        w.title.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Apply status filter
    if (status !== 'all') {
      filtered = filtered.filter((w) => w.status === status);
    }

    // Pagination
    const start = (page - 1) * limit;
    const paginatedWorkflows = filtered.slice(start, start + limit);
    const hasMore = start + limit < filtered.length;

    return HttpResponse.json({
      workflows: paginatedWorkflows,
      total: filtered.length,
      page,
      hasMore,
    });
  }),
];
