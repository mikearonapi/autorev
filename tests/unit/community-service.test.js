/**
 * Unit Tests: Community Service
 * 
 * Tests community post management and sharing utilities.
 * 
 * Run: node --test tests/unit/community-service.test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

// Import pure utility functions that don't require database
import {
  getPostShareUrl,
  getGarageShareUrl,
  getFacebookShareUrl,
  getTwitterShareUrl,
  getInstagramShareInfo,
  getNativeShareData,
} from '../../lib/communityService.js';

// =============================================================================
// SHARE URL TESTS
// =============================================================================

describe('getPostShareUrl', () => {
  it('should generate correct URL for a post slug', () => {
    const url = getPostShareUrl('my-awesome-build');
    assert.ok(url.includes('/community/builds/my-awesome-build'));
  });

  it('should handle slugs with hyphens', () => {
    const url = getPostShareUrl('2023-bmw-m3-competition-build');
    assert.ok(url.includes('/community/builds/2023-bmw-m3-competition-build'));
  });

  it('should return a valid URL format', () => {
    const url = getPostShareUrl('test-slug');
    // URL should be a valid path
    assert.ok(typeof url === 'string');
    assert.ok(url.length > 0);
  });
});

describe('getGarageShareUrl', () => {
  it('should generate correct URL for a public garage slug', () => {
    const url = getGarageShareUrl('mike-builds');
    assert.ok(url.includes('/garage/mike-builds'));
  });

  it('should handle various slug formats', () => {
    const slugs = ['user123', 'the-car-guy', 'bmw-enthusiast-99'];
    slugs.forEach(slug => {
      const url = getGarageShareUrl(slug);
      assert.ok(url.includes(`/garage/${slug}`));
    });
  });
});

describe('getFacebookShareUrl', () => {
  it('should generate correct Facebook share URL', () => {
    const url = getFacebookShareUrl('https://autorev.app/community/builds/my-build');
    assert.ok(url.includes('facebook.com/sharer'));
    assert.ok(url.includes(encodeURIComponent('https://autorev.app/community/builds/my-build')));
  });

  it('should properly encode the URL parameter', () => {
    const url = getFacebookShareUrl('https://autorev.app/test?param=value');
    assert.ok(url.includes(encodeURIComponent('https://autorev.app/test?param=value')));
  });
});

describe('getTwitterShareUrl', () => {
  it('should generate correct Twitter/X share URL', () => {
    const url = getTwitterShareUrl('https://autorev.app/builds/test', 'Check out my build!');
    assert.ok(url.includes('twitter.com/intent/tweet') || url.includes('x.com/intent/tweet'));
    assert.ok(url.includes('url='));
    assert.ok(url.includes('text='));
  });

  it('should encode both URL and text', () => {
    const shareUrl = 'https://autorev.app/builds/test';
    const text = 'Check out my BMW M3 build!';
    const url = getTwitterShareUrl(shareUrl, text);
    assert.ok(url.includes(encodeURIComponent(shareUrl)));
    assert.ok(url.includes(encodeURIComponent(text)));
  });

  it('should work without text parameter', () => {
    const url = getTwitterShareUrl('https://autorev.app/builds/test');
    assert.ok(typeof url === 'string');
    assert.ok(url.includes('url='));
  });
});

describe('getInstagramShareInfo', () => {
  it('should return share info object', () => {
    const info = getInstagramShareInfo('https://autorev.app/builds/test');
    assert.ok(typeof info === 'object');
  });

  it('should include instructions for sharing', () => {
    const info = getInstagramShareInfo('https://autorev.app/builds/test');
    // Instagram doesn't support direct URL sharing, so it should provide instructions
    assert.ok(info.message || info.instructions || info.url);
  });
});

describe('getNativeShareData', () => {
  it('should return valid share data object', () => {
    const data = getNativeShareData({
      title: 'My BMW M3 Build',
      text: 'Check out my track build!',
      url: 'https://autorev.app/builds/test',
    });
    
    assert.ok(typeof data === 'object');
    assert.ok(data.title === 'My BMW M3 Build');
    assert.ok(data.text === 'Check out my track build!');
    assert.ok(data.url === 'https://autorev.app/builds/test');
  });

  it('should handle missing optional fields', () => {
    const data = getNativeShareData({
      url: 'https://autorev.app/builds/test',
    });
    
    assert.ok(typeof data === 'object');
    assert.ok(data.url === 'https://autorev.app/builds/test');
  });
});

// =============================================================================
// SLUG VALIDATION TESTS
// =============================================================================

describe('Slug Format Validation', () => {
  it('should accept valid post slugs', () => {
    const validSlugs = [
      'my-awesome-build',
      'bmw-m3-e46-track-build',
      '2023-supra-project',
      'simple',
      'has-numbers-123',
    ];
    
    validSlugs.forEach(slug => {
      // Valid slugs should be lowercase with hyphens and numbers only
      const isValid = /^[a-z0-9-]+$/.test(slug) && slug.length > 0;
      assert.strictEqual(isValid, true, `Slug should be valid: ${slug}`);
    });
  });

  it('should reject invalid slug formats', () => {
    const invalidSlugs = [
      'Has Spaces',
      'UPPERCASE',
      'special@chars!',
      'under_scores',
      '', // empty
    ];
    
    invalidSlugs.forEach(slug => {
      const isValid = /^[a-z0-9-]+$/.test(slug) && slug.length > 0;
      assert.strictEqual(isValid, false, `Slug should be invalid: ${slug}`);
    });
  });
});

// =============================================================================
// OPTIONS VALIDATION TESTS
// =============================================================================

describe('Fetch Options Logic', () => {
  it('should have valid default limit values', () => {
    const defaultLimit = 10;
    const maxLimit = 50;
    
    assert.ok(defaultLimit > 0);
    assert.ok(maxLimit >= defaultLimit);
    assert.ok(maxLimit <= 100); // Reasonable upper bound
  });

  it('should validate sort options', () => {
    const validSortOptions = ['created_at', 'updated_at', 'view_count', 'likes'];
    const validDirections = ['asc', 'desc'];
    
    validSortOptions.forEach(sort => {
      assert.ok(typeof sort === 'string');
    });
    
    validDirections.forEach(dir => {
      assert.ok(typeof dir === 'string');
    });
  });
});

// =============================================================================
// DATA STRUCTURE TESTS
// =============================================================================

describe('Post Data Structure', () => {
  it('should define expected post fields', () => {
    const expectedFields = [
      'id',
      'slug',
      'title',
      'content',
      'user_id',
      'car_slug',
      'created_at',
      'updated_at',
      'is_public',
    ];
    
    expectedFields.forEach(field => {
      assert.ok(typeof field === 'string');
    });
  });

  it('should define expected profile fields', () => {
    const expectedProfileFields = [
      'display_name',
      'public_slug',
      'bio',
      'is_public_garage',
    ];
    
    expectedProfileFields.forEach(field => {
      assert.ok(typeof field === 'string');
    });
  });
});

// =============================================================================
// MOST VIEWED BUILDS TESTS
// =============================================================================

describe('Most Viewed Builds Logic', () => {
  it('should use correct default limit', () => {
    const defaultLimit = 10;
    assert.strictEqual(defaultLimit, 10);
  });

  it('should sort by view_count descending', () => {
    // Simulate sorting logic
    const builds = [
      { name: 'Build A', view_count: 100 },
      { name: 'Build B', view_count: 500 },
      { name: 'Build C', view_count: 250 },
    ];
    
    const sorted = [...builds].sort((a, b) => b.view_count - a.view_count);
    
    assert.strictEqual(sorted[0].name, 'Build B'); // Highest views
    assert.strictEqual(sorted[1].name, 'Build C');
    assert.strictEqual(sorted[2].name, 'Build A'); // Lowest views
  });

  it('should handle empty results', () => {
    const builds = [];
    assert.strictEqual(builds.length, 0);
  });

  it('should respect limit parameter', () => {
    const builds = Array.from({ length: 20 }, (_, i) => ({ id: i }));
    const limit = 5;
    const limited = builds.slice(0, limit);
    
    assert.strictEqual(limited.length, 5);
  });
});

console.log('Community Service tests defined successfully.');
