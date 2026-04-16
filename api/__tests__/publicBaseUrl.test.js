const { getPublicBaseUrl } = require('../utils/publicBaseUrl');

describe('getPublicBaseUrl', () => {
  const original = process.env.PUBLIC_BASE_URL;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.PUBLIC_BASE_URL;
    } else {
      process.env.PUBLIC_BASE_URL = original;
    }
  });

  it('uses PUBLIC_BASE_URL when set', () => {
    process.env.PUBLIC_BASE_URL = 'https://atlas.stacindex.org:3000/';
    const req = { protocol: 'http', get: () => '127.0.0.1:3000' };
    expect(getPublicBaseUrl(req)).toBe('https://atlas.stacindex.org:3000');
  });

  it('strips trailing slashes from PUBLIC_BASE_URL', () => {
    process.env.PUBLIC_BASE_URL = 'https://example.com///';
    const req = { protocol: 'http', get: () => 'localhost' };
    expect(getPublicBaseUrl(req)).toBe('https://example.com');
  });

  it('falls back to protocol and Host', () => {
    delete process.env.PUBLIC_BASE_URL;
    const req = { protocol: 'https', get: (h) => (h === 'host' ? 'api.example.org' : '') };
    expect(getPublicBaseUrl(req)).toBe('https://api.example.org');
  });
});
