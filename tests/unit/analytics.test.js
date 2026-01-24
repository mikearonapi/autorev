/**
 * Analytics Unit Tests
 * 
 * Tests for lib/analytics/events.js to verify:
 * - Event tracking calls fire with correct names and properties
 * - Event name validation works correctly
 * - User identification and reset functions work
 * - Pre-built trackers call with correct event names
 * 
 * Run with: npm test -- tests/unit/analytics.test.js
 */

import {
  EVENTS,
  trackEvent,
  identifyUser,
  resetAnalyticsIdentity,
  createEventTracker,
  trackCarViewed,
  trackBuildSaved,
  trackALConversationStarted,
  trackCheckoutCompleted,
  trackCTAClicked,
  trackFeatureGateHit,
} from '@/lib/analytics/events';

// =============================================================================
// MOCKS
// =============================================================================

// Mock PostHog
const mockPosthog = {
  capture: jest.fn(),
  identify: jest.fn(),
  reset: jest.fn(),
};

// Mock gtag
const mockGtag = jest.fn();

// Setup global mocks before each test
beforeEach(() => {
  // Reset all mocks
  jest.clearAllMocks();
  
  // Setup window mocks
  global.window = {
    posthog: mockPosthog,
    gtag: mockGtag,
  };
});

afterEach(() => {
  // Clean up
  delete global.window;
});

// =============================================================================
// EVENT SCHEMA TESTS
// =============================================================================

describe('EVENTS constant', () => {
  it('should have all required authentication events', () => {
    expect(EVENTS.SIGNUP_COMPLETED).toBe('Signup Completed');
    expect(EVENTS.LOGIN_COMPLETED).toBe('Login Completed');
    expect(EVENTS.LOGOUT_COMPLETED).toBe('Logout Completed');
    expect(EVENTS.PASSWORD_RESET_REQUESTED).toBe('Password Reset Requested');
  });

  it('should have all required onboarding events', () => {
    expect(EVENTS.ONBOARDING_STARTED).toBe('Onboarding Started');
    expect(EVENTS.ONBOARDING_STEP_COMPLETED).toBe('Onboarding Step Completed');
    expect(EVENTS.ONBOARDING_COMPLETED).toBe('Onboarding Completed');
    expect(EVENTS.ONBOARDING_SKIPPED).toBe('Onboarding Skipped');
  });

  it('should have all required car discovery events', () => {
    expect(EVENTS.CAR_VIEWED).toBe('Car Viewed');
    expect(EVENTS.CAR_SEARCHED).toBe('Car Searched');
    expect(EVENTS.CARS_FILTERED).toBe('Cars Filtered');
    expect(EVENTS.CARS_COMPARED).toBe('Cars Compared');
  });

  it('should have all required build events', () => {
    expect(EVENTS.BUILD_CREATED).toBe('Build Created');
    expect(EVENTS.BUILD_SAVED).toBe('Build Saved');
    expect(EVENTS.BUILD_UPGRADE_ADDED).toBe('Build Upgrade Added');
    expect(EVENTS.BUILD_SHARED).toBe('Build Shared');
  });

  it('should have all required subscription events', () => {
    expect(EVENTS.PRICING_VIEWED).toBe('Pricing Viewed');
    expect(EVENTS.CHECKOUT_STARTED).toBe('Checkout Started');
    expect(EVENTS.CHECKOUT_COMPLETED).toBe('Checkout Completed');
    expect(EVENTS.SUBSCRIPTION_CREATED).toBe('Subscription Created');
  });

  it('should follow "Object + Past-Tense Verb" naming convention', () => {
    const eventNames = Object.values(EVENTS);
    
    eventNames.forEach((eventName) => {
      // Should be Title Case (each word capitalized)
      expect(eventName).toMatch(/^[A-Z][a-z]+( [A-Z][a-z]+)*$/);
      
      // Should end with past tense verb (commonly ends in -ed, -en, -d)
      const lastWord = eventName.split(' ').pop();
      expect(
        lastWord.endsWith('ed') || 
        lastWord.endsWith('en') || 
        lastWord.endsWith('t') || // e.g., "Sent", "Hit"
        lastWord.endsWith('d')
      ).toBe(true);
    });
  });
});

// =============================================================================
// trackEvent TESTS
// =============================================================================

