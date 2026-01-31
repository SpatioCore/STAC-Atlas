const request = require('supertest');
const express = require('express');

// Mock DB module BEFORE importing the router
jest.mock('../db/db_APIconnection', () => ({
  query: jest.fn(),
}));

const db = require('../db/db_APIconnection');

// Import the functions to test by requiring the module
// We'll need to extract and test the internal functions via integration tests
// or expose them for testing. For now, we'll test them through the API endpoints.

describe('Collections Link Processing', () => {
  let app;
  const collectionsRouter = require('../routes/collections');

  beforeEach(() => {
    app = express();
    app.use((req, res, next) => {
      req.requestId = 'test-request-id';
      next();
    });
    app.use('/collections', collectionsRouter);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /collections/:id - Link Resolution', () => {
    test('should include base STAC Atlas links (self, root, parent)', async () => {
      const mockRow = {
        stac_id: 'test-collection',
        source_url: 'https://source.example.com/collection.json',
        full_json: {
          id: 'original-id',
          title: 'Test Collection',
          description: 'A test collection',
          extent: {
            spatial: { bbox: [[-180, -90, 180, 90]] },
            temporal: { interval: [[null, null]] }
          },
          license: 'MIT',
          links: []
        }
      };

      db.query.mockResolvedValue({ rows: [mockRow] });

      const response = await request(app).get('/collections/test-collection');

      expect(response.status).toBe(200);
      expect(response.body.links).toBeDefined();
      expect(Array.isArray(response.body.links)).toBe(true);

      const linkRels = response.body.links.map(l => l.rel);
      expect(linkRels).toContain('self');
      expect(linkRels).toContain('root');
      expect(linkRels).toContain('parent');

      const selfLink = response.body.links.find(l => l.rel === 'self');
      expect(selfLink.href).toContain('/collections/test-collection');
    });

    test('should preserve absolute http URLs from source links', async () => {
      const mockRow = {
        stac_id: 'test-collection',
        source_url: 'https://source.example.com/collection.json',
        full_json: {
          id: 'original-id',
          title: 'Test Collection',
          description: 'A test collection',
          extent: {
            spatial: { bbox: [[-180, -90, 180, 90]] },
            temporal: { interval: [[null, null]] }
          },
          license: 'MIT',
          links: [
            {
              rel: 'item',
              href: 'https://absolute.example.com/items/123.json',
              type: 'application/json',
              title: 'Item 123'
            }
          ]
        }
      };

      db.query.mockResolvedValue({ rows: [mockRow] });

      const response = await request(app).get('/collections/test-collection');

      expect(response.status).toBe(200);
      
      const itemLink = response.body.links.find(l => l.rel === 'item');
      expect(itemLink).toBeDefined();
      expect(itemLink.href).toBe('https://absolute.example.com/items/123.json');
      expect(itemLink.title).toContain('Item 123');
      expect(itemLink.title).toContain('Source Item Reference');
    });

    test('should resolve relative paths using source_url', async () => {
      const mockRow = {
        stac_id: 'test-collection',
        source_url: 'https://source.example.com/collections/my-collection.json',
        full_json: {
          id: 'original-id',
          title: 'Test Collection',
          description: 'A test collection',
          extent: {
            spatial: { bbox: [[-180, -90, 180, 90]] },
            temporal: { interval: [[null, null]] }
          },
          license: 'MIT',
          links: [
            {
              rel: 'item',
              href: './items/item1.json',
              type: 'application/json'
            },
            {
              rel: 'root',
              href: '../../catalog.json',
              type: 'application/json',
              title: 'Root Catalog'
            }
          ]
        }
      };

      db.query.mockResolvedValue({ rows: [mockRow] });

      const response = await request(app).get('/collections/test-collection');

      expect(response.status).toBe(200);
      
      // Item link should be resolved relative to source_url
      const itemLink = response.body.links.find(l => l.rel === 'item');
      expect(itemLink).toBeDefined();
      expect(itemLink.href).toBe('https://source.example.com/collections/items/item1.json');
      expect(itemLink.title).toContain('Source Item Reference');

      // Root link should be prefixed with source_ and resolved
      const sourceRootLink = response.body.links.find(l => l.rel === 'source_root');
      expect(sourceRootLink).toBeDefined();
      expect(sourceRootLink.href).toBe('https://source.example.com/catalog.json');
      expect(sourceRootLink.title).toContain('Original Source Link');
    });

    test('should keep item/items rel unchanged but add source hint to title', async () => {
      const mockRow = {
        stac_id: 'test-collection',
        source_url: 'https://source.example.com/collection.json',
        full_json: {
          id: 'original-id',
          title: 'Test Collection',
          description: 'A test collection',
          extent: {
            spatial: { bbox: [[-180, -90, 180, 90]] },
            temporal: { interval: [[null, null]] }
          },
          license: 'MIT',
          links: [
            {
              rel: 'items',
              href: 'https://source.example.com/items',
              type: 'application/json',
              title: 'Collection Items'
            },
            {
              rel: 'item',
              href: 'https://source.example.com/item/1.json',
              type: 'application/json'
            }
          ]
        }
      };

      db.query.mockResolvedValue({ rows: [mockRow] });

      const response = await request(app).get('/collections/test-collection');

      expect(response.status).toBe(200);
      
      const itemsLink = response.body.links.find(l => l.rel === 'items');
      expect(itemsLink).toBeDefined();
      expect(itemsLink.rel).toBe('items'); // rel unchanged
      expect(itemsLink.title).toBe('Collection Items (Source Item Reference)');

      const itemLink = response.body.links.find(l => l.rel === 'item');
      expect(itemLink).toBeDefined();
      expect(itemLink.rel).toBe('item'); // rel unchanged
      expect(itemLink.title).toBe('Source Item Reference'); // Default title when none provided
    });

    test('should prefix non-item links with source_ and add hint to title', async () => {
      const mockRow = {
        stac_id: 'test-collection',
        source_url: 'https://source.example.com/collection.json',
        full_json: {
          id: 'original-id',
          title: 'Test Collection',
          description: 'A test collection',
          extent: {
            spatial: { bbox: [[-180, -90, 180, 90]] },
            temporal: { interval: [[null, null]] }
          },
          license: 'MIT',
          links: [
            {
              rel: 'license',
              href: 'https://source.example.com/license.txt',
              type: 'text/plain',
              title: 'MIT License'
            },
            {
              rel: 'about',
              href: 'https://source.example.com/about.html',
              type: 'text/html'
            },
            {
              rel: 'child',
              href: './sub-collection.json',
              type: 'application/json',
              title: 'Sub Collection'
            }
          ]
        }
      };

      db.query.mockResolvedValue({ rows: [mockRow] });

      const response = await request(app).get('/collections/test-collection');

      expect(response.status).toBe(200);
      
      const licenseLin = response.body.links.find(l => l.rel === 'source_license');
      expect(licenseLin).toBeDefined();
      expect(licenseLin.href).toBe('https://source.example.com/license.txt');
      expect(licenseLin.title).toBe('MIT License (Original Source Link)');

      const aboutLink = response.body.links.find(l => l.rel === 'source_about');
      expect(aboutLink).toBeDefined();
      expect(aboutLink.href).toBe('https://source.example.com/about.html');
      expect(aboutLink.title).toBe('Original Source about Link'); // Default title

      const childLink = response.body.links.find(l => l.rel === 'source_child');
      expect(childLink).toBeDefined();
      expect(childLink.href).toBe('https://source.example.com/sub-collection.json');
      expect(childLink.title).toBe('Sub Collection (Original Source Link)');
    });

    test('should handle collections with no source links gracefully', async () => {
      const mockRow = {
        stac_id: 'test-collection',
        source_url: 'https://source.example.com/collection.json',
        full_json: {
          id: 'original-id',
          title: 'Test Collection',
          description: 'A test collection',
          extent: {
            spatial: { bbox: [[-180, -90, 180, 90]] },
            temporal: { interval: [[null, null]] }
          },
          license: 'MIT',
          links: null // No links
        }
      };

      db.query.mockResolvedValue({ rows: [mockRow] });

      const response = await request(app).get('/collections/test-collection');

      expect(response.status).toBe(200);
      expect(response.body.links).toBeDefined();
      
      // Should only have our base links
      expect(response.body.links.length).toBe(3); // self, root, parent
      const linkRels = response.body.links.map(l => l.rel);
      expect(linkRels).toEqual(['self', 'root', 'parent']);
    });

    test('should not expose source_links in final output', async () => {
      const mockRow = {
        stac_id: 'test-collection',
        source_url: 'https://source.example.com/collection.json',
        full_json: {
          id: 'original-id',
          title: 'Test Collection',
          description: 'A test collection',
          extent: {
            spatial: { bbox: [[-180, -90, 180, 90]] },
            temporal: { interval: [[null, null]] }
          },
          license: 'MIT',
          links: [
            {
              rel: 'item',
              href: 'https://source.example.com/items/1.json',
              type: 'application/json'
            }
          ]
        }
      };

      db.query.mockResolvedValue({ rows: [mockRow] });

      const response = await request(app).get('/collections/test-collection');

      expect(response.status).toBe(200);
      expect(response.body.source_links).toBeUndefined();
    });

    test('should handle mixed absolute and relative links', async () => {
      const mockRow = {
        stac_id: 'test-collection',
        source_url: 'https://source.example.com/data/collections/col1.json',
        full_json: {
          id: 'original-id',
          title: 'Test Collection',
          description: 'A test collection',
          extent: {
            spatial: { bbox: [[-180, -90, 180, 90]] },
            temporal: { interval: [[null, null]] }
          },
          license: 'MIT',
          links: [
            {
              rel: 'item',
              href: 'https://external.com/items/abc.json',
              type: 'application/json',
              title: 'External Item'
            },
            {
              rel: 'item',
              href: './items/local.json',
              type: 'application/json',
              title: 'Local Item'
            },
            {
              rel: 'parent',
              href: '../catalog.json',
              type: 'application/json',
              title: 'Parent Catalog'
            }
          ]
        }
      };

      db.query.mockResolvedValue({ rows: [mockRow] });

      const response = await request(app).get('/collections/test-collection');

      expect(response.status).toBe(200);
      
      const itemLinks = response.body.links.filter(l => l.rel === 'item');
      expect(itemLinks.length).toBe(2);
      
      const externalItem = itemLinks.find(l => l.href.includes('external.com'));
      expect(externalItem.href).toBe('https://external.com/items/abc.json');
      expect(externalItem.title).toBe('External Item (Source Item Reference)');
      
      const localItem = itemLinks.find(l => l.href.includes('source.example.com'));
      expect(localItem.href).toBe('https://source.example.com/data/collections/items/local.json');
      expect(localItem.title).toBe('Local Item (Source Item Reference)');
      
      const sourceParent = response.body.links.find(l => l.rel === 'source_parent');
      expect(sourceParent).toBeDefined();
      expect(sourceParent.href).toBe('https://source.example.com/data/catalog.json');
      expect(sourceParent.title).toBe('Parent Catalog (Original Source Link)');
    });

    test('should preserve source_url and source_id fields in collection', async () => {
      const mockRow = {
        stac_id: 'atlas-123',
        source_url: 'https://source.example.com/collection.json',
        full_json: {
          id: 'original-source-id',
          title: 'Test Collection',
          description: 'A test collection',
          extent: {
            spatial: { bbox: [[-180, -90, 180, 90]] },
            temporal: { interval: [[null, null]] }
          },
          license: 'MIT',
          links: []
        }
      };

      db.query.mockResolvedValue({ rows: [mockRow] });

      const response = await request(app).get('/collections/atlas-123');

      expect(response.status).toBe(200);
      expect(response.body.id).toBe('atlas-123');
      expect(response.body.stac_id).toBe('atlas-123');
      expect(response.body.source_id).toBe('original-source-id');
      expect(response.body.source_url).toBe('https://source.example.com/collection.json');
    });
  });

  describe('GET /collections - Link Processing in List', () => {
    test('should process links for all collections in list', async () => {
      const mockRows = [
        {
          stac_id: 'collection-1',
          source_url: 'https://source1.com/col1.json',
          full_json: {
            id: 'orig-1',
            title: 'Collection 1',
            description: 'First collection',
            extent: {
              spatial: { bbox: [[-180, -90, 180, 90]] },
              temporal: { interval: [[null, null]] }
            },
            license: 'MIT',
            links: [
              {
                rel: 'item',
                href: 'https://source1.com/items/1.json',
                type: 'application/json'
              }
            ]
          }
        },
        {
          stac_id: 'collection-2',
          source_url: 'https://source2.com/col2.json',
          full_json: {
            id: 'orig-2',
            title: 'Collection 2',
            description: 'Second collection',
            extent: {
              spatial: { bbox: [[-180, -90, 180, 90]] },
              temporal: { interval: [[null, null]] }
            },
            license: 'MIT',
            links: [
              {
                rel: 'license',
                href: './LICENSE',
                type: 'text/plain',
                title: 'License File'
              }
            ]
          }
        }
      ];

      // First call for data, second for count
      db.query
        .mockResolvedValueOnce({ rows: mockRows })
        .mockResolvedValueOnce({ rows: [{ total: 2 }] });

      const response = await request(app).get('/collections');

      expect(response.status).toBe(200);
      expect(response.body.collections).toBeDefined();
      expect(response.body.collections.length).toBe(2);

      // Check first collection
      const col1 = response.body.collections[0];
      expect(col1.id).toBe('collection-1');
      const col1ItemLink = col1.links.find(l => l.rel === 'item');
      expect(col1ItemLink).toBeDefined();
      expect(col1ItemLink.href).toBe('https://source1.com/items/1.json');

      // Check second collection
      const col2 = response.body.collections[1];
      expect(col2.id).toBe('collection-2');
      const col2LicenseLink = col2.links.find(l => l.rel === 'source_license');
      expect(col2LicenseLink).toBeDefined();
      expect(col2LicenseLink.href).toBe('https://source2.com/LICENSE');
      expect(col2LicenseLink.title).toBe('License File (Original Source Link)');
    });
  });
});
