const request = require('supertest');
const app = require('../app');

describe('STAC API Core Endpoints', () => {
  describe('GET /', () => {
    it('should return the landing page with STAC catalog structure', async () => {
      const response = await request(app).get('/').expect(200);

      // Make sure the response has the correct structure of a STAC Catalog
      expect(response.body).toHaveProperty('type', 'Catalog');
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('title');
      expect(response.body).toHaveProperty('description');
      expect(response.body).toHaveProperty('stac_version');
      expect(response.body).toHaveProperty('conformsTo');
      expect(response.body).toHaveProperty('links');
      expect(Array.isArray(response.body.links)).toBe(true);
    });

    it('should include required links in landing page', async () => {
      const response = await request(app).get('/').expect(200);

      const links = response.body.links;
      const linkRels = links.map(link => link.rel);

      expect(linkRels).toContain('self');
      expect(linkRels).toContain('root');
      expect(linkRels).toContain('service-doc');
      expect(linkRels).toContain('service-desc');
      expect(linkRels).toContain('conformance');
      expect(linkRels).toContain('data');
    });

	
	it('should expose the same conformance classes as the /conformance endpoint', async () => {
	  const [landingRes, confRes] = await Promise.all([
		request(app).get('/').expect(200),
		request(app).get('/conformance').expect(200)
	  ]);

	  const landingConformance = landingRes.body.conformsTo;
	  const endpointConformance = confRes.body.conformsTo;

	  // both must be arrays
	  expect(Array.isArray(landingConformance)).toBe(true);
	  expect(Array.isArray(endpointConformance)).toBe(true);

	  // support function: sort, so that the order doesn't matter
	  const sortStrings = arr => [...arr].sort();

	  expect(sortStrings(landingConformance)).toEqual(
		sortStrings(endpointConformance)
	  );
	});
  });

  describe('GET /conformance', () => {
    it('should return conformance classes', async () => {
      const response = await request(app).get('/conformance').expect(200);

      expect(response.body).toHaveProperty('conformsTo');
      expect(Array.isArray(response.body.conformsTo)).toBe(true);
      expect(response.body.conformsTo.length).toBeGreaterThan(0);
    });

    it('should include STAC API Core conformance', async () => {
      const response = await request(app).get('/conformance').expect(200);

      expect(response.body.conformsTo).toContain('https://api.stacspec.org/v1.0.0/core');
    });
  });

  describe('GET /collections', () => {
    it('should return a FeatureCollection structure', async () => {
      const response = await request(app).get('/collections').expect(200);

      expect(response.body).toHaveProperty('type', 'FeatureCollection');
      expect(response.body).toHaveProperty('collections');
      expect(response.body).toHaveProperty('links');
      expect(response.body).toHaveProperty('context');
      expect(Array.isArray(response.body.collections)).toBe(true);
    });

    it('should include pagination context', async () => {
      const response = await request(app).get('/collections').expect(200);

      expect(response.body.context).toHaveProperty('returned');
      expect(response.body.context).toHaveProperty('limit');
      expect(response.body.context).toHaveProperty('matched');
    });
  });

  describe('GET /queryables', () => {
    it('should return queryables schema', async () => {
      const response = await request(app).get('/queryables').expect(200);

      expect(response.body).toHaveProperty('$schema');
      expect(response.body).toHaveProperty('type', 'object');
      expect(response.body).toHaveProperty('properties');
    });

    it('should include standard STAC queryable fields', async () => {
      const response = await request(app).get('/queryables').expect(200);

      const properties = response.body.properties;
      expect(properties).toHaveProperty('id');
      expect(properties).toHaveProperty('title');
      expect(properties).toHaveProperty('description');
      expect(properties).toHaveProperty('keywords');
      expect(properties).toHaveProperty('license');
    });
  });

  describe('404 Handling', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app).get('/non-existent-route').expect(404);

      expect(response.body).toHaveProperty('code');
      expect(response.body).toHaveProperty('description');
    });
  });

  describe('GET /collections/:id', () => {
    it('should return 404 for non-existent collection', async () => {
      const response = await request(app).get('/collections/non-existent-id').expect(404);

      expect(response.body).toHaveProperty('code', 'NotFound');
      expect(response.body).toHaveProperty('description');
      expect(response.body).toHaveProperty('id', 'non-existent-id');
    });
  });
});
