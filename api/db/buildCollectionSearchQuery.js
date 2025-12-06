
/* function buildCollectionSearchQuery
 * Dynamically constructs a parameterized SQL query for the /collections endpoint.
 *
 * This function converts validated API search parameters into a safe, optimized,
 * database-ready SQL statement. It supports multiple filter types (full-text, spatial,
 * temporal), dynamic SELECT column injection (rank), sorting and pagination.
 *
* The SELECT part focuses on the core STAC collection metadata, as described in the bid
 * and the database schema:
 * - id, stac_version, type, title, description, license
 * - spatial_extend, temporal_extend_start, temporal_extend_end
 * - created_at, updated_at, is_api, is_active
 * - full_json (complete STAC Collection document as JSONB)
 *
 * @param {Object} params
 * @param {string|undefined} params.q
 *       Full-text search query. Currently searches in:
 *        - collection.title
 *        - collection.description
 *
 *        The bid requires full-text search across title, description and keywords
 *        (and possibly providers). Integration of keywords/providers into the
 *        tsvector (via join or dedicated search_vector column) is planned as a
 *        follow-up refinement. 
 *
 * Note: Keywords are not yet part of the full-text vector. They will be added 
 * in a follow-up step once the database exposes a canonical keyword aggregation
 * 
 * When `q` is present, a tsvector is built from title/description
 *        using the same expression as the GIN index
 *        (to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(description,''))).
 *        We use plainto_tsquery('simple', $n) and add ts_rank_cd(...) AS rank
 *        to the SELECT list so we can order by relevance.
 *
 @param {number[]|undefined} params.bbox
 *        Spatial filter as [minX, minY, maxX, maxY] in EPSG:4326.
 *        When present, the query adds:
 *        ST_Intersects(spatial_extend, ST_MakeEnvelope($x, $y, $z, $w, 4326))
 *
 * @param {string|undefined} params.datetime
 *        Temporal filter in ISO8601:
 *        - single instant: "2020-01-01T00:00:00Z"
 *        - closed interval: "2019-01-01/2021-12-31"
 *        - open start/end: "../2021-12-31" or "2019-01-01/.."
 *
 *        The collection is matched if its temporal_extend_start/temporal_extend_end
 *        overlap the requested interval.
 *
 * @param {{field: string, direction: 'ASC'|'DESC'}|undefined} params.sortby
 *        Normalized sort description. Field is restricted to an allowed
 *        whitelist (id, title, license, created_at, updated_at, …).
 *        If provided, ORDER BY <field> <direction> is used.
 *        If omitted and `q` is present, results are ordered by rank DESC, id ASC.
 *        If omitted and `q` is not present, results are ordered by id ASC.
 *
 * @param {number} params.limit
 *        Maximum number of rows to return. Already validated to be
 *        within [1, 10000]. Translated to LIMIT $n.
 *
 * @param {number} params.token
 *        Offset for pagination (0-based). Translated to OFFSET $n.
 *
 * @returns {{ sql: string, values: any[] }}
 *          sql    – complete parameterized SQL string
 *          values – array of bind parameters in the correct order
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
      stac_version,
      type,
      title,
      description,
      license,
      spatial_extend,
      temporal_extend_start,
      temporal_extend_end,
      created_at,
      updated_at,
      is_api,
      is_active,
      full_json
  `;
  
  const where = [];
  const values = [];
  let i = 1;

  // Full-text search using weighted tsvector across title (weight A) and description (weight B).
  //
  // Notes:
  // - Currently only title and description are included in the weighted tsvector.
  //   Collection keywords must also participate in full-text search.
  //   This will be added once the database team finalizes how keywords should be aggregated (JOIN + string_agg or dedicated tsvector).
  // - We use `plainto_tsquery` to convert user-entered text into a tsquery. This keeps
  //   behaviour simple and predictable for short queries entered by users.
  // - `ts_rank_cd` computes a relevance score; we add it to the SELECT list as `rank`
  //   so it can be used for ordering (when no explicit `sortby` is provided).
  // - currently we are using on-the-fly tsvector expressions (matching to the 05_indexes.sql):
  //   A persistant tsvector collumn could be added later for large-scale indexing (watch Database Issues)
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

    where.push(`
      ST_Intersects(
        spatial_extend, 
        ST_MakeEnvelope($${i}, $${i + 1}, $${i + 2}, $${i + 3}, 4326)
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

  // Pagination (only add if limit is provided)
  if (limit !== null && limit !== undefined) {
    sql += ` LIMIT $${i} OFFSET $${i + 1}`;
    values.push(limit, token || 0);
  }

  return { sql, values };
}

module.exports = { buildCollectionSearchQuery };
