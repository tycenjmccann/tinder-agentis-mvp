const request = require('supertest');
const app = require('../src/app');

describe('Error Handling', () => {
  it('should return 404 for unknown routes', async () => {
    const res = await request(app)
      .get('/api/nonexistent');

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
    expect(res.body.error.message).toContain('/api/nonexistent');
  });

  it('should return proper error format for 404', async () => {
    const res = await request(app)
      .get('/api/unknown/route');

    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toHaveProperty('code');
    expect(res.body.error).toHaveProperty('message');
  });
});

describe('Health Check', () => {
  it('should return 200 with status ok', async () => {
    const res = await request(app)
      .get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body).toHaveProperty('timestamp');
  });
});
