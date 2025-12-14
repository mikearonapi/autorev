import crypto from 'crypto';
import { supabaseServiceRole, isSupabaseConfigured } from './supabase.js';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small'; // 1536 dims

function requireServiceRole() {
  if (!isSupabaseConfigured || !supabaseServiceRole) {
    throw new Error('Supabase service role not configured');
  }
  return supabaseServiceRole;
}

function requireOpenAI() {
  if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not configured');
}

function chunkText(text, { maxChars = 1200, overlapChars = 150 } = {}) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (!clean) return [];

  const chunks = [];
  let start = 0;
  while (start < clean.length) {
    const end = Math.min(clean.length, start + maxChars);
    const chunk = clean.slice(start, end).trim();
    if (chunk) chunks.push(chunk);
    if (end >= clean.length) break;
    start = Math.max(0, end - overlapChars);
  }
  return chunks;
}

async function generateEmbedding(text) {
  requireOpenAI();
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OPENAI_EMBEDDING_MODEL,
      input: String(text || '').slice(0, 8000),
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `OpenAI embeddings failed (${res.status})`);
  }

  const data = await res.json();
  const embedding = data?.data?.[0]?.embedding;
  if (!Array.isArray(embedding)) throw new Error('OpenAI embeddings returned no vector');
  return embedding;
}

function toPgVectorLiteral(vec) {
  return `[${vec.join(',')}]`;
}

async function resolveCarId(client, carSlug) {
  if (!carSlug) return null;
  const { data } = await client.from('cars').select('id').eq('slug', carSlug).maybeSingle();
  return data?.id || null;
}

function computeChecksum({ sourceType, sourceUrl, sourceTitle, carSlug, topic, text }) {
  const checksumInput = JSON.stringify({
    sourceType,
    sourceUrl: sourceUrl || null,
    sourceTitle: sourceTitle || null,
    carSlug: carSlug || null,
    topic: topic || null,
    textHash: crypto.createHash('sha256').update(String(text || '')).digest('hex'),
  });
  return crypto.createHash('sha256').update(checksumInput).digest('hex');
}

/**
 * Index a document into (source_documents, document_chunks).
 * Re-index is deterministic: we delete chunks and reinsert.
 */
export async function ingestKnowledgeText({
  sourceType,
  sourceUrl,
  sourceTitle,
  license = null,
  carSlug = null,
  topic = null,
  text,
  metadata = {},
}) {
  const client = requireServiceRole();
  requireOpenAI();

  if (!sourceType) throw new Error('sourceType is required');
  if (!text || String(text).trim().length < 200) throw new Error('text is required (min 200 chars)');

  const carId = await resolveCarId(client, carSlug);
  const checksum = computeChecksum({ sourceType, sourceUrl, sourceTitle, carSlug, topic, text });

  // Get or create source_documents by checksum
  const { data: existingDoc, error: selErr } = await client
    .from('source_documents')
    .select('id')
    .eq('checksum', checksum)
    .maybeSingle();
  if (selErr) throw selErr;

  let documentId = existingDoc?.id || null;
  if (!documentId) {
    const { data: inserted, error: insErr } = await client
      .from('source_documents')
      .insert({
        source_type: sourceType,
        source_url: sourceUrl || null,
        source_title: sourceTitle || null,
        license: license || null,
        retrieved_at: new Date().toISOString(),
        checksum,
        raw_text: text,
        raw_json: null,
        metadata: {
          ...(metadata || {}),
          car_slug: carSlug || null,
          car_id: carId,
          topic: topic || null,
          ingested_by: 'knowledgeIndexService',
        },
      })
      .select('id')
      .single();
    if (insErr) throw insErr;
    documentId = inserted.id;
  } else {
    const { error: updErr } = await client
      .from('source_documents')
      .update({
        raw_text: text,
        metadata: {
          ...(metadata || {}),
          car_slug: carSlug || null,
          car_id: carId,
          topic: topic || null,
          ingested_by: 'knowledgeIndexService',
        },
      })
      .eq('id', documentId);
    if (updErr) throw updErr;
  }

  // Re-index chunks
  const { error: delErr } = await client.from('document_chunks').delete().eq('document_id', documentId);
  if (delErr) throw delErr;

  const chunks = chunkText(text, { maxChars: 1200, overlapChars: 150 });
  let insertedChunks = 0;

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const embedding = await generateEmbedding(chunk);
    const pgVec = toPgVectorLiteral(embedding);

    const { error } = await client
      .from('document_chunks')
      .insert({
        document_id: documentId,
        car_id: carId,
        car_slug: carSlug || null,
        chunk_index: i,
        chunk_text: chunk,
        chunk_tokens: Math.ceil(chunk.length / 4),
        topic: topic || sourceType,
        embedding_model: OPENAI_EMBEDDING_MODEL,
        embedding: pgVec,
        metadata: {
          source_type: sourceType,
          source_url: sourceUrl || null,
          source_title: sourceTitle || null,
          license: license || null,
        },
      });
    if (error) throw error;
    insertedChunks++;
  }

  return { documentId, checksum, chunks: insertedChunks };
}

