const request = require('supertest');
const app = require('../app');

describe('GET /collections/:id - Single collection retrieval', () => {

  /**
   * Helper: fetch a valid collection id via the public /collections endpoint.
   * This avoids hard-coding any specific id from the database.
   */
  async function getAnyExistingCollectionId() {
    const res = await request(app)
      .get('/collections?limit=1&token=0')
      .expect(200);

    expect(Array.isArray(res.body.collections)).toBe(true);
    expect(res.body.collections.length).toBeGreaterThan(0);

    return res.body.collections[0].id;
  }

  test('should return a single collection with matching id and STAC-style links', async () => {
    const existingId = await getAnyExistingCollectionId();

    const res = await request(app)
      .get(`/collections/${existingId}`)
      .expect(200);

    const collection = res.body;

    // id should match
    expect(collection).toBeDefined();
    expect(collection.id).toBe(existingId);

    // basic structure
    expect(collection).toHaveProperty('title');
    expect(collection).toHaveProperty('license');
    

    // links should be an array with self, root and parent
    expect(Array.isArray(collection.links)).toBe(true);

    const rels = collection.links.map(l => l.rel);

    expect(rels).toContain('self');
    expect(rels).toContain('root');
    expect(rels).toContain('parent');

    // self link should point to this resource
    const selfLink = collection.links.find(l => l.rel === 'self');
    expect(selfLink).toBeDefined();
    expect(selfLink.href).toContain(`/collections/${existingId}`);
  });

  test('should return 404 for an invalid (non-numeric) id', async () => {
    const res = await request(app)
      .get('/collections/not-a-number')
      .expect(404);

    //at least expect an error code and message.
    expect(res.body).toHaveProperty('code');
    expect(res.body).toHaveProperty('description');
    expect(res.body.code).toBe('InvalidParameter');
    expect(res.body.description).toMatch(/id/i);
  });

  test('should return 404 for a non-existing numeric id', async () => {
    // use a very large id that is unlikely to exist
    const nonExistingId = 999999999;

    const res = await request(app)
      .get(`/collections/${nonExistingId}`)
      .expect(404);

    expect(res.body).toHaveProperty('code', 'NotFound');
    expect(res.body).toHaveProperty('description');
    expect(res.body.description).toMatch(/not found/i);
    expect(res.body).toHaveProperty('id', String(nonExistingId));
  });
});