/**
 * Public base URL for STAC/OGC link hrefs.
 * When unset, derives from the request (protocol + Host).
 * Set PUBLIC_BASE_URL when clients reach the API at a different host/port than
 * Node sees (e.g. reverse proxy strips port or uses an internal Host header).
 */
function getPublicBaseUrl(req) {
  const explicit = process.env.PUBLIC_BASE_URL?.trim();
  if (explicit) {
    return explicit.replace(/\/+$/, '');
  }
  return `${req.protocol}://${req.get('host')}`;
}

module.exports = { getPublicBaseUrl };
