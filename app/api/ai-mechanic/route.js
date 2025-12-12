/**
 * AI Mechanic API Route
 * 
 * Handles chat requests for the AI Mechanic feature.
 * Uses Claude (Anthropic) API for generating responses.
 */

import { NextResponse } from 'next/server';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514';

/**
 * System prompt for AI Mechanic
 */
const SYSTEM_PROMPT = `You are an AI Mechanic for AutoRev, a platform dedicated to sports car enthusiasts.

Your role:
- Provide expert advice on sports cars, maintenance, modifications, and buying guidance
- Be friendly, knowledgeable, and enthusiastic about cars
- Give practical, actionable advice backed by real automotive knowledge
- When discussing modifications, consider both performance gains and potential trade-offs
- Mention safety considerations when relevant
- Reference specific part numbers, OEM specs, and maintenance intervals when known
- If you don't know something specific, say so rather than guessing

Maintenance Expertise:
- Fluids: Oil types/weights, coolant specifications, brake fluid, transmission fluid
- Filters: Air, oil, cabin, fuel filter replacement intervals
- Brakes: Pad compounds, rotor types, caliper maintenance
- Tires: Recommended sizes, pressures, rotation intervals
- Electrical: Battery specs, alternator output, common electrical issues
- Engine: Timing belt/chain intervals, spark plugs, fuel system maintenance
- Suspension: Alignment specs, bushing wear, shock/strut replacement
- Common issues: Known problems for specific models and how to address them

When asked about specific maintenance items, provide:
- The OEM specification when known
- Acceptable alternatives (if any)
- Replacement intervals
- Signs of wear to watch for
- DIY vs professional recommendation

Tone:
- Conversational and approachable
- Enthusiastic but not over-the-top
- Technical when needed, but explain complex terms
- Supportive of all skill levels, from beginners to experienced enthusiasts

Keep responses concise (2-3 paragraphs max) unless asked for detailed information.`;

/**
 * Build context prompt from car data including maintenance specs
 */
function buildContextPrompt(carContext, maintenanceSpecs = null) {
  if (!carContext) return '';
  
  let context = `\n\nThe user is currently viewing the ${carContext.name}`;
  
  if (carContext.year) {
    context += ` (${carContext.year})`;
  }
  
  if (carContext.hp) {
    context += `. It has ${carContext.hp} hp`;
  }
  
  if (carContext.engine) {
    context += ` with a ${carContext.engine} engine`;
  }
  
  context += '.';
  
  // Add maintenance specs if available
  if (maintenanceSpecs) {
    context += '\n\nKnown maintenance specifications for this vehicle:';
    
    if (maintenanceSpecs.oil_type) {
      context += `\n- Oil: ${maintenanceSpecs.oil_type}`;
      if (maintenanceSpecs.oil_capacity) {
        context += ` (${maintenanceSpecs.oil_capacity})`;
      }
    }
    
    if (maintenanceSpecs.fuel_octane) {
      context += `\n- Fuel: ${maintenanceSpecs.fuel_octane} octane`;
      if (maintenanceSpecs.fuel_type) {
        context += ` (${maintenanceSpecs.fuel_type})`;
      }
    }
    
    if (maintenanceSpecs.tire_size_front || maintenanceSpecs.tire_size_rear) {
      context += `\n- Tires: Front ${maintenanceSpecs.tire_size_front || 'N/A'}, Rear ${maintenanceSpecs.tire_size_rear || 'N/A'}`;
    }
    
    if (maintenanceSpecs.brake_fluid_type) {
      context += `\n- Brake fluid: ${maintenanceSpecs.brake_fluid_type}`;
    }
    
    if (maintenanceSpecs.coolant_type) {
      context += `\n- Coolant: ${maintenanceSpecs.coolant_type}`;
    }
  }
  
  return context;
}

/**
 * Convert chat history to Claude message format
 */
function formatMessagesForClaude(history, currentMessage) {
  const messages = [];
  
  // Add history (alternating user/assistant)
  history.slice(-6).forEach(msg => {
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

export async function POST(request) {
  // Check if Anthropic is configured
  if (!ANTHROPIC_API_KEY) {
    // Return a helpful demo response
    return NextResponse.json({
      response: "I'm currently in demo mode. In production, I'll be able to give you detailed, AI-powered advice about your car including maintenance schedules, fluid specifications, common issues, and modification recommendations. For now, feel free to explore the site and check out our car profiles and Performance HUB!",
    });
  }

  try {
    const body = await request.json();
    const { message, carContext, maintenanceSpecs, history = [] } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Build system prompt with context
    const systemPrompt = SYSTEM_PROMPT + buildContextPrompt(carContext, maintenanceSpecs);
    
    // Format messages for Claude
    const messages = formatMessagesForClaude(history, message);

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 1024,
        system: systemPrompt,
        messages,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[AI Mechanic] Claude API error:', error);
      throw new Error('Failed to get AI response');
    }

    const data = await response.json();
    const aiResponse = data.content?.[0]?.text;

    if (!aiResponse) {
      throw new Error('No response from AI');
    }

    return NextResponse.json({
      response: aiResponse,
    });
  } catch (err) {
    console.error('[AI Mechanic] Error:', err);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
