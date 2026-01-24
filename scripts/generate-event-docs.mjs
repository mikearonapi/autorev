#!/usr/bin/env node

/**
 * Event Documentation Generator
 * 
 * Reads the TypeScript event types and generates markdown documentation
 * for all analytics events with their properties.
 * 
 * Usage: node scripts/generate-event-docs.mjs
 * Output: docs/ANALYTICS_EVENTS.md
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

// =============================================================================
// PARSERS
// =============================================================================

/**
 * Parse TypeScript interfaces from types.ts
 */
function parseInterfaces(content) {
  const interfaces = {};
  
  // Match interface definitions
  const interfaceRegex = /\/\*\*([^*]|\*(?!\/))*\*\/\s*export interface (\w+)\s*\{([^}]+)\}/g;
  let match;
  
  while ((match = interfaceRegex.exec(content)) !== null) {
    const [, docComment, name, body] = match;
    const properties = parseInterfaceProperties(body);
    const description = parseJSDocDescription(docComment || '');
    
    interfaces[name] = {
      name,
      description,
      properties,
    };
  }
  
  return interfaces;
}

/**
 * Parse properties from interface body
 */
function parseInterfaceProperties(body) {
  const properties = [];
  const propRegex = /(\w+)(\?)?:\s*([^;]+)/g;
  let match;
  
  while ((match = propRegex.exec(body)) !== null) {
    const [, name, optional, type] = match;
    properties.push({
      name,
      type: type.trim(),
      required: !optional,
    });
  }
  
  return properties;
}

/**
 * Parse JSDoc description
 */
function parseJSDocDescription(comment) {
  const match = comment.match(/\*\s*([^@*][^\n]*)/);
  return match ? match[1].trim() : '';
}

/**
 * Parse event names from events.js
 */
function parseEventNames(content) {
  const events = {};
  
  // Match event constant definitions
  const eventRegex = /\/\*\*\s*([^*]+)\s*\*\/\s*(\w+):\s*'([^']+)'/g;
  let match;
  
  while ((match = eventRegex.exec(content)) !== null) {
    const [, description, constantName, eventName] = match;
    events[constantName] = {
      constantName,
      eventName,
      description: description.trim(),
    };
  }
  
  return events;
}

/**
 * Parse AnalyticsEvent union type
 */
function parseAnalyticsEventUnion(content) {
  const events = [];
  
  // Match union members
  const unionRegex = /\|\s*\{\s*name:\s*'([^']+)';\s*properties:\s*(\w+(?:<[^>]+>)?|\{[^}]+\}|Record<[^>]+>)\s*\}/g;
  let match;
  
  while ((match = unionRegex.exec(content)) !== null) {
    const [, eventName, propertiesType] = match;
    events.push({
      eventName,
      propertiesType: propertiesType.trim(),
    });
  }
  
  return events;
}

// =============================================================================
// GENERATORS
// =============================================================================

/**
 * Generate markdown documentation
 */
function generateMarkdown(eventData, interfaces, eventUnion) {
  const lines = [];
  
  // Header
  lines.push('# Analytics Events Documentation');
  lines.push('');
  lines.push('> **Auto-generated from TypeScript types**');
  lines.push(`> Last updated: ${new Date().toISOString().split('T')[0]}`);
  lines.push('');
  lines.push('This document describes all analytics events tracked in the AutoRev application.');
  lines.push('All events follow the "Object + Past-Tense Verb" naming convention in Title Case.');
  lines.push('');
  
  // Table of contents
  lines.push('## Table of Contents');
  lines.push('');
  const categories = groupEventsByCategory(eventData);
  for (const category of Object.keys(categories)) {
    lines.push(`- [${category}](#${category.toLowerCase().replace(/\s+/g, '-')})`);
  }
  lines.push('');
  
  // Event categories
  for (const [category, events] of Object.entries(categories)) {
    lines.push(`## ${category}`);
    lines.push('');
    
    for (const event of events) {
      lines.push(`### ${event.eventName}`);
      lines.push('');
      lines.push(`**Constant:** \`EVENTS.${event.constantName}\``);
      lines.push('');
      if (event.description) {
        lines.push(`**Description:** ${event.description}`);
        lines.push('');
      }
      
      // Find properties type from union
      const unionEvent = eventUnion.find(e => e.eventName === event.eventName);
      if (unionEvent) {
        const propsInterface = interfaces[unionEvent.propertiesType];
        if (propsInterface && propsInterface.properties.length > 0) {
          lines.push('**Properties:**');
          lines.push('');
          lines.push('| Property | Type | Required | Description |');
          lines.push('|----------|------|----------|-------------|');
          for (const prop of propsInterface.properties) {
            lines.push(`| \`${prop.name}\` | \`${prop.type}\` | ${prop.required ? 'Yes' : 'No'} | - |`);
          }
          lines.push('');
        } else if (unionEvent.propertiesType.includes('Record<string, never>')) {
          lines.push('**Properties:** None');
          lines.push('');
        }
      }
      
      // Example
      lines.push('**Example:**');
      lines.push('```javascript');
      lines.push(`trackEvent(EVENTS.${event.constantName}, {`);
      if (unionEvent) {
        const propsInterface = interfaces[unionEvent.propertiesType];
        if (propsInterface) {
          for (const prop of propsInterface.properties.slice(0, 3)) {
            const exampleValue = getExampleValue(prop.type, prop.name);
            lines.push(`  ${prop.name}: ${exampleValue},`);
          }
        }
      }
      lines.push('});');
      lines.push('```');
      lines.push('');
    }
  }
  
  return lines.join('\n');
}

