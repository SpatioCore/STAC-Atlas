// __tests__/collections-sort.test.js

const request = require('supertest');
const app = require('../app');

/**
 * Tests for API 4.4: Implement Sorting
 * 
 * Verifies that the collection search endpoint correctly:
 * - Sorts results by specified field (title, id, license, created, updated)
 * - Handles ascending (+field) and descending (-field) order
 * - Defaults to ascending when no prefix specified
 */
describe('Collection Search - Sorting behavior (4.4 Implement Sorting)', () => {
  
  /**
   * Test 1: Ascending sort by title with explicit + prefix
   * Ensures +title correctly sorts titles A-Z
   */
  it('should sort ascending by title with +title', async () => {
    const response = await request(app)
      .get('/collections?sortby=%2Btitle')
      .expect(200);

    const titles = response.body.collections.map(c => c.title);
    const sorted = titles.slice().sort((a, b) => a.localeCompare(b));
    expect(titles).toEqual(sorted);
  });

  /**
   * Test 2: Descending sort by title with - prefix
   * Ensures -title correctly sorts titles Z-A
   */
  it('should sort descending by title with -title', async () => {
    const response = await request(app)
      .get('/collections?sortby=-title')
      .expect(200);

    const titles = response.body.collections.map(c => c.title);
    const sortedDesc = titles.slice().sort((a, b) => b.localeCompare(a));
    expect(titles).toEqual(sortedDesc);
  });

  /**
   * Test 3: Ascending sort by id with explicit + prefix
   * Verifies that +id sorts collection IDs in ascending order
   */
  it('should sort ascending by id with +id', async () => {
    const response = await request(app)
      .get('/collections?sortby=%2Bid')
      .expect(200);

    const ids = response.body.collections.map(c => c.id);
    const sorted = ids.slice().sort((a, b) => a.localeCompare(b));
    expect(ids).toEqual(sorted);
  });

  /**
   * Test 4: Descending sort by id with - prefix
   * Verifies that -id sorts collection IDs in descending order
   */
  it('should sort descending by id with -id', async () => {
    const response = await request(app)
      .get('/collections?sortby=-id')
      .expect(200);

    const ids = response.body.collections.map(c => c.id);
    const sortedDesc = ids.slice().sort((a, b) => b.localeCompare(a));
    expect(ids).toEqual(sortedDesc);
  });

  /**
   * Test 5: Ascending sort by license with explicit + prefix
   * Ensures +license correctly sorts licenses from A-Z
   */
  it('should sort ascending by license with +license', async () => {
    const response = await request(app)
      .get('/collections?sortby=%2Blicense')
      .expect(200);

    const licenses = response.body.collections.map(c => c.license);
    const sorted = licenses.slice().sort((a, b) => a.localeCompare(b));
    expect(licenses).toEqual(sorted);
  });

  /**
   * Test 6: Descending sort by license with - prefix
   * Ensures -license correctly sorts licenses from Z-A
   */
  it('should sort descending by license with -license', async () => {
    const response = await request(app)
      .get('/collections?sortby=-license')
      .expect(200);

    const licenses = response.body.collections.map(c => c.license);
    const sortedDesc = licenses.slice().sort((a, b) => b.localeCompare(a));
    expect(licenses).toEqual(sortedDesc);
  });

  /**
   * Test 7: Default to ascending when no prefix provided
   * Ensures that sortby=title (without +/-) defaults to ascending order
   */
  it('should default to ascending when no prefix provided', async () => {
    const response = await request(app)
      .get('/collections?sortby=title')
      .expect(200);

    const titles = response.body.collections.map(c => c.title);
    const sorted = titles.slice().sort((a, b) => a.localeCompare(b));
    expect(titles).toEqual(sorted);
  });
});