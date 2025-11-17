require('dotenv').config();
const express = require('express');
const logger = require('morgan');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

// Import routes
const indexRouter = require('./routes/index');
const conformanceRouter = require('./routes/conformance');
const collectionsRouter = require('./routes/collections');
const collectionsQueryablesRouter = require('./routes/queryables');

const app = express();

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

// Content-Type header for all JSON responses
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  next();
});

// STAC API routes
app.use('/', indexRouter);
app.use('/conformance', conformanceRouter);
app.use('/collections', collectionsRouter);
app.use('/collections/queryables', collectionsQueryablesRouter);

// Swagger/OpenAPI documentation (if openapi.yaml exists)
try {
  const swaggerDocument = YAML.load(path.join(__dirname, 'docs', 'openapi.yaml'));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} catch (err) {
  console.log('OpenAPI documentation not found. Create docs/openapi.yaml to enable Swagger UI.');
}

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    code: 'NotFound',
    description: `The requested resource '${req.url}' was not found on this server.`
  });
});

// Error handler
app.use((err, req, res, next) => {
  // Set locals, only providing error in development
  const isDev = req.app.get('env') === 'development';
  
  res.status(err.status || 500).json({
    code: err.code || 'InternalServerError',
    description: err.message || 'An internal server error occurred',
    ...(isDev && { stack: err.stack })
  });
});

module.exports = app;
