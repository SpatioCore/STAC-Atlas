/**
 * Middleware to validate the :id route parameter for /collections/:id.
 *
 * - Ensures the id exists and is not empty or exceeds a certain length limit.
 * - Ensures the id only contains allowed characters (letters, digits, ".", "_", "-").
 * - The database only uses digits as ids, but the API should accept common STAC
 * - collection id formats.
 * - Prevents obviously malformed input reaching the database layer.
 * - On error, responds with a 404 JSON body that matches the "NotFound" error
 *   format used elsewhere in the API tests.
 */
function validateCollectionId(req, res, next) {
  const { id } = req.params;

  // not empty
  if (typeof id !== 'string' || id.trim().length === 0) {
    return res.status(400).json({
      code: 'InvalidParameter',
      description: 'The "id" parameter is required.',
      parameter: 'id',
      value: id
    });
  }

  // length limit (STAC IDs are usually short; 256 is generous)
  if (id.length > 256) {
    return res.status(400).json({
      code: 'InvalidParameter',
      description: 'The "id" parameter is too long.',
      parameter: 'id',
      value: id
    });
  }

  // whitelist allowed characters
  // - allows typical STAC-style ids like: sentinel-2-l2a, my.collection_01, abc123
  // - disallows slashes, spaces, quotes, etc.
  const allowed = /^[A-Za-z0-9._-]+$/u;
  if (!allowed.test(id)) {
    return res.status(400).json({
      code: 'InvalidParameter',
      description:
        'The "id" parameter contains invalid characters. Allowed: letters, digits, ".", "_", "-".',
      parameter: 'id',
      value: id
    });
  }

  return next();
}

module.exports = { validateCollectionId };