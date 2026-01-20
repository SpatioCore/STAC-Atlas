const { ErrorResponses } = require('../utils/errorResponse');

/**
 * Middleware to validate the :id route parameter for /collections/:id.
 *
 * - Ensures the id exists and is not empty or exceeds a certain length limit.
 * - Ensures the id only contains allowed characters (letters, digits, ".", "_", "-").
 * - The database only uses digits as ids, but the API should accept common STAC
 * - collection id formats.
 * - Prevents obviously malformed input reaching the database layer.
 * - On error, responds with a 400 JSON body using RFC 7807 format.
 */
function validateCollectionId(req, res, next) {
  const { id } = req.params;

  // not empty - id must be present and be a non-empty string
  if (typeof id !== 'string' || id.trim().length === 0) {
    const errorResponse = ErrorResponses.invalidParameter(
      'The "id" parameter is required. It cannot be empty.',
      req.requestId,
      req.originalUrl,
      {
        parameter: 'id',
        value: id
      }
    );
    return res.status(400).json(errorResponse);
  }

  // length limit (STAC IDs are usually short; 256 is generous)
  if (id.length > 256) {
    const errorResponse = ErrorResponses.invalidParameter(
      'The "id" parameter is too long. It is not allowed to exceed 256 characters.',
      req.requestId,
      req.originalUrl,
      {
        parameter: 'id',
        value: id
      }
    );
    return res.status(400).json(errorResponse);
  }

  // whitelist allowed characters
  // - allows typical STAC-style ids like: sentinel-2-l2a, my.collection_01, abc123
  // - disallows slashes, spaces, quotes, etc.
  const allowed = /^[A-Za-z0-9._-]+$/u;
  if (!allowed.test(id)) {
    const errorResponse = ErrorResponses.invalidParameter(
      'The "id" parameter contains invalid characters. Allowed: letters, digits, ".", "_", "-".',
      req.requestId,
      req.originalUrl,
      {
        parameter: 'id',
        value: id
      }
    );
   return res.status(400).json(errorResponse); 
  }
  return next();
}

module.exports = { validateCollectionId };
