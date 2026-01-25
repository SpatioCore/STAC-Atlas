require('dotenv').config();
const express = require('express');
const logger = require('morgan');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

// Import middleware
const { requestIdMiddleware } = require('./middleware/requestId');
const { globalErrorHandler } = require('./middleware/errorHandler');
const { rateLimitMiddleware } = require('./middleware/rateLimit');

// Import routes
const indexRouter = require('./routes/index');
const conformanceRouter = require('./routes/conformance');
const collectionsRouter = require('./routes/collections');
const queryablesRouter = require('./routes/queryables');

const app = express();

// Request ID middleware (must be first)
app.use(requestIdMiddleware);

// Global rate limiting middleware
// Limits each IP to 1000 requests per 15 minutes
app.use(rateLimitMiddleware);

// Middleware
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// CORS configuration - allow requests from frontend
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// OpenAPI spec endpoint (YAML file with correct content-type) - MUST be before Content-Type middleware
app.get('/openapi.yaml', (req, res, next) => {
  try {
    const openapiPath = path.join(__dirname, 'docs', 'openapi.yaml');
    res.setHeader('Content-Type', 'application/vnd.oai.openapi+json;version=3.0');
    res.sendFile(openapiPath);
  } catch (err) {
    next(err);
  }
});

// Swagger/OpenAPI documentation (if openapi.yaml exists) - MUST be before Content-Type middleware
try {
  const swaggerDocument = YAML.load(path.join(__dirname, 'docs', 'openapi.yaml'));
  app.use('/api-docs', swaggerUi.serve);
  app.get('/api-docs', swaggerUi.setup(swaggerDocument));
} catch (err) {
  console.log('OpenAPI documentation not found. Create docs/openapi.yaml to enable Swagger UI.');
}

// Content-Type header for JSON responses (set AFTER special endpoints)
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  next();
});

// STAC API routes
app.use('/', indexRouter);
app.use('/conformance', conformanceRouter);
app.use('/collections', collectionsRouter);
app.use('/collections-queryables', queryablesRouter);

// 404 handler - must be after all routes
app.use((req, res, next) => {
  const error = new Error(`The requested resource '${req.originalUrl}' was not found on this server.`);
  error.status = 404;
  error.code = 'NotFound';
  next(error);
});

// Global error handler - must be last
app.use(globalErrorHandler);

module.exports = app;