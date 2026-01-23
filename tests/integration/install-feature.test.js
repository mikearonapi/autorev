/**
 * Install Feature Integration Tests
 * 
 * Tests for the installation tracking feature:
 * - DIY video search API (Exa fallback chain)
 * - Service center search API (Google Places + caching)
 * - InstallPathSelector component behavior
 * 
 * Run with: npm test tests/integration/install-feature.test.js
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { apiRequest, waitForServer, assertResponse, assertArrayItems } from './test-helpers.js';

describe('Install Feature APIs', () => {
  beforeAll(async () => {
    // Wait for dev server to be ready
    await waitForServer();
  }, 30000);
  
  // ============================================================
  // DIY VIDEO SEARCH
  // ============================================================
  
  describe('DIY Videos Search API (/api/diy-videos/search)', () => {
    it('should return 400 if carName is missing', async () => {
      const response = await apiRequest('/api/diy-videos/search', {
        method: 'POST',
        body: JSON.stringify({ category: 'intake' }),
      });
      
      expect(response.status).toBe(400);
      expect(response.data.error).toContain('carName');
    });
    
    it('should return 400 if category is missing', async () => {
      const response = await apiRequest('/api/diy-videos/search', {
        method: 'POST',
        body: JSON.stringify({ carName: 'Ford Mustang GT' }),
      });
      
      expect(response.status).toBe(400);
      expect(response.data.error).toContain('category');
    });
    
    it('should return videos array with valid input', async () => {
      const response = await apiRequest('/api/diy-videos/search', {
        method: 'POST',
        body: JSON.stringify({
          carName: 'Ford Mustang GT',
          category: 'intake',
          limit: 3,
        }),
      });
      
      // May return 200 with empty array if no API key or no results
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('videos');
      expect(Array.isArray(response.data.videos)).toBe(true);
      expect(response.data).toHaveProperty('source');
    });
    
    it('should respect limit parameter', async () => {
      const response = await apiRequest('/api/diy-videos/search', {
        method: 'POST',
        body: JSON.stringify({
          carName: 'BMW M3',
          category: 'exhaust',
          limit: 2,
        }),
      });
      
      expect(response.status).toBe(200);
      expect(response.data.videos.length).toBeLessThanOrEqual(2);
    });
    
    it('should return videos with required fields', async () => {
      const response = await apiRequest('/api/diy-videos/search', {
        method: 'POST',
        body: JSON.stringify({
          carName: 'Subaru WRX',
          category: 'turbo',
          limit: 5,
        }),
      });
      
      expect(response.status).toBe(200);
      
      // If videos are returned, they should have required fields
      if (response.data.videos.length > 0) {
        const video = response.data.videos[0];
        expect(video).toHaveProperty('videoId');
        expect(video).toHaveProperty('title');
        expect(video).toHaveProperty('thumbnailUrl');
      }
    });
  });
  
  // ============================================================
  // SERVICE CENTER SEARCH
  // ============================================================
  
  describe('Service Centers Search API (/api/service-centers/search)', () => {
    it('should return 400 if lat is missing', async () => {
      const response = await apiRequest('/api/service-centers/search', {
        method: 'POST',
        body: JSON.stringify({ lng: -77.5636 }),
      });
      
      expect(response.status).toBe(400);
      expect(response.data.error).toContain('lat');
    });
    
    it('should return 400 if lng is missing', async () => {
      const response = await apiRequest('/api/service-centers/search', {
        method: 'POST',
        body: JSON.stringify({ lat: 39.1157 }),
      });
      
      expect(response.status).toBe(400);
      expect(response.data.error).toContain('lng');
    });
    
    it('should return 400 for invalid coordinates', async () => {
      const response = await apiRequest('/api/service-centers/search', {
        method: 'POST',
        body: JSON.stringify({ lat: 'invalid', lng: 'test' }),
      });
      
      expect(response.status).toBe(400);
    });
    
    it('should return 400 for out-of-range coordinates', async () => {
      const response = await apiRequest('/api/service-centers/search', {
        method: 'POST',
        body: JSON.stringify({ lat: 999, lng: -999 }),
      });
      
      expect(response.status).toBe(400);
      expect(response.data.error).toContain('range');
    });
    
    it('should return shops array with valid coordinates', async () => {
      // Leesburg, VA coordinates
      const response = await apiRequest('/api/service-centers/search', {
        method: 'POST',
        body: JSON.stringify({
          lat: 39.1157,
          lng: -77.5636,
          radius: 10,
        }),
      });
      
      // May return 200 with empty array if no API key
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('shops');
      expect(Array.isArray(response.data.shops)).toBe(true);
      expect(response.data).toHaveProperty('count');
      expect(response.data).toHaveProperty('radius');
      expect(response.data).toHaveProperty('center');
    });
    
    it('should respect radius parameter (capped at 50)', async () => {
      const response = await apiRequest('/api/service-centers/search', {
        method: 'POST',
        body: JSON.stringify({
          lat: 39.1157,
          lng: -77.5636,
          radius: 100, // Should be capped to 50
        }),
      });
      
      expect(response.status).toBe(200);
      expect(response.data.radius).toBeLessThanOrEqual(50);
    });
    
    it('should return shops with required fields', async () => {
      const response = await apiRequest('/api/service-centers/search', {
        method: 'POST',
        body: JSON.stringify({
          lat: 34.0522,
          lng: -118.2437,
          radius: 15,
        }),
      });
      
      expect(response.status).toBe(200);
      
      // If shops are returned, they should have required fields
      if (response.data.shops.length > 0) {
        const shop = response.data.shops[0];
        expect(shop).toHaveProperty('place_id');
        expect(shop).toHaveProperty('name');
        expect(shop).toHaveProperty('address');
        expect(shop).toHaveProperty('lat');
        expect(shop).toHaveProperty('lng');
      }
    });
  });
  
  // ============================================================
  // TIER ACCESS
  // ============================================================
  
  describe('Install Feature Tier Access', () => {
    it('should have installTracking feature defined in tierAccess', async () => {
      const { FEATURES } = await import('../../lib/tierAccess.js');
      
      expect(FEATURES).toHaveProperty('installTracking');
      expect(FEATURES.installTracking.tier).toBe('tuner');
      expect(FEATURES.installTracking.name).toBe('Install Tracking');
    });
    
    it('should require tuner tier for installTracking', async () => {
      const { hasFeatureAccess, getRequiredTier } = await import('../../lib/tierAccess.js');
      
      expect(getRequiredTier('installTracking')).toBe('tuner');
      expect(hasFeatureAccess('free', 'installTracking')).toBe(false);
      expect(hasFeatureAccess('collector', 'installTracking')).toBe(false);
      expect(hasFeatureAccess('tuner', 'installTracking')).toBe(true);
    });
  });
  
  // ============================================================
  // DATA VALIDATION
  // ============================================================
  
  describe('Upgrade Tools Data', () => {
    it('should have toolCategories defined', async () => {
      const { toolCategories } = await import('../../data/upgradeTools.js');
      
      expect(toolCategories).toBeDefined();
      expect(Object.keys(toolCategories).length).toBeGreaterThan(0);
      expect(toolCategories.basic).toBeDefined();
      expect(toolCategories.lifting).toBeDefined();
    });
    
    it('should have tools defined', async () => {
      const { tools } = await import('../../data/upgradeTools.js');
      
      expect(tools).toBeDefined();
      expect(Object.keys(tools).length).toBeGreaterThan(0);
      expect(tools['socket-set-metric']).toBeDefined();
    });
    
    it('should have upgradeToolRequirements defined', async () => {
      const { upgradeToolRequirements } = await import('../../data/upgradeTools.js');
      
      expect(upgradeToolRequirements).toBeDefined();
      expect(upgradeToolRequirements.intake).toBeDefined();
      expect(upgradeToolRequirements.intake.essential).toBeDefined();
      expect(Array.isArray(upgradeToolRequirements.intake.essential)).toBe(true);
    });
    
    it('getToolsForBuild should aggregate tools correctly', async () => {
      const { getToolsForBuild } = await import('../../data/upgradeTools.js');
      
      const result = getToolsForBuild(['intake', 'exhaust']);
      
      expect(result).toHaveProperty('essential');
      expect(result).toHaveProperty('recommended');
      expect(result).toHaveProperty('byCategory');
      expect(Array.isArray(result.essential)).toBe(true);
      expect(Array.isArray(result.recommended)).toBe(true);
    });
    
    it('calculateBuildComplexity should return valid complexity', async () => {
      const { calculateBuildComplexity } = await import('../../data/upgradeTools.js');
      
      const result = calculateBuildComplexity(['intake', 'tune']);
      
      expect(result).toHaveProperty('overallDifficulty');
      expect(result).toHaveProperty('diyFeasible');
      expect(result).toHaveProperty('timeEstimate');
      expect(result.timeEstimate).toHaveProperty('min');
      expect(result.timeEstimate).toHaveProperty('max');
    });
  });
  
  // ============================================================
  // WHY CONTENT DATA
  // ============================================================
  
  describe('Why Content Data', () => {
    it('should have all required topics defined', async () => {
      const { WHY_CONTENT } = await import('../../data/whyContent.js');
      
      const requiredTopics = [
        'hp',
        'torque',
        'lapTimeEstimate',
        'installDifficulty',
        'fitmentConfidence',
        'stageProgression',
      ];
      
      for (const topic of requiredTopics) {
        expect(WHY_CONTENT).toHaveProperty(topic);
        expect(WHY_CONTENT[topic]).toHaveProperty('title');
        expect(WHY_CONTENT[topic]).toHaveProperty('definition');
        expect(WHY_CONTENT[topic]).toHaveProperty('whyMatters');
        expect(WHY_CONTENT[topic]).toHaveProperty('whatAffects');
      }
    });
  });
});
