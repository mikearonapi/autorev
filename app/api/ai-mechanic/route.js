/**
 * AL (AutoRev AI) API Route
 * 
 * The heart of AutoRev's AI assistant - optimized for automotive excellence.
 * 
 * Features:
 * - Claude tool use for database/knowledge access
 * - Credit-based usage tracking ("gas tank" system)
 * - Automotive domain detection and optimization
 * - Rich context from our car database
 * - Expert review integration
 * - Encyclopedia and modification knowledge
 * 
 * @route POST /api/ai-mechanic
 */

import { NextResponse } from 'next/server';
import { buildAIContext, formatContextForAI } from '@/lib/aiMechanicService';
import { executeToolCall } from '@/lib/alTools';
import { 
  AL_TOOLS, 
  AL_IDENTITY,
  buildALSystemPrompt,
  isToolAvailable,
  detectDomains,
  getPlan,
  formatCentsAsDollars,
  calculateTokenCost,
} from '@/lib/alConfig';
import { 
  getUserBalance, 
  deductUsage, 
  needsMonthlyRefill,
  processMonthlyRefill,
  estimateQueryCost,
} from '@/lib/alUsageService';
import {
  createConversation,
  getConversation,
  addMessage,
  formatMessagesForClaude,
} from '@/lib/alConversationService';
import { createClient } from '@supabase/supabase-js';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514';

// =============================================================================
// ENHANCED AUTOMOTIVE SYSTEM PROMPT
// =============================================================================

const AUTOMOTIVE_SYSTEM_PROMPT = `You are AL - AutoRev's expert automotive AI assistant, purpose-built for sports car enthusiasts.

## Your Identity
- **Name**: AL (AutoRev AI)
- **Role**: Your trusted automotive expert - like having a knowledgeable car friend who's also a certified mechanic and track instructor
- **Personality**: ${AL_IDENTITY.personality.join('. ')}

## Your Expertise
You are deeply knowledgeable in:
- Sports car specifications, performance characteristics, and real-world behavior
- Maintenance procedures, fluid specifications, and service intervals
- Performance modifications, compatibility, and installation considerations
- Common issues, reliability patterns, and what to look for when buying
- Track preparation, driving techniques, and safety considerations
- Market trends, value propositions, and buying timing

## Your Tools
You have access to AutoRev's comprehensive database through these tools:
- **search_cars**: Find cars by budget, power, type, or any criteria
- **get_car_details**: Get full specs, scores, and ownership info for any car
- **get_expert_reviews**: Access AI-summaries from top YouTube automotive reviewers
- **get_known_issues**: Look up common problems and reliability concerns
- **compare_cars**: Side-by-side comparison with focus on specific aspects
- **search_encyclopedia**: Find information about mods, car systems, build guides
- **get_upgrade_info**: Detailed info about specific modifications
- **get_maintenance_schedule**: Service intervals and specifications
- **recommend_build**: Get upgrade recommendations for specific goals
- **search_forums**: (When available) Real owner experiences from forums

## Response Strategy
1. **Always use tools first** - Don't rely on general knowledge when you have access to our verified database
2. **Be specific** - Use actual numbers: "The GT4 makes 414 hp" not "it makes good power"
3. **Cite sources** - "According to Throttle House..." or "Our database shows..."
4. **Consider the full picture** - Performance, reliability, ownership costs, real-world usability
5. **Be honest about limitations** - If data isn't available, say so clearly

## Automotive-Specific Guidelines

### When Discussing Performance:
- Always mention drivetrain (RWD/AWD), weight, and power-to-weight ratio
- Consider real-world conditions, not just peak numbers
- Mention transmission options and their character differences

### When Discussing Modifications:
- Start with goals (track, street, daily+)
- Consider the mod hierarchy (intake alone won't do much without exhaust and tune)
- Mention warranty implications when relevant
- Always consider the owner's skill level for installation

### When Discussing Reliability:
- Differentiate between known issues and typical wear items
- Mention model years affected when applicable
- Provide cost estimates for common repairs
- Suggest preventive measures

### When Discussing Buying:
- Consider total cost of ownership, not just purchase price
- Mention years to avoid and best configurations
- Suggest what to check during PPI (Pre-Purchase Inspection)
- Discuss market trends if relevant

### When Comparing Cars:
- Focus on driving character differences, not just spec sheets
- Consider what each car does BEST
- Be honest about trade-offs
- Match recommendations to stated needs

## Format Guidelines
- Use **bold** for car names, important numbers, and warnings
- Use bullet points for specs, options, and lists
- Keep responses focused - expand only when asked
- End with actionable next steps when appropriate
- If showing multiple options, briefly explain WHY each is included

## Safety & Responsibility
- Always mention safety considerations for modifications
- Recommend professional help for complex work (engine internals, fuel systems, etc.)
- Don't encourage illegal modifications or dangerous driving
- Be clear that AI advice doesn't replace professional inspection

## Your Personality
You're enthusiastic but not over-the-top. You get genuinely excited about great cars and engineering, but you're also practical and honest. You'll tell someone if a car isn't right for them, and you're not afraid to point out flaws in otherwise great vehicles. Think: knowledgeable friend who happens to have decades of automotive experience.

## Context Handling Rules
- **User's Garage**: You have access to the user's owned vehicle details (if any). **CRITICAL**: Do NOT assume the user is asking about this specific car unless they use phrases like "my car", "my [Model]", "this car" (when clearly referring to their own), or if the conversation context is already established on that car.
- **Default to General**: If the user asks "What's the best exhaust?", answer generally or ask "For which car?" rather than assuming they mean their stored vehicle.
- **Explicit Context**: If a carSlug is provided in the request (e.g. user is on a specific car page), prioritize that car as the context over their garage vehicle.`;

