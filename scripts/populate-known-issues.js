/**
 * Populate `car_known_issues` for all 98 cars using real sources.
 *
 * Sources:
 * - NHTSA: recalls + complaints + TSBs
 * - CarComplaints.com: top complaint pages per platform reference model
 *
 * IMPORTANT SCHEMA NOTE
 * `car_known_issues` (in this repo) does NOT have a `source_url` column.
 * To preserve citability without altering schema, this script stores the URL in
 * the existing `source` column.
 *
 * Usage:
 *   node scripts/populate-known-issues.js
 *   node scripts/populate-known-issues.js --out supabase/migrations/043_known_issues_full.sql
 *   node scripts/populate-known-issues.js --rate-limit-ms 1000
 *   node scripts/populate-known-issues.js --carcomplaints-rate-limit-ms 250
 *   node scripts/populate-known-issues.js --dry-run
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { carData } from '../data/cars.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** @typedef {'Critical'|'Major'|'Minor'} Severity */

/**
 * @typedef {Object} PlatformReference
 * @property {{make: string, model: string, year: number}} [nhtsa]
 * @property {string} [carComplaintsModelUrl]
 */

/**
 * @typedef {Object} PlatformMapping
 * @property {string} id
 * @property {string} name
 * @property {PlatformReference[]} referenceVehicles
 * @property {string[]} cars
 */

/**
 * @typedef {Object} PlatformMappingsFile
 * @property {string} version
 * @property {string} notes
 * @property {PlatformMapping[]} platforms
 */

/**
 * @typedef {Object} KnownIssue
 * @property {string} issue_name
 * @property {Severity} severity
 * @property {string|null} affected_years
 * @property {string} description
 * @property {string|null} symptoms
 * @property {string|null} prevention
 * @property {string|null} fix_description
 * @property {string|null} estimated_cost
 * @property {string} source_url
 */

function parseArgs(argv) {
  /** @type {Record<string, string|boolean>} */
  const out = {};

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;

    const [k, v] = a.split('=');

    if (v !== undefined) {
      out[k] = v;
      continue;
    }

    // Flags with next-arg values
    const next = argv[i + 1];
    if (next && !next.startsWith('--')) {
      out[k] = next;
      i++;
      continue;
    }

    out[k] = true;
  }

  return out;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function createRateLimitedFetch({ minIntervalMs }) {
  if (!Number.isFinite(minIntervalMs) || minIntervalMs < 0) {
    throw new Error(`Invalid minIntervalMs: ${minIntervalMs}`);
  }

  /** @type {number} */
  let lastAt = 0;

  /**
   * @param {string} url
   * @returns {Promise<Response>}
   */
  return async function rateLimitedFetch(url) {
    const now = Date.now();
    const waitMs = Math.max(0, minIntervalMs - (now - lastAt));
    if (waitMs > 0) await sleep(waitMs);

    lastAt = Date.now();
    return fetch(url, {
      headers: {
        // CarComplaints returns better content with a UA.
        'User-Agent': 'AutoRevKnownIssuesBot/1.0 (+https://autorev.example)'
      }
    });
  };
}

function escapeSqlString(value) {
  return value.replaceAll("'", "''");
}

/**
 * @param {string|null|undefined} v
 */
function sqlTextOrNull(v) {
  if (v === null || v === undefined) return 'NULL';
  return `'${escapeSqlString(String(v))}'`;
}

/**
 * @param {Severity} s
 */
function normalizeSeverity(s) {
  if (s === 'Critical' || s === 'Major' || s === 'Minor') return s;
  return 'Minor';
}

/**
 * @param {string} html
 */
function parseHtmlTitle(html) {
  const m = html.match(/<title>([^<]+)<\/title>/i);
  return m?.[1]?.trim() || null;
}

/**
 * @param {string} html
 */
