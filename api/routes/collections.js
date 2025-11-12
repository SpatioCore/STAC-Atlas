// routes/collections.js (CommonJS)
const express = require('express');
const router = express.Router();


// In-Memory "DB" (nur für frühe Tests) — später durch echte SQL ersetzen     

const SAMPLE = [
  {
    id: 'sentinel-2-l2a',
    title: 'Sentinel-2 L2A',
    description: 'Surface reflectance',
    license: 'CC-BY-4.0',
    provider: 'ESA',
    keywords: ['sentinel-2', 'optical'],
    doi: '10.1234/s2l2a',
    temporal_extent_start: '2017-03-28T00:00:00Z',
    temporal_extent_end: null,
    spatial_extent_bbox: [-180, -90, 180, 90],
    full_json: {
      id: 'sentinel-2-l2a',
      type: 'Collection',
      stac_version: '1.0.0',
      title: 'Sentinel-2 L2A',
      description: 'Surface reflectance',
      license: 'CC-BY-4.0',
      keywords: ['sentinel-2', 'optical'],
      providers: [{ name: 'ESA', roles: ['producer'] }],
      extent: {
        spatial: { bbox: [[-180, -90, 180, 90]] },
        temporal: { interval: [['2017-03-28T00:00:00Z', null]] }
      },
      links: []
    }
  },
  {
    id: 'landsat-8-l1',
    title: 'Landsat 8 Level-1',
    description: 'Top of atmosphere',
    license: 'PDM',
    provider: 'USGS',
    keywords: ['landsat', 'optical'],
    doi: null,
    temporal_extent_start: '2013-02-11T00:00:00Z',
    temporal_extent_end: null,
    spatial_extent_bbox: [-180, -90, 180, 90],
    full_json: {
      id: 'landsat-8-l1',
      type: 'Collection',
      stac_version: '1.0.0',
      title: 'Landsat 8 Level-1',
      description: 'Top of atmosphere',
      license: 'PDM',
      keywords: ['landsat', 'optical'],
      providers: [{ name: 'USGS', roles: ['producer'] }],
      extent: {
        spatial: { bbox: [[-180, -90, 180, 90]] },
        temporal: { interval: [['2013-02-11T00:00:00Z', null]] }
      },
      links: []
    }
  }
];


// Helpers (Parsing, Fehler, Paging, Filter)                              

const ALLOWED_SORT_FIELDS = ['title', 'id', 'temporal_extent_start', 'license', 'provider'];

function badRequest(message) {
  const err = new Error(message);
  err.status = 400;
  err.code = 'BadRequest';
  return err;
}

function parseLimit(v, def = 20, max = 100) {
  const n = Number(v ?? def);
  return Number.isFinite(n) ? Math.min(Math.max(n, 1), max) : def;
}

function parsePage(v, def = 1) {
  const n = Number(v ?? def);
  return Number.isFinite(n) && n >= 1 ? n : def;
}

function parseBbox(raw) {
  if (!raw) return null;
  const parts = String(raw).split(',').map(Number);
  if (parts.length !== 4 || parts.some(n => !Number.isFinite(n))) {
    throw badRequest('Invalid bbox format. Expected "minX,minY,maxX,maxY".');
  }
  const [minX, minY, maxX, maxY] = parts;
  if (minX >= maxX || minY >= maxY) {
    throw badRequest('Invalid bbox: ensure min < max for both axes.');
  }
  return [minX, minY, maxX, maxY];
}

function parseDatetime(raw) {
  if (!raw) return null;
  const [start, end] = String(raw).split('/');
  if (start && start !== '..' && isNaN(Date.parse(start))) throw badRequest('Invalid datetime start.');
  if (end && end !== '..' && isNaN(Date.parse(end))) throw badRequest('Invalid datetime end.');
  const s = start && start !== '..' ? new Date(start).toISOString() : null;
  const e = end && end !== '..' ? new Date(end).toISOString() : null;
  return [s, e];
}

function parseSort(sortby, allowed) {
  if (!sortby) return [];
  const items = Array.isArray(sortby) ? sortby : String(sortby).split(',');
  return items.map(raw => {
    const dir = raw.startsWith('-') ? 'DESC' : 'ASC';
    const field = raw.replace(/^[-+]/, '');
    if (!allowed.includes(field)) throw badRequest(`Unsupported sort field: ${field}`);
    return { field, dir };
  });
}

