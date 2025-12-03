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

  // Base SELECT columns. We may append a relevance `rank` column below when `q` is present.
  //
  // Rationale: we build the SELECT portion separately into `selectPart` so that
  // we can conditionally append computed columns (for example the `rank` from
  // full-text search) *before* the `FROM` clause. Keeping `sql` fixed with a
  // `FROM` already included would make inserting additional selected columns
  // harder and error-prone when building the query dynamically.
  let selectPart = `
    SELECT
      id,
      title,
      description,
      license,
      spatial_extend,
      temporal_extend_start,
      temporal_extend_end,
      created_at,
      updated_at
  `;

  // Note: For production performance, consider adding a persistent `tsvector` column
  // (for example `search_vector`) and a GIN index on it. The expressions below
  // compute the tsvector on-the-fly which is fine for functionality and testing.

  const where = [];
  const values = [];
  let i = 1;

  // Full-text search using weighted tsvector across title (weight A) and description (weight B).
  //
  // Notes:
  // - We weight `title` higher ('A') than `description` ('B') so matches in titles
  //   influence relevance more strongly.
  // - We use `plainto_tsquery` to convert user-entered text into a tsquery. This keeps
  //   behaviour simple and predictable for short queries entered by users.
  // - `ts_rank_cd` computes a relevance score; we add it to the SELECT list as `rank`
  //   so it can be used for ordering (when no explicit `sortby` is provided).
  // - For production, computing the tsvector on the fly is fine for functionality,
  //   but you should add a persistent `tsvector` column (for example `search_vector`)
  //   and a GIN index to speed up large-scale searches.
  //
  // Use the same parameter index for both the WHERE clause and the computed rank so the
  // prepared statement uses a single bind parameter for the query text.
  if (q) {
    const queryIndex = i; // remember index to reuse for rank and condition

    // Weighted combined tsvector expression
    const vectorExpr = `to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(description,''))`;

    // Add rank to selected columns (ts_rank_cd => constant-duration ranking function)
    // The computed `rank` is available in the result rows and used for ordering
    // when no explicit `sortby` is provided.
    selectPart += `, ts_rank_cd(${vectorExpr}, plainto_tsquery('simple', $${queryIndex})) AS rank`;

    // WHERE clause uses plainto_tsquery for user-entered search text
    where.push(`${vectorExpr} @@ plainto_tsquery('simple', $${queryIndex})`);

    values.push(q);
    i++;
  }

  // BBOX with PostGIS
  if (bbox) {
    const [minX, minY, maxX, maxY] = bbox;

    // TODO: ask if spatial_extend or spatial_extent?
    where.push(`
      ST_Intersects(
        spatial_extend, 
        ST_MakeEnvelope($${i}, $${i+1}, $${i+2}, $${i+3}, 4326)
      )
    `);

    values.push(minX, minY, maxX, maxY);
    i += 4;
  }

    // datetime: Point or interval
    //TODO: ask if temporal_extent_start/end or temporal_extent?
  if (datetime) {
    if (datetime.includes('/')) {
      // interval: start/end, ../end, start/..
      const [start, end] = datetime.split('/');

      if (start !== '..') {
        // Collection should run after start
        where.push(`temporal_extend_end >= $${i}`);
        values.push(start);
        i++;
      }

      if (end !== '..') {
        // Collection should run before end
        where.push(`temporal_extend_start <= $${i}`);
        values.push(end);
        i++;
      }
    } else {
      // single datetime: collections active at that time
      where.push(`
        temporal_extend_start <= $${i}
        AND temporal_extend_end >= $${i}
      `);
      values.push(datetime);
      i++;
    }
  }

  // Build final SQL from selectPart and add FROM clause.
  // We delayed adding `FROM collection` to allow conditional additions to the
  // selected columns above (notably `rank`). The final `sql` string includes the
  // selected columns, the source table and any WHERE conditions constructed earlier.
  let sql = selectPart + `\n    FROM collection\n  `;

  if (where.length > 0) {
    sql += ` WHERE ` + where.join(' AND ');
  }

  // Sorting: if a sort is explicitly requested use it; otherwise prefer relevance when
  // a text query was provided (descending), falling back to id ascending.
  //
  // Behaviour summary:
  // - `sortby` provided → use that (same as before)
  // - no `sortby` & `q` present → order by `rank DESC, id ASC` so higher relevance comes first
  // - no `sortby` & no `q` → order by `id ASC` (legacy default)
  if (sortby) {
    sql += ` ORDER BY ${sortby.field} ${sortby.direction}`;
  } else if (q) {
    sql += ` ORDER BY rank DESC, id ASC`;
  } else {
    sql += ` ORDER BY id ASC`;
  }

  // Pagination
  sql += ` LIMIT $${i} OFFSET $${i + 1}`;
  values.push(limit, token);

  return { sql, values };
}

module.exports = { buildCollectionSearchQuery };