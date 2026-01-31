const express = require('express');
const router = express.Router();
const db = require('../db/db_APIconnection'); 

/**
 * Health check endpoint for the STAC Atlas API
 * 
 * Provides liveness and readiness probes for Kubernetes-style health checks.
 * - Liveness: Returns 200 if the service is running
 * - Readiness: Returns 200 if the service and database are operational, 503 if degraded
 * 
 * @route GET /health
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} Health status object
 * @returns {string} returns.status - Overall status: 'ok' or 'degraded'
 * @returns {boolean} returns.ready - Readiness flag indicating if service is ready for traffic
 * @returns {string} returns.service - Service name from SERVICE_NAME environment variable
 * @returns {string} returns.version - API version from npm_package_version
 * @returns {number} returns.uptimeSec - Service uptime in seconds
 * @returns {string} returns.timestamp - ISO 8601 timestamp of health check
 * @returns {number} [returns.latencyMs] - Total latency in milliseconds (included on error)
 * @returns {Object} returns.checks - Object containing individual component health checks
 * @returns {Object} returns.checks.alive - Liveness check (always ok if endpoint is reached)
 * @returns {Object} returns.checks.db - Database connectivity check
 * @returns {string} returns.checks.db.status - 'ok' or 'error'
 * @returns {number} returns.checks.db.latencyMs - Database query latency in milliseconds
 * @returns {string} [returns.checks.db.code] - Error code from database (on error)
 * @returns {string} [returns.checks.db.message] - Error message for database connectivity failure
 * 
 * @throws {503} Service Unavailable - Returns degraded status when database is unreachable
 * @throws {200} OK - Returns ok status when all checks pass
 */
router.get('/', async (req, res) => {
  const startedAt = Date.now();
  const timestamp = new Date().toISOString();

  const result = {
    status: 'ok',
    ready: true, // readiness flag
    service: process.env.SERVICE_NAME || 'stac-atlas-api',
    version: process.env.npm_package_version,
    uptimeSec: Math.floor(process.uptime()),
    timestamp,
    checks: {
      alive: { status: 'ok' } // liveness is OK if this handler runs
    }
  };

  // Readiness check: DB
  const dbStartedAt = Date.now();

  try {
    if (typeof db.ping === 'function') {
      const pingResult = await db.ping();
      if (!pingResult || pingResult.ok === false) {
        throw Object.assign(new Error(pingResult?.message || 'DB ping failed'), {
          code: pingResult?.code
        });
      }
    } else {
      await db.query('SELECT 1');
    }

    result.checks.db = { status: 'ok', latencyMs: Date.now() - dbStartedAt };
    return res.status(200).json(result);
  } catch (err) {
    result.status = 'degraded';   // service alive, but not ready
    result.ready = false;

    result.checks.db = {
      status: 'error',
      latencyMs: Date.now() - dbStartedAt,
      code: err.code,
      message: 'Database connectivity check failed'
    };

    result.latencyMs = Date.now() - startedAt;

    return res.status(503).json(result);
  }
});

module.exports = router;