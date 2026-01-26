import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

function readRepoFile(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

test('SaveEventButton uses events save endpoint (not garage/favorites) and exposes correct label', () => {
  const content = readRepoFile('components/SaveEventButton.jsx');

  // Ensures the heart icon on events triggers the events save endpoint.
  assert.match(content, /fetch\(`\/api\/events\/\$\{eventSlug\}\/save`/);
  // Auth transport: API routes may not have cookie-based sessions, so the client should forward a Bearer token.
  assert.match(content, /headers\.Authorization\s*=\s*`Bearer\s*\$\{session\.access_token\}`/);

  // Guard rails: it must not call garage/favorites endpoints or providers.
  assert.doesNotMatch(content, /\/api\/users\/\$\{.*\}\/garage/);
  assert.doesNotMatch(content, /useFavorites|FavoritesProvider|addFavorite|removeFavorite/);

  // UX + a11y: confirm this is an Event save control.
  assert.match(content, /aria-label=\{isSaved \? 'Unsave Event' : 'Save Event'\}/);
});

test('EventCard uses SaveEventButton (not CarActionMenu) for event saving', () => {
  const content = readRepoFile('components/EventCard.jsx');

  assert.match(content, /import SaveEventButton from '\.\/SaveEventButton';/);
  assert.match(content, /<SaveEventButton/);
  // It's fine if the file *mentions* CarActionMenu in comments; we only care that it
  // does not import or render it (which would risk wiring to the car favorites flow).
  assert.doesNotMatch(content, /import\s+CarActionMenu\s+from\s+['"][^'"]+['"]/);
  assert.doesNotMatch(content, /<CarActionMenu\b/);
});

test('Events save API route writes to event_saves (not user_favorites)', () => {
  const content = readRepoFile('app/api/events/[slug]/save/route.js');

  // Database target table is the canonical event bookmark table.
  assert.match(content, /\.from\('event_saves'\)/);
  assert.doesNotMatch(content, /\.from\('user_favorites'\)/);

  // Ensure it uses the authenticated user id and resolved event id.
  assert.match(content, /supabase\.auth\.getUser\(/);
  // Auth transport: accept Authorization: Bearer token for non-cookie auth flows.
  assert.match(content, /getBearerToken\(request\)/);
  assert.match(content, /createAuthenticatedClient\(bearerToken\)/);
  assert.match(content, /insert\(\{\s*user_id:\s*user\.id,\s*event_id:\s*event\.id,\s*\}\)/s);
});

test('Saved events API route supports Bearer token auth', () => {
  const content = readRepoFile('app/api/users/[userId]/saved-events/route.js');

  assert.match(content, /getBearerToken\(request\)/);
  assert.match(content, /createAuthenticatedClient\(bearerToken\)/);
  assert.match(content, /supabase\.auth\.getUser\(/);
});