describe('trackEvent', () => {
  it('should call PostHog capture with correct event name', () => {
    trackEvent(EVENTS.CAR_VIEWED, { car_id: '123' });
    
    expect(mockPosthog.capture).toHaveBeenCalledTimes(1);
    expect(mockPosthog.capture).toHaveBeenCalledWith(
      'Car Viewed',
      expect.objectContaining({ car_id: '123' })
    );
  });

  it('should include timestamp in properties', () => {
    const before = new Date().toISOString();
    trackEvent(EVENTS.SIGNUP_COMPLETED, { method: 'google' });
    const after = new Date().toISOString();
    
    const capturedProperties = mockPosthog.capture.mock.calls[0][1];
    expect(capturedProperties.timestamp).toBeDefined();
    expect(capturedProperties.timestamp >= before).toBe(true);
    expect(capturedProperties.timestamp <= after).toBe(true);
  });

  it('should also call GA4 gtag with snake_case event name', () => {
    trackEvent(EVENTS.CAR_VIEWED, { car_id: '123' });
    
    expect(mockGtag).toHaveBeenCalledTimes(1);
    expect(mockGtag).toHaveBeenCalledWith(
      'event',
      'car_viewed', // snake_case conversion
      expect.objectContaining({ car_id: '123' })
    );
  });

  it('should warn for unknown event names', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    
    trackEvent('Unknown Event', {});
    
    expect(consoleSpy).toHaveBeenCalledWith(
      '[Analytics] Unknown event: Unknown Event'
    );
    
    consoleSpy.mockRestore();
  });

  it('should not warn for valid event names', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    
    trackEvent(EVENTS.SIGNUP_COMPLETED, { method: 'email' });
    
    expect(consoleSpy).not.toHaveBeenCalled();
    
    consoleSpy.mockRestore();
  });

  it('should handle empty properties', () => {
    trackEvent(EVENTS.LOGOUT_COMPLETED);
    
    expect(mockPosthog.capture).toHaveBeenCalledWith(
      'Logout Completed',
      expect.objectContaining({ timestamp: expect.any(String) })
    );
  });

  it('should handle missing PostHog gracefully', () => {
    global.window.posthog = undefined;
    
    // Should not throw
    expect(() => {
      trackEvent(EVENTS.CAR_VIEWED, { car_id: '123' });
    }).not.toThrow();
  });

  it('should handle missing gtag gracefully', () => {
    global.window.gtag = undefined;
    
    // Should not throw and PostHog should still be called
    expect(() => {
      trackEvent(EVENTS.CAR_VIEWED, { car_id: '123' });
    }).not.toThrow();
    
    expect(mockPosthog.capture).toHaveBeenCalled();
  });
});

// =============================================================================
// identifyUser TESTS
// =============================================================================

describe('identifyUser', () => {
  it('should call PostHog identify with userId', () => {
    identifyUser('user-123');
    
    expect(mockPosthog.identify).toHaveBeenCalledTimes(1);
    expect(mockPosthog.identify).toHaveBeenCalledWith('user-123', {});
  });

  it('should pass traits to PostHog', () => {
    const traits = {
      email: 'test@example.com',
      subscription_tier: 'tuner',
      created_at: '2024-01-01',
    };
    
    identifyUser('user-123', traits);
    
    expect(mockPosthog.identify).toHaveBeenCalledWith('user-123', traits);
  });

  it('should handle missing PostHog gracefully', () => {
    global.window.posthog = undefined;
    
    expect(() => {
      identifyUser('user-123', { email: 'test@example.com' });
    }).not.toThrow();
  });
});

// =============================================================================
// resetAnalyticsIdentity TESTS
// =============================================================================

describe('resetAnalyticsIdentity', () => {
  it('should call PostHog reset', () => {
    resetAnalyticsIdentity();
    
    expect(mockPosthog.reset).toHaveBeenCalledTimes(1);
  });

  it('should handle missing PostHog gracefully', () => {
    global.window.posthog = undefined;
    
    expect(() => {
      resetAnalyticsIdentity();
    }).not.toThrow();
  });
});

// =============================================================================
// createEventTracker TESTS
// =============================================================================

describe('createEventTracker', () => {
  it('should create a tracker that calls trackEvent with correct event name', () => {
    const tracker = createEventTracker(EVENTS.CAR_VIEWED);
    tracker({ car_id: '123', car_slug: 'bmw-m3' });
    
    expect(mockPosthog.capture).toHaveBeenCalledWith(
      'Car Viewed',
      expect.objectContaining({ car_id: '123', car_slug: 'bmw-m3' })
    );
  });

  it('should merge default properties with provided properties', () => {
    const tracker = createEventTracker(EVENTS.CAR_VIEWED, { source: 'browse' });
    tracker({ car_id: '123' });
    
    expect(mockPosthog.capture).toHaveBeenCalledWith(
      'Car Viewed',
      expect.objectContaining({ car_id: '123', source: 'browse' })
    );
  });

  it('should allow provided properties to override defaults', () => {
    const tracker = createEventTracker(EVENTS.CAR_VIEWED, { source: 'browse' });
    tracker({ car_id: '123', source: 'search' });
    
    expect(mockPosthog.capture).toHaveBeenCalledWith(
      'Car Viewed',
      expect.objectContaining({ car_id: '123', source: 'search' })
    );
  });
});

// =============================================================================
// PRE-BUILT TRACKER TESTS
// =============================================================================

