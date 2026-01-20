const request = require('supertest');
const app = require('../app');

describe('Rate Limiting Middleware', () => {
  it('should allow requests under the limit', async () => {
    // Send a single request, should not be rate limited
    const res = await request(app).get('/');
    expect(res.status).not.toBe(429);
  });

  it('should return 429 after exceeding the rate limit', async () => {
    // Use a unique IP for isolation
    const agent = request.agent(app);
    let lastRes;
    // Send requests up to the limit
    for (let i = 0; i < 1000; i++) {
      lastRes = await agent.get('/').set('X-Forwarded-For', '1.2.3.4');
    }
    // The next request should be rate limited
    const res = await agent.get('/').set('X-Forwarded-For', '1.2.3.4');
    expect(res.status).toBe(429);
    expect(res.body).toHaveProperty('status', 429);
    expect(res.body.title).toMatch(/too many requests/i);
  });

  it('should reset the limit after the window', async () => {
    jest.useFakeTimers();
    const agent = request.agent(app);
    for (let i = 0; i < 1000; i++) {
      await agent.get('/').set('X-Forwarded-For', '5.6.7.8');
    }
    let res = await agent.get('/').set('X-Forwarded-For', '5.6.7.8');
    expect(res.status).toBe(429);
    // Advance time by 15 minutes
    jest.advanceTimersByTime(15 * 60 * 1000);
    res = await agent.get('/').set('X-Forwarded-For', '5.6.7.8');
    // Should be allowed again
    expect(res.status).not.toBe(429);
    jest.useRealTimers();
  });
});