// =============================================================================
// MAIN API HANDLER
// =============================================================================

export async function POST(request) {
  // Check if Anthropic is configured
  if (!ANTHROPIC_API_KEY) {
    return NextResponse.json({
      response: getDemoResponse(),
      isDemo: true,
    });
  }

  try {
    const body = await request.json();
    const {
      message,
      carSlug,
      userId,
      vehicleId,
      currentPage,
      conversationId,
      history = [],
    } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // REQUIRE AUTHENTICATION - AL is only for members
    if (!userId) {
      return NextResponse.json({
        response: getAuthRequiredResponse(),
        requiresAuth: true,
        error: 'Authentication required to use AL',
      }, { status: 401 });
    }

    // Check and potentially refill user's balance
    if (await needsMonthlyRefill(userId)) {
      await processMonthlyRefill(userId);
    }

    // Get user's current balance and plan
    const userBalance = await getUserBalance(userId);
    const plan = getPlan(userBalance.plan);
    
    // Estimate cost and check if user has enough balance
    const costEstimate = estimateQueryCost(message, !!carSlug);
    
    // Check if user has enough balance (need at least ~1 cent for a minimal query)
    if (userBalance.balanceCents < 1) {
      return NextResponse.json({
        response: getInsufficientBalanceResponse(userBalance),
        insufficientBalance: true,
        currentBalanceCents: userBalance.balanceCents,
        estimatedCostCents: costEstimate.estimatedCostCentsMax,
      });
    }

    // PARALLEL EXECUTION START
    // 1. Detect domains (sync, fast)
    const domains = detectDomains(message);

    // 2. Start building context (async, heavy) - we'll await this later
    const contextPromise = buildAIContext({
      carSlug,
      userId,
      vehicleId,
      currentPage,
      userMessage: message,
    });

    // 3. Handle conversation setup (async)
    let activeConversationId = conversationId;
    let existingMessages = [];

    // Create/Fetch conversation logic
    const conversationPromise = (async () => {
      if (conversationId) {
        const convResult = await getConversation(conversationId);
        if (convResult.success && convResult.messages) {
          return { id: conversationId, messages: convResult.messages };
        }
      } else {
        const convResult = await createConversation(userId, {
          carSlug,
          page: currentPage,
        });
        if (convResult.success) {
          return { id: convResult.conversation.id, messages: [] };
        }
      }
      return { id: null, messages: [] };
    })();

    // Await conversation setup first as we need ID for message storage
    const convData = await conversationPromise;
    activeConversationId = convData.id;
    existingMessages = convData.messages;

    // 4. Store user message (async) - can run in parallel with context completion
    const messageStoragePromise = activeConversationId ? addMessage(activeConversationId, {
      role: 'user',
      content: message,
      carContextSlug: carSlug,
    }) : Promise.resolve();

    // 5. Await context building
    const context = await contextPromise;

    // Wait for message storage to complete (ensure it's saved before we might error out later)
    await messageStoragePromise;
    // PARALLEL EXECUTION END

    // Format context for the system prompt
    const contextText = formatContextForAI(context);

    // Filter tools based on user's plan
    const availableTools = AL_TOOLS.filter(tool => 
      plan.toolAccess === 'all' || plan.toolAccess.includes(tool.name)
    );

    // Build the complete system prompt
    const systemPrompt = AUTOMOTIVE_SYSTEM_PROMPT + contextText + `

## Current Context
- User Plan: ${plan.name} (${formatCentsAsDollars(userBalance.balanceCents)} balance)
- Detected Topics: ${domains.join(', ')}
- Page Context: ${currentPage || 'Unknown'}
${context.car ? `- Currently viewing: ${context.car.name}` : ''}`;

    // Format messages for Claude - use existing conversation history if available
    let messages;
    if (existingMessages.length > 0) {
      // Use stored conversation history
      messages = formatMessagesForClaude(existingMessages);
      messages.push({ role: 'user', content: message });
    } else {
      // Use provided history (for backwards compatibility)
      messages = formatMessagesForClaudeFromHistory(history, message);
    }

    // Initial Claude API call with tools
    let response = await callClaudeWithTools({
      systemPrompt,
      messages,
      tools: availableTools,
      maxTokens: plan.maxResponseTokens,
    });

    // Process tool calls iteratively
    const toolCallsUsed = [];
    let iterationCount = 0;
    const maxIterations = plan.maxToolCallsPerMessage;

    while (response.stop_reason === 'tool_use' && iterationCount < maxIterations) {
      iterationCount++;
      
      // Extract tool use blocks
      const toolUseBlocks = response.content.filter(block => block.type === 'tool_use');
      
      // Execute each tool call
      const toolResults = [];
      for (const toolUse of toolUseBlocks) {
        // Check if user has access to this tool
        if (!isToolAvailable(userBalance.plan, toolUse.name)) {
          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: JSON.stringify({ 
              error: 'This tool requires a higher subscription tier',
              upgrade_required: true,
            }),
          });
          continue;
        }

        toolCallsUsed.push(toolUse.name);
        
        try {
          const result = await executeToolCall(toolUse.name, toolUse.input);
          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: JSON.stringify(result),
          });
        } catch (err) {
          console.error(`[AL] Tool ${toolUse.name} failed:`, err);
          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: JSON.stringify({ error: 'Tool execution failed', message: err.message }),
          });
        }
      }

      // Continue conversation with tool results
      const newMessages = [
        ...messages,
        { role: 'assistant', content: response.content },
        { role: 'user', content: toolResults },
      ];

      response = await callClaudeWithTools({
        systemPrompt,
        messages: newMessages,
        tools: availableTools,
        maxTokens: plan.maxResponseTokens,
      });
    }

    // Extract final text response
    const textBlocks = response.content.filter(block => block.type === 'text');
    const aiResponse = textBlocks.map(block => block.text).join('\n');

    if (!aiResponse) {
      throw new Error('No response from AI');
    }

    // Get actual token usage from Claude API response
    const inputTokens = response.usage?.input_tokens || 0;
    const outputTokens = response.usage?.output_tokens || 0;
    const actualCostCents = calculateTokenCost(inputTokens, outputTokens);
    
    // Deduct from user's balance based on actual token usage
    const deductResult = await deductUsage(userId, {
      inputTokens,
      outputTokens,
      toolCalls: toolCallsUsed,
    });

    if (!deductResult.success && deductResult.error === 'insufficient_balance') {
      console.warn('[AL] Balance check passed but deduction failed');
    }

    // Store assistant response in conversation history
    if (activeConversationId) {
      await addMessage(activeConversationId, {
        role: 'assistant',
        content: aiResponse,
        toolCalls: toolCallsUsed,
        costCents: actualCostCents,
        inputTokens,
        outputTokens,
        carContextSlug: carSlug,
        carContextName: context.car?.name,
        dataSources: toolCallsUsed.map(tool => ({ type: 'tool', name: tool })),
      });
    }

    return NextResponse.json({
      response: aiResponse,
      conversationId: activeConversationId,
      context: {
        carName: context.car?.name,
        domains,
        toolsUsed: toolCallsUsed,
      },
      usage: {
        costCents: actualCostCents,
        costFormatted: formatCentsAsDollars(actualCostCents),
        remainingBalanceCents: deductResult.newBalanceCents ?? userBalance.balanceCents,
        remainingBalanceFormatted: formatCentsAsDollars(deductResult.newBalanceCents ?? userBalance.balanceCents),
        inputTokens,
        outputTokens,
        toolCalls: toolCallsUsed.length,
      },
    });

  } catch (err) {
    console.error('[AL] Error:', err);
    return NextResponse.json(
      { 
        error: 'Failed to process request',
        fallbackResponse: "I apologize, but I'm having trouble processing your request right now. Please try again in a moment.",
      },
      { status: 500 }
    );
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Call Claude API with tool use
 */
async function callClaudeWithTools({ systemPrompt, messages, tools, maxTokens }) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages,
      tools: tools.length > 0 ? tools : undefined,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('[AL] Claude API error:', error);
    throw new Error('Failed to get AI response');
  }

  return await response.json();
}

