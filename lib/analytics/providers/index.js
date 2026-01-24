/**
 * Analytics Provider Adapters
 * 
 * Re-exports all provider adapters for easy importing.
 * 
 * @module lib/analytics/providers
 * 
 * @example
 * import { posthogProvider, ga4Provider, customProvider } from '@/lib/analytics/providers';
 * 
 * analytics.registerProvider(posthogProvider);
 * analytics.registerProvider(ga4Provider);
 * analytics.registerProvider(customProvider);
 */

export { posthogProvider } from './posthog';
export { ga4Provider } from './ga4';
export { customProvider } from './custom';
