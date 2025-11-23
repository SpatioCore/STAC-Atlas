const express = require('express');
const router = express.Router();
const { CONFORMANCE_URIS } = require('../config/conformance');

/**
 * GET /conformance
 * Returns the list of conformance classes this API implements
 */
router.get('/', (req, res) => {
  res.json({
    conformsTo: CONFORMANCE_URIS
  });
});

module.exports = router;
