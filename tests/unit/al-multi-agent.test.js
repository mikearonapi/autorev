/**
 * Unit Tests: AL Multi-Agent System
 *
 * Tests the multi-agent architecture including:
 * - Intent classification (orchestrator)
 * - Agent creation and tool filtering
 * - Agent registry
 *
 * Run: npm test -- tests/unit/al-multi-agent.test.js
 */

import { describe, test, expect, vi } from 'vitest';
import {
  INTENT_TYPES,
  AGENT_TOOLS,
  AGENT_DEFINITIONS,
  createAgent,
  getAllAgentDefinitions,
  getAgentTools,
  getAgentForTool,
} from '@/lib/alAgents/index.js';
import BaseAgent, { MODELS } from '@/lib/alAgents/baseAgent.js';
import { classifyIntent } from '@/lib/alAgents/orchestrator.js';
import { MULTI_AGENT_ENABLED, shouldUseMultiAgent } from '@/lib/alOrchestrator.js';

describe('AL Multi-Agent System', () => {
  describe('Intent Types', () => {
    test('should have all 8 intent types defined', () => {
      const expectedIntents = [
        'car_discovery',
        'build_planning',
        'parts_research',
        'knowledge',
        'community_events',
        'performance_data',
        'vision',
        'generalist',
      ];

      for (const intent of expectedIntents) {
        expect(Object.values(INTENT_TYPES)).toContain(intent);
      }
      expect(Object.keys(INTENT_TYPES)).toHaveLength(8);
    });
  });

  describe('Agent Definitions', () => {
    test('should have an agent definition for each intent type', () => {
      for (const intentType of Object.values(INTENT_TYPES)) {
        expect(AGENT_DEFINITIONS[intentType]).toBeDefined();
        expect(AGENT_DEFINITIONS[intentType].id).toBe(intentType);
      }
    });

    test('each agent definition should have required properties', () => {
      for (const [_intentType, def] of Object.entries(AGENT_DEFINITIONS)) {
        expect(def).toHaveProperty('id');
        expect(def).toHaveProperty('name');
        expect(def).toHaveProperty('description');
        expect(def).toHaveProperty('model');
        expect(def).toHaveProperty('maxTokens');
        expect(def).toHaveProperty('tools');
        expect(def).toHaveProperty('systemPromptBuilder');
        expect(typeof def.systemPromptBuilder).toBe('function');
      }
    });

    test('agent models should be valid', () => {
      const validModels = Object.values(MODELS);
      for (const def of Object.values(AGENT_DEFINITIONS)) {
        expect(validModels).toContain(def.model);
      }
    });

    test('Knowledge agent should use Haiku for cost efficiency', () => {
      expect(AGENT_DEFINITIONS[INTENT_TYPES.KNOWLEDGE].model).toBe(MODELS.HAIKU);
    });

    test('Vision agent should use Sonnet (required for Vision API)', () => {
      expect(AGENT_DEFINITIONS[INTENT_TYPES.VISION].model).toBe(MODELS.SONNET);
    });
  });

  describe('Agent Tools', () => {
    test('should have tool assignments for each intent type', () => {
      for (const intentType of Object.values(INTENT_TYPES)) {
        expect(AGENT_TOOLS[intentType]).toBeDefined();
      }
    });

    test('car_discovery agent should have car-related tools', () => {
      const tools = AGENT_TOOLS[INTENT_TYPES.CAR_DISCOVERY];
      expect(tools).toContain('search_cars');
      expect(tools).toContain('get_car_ai_context');
      expect(tools).toContain('compare_cars');
    });

    test('build_planning agent should have build-related tools', () => {
      const tools = AGENT_TOOLS[INTENT_TYPES.BUILD_PLANNING];
      expect(tools).toContain('recommend_build');
      expect(tools).toContain('get_user_context');
    });

    test('parts_research agent should have parts tools', () => {
      const tools = AGENT_TOOLS[INTENT_TYPES.PARTS_RESEARCH];
      expect(tools).toContain('search_parts');
      expect(tools).toContain('get_upgrade_info');
    });

    test('knowledge agent should have encyclopedia tools', () => {
      const tools = AGENT_TOOLS[INTENT_TYPES.KNOWLEDGE];
      expect(tools).toContain('search_encyclopedia');
      expect(tools).toContain('search_knowledge');
    });

    test('community_events agent should have event tools', () => {
      const tools = AGENT_TOOLS[INTENT_TYPES.COMMUNITY_EVENTS];
      expect(tools).toContain('search_events');
      expect(tools).toContain('search_community_insights');
    });

    test('performance_data agent should have performance tools', () => {
      const tools = AGENT_TOOLS[INTENT_TYPES.PERFORMANCE_DATA];
      expect(tools).toContain('calculate_mod_impact');
    });

    test('vision agent should have vision tool', () => {
      const tools = AGENT_TOOLS[INTENT_TYPES.VISION];
      expect(tools).toContain('analyze_uploaded_content');
    });

    test('generalist agent should have access to all tools', () => {
      expect(AGENT_TOOLS[INTENT_TYPES.GENERALIST]).toBe('all');
    });
  });

  describe('Agent Factory', () => {
    test('createAgent should return a BaseAgent instance', () => {
      const agent = createAgent(INTENT_TYPES.CAR_DISCOVERY);
      expect(agent).toBeInstanceOf(BaseAgent);
    });

    test('createAgent should set correct agent ID', () => {
      const agent = createAgent(INTENT_TYPES.BUILD_PLANNING);
      expect(agent.agentId).toBe(INTENT_TYPES.BUILD_PLANNING);
    });

    test('createAgent should set correct agent name', () => {
      const agent = createAgent(INTENT_TYPES.KNOWLEDGE);
      expect(agent.agentName).toBe('Knowledge');
    });

    test('createAgent should throw for unknown intent type', () => {
      expect(() => createAgent('unknown_intent')).toThrow('Unknown agent type');
    });

    test('createAgent should allow option overrides', () => {
      const agent = createAgent(INTENT_TYPES.CAR_DISCOVERY, {
        correlationId: 'test-123',
        userId: 'user-456',
      });
      expect(agent.correlationId).toBe('test-123');
      expect(agent.userId).toBe('user-456');
    });
  });

  describe('Agent Registry Functions', () => {
    test('getAllAgentDefinitions should return all definitions', () => {
      const defs = getAllAgentDefinitions();
      expect(defs).toHaveLength(8);
    });

    test('getAgentTools should return tools for valid intent', () => {
      const tools = getAgentTools(INTENT_TYPES.CAR_DISCOVERY);
      expect(Array.isArray(tools)).toBe(true);
      expect(tools.length).toBeGreaterThan(0);
    });

    test('getAgentTools should return empty array for unknown intent', () => {
      const tools = getAgentTools('unknown');
      expect(tools).toEqual([]);
    });

    test('getAgentForTool should find agent that owns a tool', () => {
      const agentId = getAgentForTool('search_cars');
      expect(agentId).toBe(INTENT_TYPES.CAR_DISCOVERY);
    });

    test('getAgentForTool should return generalist for unknown tools (fallback)', () => {
      // Generalist has 'all' tools, so it acts as fallback for any tool
      const agentId = getAgentForTool('some_unknown_tool');
      // Generalist has 'all' tools, so it will match as fallback
      expect(agentId).toBe(INTENT_TYPES.GENERALIST);
    });
  });

  describe('BaseAgent', () => {
    test('should have default model as Sonnet', () => {
      const agent = new BaseAgent();
      expect(agent.model).toBe(MODELS.SONNET);
    });

    test('should have default maxToolCalls of 5', () => {
      const agent = new BaseAgent();
      expect(agent.maxToolCalls).toBe(5);
    });

    test('getSystemPrompt should return default prompt without builder', () => {
      const agent = new BaseAgent();
      const prompt = agent.getSystemPrompt();
      expect(prompt).toContain('AL');
      expect(prompt).toContain('automotive');
    });

    test('getSystemPrompt should use builder when provided', () => {
      const mockBuilder = vi.fn(() => 'Custom prompt from builder');
      const agent = new BaseAgent({ systemPromptBuilder: mockBuilder });
      const prompt = agent.getSystemPrompt({ currentCar: { name: 'Test Car' } });
      expect(mockBuilder).toHaveBeenCalled();
      expect(prompt).toBe('Custom prompt from builder');
    });

    test('getFilteredTools should return all tools when toolNames is "all"', () => {
      const agent = new BaseAgent({ toolNames: 'all' });
      const tools = agent.getFilteredTools();
      // Should return all AL_TOOLS
      expect(tools.length).toBeGreaterThan(0);
    });

    test('buildMessageContent should return string for text-only', () => {
      const agent = new BaseAgent();
      const content = agent.buildMessageContent('Hello', []);
      expect(typeof content).toBe('string');
      expect(content).toBe('Hello');
    });

    test('buildMessageContent should return array for messages with attachments', () => {
      const agent = new BaseAgent();
      const attachments = [
        {
          file_type: 'image/jpeg',
          public_url: 'https://example.com/image.jpg',
        },
      ];
      const content = agent.buildMessageContent('What car is this?', attachments);
      expect(Array.isArray(content)).toBe(true);
      expect(content).toHaveLength(2); // 1 image + 1 text
      expect(content[0].type).toBe('image');
      expect(content[1].type).toBe('text');
    });

    test('buildPersonalizationContext should return empty string for null', () => {
      const agent = new BaseAgent();
      const context = agent.buildPersonalizationContext(null);
      expect(context).toBe('');
    });

    test('buildPersonalizationContext should include user profile data', () => {
      const agent = new BaseAgent();
      const personalization = {
        responses: {
          driving_focus: 'track',
          mod_experience: 'intermediate',
          budget_comfort: 'moderate',
        },
      };
      const context = agent.buildPersonalizationContext(personalization);
      expect(context).toContain('User Profile');
      expect(context).toContain('track');
      expect(context).toContain('intermediate');
    });
  });

  describe('Orchestrator - Intent Classification', () => {
    test('classifyIntent should return generalist for empty messages', async () => {
      const result = await classifyIntent({
        messages: [],
        context: {},
        skipLLM: true,
      });
      expect(result.intent).toBe(INTENT_TYPES.GENERALIST);
      expect(result.usedLLM).toBe(false);
    });

    test('classifyIntent should detect vision intent for image messages', async () => {
      const result = await classifyIntent({
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image', source: { type: 'url', url: 'test.jpg' } },
              { type: 'text', text: 'What is this?' },
            ],
          },
        ],
        context: {},
        skipLLM: true,
      });
      expect(result.intent).toBe(INTENT_TYPES.VISION);
    });

    test('classifyIntent should detect follow-ups as generalist', async () => {
      const result = await classifyIntent({
        messages: [{ role: 'user', content: 'yes' }],
        context: {},
        skipLLM: true,
      });
      expect(result.intent).toBe(INTENT_TYPES.GENERALIST);
      expect(result.reasoning).toContain('Follow-up');
    });

    test('classifyIntent should detect jokes as generalist', async () => {
      const result = await classifyIntent({
        messages: [{ role: 'user', content: 'tell me a car joke' }],
        context: {},
        skipLLM: true,
      });
      expect(result.intent).toBe(INTENT_TYPES.GENERALIST);
    });

    test('classifyIntent should detect events as community_events', async () => {
      const result = await classifyIntent({
        messages: [{ role: 'user', content: 'Find track days near Austin' }],
        context: {},
        skipLLM: true,
      });
      expect(result.intent).toBe(INTENT_TYPES.COMMUNITY_EVENTS);
    });

    test('classifyIntent should detect educational questions as knowledge', async () => {
      const result = await classifyIntent({
        messages: [{ role: 'user', content: 'How does a turbo work?' }],
        context: {},
        skipLLM: true,
      });
      expect(result.intent).toBe(INTENT_TYPES.KNOWLEDGE);
    });

    test('classifyIntent should detect performance calculations', async () => {
      const result = await classifyIntent({
        messages: [{ role: 'user', content: 'How much HP will a tune add?' }],
        context: {},
        skipLLM: true,
      });
      expect(result.intent).toBe(INTENT_TYPES.PERFORMANCE_DATA);
    });

    test('classifyIntent should detect build planning queries', async () => {
      const result = await classifyIntent({
        messages: [{ role: 'user', content: 'Review my build for compatibility' }],
        context: {},
        skipLLM: true,
      });
      expect(result.intent).toBe(INTENT_TYPES.BUILD_PLANNING);
    });

    test('classifyIntent should detect parts search queries', async () => {
      const result = await classifyIntent({
        messages: [{ role: 'user', content: 'Find the best exhaust for my 981' }],
        context: {},
        skipLLM: true,
      });
      expect(result.intent).toBe(INTENT_TYPES.PARTS_RESEARCH);
    });

    test('classifyIntent should detect car discovery queries', async () => {
      const result = await classifyIntent({
        messages: [{ role: 'user', content: 'Compare 911 vs Cayman' }],
        context: {},
        skipLLM: true,
      });
      expect(result.intent).toBe(INTENT_TYPES.CAR_DISCOVERY);
    });

    test('classifyIntent should return confidence score', async () => {
      const result = await classifyIntent({
        messages: [{ role: 'user', content: 'Find track days near Austin' }],
        context: {},
        skipLLM: true,
      });
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('Multi-Agent Feature Flag', () => {
    test('MULTI_AGENT_ENABLED should be a boolean', () => {
      expect(typeof MULTI_AGENT_ENABLED).toBe('boolean');
    });

    test('shouldUseMultiAgent should return false when disabled', () => {
      // When MULTI_AGENT_ENABLED is false, should always return false
      if (!MULTI_AGENT_ENABLED) {
        expect(shouldUseMultiAgent('any-user-id')).toBe(false);
      }
    });

    test('shouldUseMultiAgent should be consistent for same userId', () => {
      // Same userId should always get the same result
      const result1 = shouldUseMultiAgent('test-user-123');
      const result2 = shouldUseMultiAgent('test-user-123');
      expect(result1).toBe(result2);
    });
  });

  describe('System Prompts', () => {
    test('all agent prompts should build without errors', () => {
      for (const def of Object.values(AGENT_DEFINITIONS)) {
        expect(() => def.systemPromptBuilder({})).not.toThrow();
      }
    });

    test('all agent prompts should contain AL identity', () => {
      for (const def of Object.values(AGENT_DEFINITIONS)) {
        const prompt = def.systemPromptBuilder({});
        expect(prompt.toLowerCase()).toContain('al');
      }
    });

    test('agent prompts should include context when provided', () => {
      const context = {
        currentCar: {
          year: '2023',
          make: 'Porsche',
          model: '911 GT3',
        },
      };

      const def = AGENT_DEFINITIONS[INTENT_TYPES.CAR_DISCOVERY];
      const prompt = def.systemPromptBuilder(context);
      expect(prompt).toContain('Porsche');
    });
  });
});