/**
 * Format chat history for Claude (from client-provided history)
 */
function formatMessagesForClaudeFromHistory(history, currentMessage) {
  const messages = [];
  
  // Add recent history
  (history || []).slice(-10).forEach(msg => {
    messages.push({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content,
    });
  });
  
  // Add current message
  messages.push({
    role: 'user',
    content: currentMessage,
  });
  
  return messages;
}

/**
 * Demo response when API not configured
 */
function getDemoResponse() {
  return `Hey! I'm **AL** - your AutoRev AI assistant. I'm currently in demo mode, but here's what I can help you with when fully activated:

🚗 **Find Your Perfect Car**
Tell me your budget, preferences, and how you'll use it - I'll search our database of 150+ sports cars.

🔧 **Modification Guidance**  
Get specific recommendations for your goals, whether it's daily driving fun or track domination.

📊 **Expert Insights**
I can pull summaries from top automotive YouTubers and show you what experts really think.

⚠️ **Known Issues**
Before you buy, I'll tell you exactly what to watch for and common problems to check.

🏁 **Track Prep**
From brake pads to cooling upgrades, I'll help you prepare for your first HPDE.

Feel free to explore the site, and come back when I'm fully activated!`;
}

/**
 * Response when user is not authenticated
 */
function getAuthRequiredResponse() {
  return `Hey there! I'm **AL** - AutoRev's expert automotive AI assistant. 

To use my full capabilities, you'll need to **join AutoRev** first. It's free to get started!

**What you get with a free account:**
- 25 credits/month to chat with me
- Access to our car database
- Basic recommendations and search

**With Enthusiast ($9.99/mo) and up:**
- More monthly credits
- Expert YouTube review summaries
- Deep reliability analysis
- Forum search integration
- And much more!

👉 **[Join Now](/join)** to start chatting with me and find your perfect sports car!`;
}

