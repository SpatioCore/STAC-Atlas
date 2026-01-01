# Routes - Database Integration Guide

This guide explains how to connect API routes to the database using the existing database connection module.

## Basic Pattern

Define this helper function once at the top of your route file:

```javascript
const express = require('express');
const router = express.Router();
const db = require('../db/db_APIconnection');

// Define once per file
async function runQuery(sql, params = []) {
  try {
    const result = await db.query(sql, params);
    return result.rows;
  } catch (error) {
    console.error('Query error:', error);
    throw error;
  }
}

// Now use it everywhere in this file
router.get('/endpoint', async (req, res, next) => {
  try {
    const rows = await runQuery('SELECT * FROM table WHERE id = $1', [req.params.id]);
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
```

Every database call in your routes can now use this simple pattern:

```javascript
const rows = await runQuery('SELECT * FROM table WHERE id = $1', [123]);
```

## Example

```javascript
// get list of collections

const collections = await runQuery('SELECT * FROM collection');

// find collection via ID
const rows = await runQuery('SELECT * FROM collection WHERE id = $1', [123]);
if (rows.length === 0) {
  return res.status(404).json({ code: 'NotFound' });
}
const collection = rows[0];

// Filter by multiple conditions
const filtered = await runQuery(
  'SELECT * FROM collection WHERE is_active = $1 AND license = $2',
  [true, 'CC-BY-4.0']
);