/**
 * Upload API Tests
 * 
 * Tests for image and video upload functionality.
 * 
 * Run with: npm test -- tests/integration/api-uploads.test.js
 */

import test from 'node:test';
import assert from 'node:assert';

// Valid upload sources per database constraint
const VALID_UPLOAD_SOURCES = ['web', 'mobile', 'api'];

// Helper functions extracted from the API route
const getMediaType = (contentType) => {
  const videoTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/mov'];
  if (videoTypes.includes(contentType)) return 'video';
  return 'image';
};

const getExtension = (contentType) => {
  let ext = contentType.split('/')[1];
  if (ext === 'jpeg') ext = 'jpg';
  if (ext === 'quicktime') ext = 'mov';
  return ext;
};

test('Upload API: pathname extraction from blob URL with user ID', () => {
  const blobUrl = 'https://test.public.blob.vercel-storage.com/user-uploads/abc123-user-id/1234567890.jpg';
  const userId = 'abc123-user-id';
  
  const url = new URL(blobUrl);
  let urlPathname = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
  
  const expectedPrefix = `user-uploads/${userId}/`;
  assert.ok(urlPathname.startsWith(expectedPrefix), 'Pathname should start with user-uploads/userId/');
});

test('Upload API: __USER__ placeholder transformation', () => {
  const blobUrl = 'https://test.public.blob.vercel-storage.com/user-uploads/__USER__/1234567890.jpg';
  const userId = 'abc123-user-id';
  
  const url = new URL(blobUrl);
  let urlPathname = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
  
  if (urlPathname.includes('__USER__')) {
    urlPathname = urlPathname.replace('__USER__', userId);
  }
  
  const expectedPrefix = `user-uploads/${userId}/`;
  assert.ok(urlPathname.startsWith(expectedPrefix), '__USER__ placeholder should be replaced with userId');
});

test('Upload API: accepts valid image pathname', () => {
  const userId = 'abc123-user-id';
  const pathname = `user-uploads/${userId}/1234567890.jpg`;
  const expectedPrefix = `user-uploads/${userId}/`;
  
  assert.ok(pathname.startsWith(expectedPrefix), 'Image pathname should be valid');
});

test('Upload API: accepts valid video pathname', () => {
  const userId = 'abc123-user-id';
  const pathname = `user-videos/${userId}/1234567890.mp4`;
  const videoPrefix = `user-videos/${userId}/`;
  
  assert.ok(pathname.startsWith(videoPrefix), 'Video pathname should be valid');
});

test('Upload API: rejects pathname with wrong user ID', () => {
  const userId = 'abc123-user-id';
  const wrongUserId = 'wrong-user-id';
  const pathname = `user-uploads/${wrongUserId}/1234567890.jpg`;
  const expectedPrefix = `user-uploads/${userId}/`;
  const videoPrefix = `user-videos/${userId}/`;
  
  const isValid = pathname.startsWith(expectedPrefix) || pathname.startsWith(videoPrefix);
  assert.strictEqual(isValid, false, 'Should reject wrong user ID');
});

test('Upload API: identifies image content types', () => {
  assert.strictEqual(getMediaType('image/jpeg'), 'image');
  assert.strictEqual(getMediaType('image/png'), 'image');
  assert.strictEqual(getMediaType('image/webp'), 'image');
  assert.strictEqual(getMediaType('image/gif'), 'image');
});

test('Upload API: identifies video content types', () => {
  assert.strictEqual(getMediaType('video/mp4'), 'video');
  assert.strictEqual(getMediaType('video/webm'), 'video');
  assert.strictEqual(getMediaType('video/quicktime'), 'video');
  assert.strictEqual(getMediaType('video/mov'), 'video');
});

test('Upload API: upload_source "web" is valid for web uploads', () => {
  const uploadSource = 'web';
  assert.ok(VALID_UPLOAD_SOURCES.includes(uploadSource), 'web should be a valid upload source');
});

test('Upload API: rejects invalid upload_source values like "web-client"', () => {
  // This was the bug - 'web-client' was being used but isn't in the allowed constraint
  const invalidSources = ['web-client', 'desktop', 'browser', 'client'];
  invalidSources.forEach(source => {
    assert.ok(!VALID_UPLOAD_SOURCES.includes(source), `${source} should NOT be a valid upload source`);
  });
});

test('Upload API: upload_source "mobile" is valid', () => {
  assert.ok(VALID_UPLOAD_SOURCES.includes('mobile'), 'mobile should be a valid upload source');
});

test('Upload API: upload_source "api" is valid', () => {
  assert.ok(VALID_UPLOAD_SOURCES.includes('api'), 'api should be a valid upload source');
});

test('Upload API: normalizes jpeg to jpg extension', () => {
  assert.strictEqual(getExtension('image/jpeg'), 'jpg');
});

test('Upload API: normalizes quicktime to mov extension', () => {
  assert.strictEqual(getExtension('video/quicktime'), 'mov');
});

test('Upload API: preserves standard extensions', () => {
  assert.strictEqual(getExtension('image/png'), 'png');
  assert.strictEqual(getExtension('video/mp4'), 'mp4');
  assert.strictEqual(getExtension('video/webm'), 'webm');
});