/**
 * Response when user has insufficient balance
 */
function getInsufficientBalanceResponse(userBalance) {
  const nextRefillDate = userBalance.lastRefillDate 
    ? new Date(new Date(userBalance.lastRefillDate).getTime() + 30*24*60*60*1000).toLocaleDateString() 
    : 'next month';
  
  return `Hey! I'd love to help, but you're running low on balance. 

**Current Balance**: ${formatCentsAsDollars(userBalance.balanceCents)}
**Your Plan**: ${userBalance.planName || 'Free'}

You can:
- **Top up your balance** from your profile page
- **Upgrade your plan** for more monthly allocation
- **Wait for your monthly refill** on ${nextRefillDate}

Even without balance, feel free to browse our car profiles, use the Performance HUB, and explore the site!`;
}

// =============================================================================
// SUGGESTIONS ENDPOINT
// =============================================================================

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const carSlug = searchParams.get('carSlug');
  const context = searchParams.get('context');

  const suggestions = generateContextualSuggestions(carSlug, context);

  return NextResponse.json({ suggestions });
}

/**
 * Generate smart suggestions based on context
 */
function generateContextualSuggestions(carSlug, pageContext) {
  const baseSuggestions = [
    "What's the best sports car under $50k?",
    "What are the most reliable sports cars?",
    "What mods give the best bang for buck?",
  ];

  if (!carSlug) {
    return baseSuggestions;
  }

  // Car-specific suggestions
  const carSuggestions = [
    `What are the common issues with this car?`,
    `What do expert reviewers say about it?`,
    `What's the best first mod for this car?`,
    `How does this compare to similar cars?`,
    `Is this a good daily driver or weekend car?`,
    `What should I look for when buying one?`,
  ];

  if (pageContext === 'garage') {
    return [
      `When is my next service due?`,
      `What maintenance should I plan this year?`,
      `Are there any recalls I should know about?`,
      ...carSuggestions.slice(0, 2),
    ];
  }

  if (pageContext === 'build' || pageContext === 'performance') {
    return [
      `What order should I install these mods?`,
      `Do I need supporting mods for this?`,
      `Is this build reliable for daily driving?`,
      `What's the total cost for this build?`,
    ];
  }

  if (pageContext === 'compare') {
    return [
      `Which one is more reliable long-term?`,
      `Which is better for track days?`,
      `Which one holds value better?`,
      `Which has better aftermarket support?`,
    ];
  }

  return carSuggestions;
}
