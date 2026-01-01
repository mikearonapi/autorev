import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  buildUserProfileRowFromAuthUser,
  buildPagination,
  buildProfilesForAuthUsers,
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

  describe('buildPagination', () => {
    it('calculates totalPages correctly for 25-per-page', () => {
      assert.deepEqual(buildPagination({ page: 1, limit: 25, total: 50 }), {
        page: 1,
        limit: 25,
        total: 50,
        totalPages: 2,
        offset: 0,
      });

      assert.deepEqual(buildPagination({ page: 3, limit: 25, total: 75 }), {
        page: 3,
        limit: 25,
        total: 75,
        totalPages: 3,
        offset: 50,
      });
    });

    it('clamps invalid inputs safely', () => {
      const p = buildPagination({ page: -10, limit: 0, total: -5 });
      assert.equal(p.page, 1);
      assert.equal(p.limit, 25);
      assert.equal(p.total, 0);
      assert.equal(p.totalPages, 1);
      assert.equal(p.offset, 0);
    });
  });

  describe('buildProfilesForAuthUsers', () => {
    it('preserves auth order and synthesizes missing profiles', () => {
      const authUsers = [
        { id: 'u1', created_at: '2026-01-01T00:00:00.000Z' },
        { id: 'u2', created_at: '2026-01-02T00:00:00.000Z' },
      ];

      const profileById = new Map([
        ['u1', { id: 'u1', display_name: 'Existing', subscription_tier: 'collector', created_at: '2026-01-01T00:00:00.000Z' }],
      ]);

      const profiles = buildProfilesForAuthUsers(authUsers, profileById);
      assert.equal(profiles.length, 2);
      assert.equal(profiles[0].id, 'u1');
      assert.equal(profiles[0].display_name, 'Existing');
      assert.equal(profiles[1].id, 'u2');
      assert.equal(profiles[1].subscription_tier, 'free');
      assert.equal(profiles[1].created_at, '2026-01-02T00:00:00.000Z');
    });
  });
});


