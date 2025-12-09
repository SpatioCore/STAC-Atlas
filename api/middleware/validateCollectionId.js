/**
 * Middleware to validate the :id route parameter for /collections/:id.
 *
 * - Ensures the id is a positive integer (or at least non-negative).
 * - Prevents malformed input reaching the database layer.
 * - On error, responds with a 400 JSON body that follows the API error format.
 */
function validateCollectionId(req, res, next) {
  const { id } = req.params;

  // id must be present and represent an integer
  const num = parseInt(id, 10);

  if (!id || Number.isNaN(num)) {
    return res.status(400).json({
      code: 'InvalidParameter',
      description: 'Parameter "id" must be a valid integer',
      parameter: 'id',
      value: id
    });
  }

  if (num < 0) {
    return res.status(400).json({
      code: 'InvalidParameter',
      description: 'Parameter "id" must be non-negative',
      parameter: 'id',
      value: id
    });
  }

  next();
}

module.exports = { validateCollectionId };