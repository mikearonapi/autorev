import test from 'node:test';
import assert from 'node:assert/strict';

import { buildVBulletinListUrl } from './vbulletinAdapter.js';

test('buildVBulletinListUrl defaults to index_html pagination', () => {
  assert.equal(
    buildVBulletinListUrl('https://example.com/forums', '/some-forum-50/', 1, {}),
    'https://example.com/forums/some-forum-50/'
  );
  assert.equal(
    buildVBulletinListUrl('https://example.com/forums', '/some-forum-50/', 2, {}),
    'https://example.com/forums/some-forum-50/index2.html'
  );
});

test('buildVBulletinListUrl supports page_path pagination', () => {
  assert.equal(
    buildVBulletinListUrl('https://example.com/forums', '/s2000-talk-1/', 2, { mode: 'page_path' }),
    'https://example.com/forums/s2000-talk-1/page2/'
  );
  // no trailing slash input
  assert.equal(
    buildVBulletinListUrl('https://example.com/forums', '/s2000-talk-1', 3, { mode: 'page_path' }),
    'https://example.com/forums/s2000-talk-1/page3/'
  );
});

test('buildVBulletinListUrl supports query_param pagination', () => {
  assert.equal(
    buildVBulletinListUrl('https://example.com/forums', '/forumdisplay.php?f=577', 2, { mode: 'query_param' }),
    'https://example.com/forums/forumdisplay.php?f=577&page=2'
  );
  assert.equal(
    buildVBulletinListUrl('https://example.com/forums', '/forumdisplay.php?f=577', 4, { mode: 'query_param', paramName: 'p' }),
    'https://example.com/forums/forumdisplay.php?f=577&p=4'
  );
  assert.equal(
    buildVBulletinListUrl('https://example.com/forums', '/forumdisplay.php?f=577&sort=lastpost', 2, { mode: 'query_param' }),
    'https://example.com/forums/forumdisplay.php?f=577&sort=lastpost&page=2'
  );
});







