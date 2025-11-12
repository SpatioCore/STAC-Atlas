/**
 * Response Builder Utilities
 * Builds consistent STAC API responses
 */

/**
 * Build collection links (for pagination and navigation)
 * @param {Object} options - { baseUrl, pagination, hasMore }
 * @returns {Array} Array of link objects
 */
function buildCollectionLinks(options) {
  const { baseUrl, pagination, hasMore, filters } = options;
  const { limit, offset } = pagination;

  // Build query string from filters
  const queryParams = new URLSearchParams();
  queryParams.append('limit', limit);
  queryParams.append('offset', offset);

  if (filters.search) queryParams.append('q', filters.search);
  if (filters.bbox) queryParams.append('bbox', filters.bbox);
  if (filters.datetime) queryParams.append('datetime', filters.datetime);
  if (filters.sortby) queryParams.append('sortby', filters.sortby);
  if (filters.provider) queryParams.append('provider', filters.provider);
  if (filters.license) queryParams.append('license', filters.license);

  const links = [
    {
      rel: 'self',
      href: `${baseUrl}/collections?${queryParams.toString()}`,
      type: 'application/json',
      title: 'This page'
    },
    {
      rel: 'root',
      href: `${baseUrl}`,
      type: 'application/json',
      title: 'Root catalog'
    }
  ];

  // Add next link if there are more results
  if (hasMore) {
    const nextOffset = offset + limit;
    const nextParams = new URLSearchParams(queryParams);
    nextParams.set('offset', nextOffset);
    links.push({
      rel: 'next',
      href: `${baseUrl}/collections?${nextParams.toString()}`,
      type: 'application/json',
      title: 'Next page'
    });
  }

  // Add previous link if not on first page
  if (offset > 0) {
    const prevOffset = Math.max(0, offset - limit);
    const prevParams = new URLSearchParams(queryParams);
    prevParams.set('offset', prevOffset);
    links.push({
      rel: 'prev',
      href: `${baseUrl}/collections?${prevParams.toString()}`,
      type: 'application/json',
      title: 'Previous page'
    });
  }

  return links;
}

/**
 * Build pagination context object
 * @param {Object} options - { returned, limit, matched }
 * @returns {Object} Context object
 */
function buildPaginationContext(options) {
  const { returned = 0, limit = 10, matched = 0 } = options;

  return {
    returned,
    limit,
    matched
  };
}

/**
 * Build collections response
 * @param {Object} options - { baseUrl, collections, pagination, matched, hasMore, filters }
 * @returns {Object} Formatted collections response
 */
function buildCollectionsResponse(options) {
  const {
    baseUrl,
    collections = [],
    pagination = { limit: 10, offset: 0 },
    matched = 0,
    hasMore = false,
    filters = {}
  } = options;

  return {
    type: 'FeatureCollection',
    collections: collections,
    links: buildCollectionLinks({
      baseUrl,
      pagination,
      hasMore,
      filters
    }),
    context: buildPaginationContext({
      returned: collections.length,
      limit: pagination.limit,
      matched
    })
  };
}

/**
 * Build single collection response with STAC structure
 * @param {Object} collection - Collection data
 * @param {string} baseUrl - Base URL for links
 * @returns {Object} Formatted collection
 */
function formatCollection(collection, baseUrl) {
  return {
    id: collection.id,
    type: 'Collection',
    stac_version: '1.0.0',
    title: collection.title || '',
    description: collection.description || '',
    keywords: collection.keywords || [],
    license: collection.license || 'proprietary',
    providers: collection.providers || [],
    extent: collection.extent || {
      spatial: {
        bbox: [[]]
      },
      temporal: {
        interval: [[null, null]]
      }
    },
    links: [
      {
        rel: 'self',
        href: `${baseUrl}/collections/${collection.id}`,
        type: 'application/json',
        title: 'This collection'
      },
      {
        rel: 'root',
        href: `${baseUrl}`,
        type: 'application/json',
        title: 'Root catalog'
      },
      {
        rel: 'parent',
        href: `${baseUrl}/collections`,
        type: 'application/json',
        title: 'Collections catalog'
      }
    ],
    summaries: collection.summaries || {},
    assets: collection.assets || {}
  };
}

/**
 * Build error response
 * @param {Object} options - { code, description, statusCode, details }
 * @returns {Object} Error response
 */
function buildErrorResponse(options) {
  const {
    code = 'BadRequest',
    description = 'An error occurred',
    statusCode = 400,
    details = null
  } = options;

  const error = {
    code,
    description,
    statusCode
  };

  if (details) {
    error.details = details;
  }

  return error;
}

module.exports = {
  buildCollectionLinks,
  buildPaginationContext,
  buildCollectionsResponse,
  formatCollection,
  buildErrorResponse
};
