const { ErrorResponses } = require('../utils/errorResponse');

/**
 * Middleware to validate the :id route parameter for /collections/:id.
 *
 * - Ensures the id looks like a positive integer (all digits).
 * - Prevents obviously malformed input reaching the database layer.
 * - On error, responds with a 400 JSON body using RFC 7807 format.
 */
function validateCollectionId(req, res, next) {
  const { id } = req.params;

   // id must be present and must be a sequence of digits (no minus, no spaces, no letters)
  if (!id || !/^\d+$/u.test(id)) {
    const errorResponse = ErrorResponses.invalidParameter(
      'The "id" parameter must be a non-negative integer (digits only).',
      req.requestId,
      req.originalUrl,
      {
        parameter: 'id',
        value: id
      }
    );
    return res.status(400).json(errorResponse);
  }

  next();
}

module.exports = { validateCollectionId };