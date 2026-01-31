const request = require('supertest');
const express = require('express');
const healthRouter = require('../routes/health');

describe('Health Check Endpoint', () => {
    let app;

    beforeEach(() => {
        app = express();
        app.use(healthRouter);
    });

    test('GET /health returns 200 status code', async () => {
        const response = await request(app).get('/health');
        expect(response.status).toBe(200);
    });

    test('GET /health returns json content type', async () => {
        const response = await request(app).get('/health');
        expect(response.type).toBe('application/json');
    });

    test('GET /health response contains status field with value "ok"', async () => {
        const response = await request(app).get('/health');
        expect(response.body.status).toBe('ok');
    });

    test('GET /health response contains timestamp in ISO format', async () => {
        const response = await request(app).get('/health');
        expect(response.body.timestamp).toBeDefined();
        expect(new Date(response.body.timestamp).toISOString()).toBe(response.body.timestamp);
    });

    test('GET /health response contains service name', async () => {
        const response = await request(app).get('/health');
        expect(response.body.service).toBe('STAC Atlas API');
    });

    test('GET /health response has all required fields', async () => {
        const response = await request(app).get('/health');
        expect(response.body).toHaveProperty('status');
        expect(response.body).toHaveProperty('timestamp');
        expect(response.body).toHaveProperty('service');
    });
});