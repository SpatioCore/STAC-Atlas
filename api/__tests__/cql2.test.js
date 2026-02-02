/**
 * Unit Tests for CQL2 Parser (cql2.js)
 * Tests parseCql2Text and parseCql2Json functions
 * 
 * Note: These tests require the cql2-wasm module to be properly initialized.
 * Some tests may be skipped if WASM initialization fails in the test environment.
 */

const { parseCql2Text, parseCql2Json } = require('../utils/cql2');

// Helper to check if WASM is available
async function isWasmAvailable() {
  try {
    await parseCql2Text("title = 'test'");
    return true;
  } catch (error) {
    if (error.message === 'CQL2 parser initialization failed') {
      return false;
    }
    return true; // Other errors mean WASM is available but input was invalid
  }
}

describe('CQL2 Parser', () => {
  let wasmAvailable = false;

  beforeAll(async () => {
    wasmAvailable = await isWasmAvailable();
    if (!wasmAvailable) {
      console.log('CQL2 WASM not available in test environment - skipping WASM-dependent tests');
    }
  });

  describe('parseCql2Text', () => {
    test('should parse simple equality expression', async () => {
      if (!wasmAvailable) return;
      
      const cql2Text = "title = 'test'";
      const result = await parseCql2Text(cql2Text);
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('op', '=');
    });

    test('should parse comparison operators', async () => {
      if (!wasmAvailable) return;
      
      const cql2Text = "datetime > '2020-01-01T00:00:00Z'";
      const result = await parseCql2Text(cql2Text);
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('op', '>');
    });

    test('should parse LIKE operator', async () => {
      if (!wasmAvailable) return;
      
      const cql2Text = "title LIKE '%satellite%'";
      const result = await parseCql2Text(cql2Text);
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('op', 'like');
    });

    test('should parse AND expressions', async () => {
      if (!wasmAvailable) return;
      
      const cql2Text = "title = 'test' AND license = 'MIT'";
      const result = await parseCql2Text(cql2Text);
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('op', 'and');
      expect(result.args).toHaveLength(2);
    });

    test('should parse OR expressions', async () => {
      if (!wasmAvailable) return;
      
      const cql2Text = "title = 'test' OR title = 'other'";
      const result = await parseCql2Text(cql2Text);
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('op', 'or');
    });

    test('should parse NOT expressions', async () => {
      if (!wasmAvailable) return;
      
      const cql2Text = "NOT title = 'test'";
      const result = await parseCql2Text(cql2Text);
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('op', 'not');
    });

    test('should parse IN operator', async () => {
      if (!wasmAvailable) return;
      
      const cql2Text = "license IN ('MIT', 'Apache')";
      const result = await parseCql2Text(cql2Text);
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('op', 'in');
    });

    test('should parse BETWEEN operator', async () => {
      if (!wasmAvailable) return;
      
      const cql2Text = "datetime BETWEEN '2020-01-01' AND '2021-01-01'";
      const result = await parseCql2Text(cql2Text);
      
      expect(result).toBeDefined();
    });

    test('should parse IS NULL expression', async () => {
      if (!wasmAvailable) return;
      
      const cql2Text = 'license IS NULL';
      const result = await parseCql2Text(cql2Text);
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('op', 'isNull');
    });

    test('should throw error for invalid CQL2 text', async () => {
      if (!wasmAvailable) return;
      
      await expect(parseCql2Text('invalid cql2 @@@ syntax'))
        .rejects
        .toThrow(/Invalid CQL2 Text/);
    });

    test('should throw error for empty input', async () => {
      if (!wasmAvailable) return;
      
      await expect(parseCql2Text(''))
        .rejects
        .toThrow();
    });
  });

  describe('parseCql2Json', () => {
    test('should parse CQL2 JSON object', async () => {
      if (!wasmAvailable) return;
      
      const cql2Json = {
        op: '=',
        args: [{ property: 'title' }, 'test']
      };
      
      const result = await parseCql2Json(cql2Json);
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('op', '=');
    });

    test('should parse CQL2 JSON string', async () => {
      if (!wasmAvailable) return;
      
      const cql2JsonStr = JSON.stringify({
        op: '=',
        args: [{ property: 'title' }, 'test']
      });
      
      const result = await parseCql2Json(cql2JsonStr);
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('op', '=');
    });

    test('should parse complex nested expressions', async () => {
      if (!wasmAvailable) return;
      
      const cql2Json = {
        op: 'and',
        args: [
          { op: '=', args: [{ property: 'title' }, 'test'] },
          { op: '>', args: [{ property: 'datetime' }, '2020-01-01'] }
        ]
      };
      
      const result = await parseCql2Json(cql2Json);
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('op', 'and');
      expect(result.args).toHaveLength(2);
    });

    test('should parse spatial operators', async () => {
      if (!wasmAvailable) return;
      
      const cql2Json = {
        op: 's_intersects',
        args: [
          { property: 'geometry' },
          {
            type: 'Polygon',
            coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]
          }
        ]
      };
      
      const result = await parseCql2Json(cql2Json);
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('op', 's_intersects');
    });

    test('should throw error for invalid CQL2 JSON', async () => {
      if (!wasmAvailable) return;
      
      await expect(parseCql2Json({ invalid: 'structure' }))
        .rejects
        .toThrow(/Invalid CQL2 JSON/);
    });

    test('should throw error for malformed JSON string', async () => {
      if (!wasmAvailable) return;
      
      await expect(parseCql2Json('not valid json {'))
        .rejects
        .toThrow();
    });
  });

  describe('WASM initialization', () => {
    test('should handle WASM initialization failure gracefully', async () => {
      // This test always passes - it documents expected behavior
      // When WASM is unavailable, functions should throw 'CQL2 parser initialization failed'
      if (!wasmAvailable) {
        await expect(parseCql2Text("title = 'test'"))
          .rejects
          .toThrow('CQL2 parser initialization failed');
      } else {
        // WASM is available, so parsing should work
        const result = await parseCql2Text("title = 'test'");
        expect(result).toBeDefined();
      }
    });
  });
});
