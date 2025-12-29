import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const repoRoot = process.cwd();
// FeatureBreakdown was extracted to its own component
const featureBreakdownPath = path.join(repoRoot, 'components', 'FeatureBreakdown.jsx');
const featureBreakdownCssPath = path.join(repoRoot, 'components', 'FeatureBreakdown.module.css');

test('Join page: feature breakdown table uses AL image and avoids tierHeader CSS collision', async () => {
  const [pageJs, pageCss] = await Promise.all([
    readFile(featureBreakdownPath, 'utf8'),
    readFile(featureBreakdownCssPath, 'utf8'),
  ]);

  // CSS: verify tableTierHeader exists (only one for table headers, avoiding duplicate tierHeader)
  assert.match(pageCss, /\.tableTierHeader\s*\{/, 'Expected ".tableTierHeader" in CSS');
  
  // CSS: ensure no standalone .tierHeader class that could collide with tableTierHeader
  const standaloneHeaderDefs = pageCss.match(/^\.tierHeader\s*\{/gm) ?? [];
  assert.equal(
    standaloneHeaderDefs.length,
    0,
    'Expected no standalone ".tierHeader" class to avoid collision with .tableTierHeader'
  );

  // JSX: table header should use styles.tableTierHeader
  assert.match(pageJs, /styles\.tableTierHeader/, 'Expected table header to use styles.tableTierHeader');

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