describe('Pre-built trackers', () => {
  describe('trackCarViewed', () => {
    it('should track Car Viewed event with required properties', () => {
      trackCarViewed({
        car_id: 'car-123',
        car_slug: 'bmw-m3',
        car_name: '2024 BMW M3',
        source: 'browse',
      });
      
      expect(mockPosthog.capture).toHaveBeenCalledWith(
        'Car Viewed',
        expect.objectContaining({
          car_id: 'car-123',
          car_slug: 'bmw-m3',
          car_name: '2024 BMW M3',
          source: 'browse',
        })
      );
    });
  });

  describe('trackBuildSaved', () => {
    it('should track Build Saved event with required properties', () => {
      trackBuildSaved({
        build_id: 'build-123',
        car_id: 'car-456',
        car_slug: 'nissan-gtr',
        upgrade_count: 5,
        hp_gain: 150,
      });
      
      expect(mockPosthog.capture).toHaveBeenCalledWith(
        'Build Saved',
        expect.objectContaining({
          build_id: 'build-123',
          car_id: 'car-456',
          upgrade_count: 5,
          hp_gain: 150,
        })
      );
    });
  });

  describe('trackALConversationStarted', () => {
    it('should track AL Conversation Started event', () => {
      trackALConversationStarted({
        conversation_id: 'conv-123',
        query_type: 'specs',
      });
      
      expect(mockPosthog.capture).toHaveBeenCalledWith(
        'AL Conversation Started',
        expect.objectContaining({
          conversation_id: 'conv-123',
          query_type: 'specs',
        })
      );
    });
  });

  describe('trackCheckoutCompleted', () => {
    it('should track Checkout Completed event with subscription details', () => {
      trackCheckoutCompleted({
        tier: 'tuner',
        amount_cents: 1999,
        is_trial: false,
      });
      
      expect(mockPosthog.capture).toHaveBeenCalledWith(
        'Checkout Completed',
        expect.objectContaining({
          tier: 'tuner',
          amount_cents: 1999,
          is_trial: false,
        })
      );
    });
  });

  describe('trackCTAClicked', () => {
    it('should track CTA Clicked event with location', () => {
      trackCTAClicked({
        cta_name: 'signup-hero',
        cta_location: 'homepage',
        cta_text: 'Get Started Free',
      });
      
      expect(mockPosthog.capture).toHaveBeenCalledWith(
        'CTA Clicked',
        expect.objectContaining({
          cta_name: 'signup-hero',
          cta_location: 'homepage',
          cta_text: 'Get Started Free',
        })
      );
    });
  });

  describe('trackFeatureGateHit', () => {
    it('should track Feature Gate Hit event with tier information', () => {
      trackFeatureGateHit({
        feature_name: 'unlimited_al_chats',
        required_tier: 'tuner',
        user_tier: 'free',
        location: 'al-chat',
      });
      
      expect(mockPosthog.capture).toHaveBeenCalledWith(
        'Feature Gate Hit',
        expect.objectContaining({
          feature_name: 'unlimited_al_chats',
          required_tier: 'tuner',
          user_tier: 'free',
          location: 'al-chat',
        })
      );
    });
  });
});

// =============================================================================
// INTEGRATION SCENARIO TESTS
// =============================================================================

describe('Integration scenarios', () => {
  it('should track complete signup flow', () => {
    // User signs up
    trackEvent(EVENTS.SIGNUP_COMPLETED, { method: 'google' });
    
    // User is identified
    identifyUser('user-new-123', {
      email: 'new@example.com',
      subscription_tier: 'free',
    });
    
    // User starts onboarding
    trackEvent(EVENTS.ONBOARDING_STARTED, {});
    
    expect(mockPosthog.capture).toHaveBeenCalledTimes(2);
    expect(mockPosthog.identify).toHaveBeenCalledTimes(1);
  });

  it('should track complete car view to build flow', () => {
    // User views car
    trackCarViewed({
      car_id: 'car-123',
      car_slug: 'porsche-911',
      car_name: '2024 Porsche 911 GT3',
      source: 'search',
    });
    
    // User creates build
    trackEvent(EVENTS.BUILD_CREATED, {
      car_id: 'car-123',
      car_slug: 'porsche-911',
    });
    
    // User adds upgrade
    trackEvent(EVENTS.BUILD_UPGRADE_ADDED, {
      car_id: 'car-123',
      upgrade_category: 'exhaust',
      upgrade_name: 'Akrapovic Slip-On',
    });
    
    // User saves build
    trackBuildSaved({
      build_id: 'build-456',
      car_id: 'car-123',
      car_slug: 'porsche-911',
      upgrade_count: 1,
      hp_gain: 15,
    });
    
    expect(mockPosthog.capture).toHaveBeenCalledTimes(4);
    
    // Verify event names in order
    const eventNames = mockPosthog.capture.mock.calls.map(call => call[0]);
    expect(eventNames).toEqual([
      'Car Viewed',
      'Build Created',
      'Build Upgrade Added',
      'Build Saved',
    ]);
  });

  it('should handle logout correctly', () => {
    // User is logged in
    identifyUser('user-123', { email: 'test@example.com' });
    
    // User logs out
    trackEvent(EVENTS.LOGOUT_COMPLETED, {});
    resetAnalyticsIdentity();
    
    expect(mockPosthog.identify).toHaveBeenCalledTimes(1);
    expect(mockPosthog.capture).toHaveBeenCalledWith(
      'Logout Completed',
      expect.any(Object)
    );
    expect(mockPosthog.reset).toHaveBeenCalledTimes(1);
  });
});
