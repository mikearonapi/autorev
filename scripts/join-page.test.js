import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const repoRoot = process.cwd();
const joinPagePath = path.join(repoRoot, 'app', 'join', 'page.jsx');
const joinCssPath = path.join(repoRoot, 'app', 'join', 'page.module.css');

test('Join page: feature breakdown table uses AL image and avoids tierHeader CSS collision', async () => {
  const [pageJs, pageCss] = await Promise.all([
    readFile(joinPagePath, 'utf8'),
    readFile(joinCssPath, 'utf8'),
  ]);

  // CSS: prevent accidental reintroduction of duplicate .tierHeader rules
  const tierHeaderDefs = pageCss.match(/\.tierHeader\s*\{/g) ?? [];
  assert.equal(
    tierHeaderDefs.length,
    1,
    `Expected exactly 1 ".tierHeader {" definition in join CSS, found ${tierHeaderDefs.length}`
  );
  assert.match(pageCss, /\.tableTierHeader\s*\{/, 'Expected ".tableTierHeader" in join CSS');

  // JSX: table header should use styles.tableTierHeader (not styles.tierHeader)
  assert.match(pageJs, /styles\.tableTierHeader/, 'Expected table header to use styles.tableTierHeader');
  assert.doesNotMatch(
    pageJs,
    /\$\{styles\.tableHeaderCell\}\s*\$\{styles\.tierHeader\}/,
    'Expected join table header to not use styles.tierHeader (CSS collision risk)'
  );

  // AI category should use AL image (not robot icon)
  assert.match(pageJs, /const AlIcon\s*=\s*\(\{[^}]*size[^}]*\}\)\s*=>\s*\(/, 'Expected AlIcon component');
  assert.match(pageJs, /src="\/images\/al-mascot\.png"/, 'Expected AL icon to use /images/al-mascot.png');
  assert.match(
    pageJs,
    /id:\s*'ai'[\s\S]*?name:\s*'AL — Your AI Co-Pilot'[\s\S]*?icon:\s*AlIcon/,
    'Expected AI category to use icon: AlIcon'
  );
  assert.doesNotMatch(
    pageJs,
    /id:\s*'ai'[\s\S]*?icon:\s*Icons\.robot/,
    'Expected AI category to not use Icons.robot'
  );
});















