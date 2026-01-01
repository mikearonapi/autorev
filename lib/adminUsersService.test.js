import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  buildUserProfileRowFromAuthUser,
  computeMissingUserProfileRows,
} from './adminUsersService.js';

describe('adminUsersService', () => {
  describe('buildUserProfileRowFromAuthUser', () => {
    it('uses user_metadata full_name/name + avatar_url when present', () => {
      const row = buildUserProfileRowFromAuthUser({
        id: 'u1',
        user_metadata: {
          full_name: 'Jane Doe',
          avatar_url: 'https://example.com/a.png',
        },
      });

      assert.deepEqual(row, {
        id: 'u1',
        display_name: 'Jane Doe',
        avatar_url: 'https://example.com/a.png',
      });
    });

    it('falls back to raw_user_meta_data', () => {
      const row = buildUserProfileRowFromAuthUser({
        id: 'u2',
        raw_user_meta_data: {
          name: 'John Smith',
        },
      });

      assert.deepEqual(row, {
        id: 'u2',
        display_name: 'John Smith',
        avatar_url: null,
      });
    });

    it('returns null fields when metadata missing', () => {
      const row = buildUserProfileRowFromAuthUser({ id: 'u3' });
      assert.deepEqual(row, { id: 'u3', display_name: null, avatar_url: null });
    });
  });

  describe('computeMissingUserProfileRows', () => {
    it('returns rows only for auth users missing profiles', () => {
      const authUsers = [
        { id: 'a', user_metadata: { full_name: 'A' } },
        { id: 'b', user_metadata: { full_name: 'B' } },
        { id: 'c', user_metadata: { full_name: 'C' } },
      ];

      const existing = new Set(['a', 'c']);
      const missingRows = computeMissingUserProfileRows(authUsers, existing);

      assert.deepEqual(missingRows, [{ id: 'b', display_name: 'B', avatar_url: null }]);
    });
  });
});


