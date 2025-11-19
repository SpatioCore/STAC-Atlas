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
const queryablesRouter = require('./routes/queryables');

// Import error handler
const { errorHandler } = require('./middleware/errorHandler');

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
app.use('/collections-queryables', queryablesRouter);

// Swagger/OpenAPI documentation (if openapi.yaml exists) 
// Swagger-ui-express automatically generates a swagger-ui-init.js file 
try {
  const swaggerDocument = YAML.load(path.join(__dirname, 'docs', 'openapi.yaml'));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  
  // Serve the OpenAPI YAML file directly
  app.get('/openapi.yaml', (req, res) => {
    res.type('application/yaml').sendFile(path.join(__dirname, 'docs', 'openapi.yaml'));
  });
} catch (err) {
  console.error('Error loading OpenAPI documentation:', err.message);
  // OpenAPI documentation not found. Create docs/openapi.yaml to enable Swagger UI.
}

// 404 handler
app.use((req, res, _next) => {
  res.status(404).json({
    code: 'NotFound',
    description: `The requested resource '${req.url}' was not found on this server.`
  });
});

// Error handler middleware (MUST be last)
app.use(errorHandler);

module.exports = app;
