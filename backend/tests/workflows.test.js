const request = require('supertest');
const app = require('../src/app');
const { generateToken } = require('../src/middleware/auth');

describe('GET /api/workflows', () => {
  let token;

  beforeAll(() => {
    token = generateToken({ userId: 'test-user', role: 'admin' });
  });

  describe('Authentication', () => {
    it('should return 401 when no auth header is provided', async () => {
      const res = await request(app)
        .get('/api/workflows');

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 401 when token is invalid', async () => {
      const res = await request(app)
        .get('/api/workflows')
        .set('Authorization', 'Bearer invalid.token');

      expect(res.status).toBe(401);
    });
  });

  describe('Happy Path - Default Response', () => {
    it('should return workflows with default pagination', async () => {
      const res = await request(app)
        .get('/api/workflows')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('workflows');
      expect(res.body).toHaveProperty('total');
      expect(res.body).toHaveProperty('page');
      expect(res.body).toHaveProperty('hasMore');
      expect(Array.isArray(res.body.workflows)).toBe(true);
    });

    it('should return workflows with correct structure', async () => {
      const res = await request(app)
        .get('/api/workflows')
        .set('Authorization', `Bearer ${token}`);

      const workflow = res.body.workflows[0];
      expect(workflow).toHaveProperty('id');
      expect(workflow).toHaveProperty('title');
      expect(workflow).toHaveProperty('status');
      expect(workflow).toHaveProperty('createdAt');
      expect(workflow).toHaveProperty('updatedAt');
    });

    it('should return workflows sorted by createdAt descending', async () => {
      const res = await request(app)
        .get('/api/workflows')
        .set('Authorization', `Bearer ${token}`);

      const workflows = res.body.workflows;
      for (let i = 0; i < workflows.length - 1; i++) {
        const current = new Date(workflows[i].createdAt).getTime();
        const next = new Date(workflows[i + 1].createdAt).getTime();
        expect(current).toBeGreaterThanOrEqual(next);
      }
    });

    it('should default to page 1', async () => {
      const res = await request(app)
        .get('/api/workflows')
        .set('Authorization', `Bearer ${token}`);

      expect(res.body.page).toBe(1);
    });
  });

  describe('Search Functionality', () => {
    it('should filter workflows by title (case-insensitive)', async () => {
      const res = await request(app)
        .get('/api/workflows?search=sidebar')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.workflows.length).toBeGreaterThan(0);
      res.body.workflows.forEach(wf => {
        const matchesSearch =
          wf.title.toLowerCase().includes('sidebar') ||
          wf.id.toLowerCase().includes('sidebar');
        expect(matchesSearch).toBe(true);
      });
    });

    it('should filter workflows by ID', async () => {
      const res = await request(app)
        .get('/api/workflows?search=wf_001')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.workflows.length).toBe(1);
      expect(res.body.workflows[0].id).toBe('wf_001');
    });

    it('should return empty array when search has no matches', async () => {
      const res = await request(app)
        .get('/api/workflows?search=nonexistentworkflow123')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.workflows).toEqual([]);
      expect(res.body.total).toBe(0);
      expect(res.body.hasMore).toBe(false);
    });

    it('should search in description field', async () => {
      const res = await request(app)
        .get('/api/workflows?search=JWT')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.workflows.length).toBeGreaterThan(0);
    });
  });

  describe('Status Filtering', () => {
    it('should filter by running status', async () => {
      const res = await request(app)
        .get('/api/workflows?status=running')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      res.body.workflows.forEach(wf => {
        expect(wf.status).toBe('running');
      });
    });

    it('should filter by completed status', async () => {
      const res = await request(app)
        .get('/api/workflows?status=completed')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      res.body.workflows.forEach(wf => {
        expect(wf.status).toBe('completed');
      });
    });

    it('should filter by failed status', async () => {
      const res = await request(app)
        .get('/api/workflows?status=failed')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      res.body.workflows.forEach(wf => {
        expect(wf.status).toBe('failed');
      });
    });

    it('should return all workflows when status is "all"', async () => {
      const res = await request(app)
        .get('/api/workflows?status=all')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.total).toBeGreaterThan(0);
    });

    it('should combine search and status filter', async () => {
      const res = await request(app)
        .get('/api/workflows?search=agent&status=running')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      res.body.workflows.forEach(wf => {
        expect(wf.status).toBe('running');
      });
    });
  });

  describe('Pagination', () => {
    it('should paginate with custom limit', async () => {
      const res = await request(app)
        .get('/api/workflows?limit=3')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.workflows.length).toBeLessThanOrEqual(3);
      expect(res.body.page).toBe(1);
    });

    it('should return correct hasMore value', async () => {
      const res = await request(app)
        .get('/api/workflows?limit=2')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.hasMore).toBe(true);
    });

    it('should return page 2 correctly', async () => {
      const res1 = await request(app)
        .get('/api/workflows?limit=3&page=1')
        .set('Authorization', `Bearer ${token}`);

      const res2 = await request(app)
        .get('/api/workflows?limit=3&page=2')
        .set('Authorization', `Bearer ${token}`);

      expect(res2.status).toBe(200);
      expect(res2.body.page).toBe(2);
      // Ensure no overlap between pages
      const page1Ids = res1.body.workflows.map(w => w.id);
      const page2Ids = res2.body.workflows.map(w => w.id);
      page2Ids.forEach(id => {
        expect(page1Ids).not.toContain(id);
      });
    });

    it('should return total count correctly', async () => {
      const resAll = await request(app)
        .get('/api/workflows?limit=100')
        .set('Authorization', `Bearer ${token}`);

      const resPage = await request(app)
        .get('/api/workflows?limit=3')
        .set('Authorization', `Bearer ${token}`);

      expect(resPage.body.total).toBe(resAll.body.total);
    });

    it('should return empty results for page beyond total', async () => {
      const res = await request(app)
        .get('/api/workflows?page=999&limit=20')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.workflows).toEqual([]);
      expect(res.body.hasMore).toBe(false);
    });
  });

  describe('Validation & Error Handling', () => {
    it('should return 400 for invalid status parameter', async () => {
      const res = await request(app)
        .get('/api/workflows?status=invalid')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.details).toBeDefined();
    });

    it('should return 400 for invalid page parameter', async () => {
      const res = await request(app)
        .get('/api/workflows?page=0')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for negative page', async () => {
      const res = await request(app)
        .get('/api/workflows?page=-1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for limit exceeding max', async () => {
      const res = await request(app)
        .get('/api/workflows?limit=101')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for limit of 0', async () => {
      const res = await request(app)
        .get('/api/workflows?limit=0')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for non-numeric page', async () => {
      const res = await request(app)
        .get('/api/workflows?page=abc')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
