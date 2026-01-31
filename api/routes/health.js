const express = require('express');
const router = express.Router();
const db = require('../db/db_APIconnection'); 

router.get('/', async (req, res) => {
  const startedAt = Date.now();
  const timestamp = new Date().toISOString();

  const result = {
    status: 'ok',
    service: process.env.SERVICE_NAME || 'stac-atlas-api',
    version: process.env.npm_package_version,
    uptimeSec: Math.floor(process.uptime()),
    timestamp,
    checks: {}
  };

  try {
    await db.query('SELECT 1');
    result.checks.db = { status: 'ok', latencyMs: Date.now() - startedAt };
    return res.status(200).json(result);
  } catch (err) {
    result.status = 'error';
    result.checks.db = {
      status: 'error',
      latencyMs: Date.now() - startedAt,
      
      message: 'Database connectivity check failed'
    };
    return res.status(503).json(result);
  }
});

module.exports = router;