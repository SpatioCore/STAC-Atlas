const request = require('supertest');
const express = require('express');

// Mock DB module BEFORE importing the router
jest.mock('../db/db_APIconnection', () => ({
  ping: jest.fn(),
  query: jest.fn(),
  pool: { connect: jest.fn() },
}));

const db = require('../db/db_APIconnection');
const healthRouter = require('../routes/health');

describe('Health Check Endpoint', () => {
  let app;

  beforeEach(() => {
    process.env.SERVICE_NAME = 'STAC Atlas API';
    db.ping.mockResolvedValue({ ok: true });

    app = express();
    app.use('/health', healthRouter);
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.SERVICE_NAME;
  });

  test('GET /health returns 200 status code when DB is ok', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
  });

  test('GET /health returns json content type', async () => {
    const response = await request(app).get('/health');
    expect(response.type).toBe('application/json');
  });

  test('GET /health response contains STAC-compliant structure', async () => {
    const response = await request(app).get('/health');
    expect(response.body.type).toBe('Health');
    expect(response.body.id).toBe('stac-atlas-health');
    expect(response.body.title).toBe('STAC Atlas API Health Check');
    expect(response.body.description).toBeDefined();
    expect(typeof response.body.description).toBe('string');
  });

  test('GET /health response contains liveness + readiness fields', async () => {
    const response = await request(app).get('/health');
    expect(response.body.status).toBe('ok');
    expect(response.body.ready).toBe(true);
    expect(response.body.checks.alive.status).toBe('ok');
    expect(response.body.checks.db.status).toBe('ok');
    expect(typeof response.body.checks.db.latencyMs).toBe('number');
  });

  test('GET /health response contains timestamp in ISO format', async () => {
    const response = await request(app).get('/health');
    expect(response.body.timestamp).toBeDefined();
    expect(new Date(response.body.timestamp).toISOString()).toBe(response.body.timestamp);
  });

  test('GET /health response contains uptime', async () => {
    const response = await request(app).get('/health');
    expect(response.body.uptimeSec).toBeDefined();
    expect(typeof response.body.uptimeSec).toBe('number');
    expect(response.body.uptimeSec).toBeGreaterThanOrEqual(0);
  });

  test('GET /health response contains STAC links', async () => {
    const response = await request(app).get('/health');
    expect(response.body.links).toBeDefined();
    expect(Array.isArray(response.body.links)).toBe(true);
    expect(response.body.links.length).toBeGreaterThan(0);

    // Check for required link relations
    const linkRels = response.body.links.map(link => link.rel);
    expect(linkRels).toContain('self');
    expect(linkRels).toContain('root');
    expect(linkRels).toContain('parent');

    // Validate link structure
    response.body.links.forEach(link => {
      expect(link).toHaveProperty('rel');
      expect(link).toHaveProperty('href');
      expect(link).toHaveProperty('type');
      expect(link).toHaveProperty('title');
      expect(typeof link.href).toBe('string');
      expect(link.href.length).toBeGreaterThan(0);
    });
  });

  test('GET /health returns 503 when DB ping fails', async () => {
    db.ping.mockResolvedValue({ ok: false, code: 'ECONN', message: 'nope' });

    const response = await request(app).get('/health');
    expect(response.status).toBe(503);
    expect(response.body.status).toBe('degraded');
    expect(response.body.ready).toBe(false);
    expect(response.body.checks.db.status).toBe('error');
  });
});