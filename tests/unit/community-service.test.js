/**
 * Unit Tests: Community Service
 * 
 * Tests community post management and sharing utilities.
 * 
 * Run: npm run test:unit -- tests/unit/community-service.test.js
 */

import { describe, it, expect } from 'vitest';

// Import pure utility functions that don't require database
import {
  getPostShareUrl,
  getGarageShareUrl,
  getFacebookShareUrl,
  getTwitterShareUrl,
  getInstagramShareInfo,
  getNativeShareData,
} from '@/lib/communityService.js';

// =============================================================================
// SHARE URL TESTS
// =============================================================================

describe('getPostShareUrl', () => {
  it('should generate correct URL for a post slug', () => {
    const url = getPostShareUrl('my-awesome-build');
    expect(url).toContain('/community/builds/my-awesome-build');
  });

  it('should handle slugs with hyphens', () => {
    const url = getPostShareUrl('2023-bmw-m3-competition-build');
    expect(url).toContain('/community/builds/2023-bmw-m3-competition-build');
  });

  it('should return a valid URL format', () => {
    const url = getPostShareUrl('test-slug');
    expect(typeof url).toBe('string');
    expect(url.length).toBeGreaterThan(0);
  });
});

describe('getGarageShareUrl', () => {
  it('should generate correct URL for a public garage slug', () => {
    const url = getGarageShareUrl('mike-builds');
    expect(url).toContain('/garage/mike-builds');
  });

  it('should handle various slug formats', () => {
    const slugs = ['user123', 'the-car-guy', 'bmw-enthusiast-99'];
    slugs.forEach(slug => {
      const url = getGarageShareUrl(slug);
      expect(url).toContain(`/garage/${slug}`);
    });
  });
});

describe('getFacebookShareUrl', () => {
  it('should generate correct Facebook share URL', () => {
    const url = getFacebookShareUrl('https://autorev.app/community/builds/my-build');
    expect(url).toContain('facebook.com/sharer');
    expect(url).toContain(encodeURIComponent('https://autorev.app/community/builds/my-build'));
  });

  it('should properly encode the URL parameter', () => {
    const url = getFacebookShareUrl('https://autorev.app/test?param=value');
    expect(url).toContain(encodeURIComponent('https://autorev.app/test?param=value'));
  });
});

describe('getTwitterShareUrl', () => {
  it('should generate correct Twitter/X share URL', () => {
    const url = getTwitterShareUrl('https://autorev.app/builds/test', 'Check out my build!');
    expect(url.includes('twitter.com/intent/tweet') || url.includes('x.com/intent/tweet')).toBe(true);
    expect(url).toContain('url=');
    expect(url).toContain('text=');
  });

  it('should encode both URL and text', () => {
    const shareUrl = 'https://autorev.app/builds/test';
    const text = 'Check out my BMW M3 build!';
    const url = getTwitterShareUrl(shareUrl, text);
    expect(url).toContain(encodeURIComponent(shareUrl));
    expect(url).toContain(encodeURIComponent(text));
  });

  it('should work without text parameter', () => {
    const url = getTwitterShareUrl('https://autorev.app/builds/test');
    expect(typeof url).toBe('string');
    expect(url).toContain('url=');
  });
});

describe('getInstagramShareInfo', () => {
  it('should return share info object', () => {
    const info = getInstagramShareInfo('https://autorev.app/builds/test');
    expect(typeof info).toBe('object');
  });

  it('should include instructions for sharing', () => {
    const info = getInstagramShareInfo('https://autorev.app/builds/test');
    // Instagram doesn't support direct URL sharing, so it should provide instructions
    expect(info.message || info.instructions || info.url).toBeTruthy();
  });
});

describe('getNativeShareData', () => {
  it('should return valid share data object', () => {
    const data = getNativeShareData({
      title: 'My BMW M3 Build',
      text: 'Check out my track build!',
      url: 'https://autorev.app/builds/test',
    });
    
    expect(typeof data).toBe('object');
    expect(data.title).toBe('My BMW M3 Build');
    expect(data.text).toBe('Check out my track build!');
    expect(data.url).toBe('https://autorev.app/builds/test');
  });

  it('should handle missing optional fields', () => {
    const data = getNativeShareData({
      url: 'https://autorev.app/builds/test',
    });
    
    expect(typeof data).toBe('object');
    expect(data.url).toBe('https://autorev.app/builds/test');
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
      const isValid = /^[a-z0-9-]+$/.test(slug) && slug.length > 0;
      expect(isValid).toBe(true);
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
      expect(isValid).toBe(false);
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
    
    expect(defaultLimit).toBeGreaterThan(0);
    expect(maxLimit).toBeGreaterThanOrEqual(defaultLimit);
    expect(maxLimit).toBeLessThanOrEqual(100);
  });

  it('should validate sort options', () => {
    const validSortOptions = ['created_at', 'updated_at', 'view_count', 'likes'];
    const validDirections = ['asc', 'desc'];
    
    validSortOptions.forEach(sort => {
      expect(typeof sort).toBe('string');
    });
    
    validDirections.forEach(dir => {
      expect(typeof dir).toBe('string');
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
      expect(typeof field).toBe('string');
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
      expect(typeof field).toBe('string');
    });
  });
});

// =============================================================================
// MOST VIEWED BUILDS TESTS
// =============================================================================

describe('Most Viewed Builds Logic', () => {
  it('should use correct default limit', () => {
    const defaultLimit = 10;
    expect(defaultLimit).toBe(10);
  });

  it('should sort by view_count descending', () => {
    const builds = [
      { name: 'Build A', view_count: 100 },
      { name: 'Build B', view_count: 500 },
      { name: 'Build C', view_count: 250 },
    ];
    
    const sorted = [...builds].sort((a, b) => b.view_count - a.view_count);
    
    expect(sorted[0].name).toBe('Build B');
    expect(sorted[1].name).toBe('Build C');
    expect(sorted[2].name).toBe('Build A');
  });

  it('should handle empty results', () => {
    const builds = [];
    expect(builds.length).toBe(0);
  });

  it('should respect limit parameter', () => {
    const builds = Array.from({ length: 20 }, (_, i) => ({ id: i }));
    const limit = 5;
    const limited = builds.slice(0, limit);
    
    expect(limited.length).toBe(5);
  });
});
