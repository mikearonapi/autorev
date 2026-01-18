import test from 'node:test';
import assert from 'node:assert/strict';

import { dedupeBy, extractYouTubeVideoId, slugifyKey } from './utils.mjs';

test('extractYouTubeVideoId parses common YouTube URL shapes', () => {
  assert.equal(extractYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
  assert.equal(extractYouTubeVideoId('https://youtu.be/dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
  assert.equal(extractYouTubeVideoId('https://www.youtube.com/shorts/dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
  assert.equal(extractYouTubeVideoId('https://www.youtube.com/embed/dQw4w9WgXcQ?start=10'), 'dQw4w9WgXcQ');
  assert.equal(extractYouTubeVideoId('not a url'), null);
  assert.equal(extractYouTubeVideoId(null), null);
});

test('dedupeBy keeps first occurrence per key', () => {
  const input = [{ u: 'a' }, { u: 'a' }, { u: 'b' }, { u: '' }, { u: null }];
  const out = dedupeBy(input, (x) => x.u);
  assert.deepEqual(out, [{ u: 'a' }, { u: 'b' }]);
});

test('slugifyKey creates stable keys', () => {
  assert.equal(slugifyKey('TRX 2021 — Level 2'), 'trx-2021-level-2');
  assert.equal(slugifyKey('  '), '');
});

