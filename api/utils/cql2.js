const fs = require('fs');
const path = require('path');

let cql2Module = null;
let wasmInitialized = false;

async function initWasm() {
    if (wasmInitialized) return;
    
    try {
        // Dynamic import for ESM module
        cql2Module = await import('cql2-wasm');
        
        const wasmPath = path.join(__dirname, '..', 'node_modules', 'cql2-wasm', 'cql2_wasm_bg.wasm');
        const wasmBuffer = fs.readFileSync(wasmPath);
        await cql2Module.default(wasmBuffer);
        wasmInitialized = true;
    } catch (error) {
        console.error('Failed to initialize cql2-wasm:', error);
        throw new Error('CQL2 parser initialization failed');
    }
}

/**
 * Parses CQL2 Text to CQL2 JSON object
 * @param {string} text - CQL2 Text
 * @returns {Promise<Object>} CQL2 JSON object
 */
async function parseCql2Text(text) {
    await initWasm();
    try {
        const result = cql2Module.parseText(text);
        // result.to_json() returns a JSON string, so we parse it
        return JSON.parse(result.to_json());
    } catch (error) {
        throw new Error(`Invalid CQL2 Text: ${error.message || error}`);
    }
}

/**
 * Validates/Parses CQL2 JSON
 * @param {Object|string} json - CQL2 JSON object or string
 * @returns {Promise<Object>} CQL2 JSON object
 */
async function parseCql2Json(json) {
    await initWasm();
    try {
        let jsonStr;
        if (typeof json === 'string') {
            jsonStr = json;
        } else {
            jsonStr = JSON.stringify(json);
        }
        
        const result = cql2Module.parseJson(jsonStr);
        return JSON.parse(result.to_json());
    } catch (error) {
        throw new Error(`Invalid CQL2 JSON: ${error.message || error}`);
    }
}

module.exports = {
    parseCql2Text,
    parseCql2Json
};