function parseMetaDescription(html) {
  const m = html.match(/<meta\s+name=\"description\"\s+content=\"([^\"]+)\"\s*\/?\s*>/i);
  return m?.[1]?.trim() || null;
}

/**
 * Extract CarComplaints complaint links from a model page.
 *
 * Model page example: https://www.carcomplaints.com/Volkswagen/GTI/
 * Complaint page example: /Volkswagen/GTI/2012/engine/engine_failure.shtml
 *
 * @param {string} modelUrl
 * @param {string} html
 * @param {number} limit
 */
function extractCarComplaintsComplaintLinks(modelUrl, html, limit) {
  const u = new URL(modelUrl);
  const basePath = u.pathname.endsWith('/') ? u.pathname : `${u.pathname}/`;

  // Only keep complaint pages under the model path and containing a year.
  const re = new RegExp(`href=\\"(${basePath}\\d{4}\\/[^\\\"]+?\\.shtml)\\"`, 'g');

  /** @type {string[]} */
  const out = [];
  const seen = new Set();
  let m;
  // eslint-disable-next-line no-cond-assign
  while ((m = re.exec(html))) {
    const href = m[1];
    if (!href) continue;
    if (href.includes('/news/')) continue;
    if (seen.has(href)) continue;

    seen.add(href);
    out.push(new URL(href, u.origin).toString());
    if (out.length >= limit) break;
  }

  return out;
}

/**
 * @param {string} complaintUrl
 * @param {string} html
 * @returns {KnownIssue|null}
 */
function parseCarComplaintsComplaintPage(complaintUrl, html) {
  const title = parseHtmlTitle(html);
  const metaDesc = parseMetaDescription(html);

  if (!title || !metaDesc) return null;

  // Title example: "2012 Volkswagen GTI Engine Failure: 6 Complaints"
  const mTitle = title.match(/^\d{4}\s+.*?\s+(.+?):\s*\d+\s+Complaints/i);
  const issueName = (mTitle?.[1] || title).trim();

  // Meta description example:
  // "The 2012 Volkswagen GTI has 6 problems reported for engine failure. Average repair cost is $6,670 at 79,750 miles."
  const mCost = metaDesc.match(/Average repair cost is \$([0-9,]+)/i);
  const mMiles = metaDesc.match(/at\s+([0-9,]+)\s+miles/i);

  const estimatedCost = mCost ? `$${mCost[1]}` : null;
  const avgMiles = mMiles ? `${mMiles[1]} miles` : null;

  const solutions = [];
  const solBlock = html.match(/Most Common Solutions:<\/h4>[\s\S]*?<\/ol>/i);
  if (solBlock) {
    const items = [...solBlock[0].matchAll(/<li><em>([^<]+)</gi)].map(x => x[1]?.trim()).filter(Boolean);
    for (const it of items.slice(0, 3)) solutions.push(it);
  }

  /** @type {Severity} */
  let severity = 'Minor';
  const nameLower = issueName.toLowerCase();
  if (/(airbag|brake|steering|fire)/i.test(issueName)) severity = 'Critical';
  else if (/(engine|trans|transmission|clutch|fuel|cooling|overheat|failure|stall|turbo|timing)/i.test(issueName)) severity = 'Major';

  const descParts = [metaDesc];
  if (avgMiles) descParts.push(`(Avg mileage: ${avgMiles})`);

  return {
    issue_name: issueName,
    severity,
    affected_years: null,
    description: descParts.join(' '),
    symptoms: null,
    prevention: null,
    fix_description: solutions.length ? `Common solutions reported: ${solutions.join('; ')}` : null,
    estimated_cost: estimatedCost,
    source_url: complaintUrl
  };
}

/**
 * @param {string} url
 * @param {(url: string) => Promise<Response>} rateFetch
 */
async function fetchText(url, rateFetch) {
  const res = await rateFetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

/**
 * @param {string} url
 * @param {(url: string) => Promise<Response>} rateFetch
 */
async function fetchJson(url, rateFetch) {
  const res = await rateFetch(url);
  // NHTSA sometimes returns HTTP 400 with a JSON body like:
  // {"count":0,"message":"Results returned successfully","results":[]}
  // Treat that as a valid (empty) response.
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    // If it's not JSON, treat as an error.
    throw new Error(`Non-JSON response (HTTP ${res.status}) for ${url}`);
  }

  if (!res.ok && res.status !== 400) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }

  return json;
}

/**
 * @param {string} modelUrl
 * @param {(url: string) => Promise<Response>} rateFetch
 * @param {number} maxIssues
 * @returns {Promise<KnownIssue[]>}
 */
