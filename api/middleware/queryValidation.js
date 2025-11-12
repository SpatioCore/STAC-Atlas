/**
 * Query Parameter Validation Middleware
 * Validates and parses query parameters for collections endpoint
 */

const queryParser = require('../utils/queryParser');
const validation = require('../utils/validation');
const { ValidationError } = require('./errorHandler');

/**
 * Middleware to parse and validate query parameters
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function validateQueryParams(req, res, next) {
  try {
    // Parse query parameters
    const parsedParams = queryParser.parseQueryParameters(req.query);

    // Validate parsed parameters
    const validation_result = validation.validateQueryParameters(parsedParams);

    if (!validation_result.valid) {
      throw new ValidationError(
        'Invalid query parameters',
        validation_result.errors
      );
    }

    // Attach parsed and validated parameters to request
    req.parsedQuery = parsedParams;

    next();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  validateQueryParams
};

