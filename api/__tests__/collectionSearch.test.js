// __tests__/collectionSearch.test.js

const request = require('supertest');
const app = require('../app');

describe('Collection Search API - Query Parameters', () => {
  
  describe('GET /collections - Parameter Validation', () => {
    
    // ========== Successful Requests ==========
    
    it('should accept request without any parameters', async () => {
      const response = await request(app)
        .get('/collections')
        .expect(200);

      expect(response.body).toHaveProperty('collections');
      expect(response.body).toHaveProperty('context');
      expect(response.body.context.limit).toBe(10); // default limit
    });

    it('should accept valid limit parameter', async () => {
      const response = await request(app)
        .get('/collections?limit=5')
        .expect(200);
      
      expect(response.body.context.limit).toBe(5);
      expect(response.body.collections.length).toBeLessThanOrEqual(5);
    });

    it('should accept valid token parameter', async () => {
      const response = await request(app)
        .get('/collections?token=10')
        .expect(200);
      
      expect(response.body).toHaveProperty('collections');
    });

    it('should accept limit and token together', async () => {
      const response = await request(app)
        .get('/collections?limit=3&token=0')
        .expect(200);
      
      expect(response.body.context.limit).toBe(3);
      expect(response.body.collections.length).toBeLessThanOrEqual(3);
    });

    it('should accept valid q parameter', async () => {
      const response = await request(app)
        .get('/collections?q=test')
        .expect(200);
      
      expect(response.body).toHaveProperty('collections');
    });

    it('should accept valid bbox parameter', async () => {
      const response = await request(app)
        .get('/collections?bbox=-10,40,10,50')
        .expect(200);
      
      expect(response.body).toHaveProperty('collections');
    });

    it('should accept valid datetime parameter', async () => {
      const response = await request(app)
        .get('/collections?datetime=2020-01-01/2021-12-31')
        .expect(200);
      
      expect(response.body).toHaveProperty('collections');
    });

    it('should accept valid sortby parameter', async () => {
      const response = await request(app)
        .get('/collections?sortby=-created')
        .expect(200);
      
      expect(response.body).toHaveProperty('collections');
    });

    it('should accept multiple parameters combined', async () => {
      const response = await request(app)
        .get('/collections?q=test&limit=5&sortby=%2Btitle')
        .expect(200);
      
      expect(response.body.context.limit).toBe(5);
      expect(response.body).toHaveProperty('collections');
    });

    // ========== Limit Parameter Validation ==========
    
    it('should reject limit less than 1', async () => {
      const response = await request(app)
        .get('/collections?limit=0')
        .expect(400);
      
      expect(response.body.code).toBe('InvalidParameterValue');
      expect(response.body.description).toContain('limit');
      expect(response.body.description).toContain('at least 1');
    });

    it('should reject negative limit', async () => {
      const response = await request(app)
        .get('/collections?limit=-5')
        .expect(400);
      
      expect(response.body.code).toBe('InvalidParameterValue');
      expect(response.body.description).toContain('limit');
    });

    it('should reject limit exceeding maximum', async () => {
      const response = await request(app)
        .get('/collections?limit=10001')
        .expect(400);
      
      expect(response.body.code).toBe('InvalidParameterValue');
      expect(response.body.description).toContain('limit');
      expect(response.body.description).toContain('10000');
    });

    it('should reject non-numeric limit', async () => {
      const response = await request(app)
        .get('/collections?limit=abc')
        .expect(400);
      
      expect(response.body.code).toBe('InvalidParameterValue');
      expect(response.body.description).toContain('limit');
      expect(response.body.description).toContain('integer');
    });

    // ========== Token Parameter Validation ==========
    
    it('should reject negative token', async () => {
      const response = await request(app)
        .get('/collections?token=-10')
        .expect(400);
      
      expect(response.body.code).toBe('InvalidParameterValue');
      expect(response.body.description).toContain('token');
      expect(response.body.description).toContain('non-negative');
    });

    it('should reject non-numeric token', async () => {
      const response = await request(app)
        .get('/collections?token=abc')
        .expect(400);
      
      expect(response.body.code).toBe('InvalidParameterValue');
      expect(response.body.description).toContain('token');
      expect(response.body.description).toContain('integer');
    });

    // ========== Q Parameter Validation ==========
    
    it('should reject q exceeding max length', async () => {
      const longString = 'a'.repeat(501);
      const response = await request(app)
        .get(`/collections?q=${longString}`)
        .expect(400);
      
      expect(response.body.code).toBe('InvalidParameterValue');
      expect(response.body.description).toContain('q');
      expect(response.body.description).toContain('500');
    });

    // ========== Bbox Parameter Validation ==========
    
    it('should reject bbox with wrong number of coordinates', async () => {
      const response = await request(app)
        .get('/collections?bbox=1,2,3')
        .expect(400);
      
      expect(response.body.code).toBe('InvalidParameterValue');
      expect(response.body.description).toContain('bbox');
      expect(response.body.description).toContain('4 coordinates');
    });

    it('should reject bbox with invalid numeric values', async () => {
      const response = await request(app)
        .get('/collections?bbox=a,b,c,d')
        .expect(400);
      
      expect(response.body.code).toBe('InvalidParameterValue');
      expect(response.body.description).toContain('bbox');
      expect(response.body.description).toContain('numeric');
    });

    it('should reject bbox where minX >= maxX', async () => {
      const response = await request(app)
        .get('/collections?bbox=10,40,10,50')
        .expect(400);
      
      expect(response.body.code).toBe('InvalidParameterValue');
      expect(response.body.description).toContain('bbox');
      expect(response.body.description).toContain('minX must be less than maxX');
    });

    it('should reject bbox where minY >= maxY', async () => {
      const response = await request(app)
        .get('/collections?bbox=-10,50,10,50')
        .expect(400);
      
      expect(response.body.code).toBe('InvalidParameterValue');
      expect(response.body.description).toContain('bbox');
      expect(response.body.description).toContain('minY must be less than maxY');
    });

    it('should reject bbox with longitude out of range', async () => {
      const response = await request(app)
        .get('/collections?bbox=-181,40,10,50')
        .expect(400);
      
      expect(response.body.code).toBe('InvalidParameterValue');
      expect(response.body.description).toContain('bbox');
      expect(response.body.description).toContain('longitude');
    });

    it('should reject bbox with latitude out of range', async () => {
      const response = await request(app)
        .get('/collections?bbox=-10,91,10,50')
        .expect(400);
      
      expect(response.body.code).toBe('InvalidParameterValue');
      expect(response.body.description).toContain('bbox');
      expect(response.body.description).toContain('latitude');
    });

    // ========== Datetime Parameter Validation ==========
    
    it('should reject invalid datetime format', async () => {
      const response = await request(app)
        .get('/collections?datetime=not-a-date')
        .expect(400);
      
      expect(response.body.code).toBe('InvalidParameterValue');
      expect(response.body.description).toContain('datetime');
      expect(response.body.description).toContain('ISO8601');
    });

    it('should reject datetime interval with multiple separators', async () => {
      const response = await request(app)
        .get('/collections?datetime=2019/2020/2021')
        .expect(400);
      
      expect(response.body.code).toBe('InvalidParameterValue');
      expect(response.body.description).toContain('datetime');
      expect(response.body.description).toContain('separator');
    });

    it('should reject fully unbounded datetime interval', async () => {
      const response = await request(app)
        .get('/collections?datetime=../..')
        .expect(400);
      
      expect(response.body.code).toBe('InvalidParameterValue');
      expect(response.body.description).toContain('datetime');
      expect(response.body.description).toContain('unbounded');
    });

    // ========== Sortby Parameter Validation ==========
    
    it('should reject unsupported sortby field', async () => {
      const response = await request(app)
        .get('/collections?sortby=invalid_field')
        .expect(400);
      
      expect(response.body.code).toBe('InvalidParameterValue');
      expect(response.body.description).toContain('sortby');
      expect(response.body.description).toContain('not supported');
    });

    // ========== Multiple Error Handling ==========
    
    it('should return all validation errors combined', async () => {
      const response = await request(app)
        .get('/collections?limit=0&token=-5')
        .expect(400);
      
      expect(response.body.code).toBe('InvalidParameterValue');
      expect(response.body.description).toContain('limit');
      expect(response.body.description).toContain('token');
      // Errors should be separated by semicolon
      expect(response.body.description).toContain(';');
    });
  });

  describe('GET /collections - Pagination Behavior', () => {
    
    it('should return correct number of items with limit', async () => {
      const response = await request(app)
        .get('/collections?limit=2')
        .expect(200);
      
      expect(response.body.collections.length).toBeLessThanOrEqual(2);
      expect(response.body.context.limit).toBe(2);
    });

    it('should include next link when more results available', async () => {
      const response = await request(app)
        .get('/collections?limit=2')
        .expect(200);
      
      const links = response.body.links;
      const nextLink = links.find(link => link.rel === 'next');
      
      // Only check for next link if there are more items than limit
      if (response.body.context.matched > response.body.context.limit) {
        expect(nextLink).toBeDefined();
        expect(nextLink.href).toContain('token=');
      }
    });

    it('should include prev link when not on first page', async () => {
      const response = await request(app)
        .get('/collections?limit=2&token=2')
        .expect(200);
      
      const links = response.body.links;
      const prevLink = links.find(link => link.rel === 'prev');
      
      expect(prevLink).toBeDefined();
      expect(prevLink.href).toContain('token=');
    });

    it('should include self link with current parameters', async () => {
      const response = await request(app)
        .get('/collections?limit=5&token=10')
        .expect(200);
      
      const links = response.body.links;
      const selfLink = links.find(link => link.rel === 'self');
      
      expect(selfLink).toBeDefined();
      expect(selfLink.href).toContain('limit=5');
      expect(selfLink.href).toContain('token=10');
    });

    it('should return context with correct counts', async () => {
      const response = await request(app)
        .get('/collections?limit=3')
        .expect(200);
      
      const context = response.body.context;
      expect(context).toHaveProperty('returned');
      expect(context).toHaveProperty('limit', 3);
      expect(context).toHaveProperty('matched');
      expect(context.returned).toBeLessThanOrEqual(context.limit);
      expect(context.returned).toBeLessThanOrEqual(context.matched);
    });

    it('should handle token beyond available results', async () => {
      const response = await request(app)
        .get('/collections?limit=10&token=999999')
        .expect(200);
      
      expect(response.body.collections).toHaveLength(0);
      expect(response.body.context.returned).toBe(0);
    });
  });

  describe('GET /collections - Response Format', () => {
    
    it('should return valid FeatureCollection structure', async () => {
      const response = await request(app)
        .get('/collections')
        .expect(200);
      
      expect(response.body).toMatchObject({
        collections: expect.any(Array),
        links: expect.any(Array),
        context: {
          returned: expect.any(Number),
          limit: expect.any(Number),
          matched: expect.any(Number)
        }
      });
    });

    it('should include required link relations', async () => {
      const response = await request(app)
        .get('/collections')
        .expect(200);
      
      const links = response.body.links;
      const linkRels = links.map(link => link.rel);
      
      expect(linkRels).toContain('self');
      expect(linkRels).toContain('root');
    });

    it('should return collections as array', async () => {
      const response = await request(app)
        .get('/collections')
        .expect(200);
      
      expect(Array.isArray(response.body.collections)).toBe(true);
    });
  });
});
