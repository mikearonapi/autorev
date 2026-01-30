/**
 * Regression test: Insights page should not surface Community card
 * in the "Additional Insights" section (Compare Builds /community CTA).
 *
 * This is a lightweight guard (no React render) because importing the full
 * `InsightsClient.jsx` tree can be very memory-heavy under Vitest.
 */

import fs from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

describe('InsightsClient - Additional Insights community removal', () => {
  it('does not reference Compare Builds /community CTA', async () => {
    const insightsClientPath = path.resolve(process.cwd(), 'app/(app)/insights/InsightsClient.jsx');
    const source = await fs.readFile(insightsClientPath, 'utf8');

    expect(source).not.toContain('Compare Builds');
    expect(source).not.toContain('/community');
    expect(source).not.toContain("id: 'comm-1'");
  });
});