export async function runKnowledgeIndexJob(job) {
  const payload = job?.job_payload || job?.jobPayload || {};
  const mode = payload?.mode || 'internal_docs';

  if (mode === 'internal_docs') {
    // Keep this conservative: only index our own repo docs/audit by default.
    // In Vercel serverless, the repository files may not be present on disk,
    // so we fall back to GitHub Contents API when needed.
    const { readFile, readdir } = await import('fs/promises');
    const path = await import('path');

    const root = payload?.root || process.cwd();
    const includeDirs = Array.isArray(payload?.includeDirs) ? payload.includeDirs : ['docs', 'audit'];
    const maxFiles = Number.isFinite(Number(payload?.maxFiles)) ? Number(payload.maxFiles) : 40;
    const maxCharsPerFile = Number.isFinite(Number(payload?.maxCharsPerFile)) ? Number(payload.maxCharsPerFile) : 25000;

    /** @type {string[]} */
    const files = [];

    async function walk(dirAbs) {
      const entries = await readdir(dirAbs, { withFileTypes: true });
      for (const e of entries) {
        if (files.length >= maxFiles) return;
        const abs = path.join(dirAbs, e.name);
        if (e.isDirectory()) {
          await walk(abs);
        } else if (e.isFile() && (e.name.endsWith('.md') || e.name.endsWith('.txt'))) {
          files.push(abs);
        }
      }
    }

    let ok = 0;
    let chunks = 0;

    let usedGithubFallback = false;

    try {
      for (const d of includeDirs) {
        if (files.length >= maxFiles) break;
        await walk(path.join(root, d));
      }

      for (const abs of files) {
        const rel = abs.startsWith(root) ? abs.slice(root.length).replace(/^[\\/]/, '') : abs;
        const raw = await readFile(abs, 'utf8').catch(() => '');
        const text = String(raw || '').slice(0, maxCharsPerFile);
        if (text.trim().length < 200) continue;

        const result = await ingestKnowledgeText({
          sourceType: 'internal_doc',
          sourceUrl: `repo://${rel}`,
          sourceTitle: rel,
          license: 'internal',
          topic: payload?.topic || 'internal_doc',
          text,
          metadata: { file_path: rel },
        });
        ok++;
        chunks += result.chunks;
      }
    } catch (err) {
      // Likely running in serverless bundle without docs/ folder.
      usedGithubFallback = true;
    }

    if (usedGithubFallback || ok === 0) {
      const owner = process.env.VERCEL_GIT_REPO_OWNER || process.env.GITHUB_REPO_OWNER || null;
      const repo = process.env.VERCEL_GIT_REPO_SLUG || process.env.GITHUB_REPO_SLUG || null;
      const ref = process.env.VERCEL_GIT_COMMIT_REF || 'main';

      if (!owner || !repo) {
        return { mode, filesIndexed: ok, chunksIndexed: chunks, githubFallback: false, note: 'No repo owner/slug available in env' };
      }

      /** @type {{path: string, download_url: string|null}[]} */
      const ghFiles = [];

      async function listDir(dirPath) {
        const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${dirPath}?ref=${encodeURIComponent(ref)}`;
        const res = await fetch(apiUrl, { headers: { 'User-Agent': 'AutoRev/knowledge-index' } });
        if (!res.ok) throw new Error(`GitHub contents fetch failed (${res.status}) for ${dirPath}`);
        const data = await res.json();
        if (!Array.isArray(data)) return;

        for (const entry of data) {
          if (ghFiles.length >= maxFiles) return;
          if (entry?.type === 'dir') {
            await listDir(entry.path);
          } else if (entry?.type === 'file') {
            const name = String(entry?.name || '');
            if (name.endsWith('.md') || name.endsWith('.txt')) {
              ghFiles.push({ path: entry.path, download_url: entry.download_url || null });
            }
          }
        }
      }

      for (const d of includeDirs) {
        if (ghFiles.length >= maxFiles) break;
        await listDir(String(d).replace(/^[\\/]+/, '').replace(/[\\/]+$/, ''));
      }

      let ghOk = 0;
      let ghChunks = 0;

      for (const f of ghFiles) {
        const dl = f.download_url;
        if (!dl) continue;
        const r = await fetch(dl, { headers: { 'User-Agent': 'AutoRev/knowledge-index' } });
        if (!r.ok) continue;
        const raw = await r.text();
        const text = String(raw || '').slice(0, maxCharsPerFile);
        if (text.trim().length < 200) continue;

        const sourceUrl = `https://github.com/${owner}/${repo}/blob/${ref}/${f.path}`;
        const result = await ingestKnowledgeText({
          sourceType: 'internal_doc',
          sourceUrl,
          sourceTitle: f.path,
          license: 'internal',
          topic: payload?.topic || 'internal_doc',
          text,
          metadata: { file_path: f.path, github: { owner, repo, ref, download_url: dl } },
        });
        ghOk++;
        ghChunks += result.chunks;
      }

      return { mode, filesIndexed: ghOk, chunksIndexed: ghChunks, githubFallback: true, repo: `${owner}/${repo}`, ref };
    }

    return { mode, filesIndexed: ok, chunksIndexed: chunks };
  }

  if (mode === 'items') {
    const items = Array.isArray(payload?.items) ? payload.items : [];
    if (items.length === 0) throw new Error('knowledge_index items payload is empty');

    let ok = 0;
    let chunks = 0;
    for (const it of items) {
      const result = await ingestKnowledgeText(it);
      ok++;
      chunks += result.chunks;
    }
    return { mode, itemsIndexed: ok, chunksIndexed: chunks };
  }

  throw new Error(`Unknown knowledge_index mode: ${mode}`);
}