async function getCarComplaintsIssuesForModel(modelUrl, rateFetch, maxIssues) {
  const html = await fetchText(modelUrl, rateFetch);
  const complaintLinks = extractCarComplaintsComplaintLinks(modelUrl, html, Math.max(10, maxIssues * 3));

  /** @type {KnownIssue[]} */
  const issues = [];

  for (const link of complaintLinks) {
    if (issues.length >= maxIssues) break;

    try {
      const detailHtml = await fetchText(link, rateFetch);
      const parsed = parseCarComplaintsComplaintPage(link, detailHtml);
      if (!parsed) continue;

      // Prefer issues that have either a fix hint or cost (higher-signal).
      const hasSignal = Boolean(parsed.fix_description || parsed.estimated_cost);
      if (!hasSignal && issues.length > 0) continue;

      issues.push(parsed);
    } catch (err) {
      console.warn('[Known Issues] CarComplaints fetch failed:', link, err?.message || err);
    }
  }

  return issues;
}

/**
 * @param {{make: string, model: string, year: number}} ref
 * @returns {{recallsUrl: string, complaintsUrl: string, tsbsUrl: string}}
 */
function buildNhtsaUrls(ref) {
  const { make, model, year } = ref;
  const recallsUrl = `https://api.nhtsa.gov/recalls/recallsByVehicle?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&modelYear=${encodeURIComponent(year)}`;
  const complaintsUrl = `https://api.nhtsa.gov/complaints/complaintsByVehicle?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&modelYear=${encodeURIComponent(year)}`;
  const tsbsUrl = `https://api.nhtsa.gov/products/vehicle/makes/${encodeURIComponent(make)}/models/${encodeURIComponent(model)}/years/${encodeURIComponent(year)}/tsbs?format=json`;
  return { recallsUrl, complaintsUrl, tsbsUrl };
}

/**
 * @param {{make: string, model: string, year: number}} ref
 * @param {(url: string) => Promise<Response>} rateFetch
 * @returns {Promise<KnownIssue[]>}
 */
async function getNhtsaIssues(ref, rateFetch) {
  const { make, model, year } = ref;
  const { recallsUrl, complaintsUrl, tsbsUrl } = buildNhtsaUrls(ref);

  /** @type {KnownIssue[]} */
  const out = [];

  // Recalls
  try {
    const json = await fetchJson(recallsUrl, rateFetch);
    const recalls = Array.isArray(json?.results) ? json.results : [];
    if (recalls.length > 0) {
      const samples = recalls.slice(0, 3).map(r => {
        const comp = r.Component || 'Unknown component';
        const sum = r.Summary || r.summary || '';
        return `${comp}: ${String(sum).slice(0, 180)}`;
      });

      out.push({
        issue_name: `NHTSA Recalls (${make} ${model} ${year})`,
        severity: 'Major',
        affected_years: String(year),
        description: `NHTSA recall records for ${make} ${model} ${year}. Sample recall summaries: ${samples.join(' | ')}`,
        symptoms: null,
        prevention: null,
        fix_description: null,
        estimated_cost: null,
        source_url: recallsUrl
      });
    }
  } catch (err) {
    console.warn('[Known Issues] NHTSA recalls fetch failed:', make, model, year, err?.message || err);
  }

  // Complaints
  try {
    const json = await fetchJson(complaintsUrl, rateFetch);
    const complaints = Array.isArray(json?.results) ? json.results : [];
    if (complaints.length > 0) {
      const byComponent = new Map();
      for (const c of complaints) {
        // complaintsByVehicle uses lower-camel fields like `components`, `summary`
        // (while recallsByVehicle uses PascalCase).
        const comp = c.components || c.Component || 'Other';
        byComponent.set(comp, (byComponent.get(comp) || 0) + 1);
      }
      const top = [...byComponent.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
      const topText = top.map(([comp, count]) => `${comp} (n=${count})`).join(', ');
      const sampleSummaries = complaints
        .map(c => c.summary || c.Summary)
        .filter(Boolean)
        .slice(0, 2)
        .map(s => String(s).replaceAll(/\s+/g, ' ').trim().slice(0, 220));

      const severity = complaints.length >= 50 ? 'Major' : complaints.length >= 10 ? 'Minor' : 'Minor';

      out.push({
        issue_name: `NHTSA Complaints (${make} ${model} ${year})`,
        severity,
        affected_years: String(year),
        description: `NHTSA ODI complaint records for ${make} ${model} ${year} (count=${complaints.length}). Top components: ${topText}. Sample complaint summaries: ${sampleSummaries.join(' | ')}`,
        symptoms: null,
        prevention: null,
        fix_description: null,
        estimated_cost: null,
        source_url: complaintsUrl
      });
    }
  } catch (err) {
    console.warn('[Known Issues] NHTSA complaints fetch failed:', make, model, year, err?.message || err);
  }

  // TSBs
  try {
    const json = await fetchJson(tsbsUrl, rateFetch);
    const tsbs = Array.isArray(json?.results) ? json.results : [];
    if (tsbs.length > 0) {
      const byComp = new Map();
      for (const t of tsbs) {
        const comp = t.Component || 'Other';
        byComp.set(comp, (byComp.get(comp) || 0) + 1);
      }
      const top = [...byComp.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
      const topText = top.map(([comp, count]) => `${comp} (n=${count})`).join(', ');

      out.push({
        issue_name: `NHTSA TSBs (${make} ${model} ${year})`,
        severity: 'Minor',
        affected_years: String(year),
        description: `NHTSA TSB records for ${make} ${model} ${year} (count=${tsbs.length}). Top components: ${topText}.`,
        symptoms: null,
        prevention: null,
        fix_description: null,
        estimated_cost: null,
        source_url: tsbsUrl
      });
    }
  } catch (err) {
    console.warn('[Known Issues] NHTSA TSB fetch failed:', make, model, year, err?.message || err);
  }

  return out;
}

/**
 * @param {KnownIssue[]} issues
 */
function dedupeIssues(issues) {
  const seen = new Set();
  /** @type {KnownIssue[]} */
  const out = [];

  for (const i of issues) {
    const key = i.issue_name.toLowerCase().trim();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      ...i,
      severity: normalizeSeverity(i.severity)
    });
  }

  return out;
}

