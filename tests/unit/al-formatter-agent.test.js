/**
 * Tests for AL Formatter Agent
 *
 * Verifies the Formatter Agent correctly strips preamble and formats responses.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the dependencies before importing
vi.mock('@/lib/observability', () => ({
  getAnthropicConfig: vi.fn(() => ({
    apiUrl: 'https://api.anthropic.com/v1/messages',
    headers: { 'Content-Type': 'application/json' },
  })),
}));

vi.mock('@/lib/aiCircuitBreaker', () => ({
  executeWithCircuitBreaker: vi.fn(async (fn) => {
    const result = await fn();
    return { result };
  }),
}));

vi.mock('@/lib/alConfig', () => ({
  calculateTokenCost: vi.fn(() => 1),
  formatCentsAsDollars: vi.fn((cents) => `$${(cents / 100).toFixed(2)}`),
}));

describe('startsWithContent', () => {
  // Import dynamically to get fresh mocks
  let startsWithContent;

  beforeEach(async () => {
    const formatterModule = await import('../../lib/alAgents/formatterAgent.js');
    startsWithContent = formatterModule.default.startsWithContent;
  });

  it('recognizes markdown headings as content', () => {
    expect(startsWithContent('## Top 5 Exhausts')).toBe(true);
    expect(startsWithContent('### Best Parts')).toBe(true);
  });

  it('recognizes bold numbered items as content', () => {
    expect(startsWithContent('**1) Akrapovic Slip-On**')).toBe(true);
    expect(startsWithContent('**#1 RECOMMENDED:**')).toBe(true);
  });

  it('recognizes "For your [car]" as content', () => {
    expect(startsWithContent('For your 2020 RS5, here are the best options:')).toBe(true);
  });

  it('recognizes "Here are" as content', () => {
    expect(startsWithContent('Here are the top fuel system upgrades:')).toBe(true);
  });

  it('detects preamble phrases', () => {
    expect(startsWithContent("I'll research the best options")).toBe(false);
    expect(startsWithContent('Let me search for exhaust options')).toBe(false);
    expect(startsWithContent('I notice you have a 2020 RS5')).toBe(false);
    expect(startsWithContent('Great question!')).toBe(false);
    expect(startsWithContent('using the research_parts_live tool')).toBe(false);
  });

  it('handles edge cases', () => {
    expect(startsWithContent('')).toBe(false);
    expect(startsWithContent(null)).toBe(false);
    expect(startsWithContent('   ## Heading with whitespace')).toBe(true);
  });
});

describe('formatResponse', () => {
  let formatResponse;

  beforeEach(async () => {
    vi.clearAllMocks();
    const formatterModule = await import('../../lib/alAgents/formatterAgent.js');
    formatResponse = formatterModule.formatResponse;
  });

  it('skips formatting for short responses', async () => {
    const result = await formatResponse({
      rawResponse: 'Yes, that fits.',
      correlationId: 'test-123',
      userId: 'user-123',
    });

    expect(result.skipped).toBe(true);
    expect(result.response).toBe('Yes, that fits.');
  });

  it('skips formatting for responses that already start with content', async () => {
    const cleanResponse = `## Top 5 Exhausts for BMW M3

**1) Akrapovic Evolution**
- Price: $4,500`;

    const result = await formatResponse({
      rawResponse: cleanResponse,
      correlationId: 'test-123',
      userId: 'user-123',
    });

    expect(result.skipped).toBe(true);
    expect(result.reason).toBe('already_clean');
    expect(result.response).toBe(cleanResponse);
  });
});

describe('createStreamFormatter', () => {
  let createStreamFormatter;

  beforeEach(async () => {
    vi.clearAllMocks();
    const formatterModule = await import('../../lib/alAgents/formatterAgent.js');
    createStreamFormatter = formatterModule.createStreamFormatter;
  });

  it('creates a stream formatter with required methods', () => {
    const onText = vi.fn();
    const formatter = createStreamFormatter({
      correlationId: 'test-123',
      userId: 'user-123',
      onText,
    });

    expect(formatter.addChunk).toBeDefined();
    expect(formatter.flush).toBeDefined();
    expect(formatter.getState).toBeDefined();
  });

  it('starts in buffering mode', () => {
    const onText = vi.fn();
    const formatter = createStreamFormatter({
      correlationId: 'test-123',
      userId: 'user-123',
      onText,
    });

    expect(formatter.getState().isBuffering).toBe(true);
    expect(formatter.getState().bufferLength).toBe(0);
  });

  it('passes through clean content immediately', async () => {
    const onText = vi.fn();
    const formatter = createStreamFormatter({
      correlationId: 'test-123',
      userId: 'user-123',
      onText,
    });

    await formatter.addChunk('## Top 5 Exhausts\n\n**1) Akrapovic**');

    // Should have released the content since it starts clean
    expect(formatter.getState().isBuffering).toBe(false);
    expect(onText).toHaveBeenCalled();
  });
});
