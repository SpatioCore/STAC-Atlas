import { jest } from '@jest/globals';
import db from '../utils/db.js';

describe('deactivateStaleCollections', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  test('sets is_active=false for collections older than crawl start (7 days window)', async () => {
    const querySpy = jest
      .spyOn(db.pool, 'query')
      .mockResolvedValue({ rowCount: 3 });

    const count = await db.deactivateStaleCollections();

    expect(querySpy).toHaveBeenCalledTimes(1);

    const sql = querySpy.mock.calls[0][0];
    expect(sql).toMatch(/UPDATE\s+collection/i);
    expect(sql).toMatch(/SET\s+is_active\s*=\s*false/i);
    expect(sql).toMatch(/updated_at\s*<\s*NOW\(\)\s*-\s*INTERVAL\s*'7 days'/i);
    expect(sql).toMatch(/AND\s+is_active\s*=\s*true/i);
    expect(count).toBe(3);
  });

  test('returns 0 when no collections are deactivated', async () => {
    jest.spyOn(db.pool, 'query').mockResolvedValue({ rowCount: 0 });

    const count = await db.deactivateStaleCollections();

    expect(count).toBe(0);
  });
});
