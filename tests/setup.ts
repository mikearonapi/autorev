/**
 * Vitest Test Setup
 *
 * This file runs before each test file to configure the testing environment.
 * It provides:
 * - jest-dom matchers for DOM assertions
 * - Browser API mocks (ResizeObserver, matchMedia, etc.)
 * - Cleanup between tests
 *
 * @see https://testing-library.com/docs/react-testing-library/setup
 */

import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// =============================================================================
// AUTOMATIC CLEANUP
// =============================================================================

// Clean up after each test to prevent memory leaks and test pollution
afterEach(() => {
  cleanup();
});

// =============================================================================
// BROWSER API MOCKS
// =============================================================================

// Mock ResizeObserver (used by many UI libraries)
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = ResizeObserverMock;

// Mock IntersectionObserver (used for lazy loading, infinite scroll)
class IntersectionObserverMock {
  readonly root: Element | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];

  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}
global.IntersectionObserver = IntersectionObserverMock;

// Mock window.matchMedia (used for responsive design, dark mode)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock window.scrollTo (used by router and scroll utilities)
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: vi.fn(),
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock sessionStorage
Object.defineProperty(window, 'sessionStorage', {
  value: localStorageMock,
});

// =============================================================================
// NEXT.JS MOCKS
// =============================================================================

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

// Mock next/image (renders as regular img)
vi.mock('next/image', () => ({
  default: ({
    src,
    alt,
    ...props
  }: {
    src: string;
    alt: string;
    [key: string]: unknown;
  }) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} {...props} />;
  },
}));

// =============================================================================
// ENVIRONMENT VARIABLES
// =============================================================================

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

// =============================================================================
// CONSOLE SUPPRESSION (optional)
// =============================================================================

// Suppress specific console warnings during tests if needed
// Uncomment to silence noisy warnings:
// const originalWarn = console.warn;
// console.warn = (...args) => {
//   if (args[0]?.includes?.('Warning:')) return;
//   originalWarn.apply(console, args);
// };
