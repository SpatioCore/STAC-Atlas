
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
 * @param {number[]|undefined} params.bbox
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
 * @param {string|undefined} params.provider
 *        Provider name to filter collections by their provider (case-insensitive match).
 *
 * @param {string|undefined} params.license
 *        License identifier to filter collections by `collection.license`.
 * 
 * @param {{sql: string, values: any[]}|undefined} params.cqlFilter
 *        Pre-parsed CQL2 filter SQL fragment and values.
 *        The SQL fragment uses 1-based placeholders ($1, $2...) relative to its own values.
 *        This function will re-index them to match the main query's parameter sequence.
 *
 * @returns {{ sql: string, values: any[] }}
 *          sql    – complete parameterized SQL string
 *          values – array of bind parameters in the correct order
 */

function buildCollectionSearchQuery(params) {
  const {
    id,
    q,
    bbox,
    datetime,
    provider,
    license,
    sortby,
    limit,
    token,
    cqlFilter
  } = params;

  // Base SELECT columns. We may append a relevance `rank` column below when `q` is present.
  //
  // Rationale: we build the SELECT portion separately into `selectPart` so that
  // we can conditionally append computed columns (for example the `rank` from
  // full-text search) *before* the `FROM` clause. Keeping `sql` fixed with a
  // `FROM` already included would make inserting additional selected columns
  // harder and error-prone when building the query dynamically.
  //
  // We use alias 'c' for the collection table to simplify JOIN expressions and
  // distinguish collection columns from aggregated relation data (keywords, providers, etc.).
  let selectPart = `
    SELECT
      c.id,
      c.stac_version,
      c.type,
      c.title,
      c.description,
      c.license,
      c.spatial_extend,
      c.temporal_extend_start,
      c.temporal_extend_end,
      c.created_at,
      c.updated_at,
      c.is_api,
      c.is_active,
      c.full_json,
      kw.keywords,
      ext.stac_extensions,
      prov.providers,
      a.assets,
      s.summaries,
      cl.last_crawled
  `;

  const where = [];
  const values = [];
  let i = 1;

  if (id !== undefined && id !== null) {
    where.push(`id = $${i}`);
    values.push(id);
    i++;
  }

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

    // Weighted combined tsvector expression (using alias 'c' for collection table)
    const vectorExpr = `to_tsvector('simple', coalesce(c.title,'') || ' ' || coalesce(c.description,''))`;

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
        c.spatial_extend, 
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
        where.push(`c.temporal_extend_end >= $${i}`);
        values.push(start);
        i++;
      }

      if (end !== '..') {
        // Collection should run before end
        where.push(`c.temporal_extend_start <= $${i}`);
        values.push(end);
        i++;
      }
    } else {
      // single datetime: collections active at that time
      where.push(`
        c.temporal_extend_start <= $${i}
        AND c.temporal_extend_end >= $${i}
      `);
      values.push(datetime);
      i++;
    }
  }

  // Provider filter: match collections that have a provider with the given name (case-insensitive)
  if (provider) {
    where.push(`EXISTS (
      SELECT 1 FROM collection_providers cp
      JOIN providers p ON cp.provider_id = p.id
      WHERE cp.collection_id = c.id
        AND lower(p.provider) = lower($${i})
    )`);
    values.push(provider);
    i++;
  }

  // License filter: direct match on collection.license
  if (license) {
    where.push(`c.license = $${i}`);
    values.push(license);
    i++;
  }

  // CQL2 Filter
  if (cqlFilter && cqlFilter.sql) {
    // Re-index placeholders in cqlFilter.sql
    // Current index is i.
    // cqlFilter.sql has $1, $2...
    // We need to replace $1 with $i, $2 with $(i+1)...
    
    const reindexedSql = cqlFilter.sql.replace(/\$(\d+)/g, (match, num) => {
      return '$' + (parseInt(num) + i - 1);
    });
    
    where.push(`(${reindexedSql})`);
    values.push(...cqlFilter.values);
    i += cqlFilter.values.length;
  }

  // Build final SQL from selectPart and add FROM clause with LATERAL JOINs.
  // We delayed adding `FROM collection` to allow conditional additions to the
  // selected columns above (notably `rank`). The final `sql` string includes the
  // selected columns, the source table and any WHERE conditions constructed earlier.
  //
  // LATERAL JOINs aggregate related data (keywords, extensions, providers, assets, summaries,
  // and crawl timestamps) from normalized tables without duplicating collection rows.
  // Each LEFT JOIN LATERAL subquery returns a single aggregated row per collection.
  let sql = selectPart + `
    FROM collection c
    LEFT JOIN LATERAL (
      SELECT jsonb_agg(k.keyword ORDER BY k.keyword) AS keywords
      FROM collection_keywords ck
      JOIN keywords k ON k.id = ck.keyword_id
      WHERE ck.collection_id = c.id
    ) kw ON TRUE
    LEFT JOIN LATERAL (
      SELECT jsonb_agg(se.stac_extension ORDER BY se.stac_extension) AS stac_extensions
      FROM collection_stac_extension cse
      JOIN stac_extensions se ON se.id = cse.stac_extension_id
      WHERE cse.collection_id = c.id
    ) ext ON TRUE
    LEFT JOIN LATERAL (
      SELECT jsonb_agg(jsonb_build_object(
        'name', p.provider,
        'roles', cpr.collection_provider_roles
      ) ORDER BY p.provider) AS providers
      FROM collection_providers cpr
      JOIN providers p ON p.id = cpr.provider_id
      WHERE cpr.collection_id = c.id
    ) prov ON TRUE
    LEFT JOIN LATERAL (
      SELECT jsonb_agg(jsonb_build_object(
        'name', a.name,
        'href', a.href,
        'type', a.type,
        'roles', a.roles,
        'metadata', a.metadata,
        'collection_roles', ca.collection_asset_roles
      ) ORDER BY a.name) AS assets
      FROM collection_assets ca
      JOIN assets a ON a.id = ca.asset_id
      WHERE ca.collection_id = c.id
    ) a ON TRUE
    LEFT JOIN LATERAL (
      SELECT jsonb_object_agg(s.name, s.s_summary) AS summaries
      FROM (
        SELECT
          cs.name,
          CASE
            WHEN cs.kind = 'range' THEN jsonb_build_object('min', cs.range_min, 'max', cs.range_max)
            WHEN cs.kind = 'set' THEN to_jsonb(cs.set_value)
            ELSE cs.json_schema
          END AS s_summary
        FROM collection_summaries cs
        WHERE cs.collection_id = c.id
      ) s
    ) s ON TRUE
    LEFT JOIN LATERAL (
      SELECT MAX(clc.last_crawled) AS last_crawled
      FROM crawllog_collection clc
      WHERE clc.collection_id = c.id
    ) cl ON TRUE
  `;

  if (where.length > 0) {
    sql += ` WHERE ` + where.join(' AND ');
  }

  // Sorting: if a sort is explicitly requested use it; otherwise prefer relevance when
  // a text query was provided (descending), falling back to id ascending.
  //
  // Behaviour summary:
  // - `sortby` provided → use that (with 'c.' prefix for collection columns)
  // - no `sortby` & `q` present → order by `rank DESC, c.id ASC` so higher relevance comes first
  // - no `sortby` & no `q` → order by `c.id ASC` (legacy default)
  //
  // Note: sortby.field is validated against a whitelist in the calling code; only collection
  // table columns are allowed for sorting (not aggregated fields like keywords/providers).
  if (sortby) {
    sql += ` ORDER BY c.${sortby.field} ${sortby.direction}`;
  } else if (q) {
    sql += ` ORDER BY rank DESC, c.id ASC`;
  } else {
    sql += ` ORDER BY c.id ASC`;
  }

  // Pagination (only add if limit is provided)
  if (limit !== null && limit !== undefined) {
    sql += ` LIMIT $${i} OFFSET $${i + 1}`;
    values.push(limit, token || 0);
  }

  return { sql, values };
}

module.exports = { buildCollectionSearchQuery };
