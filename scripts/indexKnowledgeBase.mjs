/**
 * Index YouTube transcripts into `source_documents` + `document_chunks` with embeddings.
 *
 * Enables AL tool: search_knowledge (pgvector similarity + citations).
 *
 * Env (.env.local):
 *  - NEXT_PUBLIC_SUPABASE_URL
 *  - SUPABASE_SERVICE_ROLE_KEY
 *  - OPENAI_API_KEY
 *  - (optional) OPENAI_EMBEDDING_MODEL (default: text-embedding-3-small)
 *
 * Run:
 *  node scripts/indexKnowledgeBase.mjs
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small'; // 1536 dims

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}
if (!OPENAI_API_KEY) {
  console.error('Missing OPENAI_API_KEY in .env.local (required for embeddings)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function generateEmbedding(text) {
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OPENAI_EMBEDDING_MODEL,
      input: text.slice(0, 8000),
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

function chunkText(text, { maxChars = 1400, overlapChars = 200 } = {}) {
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

async function getOrCreateSourceDocument({ checksum, sourceUrl, sourceTitle, rawText, rawJson, metadata }) {
  const existing = await supabase
    .from('source_documents')
    .select('id')
    .eq('checksum', checksum)
    .maybeSingle();

  if (!existing.error && existing.data?.id) return existing.data.id;

  const inserted = await supabase
    .from('source_documents')
    .insert({
      source_type: 'youtube',
      source_url: sourceUrl,
      source_title: sourceTitle,
      retrieved_at: new Date().toISOString(),
      checksum,
      raw_text: rawText,
      raw_json: rawJson,
      metadata,
    })
    .select('id')
    .single();

  if (inserted.error) throw inserted.error;
  return inserted.data.id;
}

async function indexVideo(video, linksByVideoId) {
  const transcript = video.transcript_text?.trim();
  if (!transcript) return { skipped: true, reason: 'no transcript' };

  const videoId = video.video_id;
  const url = video.url;
  const title = video.title || videoId;

  const checksum = `youtube:${videoId}:transcript_v1`;
  const rawText = [
    `Title: ${title}`,
    video.channel_name ? `Channel: ${video.channel_name}` : null,
    video.published_at ? `Published: ${new Date(video.published_at).toISOString()}` : null,
    url ? `URL: ${url}` : null,
    video.summary ? `Summary: ${video.summary}` : null,
    '',
    transcript,
  ].filter(Boolean).join('\n');

  const documentId = await getOrCreateSourceDocument({
    checksum,
    sourceUrl: url,
    sourceTitle: title,
    rawText,
    rawJson: { videoId, url, channelName: video.channel_name, publishedAt: video.published_at, summary: video.summary },
    metadata: { video_id: videoId, channel_name: video.channel_name, published_at: video.published_at },
  });

  // Re-index: remove existing chunks for this doc to keep it deterministic
  const del = await supabase.from('document_chunks').delete().eq('document_id', documentId);
  if (del.error) throw del.error;

  const carLinks = linksByVideoId.get(videoId) || [];
  const carTargets = carLinks.length > 0 ? carLinks : [{ car_id: null, car_slug: null, role: null, match_confidence: null }];

  const chunks = chunkText(transcript, { maxChars: 1400, overlapChars: 200 });
  let chunkRowCount = 0;

  for (const target of carTargets) {
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = await generateEmbedding(chunk);
      const pgVec = toPgVectorLiteral(embedding);

      const { error } = await supabase.from('document_chunks').insert({
        document_id: documentId,
        car_id: target.car_id,
        car_slug: target.car_slug,
        chunk_index: i,
        chunk_text: chunk,
        chunk_tokens: Math.ceil(chunk.length / 4),
        topic: 'youtube_transcript',
        embedding_model: OPENAI_EMBEDDING_MODEL,
        embedding: pgVec,
        metadata: {
          video_id: videoId,
          url,
          role: target.role,
          match_confidence: target.match_confidence,
          channel_name: video.channel_name,
        },
      });
      if (error) throw error;
      chunkRowCount++;
    }
  }

  return { skipped: false, documentId, chunkRowCount };
}

async function main() {
  console.log('Fetching YouTube videos with transcripts...');

  const { data: videos, error: vErr } = await supabase
    .from('youtube_videos')
    .select('video_id,url,title,channel_name,published_at,summary,transcript_text')
    .not('transcript_text', 'is', null)
    .order('published_at', { ascending: false })
    .limit(50);
  if (vErr) throw vErr;

  const videoIds = (videos || []).map(v => v.video_id).filter(Boolean);
  console.log(`Found ${videoIds.length} videos (limit 50).`);

  const { data: links, error: lErr } = await supabase
    .from('youtube_video_car_links')
    .select('video_id,car_id,car_slug,role,match_confidence')
    .in('video_id', videoIds);
  if (lErr) throw lErr;

  const linksByVideoId = new Map();
  for (const link of links || []) {
    if (!linksByVideoId.has(link.video_id)) linksByVideoId.set(link.video_id, []);
    linksByVideoId.get(link.video_id).push(link);
  }

  let indexed = 0;
  let skipped = 0;

  for (const video of videos || []) {
    try {
      const res = await indexVideo(video, linksByVideoId);
      if (res.skipped) {
        skipped++;
        continue;
      }
      indexed++;
      console.log(`✅ Indexed ${video.title || video.video_id} (${res.chunkRowCount} chunks)`);
    } catch (err) {
      console.error(`❌ Failed ${video.title || video.video_id}:`, err?.message || err);
    }
  }

  console.log(`Done. Indexed: ${indexed}, skipped: ${skipped}`);
}

main().catch((err) => {
  console.error('Fatal:', err?.message || err);
  process.exit(1);
});


