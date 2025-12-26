/**
 * Middleware to validate the :id route parameter for /collections/:id.
 *
 * - Ensures the id looks like a positive integer (all digits).
 * - Prevents obviously malformed input reaching the database layer.
 * - On error, responds with a 404 JSON body that matches the "NotFound" error
 *   format used elsewhere in the API tests.
 */
function validateCollectionId(req, res, next) {
  const { id } = req.params;

   // id must be present and must be a sequence of digits (no minus, no spaces, no letters)
  if (!id || !/^\d+$/u.test(id)) {
    return res.status(400).json({
      code: 'InvalidParameter',
      description: 'The "id" parameter must be a non-negative integer (digits only).',
      parameter: 'id',
      value: id
    });
  }

  next();
}

module.exports = { validateCollectionId };