/**
 * @param {PlatformMappingsFile} mappings
 */
function validateMappings(mappings) {
  if (!mappings || !Array.isArray(mappings.platforms)) {
    throw new Error('Invalid platform mappings file');
  }

  const carSlugs = new Set(carData.map(c => c.slug));
  const mapped = [];

  for (const p of mappings.platforms) {
    if (!p?.id || !Array.isArray(p.cars)) throw new Error(`Invalid platform entry: ${p?.id || 'unknown'}`);
    for (const s of p.cars) mapped.push(s);
  }

  const mappedSet = new Set(mapped);
  const dup = [...new Set(mapped.filter((s, i) => mapped.indexOf(s) !== i))];
  const missing = [...carSlugs].filter(s => !mappedSet.has(s));
  const extra = [...mappedSet].filter(s => !carSlugs.has(s));

  if (dup.length || missing.length || extra.length) {
    throw new Error(
      `platform-mappings.json invalid: dup=${dup.length}, missing=${missing.length}, extra=${extra.length}`
    );
  }
}

/**
 * @param {string} outPath
 * @param {Array<{car_slug: string, issue: KnownIssue, sort_order: number}>} rows
 */
function writeSqlFile(outPath, rows) {
  const header = [
    '-- Auto-generated by scripts/populate-known-issues.js',
    '--',
    '-- NOTE: This repo\'s `car_known_issues` table has no `source_url` column.',
    '-- For citability, URLs are written into the `source` column.',
    '--',
    '-- Review this file before executing in Supabase.',
    ''
  ].join('\n');

  const insertHeader =
    'INSERT INTO car_known_issues (\n' +
    '  car_slug,\n' +
    '  issue_name,\n' +
    '  severity,\n' +
    '  affected_years,\n' +
    '  description,\n' +
    '  symptoms,\n' +
    '  prevention,\n' +
    '  fix_description,\n' +
    '  estimated_cost,\n' +
    '  source,\n' +
    '  sort_order\n' +
    ') VALUES\n';

  const values = rows
    .map(r => {
      const i = r.issue;
      return (
        '(' +
        [
          sqlTextOrNull(r.car_slug),
          sqlTextOrNull(i.issue_name),
          sqlTextOrNull(i.severity),
          sqlTextOrNull(i.affected_years),
          sqlTextOrNull(i.description),
          sqlTextOrNull(i.symptoms),
          sqlTextOrNull(i.prevention),
          sqlTextOrNull(i.fix_description),
          sqlTextOrNull(i.estimated_cost),
          sqlTextOrNull(i.source_url),
          String(r.sort_order)
        ].join(', ') +
        ')'
      );
    })
    .join(',\n');

  const sql = `${header}${insertHeader}${values};\n`;

  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, sql, 'utf8');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const outRel = typeof args['--out'] === 'string'
    ? args['--out']
    : 'supabase/migrations/043_known_issues_full.sql';

  const outPath = resolve(__dirname, '..', outRel);

  const rateLimitMsRaw = args['--rate-limit-ms'];
  const rateLimitMs = typeof rateLimitMsRaw === 'string' ? Number(rateLimitMsRaw) : 1000;

  if (!Number.isFinite(rateLimitMs) || rateLimitMs < 0) {
    throw new Error(`Invalid --rate-limit-ms: ${rateLimitMsRaw}`);
  }

  const ccRateLimitMsRaw = args['--carcomplaints-rate-limit-ms'];
  const ccRateLimitMs = typeof ccRateLimitMsRaw === 'string' ? Number(ccRateLimitMsRaw) : 250;
  if (!Number.isFinite(ccRateLimitMs) || ccRateLimitMs < 0) {
    throw new Error(`Invalid --carcomplaints-rate-limit-ms: ${ccRateLimitMsRaw}`);
  }

  const isDryRun = Boolean(args['--dry-run']);

  /** @type {PlatformMappingsFile} */
  const mappings = JSON.parse(
    readFileSync(resolve(__dirname, 'platform-mappings.json'), 'utf8')
  );

  validateMappings(mappings);

  // NHTSA rate limit is required (default 1 req/sec). CarComplaints is throttled separately.
  const nhtsaFetch = createRateLimitedFetch({ minIntervalMs: rateLimitMs });
  const carComplaintsFetch = createRateLimitedFetch({ minIntervalMs: ccRateLimitMs });

  /** @type {Array<{car_slug: string, issue: KnownIssue, sort_order: number}>} */
  const rows = [];

  for (const platform of mappings.platforms) {
    console.log(`[Known Issues] Platform: ${platform.name} (${platform.id}) — cars=${platform.cars.length}`);

    /** @type {KnownIssue[]} */
    let platformIssues = [];

    for (const ref of platform.referenceVehicles || []) {
      // CarComplaints
      if (ref.carComplaintsModelUrl) {
        try {
          const ccIssues = await getCarComplaintsIssuesForModel(ref.carComplaintsModelUrl, carComplaintsFetch, 3);
          platformIssues.push(...ccIssues);
        } catch (err) {
          console.warn('[Known Issues] CarComplaints model fetch failed:', ref.carComplaintsModelUrl, err?.message || err);
        }
      }

      // NHTSA
      if (ref.nhtsa) {
        try {
          const nhtsaIssues = await getNhtsaIssues(ref.nhtsa, nhtsaFetch);
          platformIssues.push(...nhtsaIssues);
        } catch (err) {
          console.warn('[Known Issues] NHTSA fetch failed:', ref.nhtsa, err?.message || err);
        }
      }
    }

    platformIssues = dedupeIssues(platformIssues);

    if (platformIssues.length === 0) {
      // Hard fail: the acceptance criteria requires every car to have at least one issue.
      throw new Error(
        `No issues found for platform ${platform.id}. Add/adjust referenceVehicles in scripts/platform-mappings.json.`
      );
    }

    for (const car_slug of platform.cars) {
      for (let i = 0; i < platformIssues.length; i++) {
        rows.push({
          car_slug,
          issue: platformIssues[i],
          sort_order: i + 1
        });
      }
    }

    console.log(`[Known Issues]   collected issues=${platformIssues.length}, generated rows=${platformIssues.length * platform.cars.length}`);
  }

  // Validation: every car slug must have at least 1 row
  const carSlugSet = new Set(carData.map(c => c.slug));
  const covered = new Set(rows.map(r => r.car_slug));
  const missingCars = [...carSlugSet].filter(s => !covered.has(s));
  if (missingCars.length > 0) {
    throw new Error(`Coverage check failed: ${missingCars.length} car(s) have 0 issues: ${missingCars.join(', ')}`);
  }

  // Validation: every issue row must have a source URL
  const noSource = rows.filter(r => !r.issue.source_url);
  if (noSource.length > 0) {
    throw new Error(`Source URL check failed: ${noSource.length} row(s) missing source_url`);
  }

  if (isDryRun) {
    console.log(`[Known Issues] Dry run complete. Would write: ${outPath}`);
    console.log(`[Known Issues] Rows: ${rows.length} (cars=${carSlugSet.size})`);
    return;
  }

  writeSqlFile(outPath, rows);
  console.log(`[Known Issues] Wrote SQL: ${outPath}`);
  console.log(`[Known Issues] Rows: ${rows.length} (cars=${carSlugSet.size})`);
}

main().catch(err => {
  console.error('[Known Issues] Fatal:', err);
  process.exitCode = 1;
});












