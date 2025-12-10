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

  // Require a non-empty string of digits (no negatives, no letters, no junk)
  if (!id || !/^\d+$/u.test(id)) {
    return res.status(404).json({
      code: 'NotFound',
      description: `Collection with id '${id}' not found`,
      id: id
    });
  }

  // You _could_ noch num < 0 prüfen, aber mit dem Regex oben kann das nicht vorkommen.
  next();
}

module.exports = { validateCollectionId };