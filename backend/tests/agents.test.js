const request = require('supertest');
const app = require('../src/app');
const { generateToken } = require('../src/middleware/auth');

describe('GET /api/agents/status', () => {
  let token;

  beforeAll(() => {
    token = generateToken({ userId: 'test-user', role: 'admin' });
  });

  describe('Authentication', () => {
    it('should return 401 when no auth header is provided', async () => {
      const res = await request(app)
        .get('/api/agents/status');

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
      expect(res.body.error.message).toBe('Authorization header is required');
    });

    it('should return 401 when auth header format is invalid', async () => {
      const res = await request(app)
        .get('/api/agents/status')
        .set('Authorization', 'InvalidFormat token123');

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 401 when token is invalid', async () => {
      const res = await request(app)
        .get('/api/agents/status')
        .set('Authorization', 'Bearer invalid.token.here');

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
      expect(res.body.error.message).toBe('Invalid or expired token');
    });
  });

  describe('Happy Path', () => {
    it('should return all agent statuses when authenticated', async () => {
      const res = await request(app)
        .get('/api/agents/status')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('agents');
      expect(Array.isArray(res.body.agents)).toBe(true);
      expect(res.body.agents.length).toBeGreaterThan(0);
    });

    it('should return agents with correct structure', async () => {
      const res = await request(app)
        .get('/api/agents/status')
        .set('Authorization', `Bearer ${token}`);

      const agent = res.body.agents[0];
      expect(agent).toHaveProperty('id');
      expect(agent).toHaveProperty('name');
      expect(agent).toHaveProperty('role');
      expect(agent).toHaveProperty('status');
      expect(agent).toHaveProperty('lastActivity');
      expect(agent).toHaveProperty('updatedAt');
    });

    it('should return valid status values', async () => {
      const res = await request(app)
        .get('/api/agents/status')
        .set('Authorization', `Bearer ${token}`);

      const validStatuses = ['active', 'idle', 'error'];
      res.body.agents.forEach(agent => {
        expect(validStatuses).toContain(agent.status);
      });
    });

    it('should return ISO 8601 timestamps', async () => {
      const res = await request(app)
        .get('/api/agents/status')
        .set('Authorization', `Bearer ${token}`);

      const agent = res.body.agents[0];
      expect(new Date(agent.lastActivity).toISOString()).toBe(agent.lastActivity);
      expect(new Date(agent.updatedAt).toISOString()).toBe(agent.updatedAt);
    });

    it('should include all configured agents', async () => {
      const res = await request(app)
        .get('/api/agents/status')
        .set('Authorization', `Bearer ${token}`);

      const agentIds = res.body.agents.map(a => a.id);
      expect(agentIds).toContain('team-backend-dev');
      expect(agentIds).toContain('team-frontend-dev');
      expect(agentIds).toContain('team-ios-designer');
      expect(agentIds).toContain('team-security-reviewer');
      expect(agentIds).toContain('team-qa-verifier');
    });
  });

  describe('Performance', () => {
    it('should respond within 200ms', async () => {
      const start = Date.now();
      await request(app)
        .get('/api/agents/status')
        .set('Authorization', `Bearer ${token}`);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(200);
    });
  });
});
