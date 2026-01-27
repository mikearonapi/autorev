/**
 * Tests for AL Preamble Stripper
 *
 * Ensures preamble is properly stripped from AL responses.
 */

import { describe, it, expect } from 'vitest';

import { stripPreamble, isPreamble, createPreambleStripper } from '../../lib/alPreambleStripper.js';

describe('stripPreamble', () => {
  it('strips exact preamble from Cory screenshot example', () => {
    // This is the exact problematic text from the screenshot
    const input = `I'll research the best fuel system upgrades for your Ford Mustang SVT Cobra using the research_parts_live tool.I notice the research tool encountered some limitations. I'll supplement this with my expertise and use the search_parts tool to ensure we get comprehensive recommendations.Given the limited automated results, I'll provide expert recommendations based on knowledge of the Ford Mustang SVT Cobra's fuel system needs:

## Top 5 Fuel System Upgrade Picks for Ford Mustang SVT Cobra

1) Aeromotive 340 Stealth Fuel Pump`;

    const result = stripPreamble(input);

    // Should strip all preamble and start with the content
    expect(result).not.toContain("I'll research");
    expect(result).not.toContain('research_parts_live');
    expect(result).not.toContain('I notice');
    expect(result).not.toContain('search_parts');
    expect(result).not.toContain("I'll supplement");
    expect(result).not.toContain('Given the limited');
    expect(result).toContain('## Top 5 Fuel System Upgrade Picks');
    expect(result).toContain('Aeromotive 340 Stealth Fuel Pump');
  });

  it('strips research announcements', () => {
    const input = "I'll research the best exhaust options for your car. ## Best Exhausts";
    const result = stripPreamble(input);
    expect(result).not.toContain('research the best');
    expect(result).toContain('## Best Exhausts');
  });

  it('strips tool name mentions', () => {
    const inputs = [
      {
        input: 'using the research_parts_live tool to find parts',
        shouldNotContain: 'research_parts_live',
      },
      { input: 'with the search_parts tool', shouldNotContain: 'search_parts' },
      {
        input: "I'll use get_car_ai_context to check specs.",
        shouldNotContain: 'get_car_ai_context',
      },
      {
        input: 'the research_parts_live tool returned results',
        shouldNotContain: 'research_parts_live',
      },
    ];

    for (const { input, shouldNotContain } of inputs) {
      const result = stripPreamble(input);
      expect(result).not.toContain(shouldNotContain);
    }
  });

  it('strips "I notice" observations', () => {
    const input = 'I notice you have a 2020 RS5 in your garage. Here are the best mods:';
    const result = stripPreamble(input);
    expect(result).not.toContain('I notice');
    expect(result).toContain('Here are the best mods');
  });

  it('strips "Great question!" pleasantries', () => {
    const input = "Great question! Here's what you need to know about turbos:";
    const result = stripPreamble(input);
    expect(result).not.toContain('Great question');
    expect(result).toContain("Here's what you need to know");
  });

  it('strips "Let me" announcements', () => {
    const inputs = [
      'Let me search for the best options.',
      'Let me compare these two cars.',
      'Let me pull up the specs.',
      'Let me find the best parts.',
    ];

    for (const input of inputs) {
      const result = stripPreamble(input);
      expect(result).not.toContain('Let me');
    }
  });

  it('strips limitation mentions', () => {
    const input =
      'The research tool encountered some limitations. Here are recommendations based on my expertise:';
    const result = stripPreamble(input);
    expect(result).not.toContain('encountered some limitations');
    expect(result).toContain('recommendations');
  });

  it('preserves content after stripping', () => {
    const input = `I'll search for the best options. ## Top 5 Intakes

**1) K&N Cold Air Intake**
- Price: $399
- Flow: +15 CFM

**2) aFe Power Momentum**
- Price: $449`;

    const result = stripPreamble(input);
    expect(result).toContain('## Top 5 Intakes');
    expect(result).toContain('K&N Cold Air Intake');
    expect(result).toContain('$399');
    expect(result).toContain('aFe Power Momentum');
  });

  it('handles empty input', () => {
    expect(stripPreamble('')).toBe('');
    expect(stripPreamble(null)).toBe(null);
    expect(stripPreamble(undefined)).toBe(undefined);
  });

  it('does not strip legitimate content', () => {
    const input = `## Best Exhausts for BMW M3

**1) Akrapovic Evolution**
- Price: $4,500
- Power gain: +15 hp

**2) Eisenmann Race**
- Price: $2,800`;

    const result = stripPreamble(input);
    // Content should be preserved (whitespace may be normalized)
    expect(result).toContain('## Best Exhausts for BMW M3');
    expect(result).toContain('Akrapovic Evolution');
    expect(result).toContain('$4,500');
    expect(result).toContain('Eisenmann Race');
    expect(result).toContain('$2,800');
  });
});

describe('isPreamble', () => {
  it('detects preamble phrases', () => {
    expect(isPreamble("I'll research the best options")).toBe(true);
    expect(isPreamble('Let me search for that')).toBe(true);
    expect(isPreamble('I notice you have a car')).toBe(true);
    expect(isPreamble('Great question!')).toBe(true);
  });

  it('does not flag content as preamble', () => {
    expect(isPreamble('## Top 5 Exhausts')).toBe(false);
    expect(isPreamble('**1) Akrapovic**')).toBe(false);
    expect(isPreamble('For your BMW M3, here are the best mods')).toBe(false);
  });
});

describe('createPreambleStripper (streaming)', () => {
  it('buffers and strips preamble before content', () => {
    const stripper = createPreambleStripper();

    // Simulate streaming chunks
    let output = '';
    output += stripper.addChunk("I'll research ");
    output += stripper.addChunk('the best options ');
    output += stripper.addChunk('using the search_parts tool. ');
    output += stripper.addChunk('## Top 5 ');
    output += stripper.addChunk('Exhausts\n\n**1) Akrapovic**');
    output += stripper.flush();

    expect(output).not.toContain("I'll research");
    expect(output).not.toContain('search_parts');
    expect(output).toContain('## Top 5 Exhausts');
    expect(output).toContain('Akrapovic');
  });

  it('passes through clean content without buffering', () => {
    const stripper = createPreambleStripper();

    // First chunk triggers buffer release
    let output = '';
    output += stripper.addChunk('## Best Parts for your car\n\n');
    output += stripper.addChunk('**1) Intake** - $500');
    output += stripper.flush();

    expect(output).toContain('## Best Parts');
    expect(output).toContain('Intake');
  });

  it('handles flush with no remaining content', () => {
    const stripper = createPreambleStripper();
    stripper.addChunk('## Content');
    const remaining = stripper.flush();
    expect(remaining).toBe('');
  });
});