/**
 * Group events by category based on constant name prefix
 */
function groupEventsByCategory(events) {
  const categories = {};
  const categoryMap = {
    'SIGNUP': 'Authentication Events',
    'LOGIN': 'Authentication Events',
    'LOGOUT': 'Authentication Events',
    'PASSWORD': 'Authentication Events',
    'ONBOARDING': 'Onboarding Events',
    'CAR': 'Car Discovery Events',
    'CARS': 'Car Discovery Events',
    'GARAGE': 'Garage Events',
    'FAVORITE': 'Garage Events',
    'BUILD': 'Build/Tuning Events',
    'AL': 'AL (AI Assistant) Events',
    'EVENT': 'Events Calendar',
    'COMMUNITY': 'Community Events',
    'PRICING': 'Subscription Events',
    'CHECKOUT': 'Subscription Events',
    'SUBSCRIPTION': 'Subscription Events',
    'CTA': 'Engagement Events',
    'CONTENT': 'Engagement Events',
    'FEEDBACK': 'Engagement Events',
    'CONTACT': 'Engagement Events',
    'FEATURE': 'Feature Discovery',
    'EXPERIMENT': 'A/B Testing',
  };
  
  for (const event of Object.values(events)) {
    let category = 'Other Events';
    for (const [prefix, cat] of Object.entries(categoryMap)) {
      if (event.constantName.startsWith(prefix)) {
        category = cat;
        break;
      }
    }
    
    if (!categories[category]) {
      categories[category] = [];
    }
    categories[category].push(event);
  }
  
  return categories;
}

/**
 * Get example value for a type
 */
function getExampleValue(type, name) {
  if (type.includes('string')) {
    if (name.includes('id')) return `'${name.replace('_id', '')}-123'`;
    if (name.includes('slug')) return "'bmw-m3'";
    if (name.includes('name')) return "'Example Name'";
    if (name.includes('email')) return "'user@example.com'";
    if (name.includes('method')) return "'google'";
    return "'value'";
  }
  if (type.includes('number')) return '123';
  if (type.includes('boolean')) return 'true';
  if (type.includes('|')) {
    const firstOption = type.split('|')[0].trim().replace(/['"]/g, '');
    return `'${firstOption}'`;
  }
  return "'value'";
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  console.log('Generating analytics event documentation...');
  
  // Read source files
  const typesPath = join(rootDir, 'lib/analytics/types.ts');
  const eventsPath = join(rootDir, 'lib/analytics/events.js');
  
  let typesContent, eventsContent;
  
  try {
    typesContent = readFileSync(typesPath, 'utf-8');
    eventsContent = readFileSync(eventsPath, 'utf-8');
  } catch (error) {
    console.error('Error reading source files:', error.message);
    process.exit(1);
  }
  
  // Parse
  const interfaces = parseInterfaces(typesContent);
  const events = parseEventNames(eventsContent);
  const eventUnion = parseAnalyticsEventUnion(typesContent);
  
  console.log(`Found ${Object.keys(events).length} events`);
  console.log(`Found ${Object.keys(interfaces).length} interfaces`);
  console.log(`Found ${eventUnion.length} event union members`);
  
  // Generate markdown
  const markdown = generateMarkdown(events, interfaces, eventUnion);
  
  // Write output
  const outputPath = join(rootDir, 'docs/ANALYTICS_EVENTS.md');
  writeFileSync(outputPath, markdown);
  
  console.log(`Documentation written to: ${outputPath}`);
}

main().catch(console.error);
