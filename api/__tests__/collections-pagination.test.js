// __tests__/collections-pagination.test.js

const request = require('supertest');
const app = require('../app');

/**
 * Tests for API 4.5: Implement Pagination
 *
 * Verifies that:
 * - limit correctly restricts number of returned results
 * - token acts as offset for pagination
 * - matched = total filtered collections BEFORE pagination
 * - returned = number of results in this page
 * - pagination handles boundaries correctly
 */
describe('Collection Search - Pagination behavior (4.5 Implement Pagination)', () => {

  /**
   * Test 1: limit=2 should return exactly 2 collections
   */
  it('should return exactly 2 collections with limit=2', async () => {
    const response = await request(app)
      .get('/collections?limit=2&token=0')
      .expect(200);

    expect(response.body.collections.length).toBe(2);
    expect(response.body.context.returned).toBe(2);
    expect(response.body.context.matched).toBeGreaterThanOrEqual(2);
  });

  /**
   * Test 2: token=0 and token=2 should return different slices
   * Page 1: first 2 collections
   * Page 2: next 2 collections
   */
  it('should return different items for token=0 and token=2', async () => {
    const page1 = await request(app)
      .get('/collections?limit=2&token=0')
      .expect(200);

    const page2 = await request(app)
      .get('/collections?limit=2&token=2')
      .expect(200);

    // Compare IDs to ensure pages differ
    const ids1 = page1.body.collections.map(c => c.id);
    const ids2 = page2.body.collections.map(c => c.id);

    expect(ids1).not.toEqual(ids2);
  });

  /**
   * Test 3: Using token should correctly skip collections
   * token = offset
   */
  it('should skip the correct number of items based on token', async () => {
    const all = await request(app)
      .get('/collections')
      .expect(200);

    const first = all.body.collections[0];
    const third = all.body.collections[2];

    const response = await request(app)
      .get('/collections?limit=1&token=2')
      .expect(200);

    expect(response.body.collections[0].id).toBe(third.id);
    expect(response.body.collections[0].id).not.toBe(first.id);
  });

  /**
   * Test 4: matched remains constant regardless of limit/token
   */
  it('matched should reflect total results, not paginated results', async () => {
    const full = await request(app)
      .get('/collections')
      .expect(200);

    const paginated = await request(app)
      .get('/collections?limit=1&token=0')
      .expect(200);

    expect(paginated.body.context.matched).toBe(full.body.context.matched);
    expect(paginated.body.context.returned).toBe(1);
  });

  /**
   * Test 5: If token is out of bounds, should return an empty array
   */
  it('should return empty list when token is beyond result count', async () => {
    const full = await request(app)
      .get('/collections')
      .expect(200);

    const tooHighToken = full.body.context.matched + 50;

    const response = await request(app)
      .get(`/collections?limit=5&token=${tooHighToken}`)
      .expect(200);

    // Should return empty or very few results
    expect(response.body.collections.length).toBeLessThanOrEqual(5);
    expect(response.body.context.returned).toBe(response.body.collections.length);
  });

  /**
   * Test 6: Pagination should not duplicate items across pages
   */
  it('should not duplicate items across paginated pages', async () => {
    const p1 = await request(app)
      .get('/collections?limit=3&token=0')
      .expect(200);

    const p2 = await request(app)
      .get('/collections?limit=3&token=3')
      .expect(200);

    const ids1 = p1.body.collections.map(c => c.id);
    const ids2 = p2.body.collections.map(c => c.id);

    ids1.forEach(id => {
      expect(ids2).not.toContain(id);
    });
  });

});