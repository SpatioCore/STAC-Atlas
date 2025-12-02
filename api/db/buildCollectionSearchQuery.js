// api/db/buildCollectionSearchQuery.js

/**
 * Build SQL + params dynamically for /collections search
 */
function buildCollectionSearchQuery(params) {
  const {
    q,
    bbox,
    datetime,
    sortby,
    limit,
    token
  } = params;

  let sql = `
    SELECT
      id,
      title,
      description,
      license,
      spatial_extent,
      temporal_extent_start,
      temporal_extent_end,
      created,
      updated
    FROM collection
  `;

  const where = [];
  const values = [];
  let i = 1;

  // Free-text search
  if (q) {
    where.push(`(title ILIKE $${i} OR description ILIKE $${i})`);
    values.push(`%${q}%`);
    i++;
  }

  // BBOX with PostGIS
  if (bbox) {
    const [minX, minY, maxX, maxY] = bbox;

    where.push(`
      ST_Intersects(
        spatial_extent,
        ST_MakeEnvelope($${i}, $${i+1}, $${i+2}, $${i+3}, 4326)
      )
    `);

    values.push(minX, minY, maxX, maxY);
    i += 4;
  }

    // datetime: Point or interval
  if (datetime) {
    if (datetime.includes('/')) {
      // interval: start/end, ../end, start/..
      const [start, end] = datetime.split('/');

      if (start !== '..') {
        // Collection should run after start
        where.push(`temporal_extent_end >= $${i}`);
        values.push(start);
        i++;
      }

      if (end !== '..') {
        // Collection should run before end
        where.push(`temporal_extent_start <= $${i}`);
        values.push(end);
        i++;
      }
    } else {
      // single datetime: collections active at that time
      where.push(`
        temporal_extent_start <= $${i}
        AND temporal_extent_end >= $${i}
      `);
      values.push(datetime);
      i++;
    }
  }

  if (where.length > 0) {
    sql += ` WHERE ` + where.join(' AND ');
  }

  // Sorting
  if (sortby) {
    sql += ` ORDER BY ${sortby.field} ${sortby.direction}`;
  } else {
    sql += ` ORDER BY id ASC`;
  }

  // Pagination
  sql += ` LIMIT $${i} OFFSET $${i + 1}`;
  values.push(limit, token);

  return { sql, values };
}

module.exports = { buildCollectionSearchQuery };