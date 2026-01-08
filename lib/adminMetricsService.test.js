import { describe, it } from 'node:test';
import assert from 'node:assert';
import { getTotalUsersCount, getUserTierBreakdown } from './adminMetricsService.js';

function createMockSupabase(routes) {
  const calls = [];

  const api = {
    calls,
    from(table) {
      const state = { table, chain: [] };
      calls.push(state);

      const builder = {
        select(columns, options) {
          state.chain.push({ op: 'select', columns, options });
          return builder;
        },
        eq(column, value) {
          state.chain.push({ op: 'eq', column, value });
          return builder;
        },
        is(column, value) {
          state.chain.push({ op: 'is', column, value });
          return builder;
        },
        then(resolve, reject) {
          // Promise-like interface so `await builder` works.
          try {
            const key = JSON.stringify({ table: state.table, chain: state.chain });
            if (!(key in routes)) {
              throw new Error(`No mock route for ${key}`);
            }
            return Promise.resolve(routes[key]).then(resolve, reject);
          } catch (e) {
            return Promise.reject(e).then(resolve, reject);
          }
        },
      };

      return builder;
    },
  };

  return api;
}

describe('adminMetricsService', () => {
  describe('getTotalUsersCount', () => {
    it('uses an exact head count query (not data.length) and returns the count', async () => {
      const supabase = createMockSupabase({
        [JSON.stringify({
          table: 'user_profiles',
          chain: [{ op: 'select', columns: 'id', options: { count: 'exact', head: true } }],
        })]: { count: 11, error: null },
      });

      const total = await getTotalUsersCount(supabase);
      assert.equal(total, 11);
    });

    it('throws when Supabase returns an error', async () => {
      const supabase = createMockSupabase({
        [JSON.stringify({
          table: 'user_profiles',
          chain: [{ op: 'select', columns: 'id', options: { count: 'exact', head: true } }],
        })]: { count: null, error: { message: 'boom' } },
      });

      await assert.rejects(() => getTotalUsersCount(supabase), /Failed to count users: boom/);
    });
  });

  describe('getUserTierBreakdown', () => {
    it('counts tiers exactly and treats null subscription_tier as free', async () => {
      const mk = (chain, count) => [
        JSON.stringify({ table: 'user_profiles', chain }),
        { count, error: null },
      ];

      const routes = Object.fromEntries([
        mk([{ op: 'select', columns: 'id', options: { count: 'exact', head: true } }, { op: 'eq', column: 'subscription_tier', value: 'free' }], 6),
        mk([{ op: 'select', columns: 'id', options: { count: 'exact', head: true } }, { op: 'is', column: 'subscription_tier', value: null }], 1),
        mk([{ op: 'select', columns: 'id', options: { count: 'exact', head: true } }, { op: 'eq', column: 'subscription_tier', value: 'collector' }], 3),
        mk([{ op: 'select', columns: 'id', options: { count: 'exact', head: true } }, { op: 'eq', column: 'subscription_tier', value: 'tuner' }], 1),
        mk([{ op: 'select', columns: 'id', options: { count: 'exact', head: true } }, { op: 'eq', column: 'subscription_tier', value: 'admin' }], 0),
      ]);

      const supabase = createMockSupabase(routes);

      const breakdown = await getUserTierBreakdown(supabase);
      assert.deepEqual(breakdown, { free: 7, collector: 3, tuner: 1, admin: 0 });
    });
  });
});










