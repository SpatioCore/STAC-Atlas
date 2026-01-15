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

  test('should return 400 for invalid characters in id', async () => {
    const res = await request(app)
      .get('/collections/invalid id with spaces')
      .expect(400);

    expect(res.body).toHaveProperty('code', 'InvalidParameter');
    expect(res.body).toHaveProperty('detail');
    expect(res.body.detail).toMatch(/invalid characters/i);
    expect(res.body).toHaveProperty('parameter', 'id');
  });

  test('should return 400 for id exceeding length limit', async () => {
    const longId = 'a'.repeat(257); // 257 characters, exceeds 256 limit

    const res = await request(app)
      .get(`/collections/${longId}`)
      .expect(400);

    expect(res.body).toHaveProperty('code', 'InvalidParameter');
    expect(res.body.detail).toMatch(/too long/i);
    expect(res.body).toHaveProperty('parameter', 'id');
  });

  test('should accept valid STAC-style collection ids', async () => {
    // These should pass validation but return 404 since they don't exist
    const validIds = ['GeosoftwareII', 'my.collection_01', 'abc123'];

    for (const id of validIds) {
      const res = await request(app)
        .get(`/collections/${id}`)
        .expect(404);

      expect(res.body).toHaveProperty('code', 'NotFound');
    }
  });

  test('should return 404 for non-existing numeric id', async () => {
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