function buildPagingLinks(req, { page, limit, total }) {
  const base = `${req.protocol}://${req.get('host')}${req.path}`;
  const url = new URL(base);
  // vorhandene Query-Parameter übernehmen
  for (const [k, v] of Object.entries(req.query)) url.searchParams.set(k, String(v));

  const make = (p) => {
    const u = new URL(url);
    u.searchParams.set('page', String(p));
    u.searchParams.set('limit', String(limit));
    return u.toString();
  };

  const links = [{ rel: 'self', href: make(page), type: 'application/json' }];
  const maxPage = Math.max(1, Math.ceil(total / limit));
  if (page < maxPage) links.push({ rel: 'next', href: make(page + 1), type: 'application/json' });
  if (page > 1) links.push({ rel: 'prev', href: make(page - 1), type: 'application/json' });
  // Root-Link (nice to have)
  links.push({ rel: 'root', href: `${req.protocol}://${req.get('host')}`, type: 'application/json' });
  return links;
}

function intersectsBbox(recBbox, qBbox) {
  const [a1, b1, a2, b2] = recBbox;      // record bbox
  const [x1, y1, x2, y2] = qBbox;        // query bbox
  return !(x2 < a1 || x1 > a2 || y2 < b1 || y1 > b2);
}

/*  GET /collections — STAC-konforme Antwort: { collections, links }          */
/*  Filter: q, bbox, datetime, provider, license, id, doi; Sort: sortby       */
/*  Paging: limit + page → offset                                              */

router.get('/', (req, res, next) => {
  try {
    const limit = parseLimit(req.query.limit);
    const page = parsePage(req.query.page);
    const offset = (page - 1) * limit;

    const bbox = parseBbox(req.query.bbox);
    const datetime = parseDatetime(req.query.datetime);
    const sort = parseSort(req.query.sortby, ALLOWED_SORT_FIELDS);

    // Filter gegen In-Memory-Daten anwenden (später via SQL ersetzen)
    let rows = SAMPLE.slice();

    // einfache Felder
    if (req.query.id) rows = rows.filter(r => r.id === req.query.id);
    if (req.query.doi) rows = rows.filter(r => (r.doi || '') === req.query.doi);
    if (req.query.license) rows = rows.filter(r => (r.license || '').toLowerCase() === String(req.query.license).toLowerCase());
    if (req.query.provider) rows = rows.filter(r => (r.provider || '').toLowerCase() === String(req.query.provider).toLowerCase());

    // Freitext q
    if (req.query.q) {
      const needle = String(req.query.q).toLowerCase();
      rows = rows.filter(r =>
        (r.title || '').toLowerCase().includes(needle) ||
        (r.description || '').toLowerCase().includes(needle) ||
        (r.provider || '').toLowerCase().includes(needle) ||
        (r.keywords || []).some(k => String(k).toLowerCase().includes(needle))
      );
    }

    // bbox
    if (bbox) rows = rows.filter(r => intersectsBbox(r.spatial_extent_bbox, bbox));

    // datetime (Intervall-Überschneidung)
    if (datetime) {
      const [s, e] = datetime; // ISO strings or null
      rows = rows.filter(r => {
        const a = r.temporal_extent_start ? Date.parse(r.temporal_extent_start) : null;
        const b = r.temporal_extent_end ? Date.parse(r.temporal_extent_end) : null;
        const left = s ? Date.parse(s) : -Infinity;
        const right = e ? Date.parse(e) : Infinity;
        const recLeft = a ?? -Infinity;
        const recRight = b ?? Infinity;
        return recLeft <= right && left <= recRight;
      });
    }

    // Sort (stabil, whitelist)
    for (let i = sort.length - 1; i >= 0; i--) {
      const { field, dir } = sort[i];
      rows.sort((A, B) => {
        const a = (A[field] ?? '').toString();
        const b = (B[field] ?? '').toString();
        if (a < b) return dir === 'ASC' ? -1 : 1;
        if (a > b) return dir === 'ASC' ? 1 : -1;
        return 0;
      });
    }

    const total = rows.length;
    const pageRows = rows.slice(offset, offset + limit);

    // STAC-konforme Antwort (keine FeatureCollection!)
    res.json({
      collections: pageRows.map(r => r.full_json),
      links: buildPagingLinks(req, { page, limit, total }),
      // "context" ist optional; kann der UI helfen
      context: { returned: pageRows.length, limit, matched: total }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /collections/:id
 * Returns a single collection by ID
 */
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const hit = SAMPLE.find(r => r.id === id);
  if (!hit) {
    return res.status(404).json({
      code: 'NotFound',
      description: `Collection with id '${id}' not found`,
      id
    });
  }
  res.json(hit.full_json);
});

module.exports = router;
