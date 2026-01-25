const request = require('supertest');
const app = require('../app');

describe('GET /collections-queryables', () => {
  it('returns queryables as JSON Schema', async () => {
    const res = await request(app).get('/collections-queryables');

    expect(res.status).toBe(200);

    // content type should be schema+json (may include charset)
    expect(res.headers['content-type']).toMatch(/application\/schema\+json/);

    // basic JSON Schema structure
    expect(res.body).toHaveProperty('$schema');
    expect(res.body).toHaveProperty('$id');
    expect(res.body).toHaveProperty('type', 'object');
    expect(res.body).toHaveProperty('properties');

    // required properties from bid/schema
    expect(res.body.properties).toHaveProperty('id');
    expect(res.body.properties).toHaveProperty('title');
    expect(res.body.properties).toHaveProperty('description');
    expect(res.body.properties).toHaveProperty('license');
    expect(res.body.properties).toHaveProperty('keywords');
    expect(res.body.properties).toHaveProperty('providers');
    expect(res.body.properties).toHaveProperty('stac_extensions');

    // spatial/temporal queryables
    expect(res.body.properties).toHaveProperty('spatial_extent');
    expect(res.body.properties).toHaveProperty('datetime');

    // operators documented (vendor extension)
    expect(res.body.properties.id).toHaveProperty('x-ogc-operators');
    expect(Array.isArray(res.body.properties.id['x-ogc-operators'])).toBe(true);
  });
});