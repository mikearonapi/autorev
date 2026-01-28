/**
 * AutoRev Encyclopedia - Unified Data Layer
 * 
 * This module provides a unified interface to all educational content:
 * - Automotive Systems & Topics (component-centric education)
 * - Modifications & Upgrades (what you can do)
 * - Build Guides (goal-based learning paths)
 * 
 * All content is organized into a consistent structure for the Encyclopedia UI.
 * 
 * NEW HIERARCHY (v2):
 *   System → Component → Topic
 *   (e.g., Engine → Cylinder Head → Port Design)
 * 
 * LEGACY SUPPORT:
 *   The old "systems" (from connectedTissueMatrix) are still available
 *   for backward compatibility with existing consumers.
 */

import { systems, nodes, edges } from '@/data/connectedTissueMatrix';
import { upgradeCategories, upgradeDetails } from '@/data/upgradeEducation';
import { buildGoals, buildPaths } from '@/lib/educationData';
import {
  encyclopediaSystems,
  encyclopediaComponents,
  encyclopediaTopics,
  upgradeKeyToTopics,
  getSystemsOrdered,
  getComponentsForSystem,
  getTopicsForComponent,
  getTopicsForUpgrade,
  getHierarchyStats,
} from '@/lib/encyclopediaHierarchy';
import { 
  modificationCategories, 
  activeCategories, 
  activeCategoryKeys,
  modificationCategoryReassignment,
  modificationTopicLinks,
  getLinkedTopics,
  getPrimaryLinkedTopic,
  isCategoryDeprecated,
  getModificationsByCategory,
} from '@/lib/modificationCategories';
import { buildTechnicalSpecs } from '@/lib/technicalSpecsMapping';

// =============================================================================
// CONTENT TYPES
// =============================================================================

export const CONTENT_TYPES = {
  // New hierarchy types
  AUTOMOTIVE_SYSTEM: 'automotiveSystem',
  AUTOMOTIVE_COMPONENT: 'automotiveComponent',
  TOPIC: 'topic',
  // Legacy types (still supported)
  SYSTEM: 'system',
  COMPONENT: 'component',
  CATEGORY: 'category',
  MODIFICATION: 'modification',
  BUILD_GUIDE: 'buildGuide',
};

// =============================================================================
// MAIN SECTIONS
// =============================================================================

export const ENCYCLOPEDIA_SECTIONS = {
  automotive: {
    key: 'automotive',
    title: 'Automotive Systems',
    subtitle: 'Learn how your car works from the inside out',
    icon: 'cog',
    description: 'Comprehensive education on automotive systems—from engine fundamentals to aerodynamics. Understand how components work together.',
  },
  modifications: {
    key: 'modifications',
    title: 'Modifications',
    subtitle: 'Performance upgrades and modifications',
    icon: 'wrench',
    description: 'Explore our complete encyclopedia of performance parts. Understand what each upgrade does and how it improves your car.',
  },
  guides: {
    key: 'guides',
    title: 'Build Guides',
    subtitle: 'Goal-based build paths',
    icon: 'map',
    description: 'Curated paths to achieve your performance goals, from beginner to advanced.',
  },
  // DEPRECATED: Technical Reference has been merged into Automotive Systems
  // Legacy system/component routes are still supported for backwards compatibility
  // but this section is no longer shown in navigation
};

// Section keys that should be displayed in navigation (3 sections)
export const ACTIVE_SECTION_KEYS = ['automotive', 'modifications', 'guides'];

// =============================================================================
// UNIFIED ARTICLE STRUCTURE
// =============================================================================

/**
 * Creates a standardized article object from any content type
 */
function createArticle({ 
  id, 
  type, 
  title, 
  subtitle, 
  icon, 
  color, 
  breadcrumb,
  summary,
  sections,
  metadata,
  related,
  rawData,
}) {
  return {
    id,
    type,
    title,
    subtitle,
    icon,
    color,
    breadcrumb,
    summary,
    sections: sections || [],
    metadata: metadata || {},
    related: related || [],
    rawData,
  };
}

// =============================================================================
// NEW HIERARCHY: AUTOMOTIVE SYSTEM ARTICLES
// =============================================================================

/**
 * Get all automotive system articles (new hierarchy)
 */
export function getAutomotiveSystemArticles() {
  return getSystemsOrdered().map(system => {
    const components = getComponentsForSystem(system.slug);
    
    return createArticle({
      id: `auto.${system.slug}`,
      type: CONTENT_TYPES.AUTOMOTIVE_SYSTEM,
      title: system.name,
      subtitle: system.description,
      icon: system.icon,
      color: system.color,
      breadcrumb: ['Encyclopedia', 'Automotive Systems', system.name],
      summary: system.description,
      sections: [
        {
          title: 'Components',
          type: 'automotiveComponentList',
          content: components.map(comp => ({
            id: `auto.${system.slug}.${comp.slug}`,
            name: comp.name,
            description: comp.description,
            topicCount: getTopicsForComponent(comp.slug).length,
          })),
        },
      ],
      metadata: {
        componentCount: components.length,
        sortOrder: system.sortOrder,
      },
      related: [],
      rawData: system,
    });
  });
}

/**
 * Helper to find a system by its slug (handles mismatched keys/slugs)
 */
function findSystemBySlug(systemSlug) {
  // First try direct key lookup (for systems where key === slug)
  if (encyclopediaSystems[systemSlug]) {
    return encyclopediaSystems[systemSlug];
  }
  // Fall back to searching by slug property
  return Object.values(encyclopediaSystems).find(s => s.slug === systemSlug) || null;
}

/**
 * Get a single automotive system article by slug
 */
export function getAutomotiveSystemArticle(systemSlug) {
  const system = findSystemBySlug(systemSlug);
  if (!system) return null;
  
  const components = getComponentsForSystem(system.slug);
  
  return createArticle({
    id: `auto.${system.slug}`,
    type: CONTENT_TYPES.AUTOMOTIVE_SYSTEM,
    title: system.name,
    subtitle: system.description,
    icon: system.icon,
    color: system.color,
    breadcrumb: ['Encyclopedia', 'Automotive Systems', system.name],
    summary: system.description,
    sections: [
      {
        title: 'Components',
        type: 'automotiveComponentList',
        content: components.map(comp => ({
          id: `auto.${system.slug}.${comp.slug}`,
          name: comp.name,
          description: comp.description,
          topicCount: getTopicsForComponent(comp.slug).length,
        })),
      },
    ],
    metadata: {
      componentCount: components.length,
      sortOrder: system.sortOrder,
    },
    related: [],
    rawData: system,
  });
}

/**
 * Get a component article with its topics
 */
export function getAutomotiveComponentArticle(systemSlug, componentSlug) {
  const system = findSystemBySlug(systemSlug);
  const component = encyclopediaComponents[componentSlug];
  
  if (!system || !component || component.system !== systemSlug) return null;
  
  const topics = getTopicsForComponent(componentSlug);
  
  return createArticle({
    id: `auto.${system.slug}.${component.slug}`,
    type: CONTENT_TYPES.AUTOMOTIVE_COMPONENT,
    title: component.name,
    subtitle: component.description,
    icon: system.icon,
    color: system.color,
    breadcrumb: ['Encyclopedia', 'Automotive Systems', system.name, component.name],
    summary: component.description,
    sections: [
      {
        title: 'Topics',
        type: 'topicList',
        content: topics.map(topic => ({
          id: `topic.${topic.slug}`,
          name: topic.name,
          definition: topic.definition,
          status: topic.status,
        })),
      },
    ],
    metadata: {
      system: system.slug,
      topicCount: topics.length,
      completeCount: topics.filter(t => t.status === 'complete').length,
    },
    related: [],
    rawData: component,
  });
}

/**
 * Get a topic article
 */
export function getTopicArticle(topicSlug) {
  const topic = encyclopediaTopics[topicSlug];
  if (!topic) return null;
  
  const component = encyclopediaComponents[topic.component];
  const system = findSystemBySlug(topic.system);
  
  // Find related upgrades that link to this topic
  const relatedUpgrades = [];
  for (const [upgradeKey, topicSlugs] of Object.entries(upgradeKeyToTopics)) {
    if (topicSlugs.includes(topicSlug)) {
      const upgrade = upgradeDetails[upgradeKey];
      if (upgrade) {
        relatedUpgrades.push({
          id: `mod.${upgradeKey}`,
          title: upgrade.name,
          type: CONTENT_TYPES.MODIFICATION,
        });
      }
    }
  }
  
  // CF-010: Build sections - skip "What Is It?" if definition is used as summary
  // to avoid duplicate content at the top of articles
  const sections = [
    // "What Is It?" section content is shown via article.summary, so we skip this section
    // to avoid duplication. The summary displays the definition prominently.
    {
      title: 'How It Works',
      type: 'text',
      content: topic.howItWorks,
    },
    {
      title: 'Why It Matters',
      type: 'text',
      content: topic.whyItMatters,
    },
  ];
  
  if (topic.modPotential) {
    // Handle both old string format and new object format
    if (typeof topic.modPotential === 'string') {
      sections.push({
        title: 'Modification Potential',
        type: 'text',
        content: topic.modPotential,
      });
    } else if (typeof topic.modPotential === 'object') {
      // New format: { summary, gains, considerations }
      sections.push({
        title: 'Modification Potential',
        type: 'modPotential',
        content: {
          summary: topic.modPotential.summary,
          gains: topic.modPotential.gains,
          considerations: topic.modPotential.considerations,
        },
      });
    }
  }
  
  if (topic.relatedUpgradeKeys && topic.relatedUpgradeKeys.length > 0) {
    sections.push({
      title: 'Related Upgrades',
      type: 'upgradeLinks',
      content: topic.relatedUpgradeKeys.map(key => {
        const upgrade = upgradeDetails[key];
        return upgrade ? { key, name: upgrade.name } : null;
      }).filter(Boolean),
    });
  }
  
  // Add technical specifications merged from Technical Reference
  const technicalSpecs = buildTechnicalSpecs(topic.slug);
  if (technicalSpecs && technicalSpecs.specifications.length > 0) {
    sections.push({
      title: 'Technical Specifications',
      type: 'technicalSpecs',
      content: technicalSpecs,
    });
  }
  
  return createArticle({
    id: `topic.${topic.slug}`,
    type: CONTENT_TYPES.TOPIC,
    title: topic.name,
    subtitle: `Part of ${component?.name || 'Unknown Component'}`,
    icon: system?.icon || 'cog',
    color: system?.color || '#6b7280',
    breadcrumb: ['Encyclopedia', 'Automotive Systems', system?.name || 'System', component?.name || 'Component', topic.name],
    summary: topic.definition,
    sections,
    metadata: {
      system: topic.system,
      component: topic.component,
      status: topic.status,
      hasTechnicalSpecs: !!technicalSpecs,
    },
    related: relatedUpgrades.slice(0, 5),
    rawData: topic,
  });
}

// =============================================================================
// LEGACY SYSTEM ARTICLES (from connectedTissueMatrix - preserved for compatibility)
// =============================================================================

/**
 * Get all system articles (legacy - from connectedTissueMatrix)
 */
export function getSystemArticles() {
  return Object.values(systems).map(system => {
    const systemNodes = Object.values(nodes).filter(n => n.system === system.key);
    
    return createArticle({
      id: `system.${system.key}`,
      type: CONTENT_TYPES.SYSTEM,
      title: system.name,
      subtitle: system.description,
      icon: system.icon,
      color: system.color,
      breadcrumb: ['Encyclopedia', 'How Cars Work', system.name],
      summary: system.description,
      sections: [
        {
          title: 'Components',
          type: 'componentList',
          content: systemNodes.map(node => ({
            id: `component.${node.key}`,
            name: node.name,
            description: node.description,
            unit: node.unit,
          })),
        },
      ],
      metadata: {
        componentCount: systemNodes.length,
      },
      related: getRelatedSystems(system.key),
      rawData: system,
    });
  });
}

/**
 * Get a single system article by key (legacy)
 */
export function getSystemArticle(systemKey) {
  const system = systems[systemKey];
  if (!system) return null;
  
  const systemNodes = Object.values(nodes).filter(n => n.system === systemKey);
  
  return createArticle({
    id: `system.${system.key}`,
    type: CONTENT_TYPES.SYSTEM,
    title: system.name,
    subtitle: system.description,
    icon: system.icon,
    color: system.color,
    breadcrumb: ['Encyclopedia', 'How Cars Work', system.name],
    summary: system.description,
    sections: [
      {
        title: 'Components',
        type: 'componentList',
        content: systemNodes.map(node => ({
          id: `component.${node.key}`,
          name: node.name,
          description: node.description,
          unit: node.unit,
        })),
      },
    ],
    metadata: {
      componentCount: systemNodes.length,
    },
    related: getRelatedSystems(systemKey),
    rawData: system,
  });
}

/**
 * Get related systems based on edges (legacy)
 */
function getRelatedSystems(systemKey) {
  const relatedSystemKeys = new Set();
  
  const systemNodeKeys = Object.values(nodes)
    .filter(n => n.system === systemKey)
    .map(n => n.key);
  
  edges.forEach(edge => {
    if (systemNodeKeys.includes(edge.from)) {
      const toNode = nodes[edge.to];
      if (toNode && toNode.system !== systemKey) {
        relatedSystemKeys.add(toNode.system);
      }
    }
    if (systemNodeKeys.includes(edge.to)) {
      const fromNode = nodes[edge.from];
      if (fromNode && fromNode.system !== systemKey) {
        relatedSystemKeys.add(fromNode.system);
      }
    }
  });
  
  return Array.from(relatedSystemKeys).slice(0, 5).map(key => ({
    id: `system.${key}`,
    title: systems[key]?.name || key,
    type: CONTENT_TYPES.SYSTEM,
  }));
}

// =============================================================================
// COMPONENT ARTICLES (legacy - from connectedTissueMatrix nodes)
// =============================================================================

/**
 * Get a component article by key (legacy)
 */
export function getComponentArticle(componentKey) {
  const node = nodes[componentKey];
  if (!node) return null;
  
  const system = systems[node.system];
  
  const relatedEdges = edges.filter(e => e.from === componentKey || e.to === componentKey);
  
  const affectingMods = Object.entries(upgradeDetails)
    .filter(([_key, mod]) => {
      return mod.fullDescription?.toLowerCase().includes(node.name.toLowerCase());
    })
    .slice(0, 5)
    .map(([key, mod]) => ({
      id: `mod.${key}`,
      title: mod.name,
      type: CONTENT_TYPES.MODIFICATION,
    }));
  
  return createArticle({
    id: `component.${componentKey}`,
    type: CONTENT_TYPES.COMPONENT,
    title: node.name,
    subtitle: `Part of the ${system?.name || 'vehicle'} system`,
    icon: system?.icon || 'cog',
    color: system?.color || '#6b7280',
    breadcrumb: ['Encyclopedia', 'How Cars Work', system?.name || 'System', node.name],
    summary: node.description,
    sections: [
      {
        title: 'Technical Details',
        type: 'keyValue',
        content: [
          { label: 'System', value: system?.name || 'Unknown' },
          node.unit && { label: 'Measured in', value: node.unit },
          node.applicableEngines && { label: 'Applies to', value: node.applicableEngines.join(', ') },
        ].filter(Boolean),
      },
      relatedEdges.length > 0 && {
        title: 'Relationships',
        type: 'relationships',
        content: relatedEdges.slice(0, 10).map(edge => {
          const isFrom = edge.from === componentKey;
          const otherKey = isFrom ? edge.to : edge.from;
          const otherNode = nodes[otherKey];
          return {
            direction: isFrom ? 'affects' : 'affected by',
            type: edge.type,
            node: otherNode?.name || otherKey,
            description: edge.description,
          };
        }),
      },
    ].filter(Boolean),
    metadata: {
      unit: node.unit,
      system: node.system,
    },
    related: [
      { id: `system.${node.system}`, title: system?.name, type: CONTENT_TYPES.SYSTEM },
      ...affectingMods,
    ],
    rawData: node,
  });
}

// =============================================================================
// MODIFICATION ARTICLES
// =============================================================================

/**
 * Get all modification category articles
 * Now uses restructured categories (10 active + 2 deprecated)
 */
export function getModificationCategoryArticles() {
  // Return only active categories in sorted order
  return Object.values(activeCategories)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(category => {
      // Get mods for this category using the reassignment map
      const categoryModKeys = getModificationsByCategory(category.key);
      const mods = categoryModKeys
        .map(modKey => upgradeDetails[modKey])
        .filter(Boolean);

      return createArticle({
        id: `category.${category.key}`,
        type: CONTENT_TYPES.CATEGORY,
        title: category.name,
        subtitle: category.description,
        icon: category.icon,
        color: category.color,
        breadcrumb: ['Encyclopedia', 'Modifications', category.name],
        summary: category.description,
        sections: [
          {
            title: 'Available Modifications',
            type: 'modificationList',
            content: mods.map(mod => ({
              id: `mod.${mod.key}`,
              name: mod.name,
              description: mod.shortDescription,
              cost: mod.cost?.range,
              difficulty: mod.difficulty,
              linkedLearnTopic: getPrimaryLinkedTopic(mod.key),
            })),
          },
        ],
        metadata: {
          modCount: mods.length,
          linkedSystems: category.linkedSystems,
        },
        related: [],
        rawData: category,
      });
    });
}

/**
 * Get a single modification article
 * Now uses restructured categories and includes linkedLearnTopic
 */
export function getModificationArticle(modKey) {
  const mod = upgradeDetails[modKey];
  if (!mod) return null;

  // Get the NEW category for this modification
  const newCategoryKey = modificationCategoryReassignment[modKey] || mod.category;
  const category = modificationCategories[newCategoryKey] || upgradeCategories[mod.category];
  
  // Get linked learn topics for cross-referencing
  const linkedTopics = getLinkedTopics(modKey);
  const primaryLinkedTopic = linkedTopics[0] || null;

  // Find related topics from the new hierarchy
  const relatedTopics = getTopicsForUpgrade(modKey);
  
  return createArticle({
    id: `mod.${modKey}`,
    type: CONTENT_TYPES.MODIFICATION,
    title: mod.name,
    subtitle: mod.shortDescription,
    icon: category?.icon || 'wrench',
    color: category?.color || '#6b7280',
    breadcrumb: ['Encyclopedia', 'Modifications', category?.name || 'General', mod.name],
    summary: mod.fullDescription,
    sections: [
      {
        title: 'Overview',
        type: 'text',
        content: mod.fullDescription,
      },
      mod.howItWorks && {
        title: 'How It Works',
        type: 'text',
        content: mod.howItWorks,
      },
      mod.expectedGains && {
        title: 'Expected Gains',
        type: 'gains',
        content: mod.expectedGains,
      },
      {
        title: 'Quick Facts',
        type: 'keyValue',
        content: [
          mod.cost?.range && { label: 'Cost', value: mod.cost.range },
          mod.difficulty && { label: 'Difficulty', value: mod.difficulty },
          mod.installTime && { label: 'Install Time', value: mod.installTime },
          mod.requiresTune !== undefined && { label: 'Requires Tune', value: mod.requiresTune ? 'Yes' : 'No' },
          mod.streetLegal && { label: 'Street Legal', value: mod.streetLegal },
        ].filter(Boolean),
      },
      (mod.pros?.length > 0 || mod.cons?.length > 0) && {
        title: 'Pros & Cons',
        type: 'prosCons',
        content: { pros: mod.pros || [], cons: mod.cons || [] },
      },
      mod.bestFor?.length > 0 && {
        title: 'Best For',
        type: 'tags',
        content: mod.bestFor,
      },
      mod.worksWellWith?.length > 0 && {
        title: 'Works Well With',
        type: 'tags',
        content: mod.worksWellWith,
      },
      mod.considerations && {
        title: 'Important Considerations',
        type: 'text',
        content: mod.considerations,
      },
      mod.brands?.length > 0 && {
        title: 'Popular Brands',
        type: 'tags',
        content: mod.brands,
      },
      relatedTopics.length > 0 && {
        title: 'Learn More',
        type: 'topicLinks',
        content: relatedTopics.map(t => ({
          id: `topic.${t.slug}`,
          name: t.name,
          system: t.system,
        })),
      },
    ].filter(Boolean),
    metadata: {
      category: newCategoryKey,           // Use new restructured category
      originalCategory: mod.category,      // Preserve original for reference
      tier: mod.tier,
      cost: mod.cost,
      difficulty: mod.difficulty,
      linkedLearnTopic: primaryLinkedTopic,
      linkedLearnTopics: linkedTopics,
      isDeprecatedCategory: isCategoryDeprecated(newCategoryKey),
    },
    related: getRelatedMods(mod),
    rawData: mod,
  });
}

/**
 * Get related modifications
 */
function getRelatedMods(mod) {
  const related = [];
  
  if (mod.worksWellWith) {
    mod.worksWellWith.forEach(name => {
      const found = Object.entries(upgradeDetails).find(([_key, m]) => 
        m.name.toLowerCase().includes(name.toLowerCase()) ||
        name.toLowerCase().includes(m.name.toLowerCase())
      );
      if (found) {
        related.push({
          id: `mod.${found[0]}`,
          title: found[1].name,
          type: CONTENT_TYPES.MODIFICATION,
        });
      }
    });
  }
  
  const sameCategoryMods = Object.entries(upgradeDetails)
    .filter(([_key, m]) => m.category === mod.category && m.key !== mod.key)
    .slice(0, 3)
    .map(([key, m]) => ({
      id: `mod.${key}`,
      title: m.name,
      type: CONTENT_TYPES.MODIFICATION,
    }));
  
  return [...related, ...sameCategoryMods].slice(0, 6);
}

// =============================================================================
// BUILD GUIDE ARTICLES
// =============================================================================

/**
 * Get all build guide articles
 */
export function getBuildGuideArticles() {
  return Object.values(buildGoals).map(goal => {
    const path = buildPaths[goal.key];
    
    return createArticle({
      id: `guide.${goal.key}`,
      type: CONTENT_TYPES.BUILD_GUIDE,
      title: goal.name,
      subtitle: goal.description,
      icon: goal.icon,
      color: goal.color,
      breadcrumb: ['Encyclopedia', 'Build Guides', goal.name],
      summary: goal.description,
      sections: path?.stages ? [
        {
          title: 'Build Stages',
          type: 'buildStages',
          content: path.stages,
        },
      ] : [],
      metadata: {
        tagline: goal.tagline,
        stageCount: path?.stages?.length || 0,
      },
      related: [],
      rawData: { goal, path },
    });
  });
}

/**
 * Get a single build guide article
 */
export function getBuildGuideArticle(guideKey) {
  const goal = buildGoals[guideKey];
  if (!goal) return null;
  
  const path = buildPaths[guideKey];
  
  return createArticle({
    id: `guide.${guideKey}`,
    type: CONTENT_TYPES.BUILD_GUIDE,
    title: goal.name,
    subtitle: goal.description,
    icon: goal.icon,
    color: goal.color,
    breadcrumb: ['Encyclopedia', 'Build Guides', goal.name],
    summary: goal.description,
    sections: path?.stages ? [
      {
        title: 'Build Stages',
        type: 'buildStages',
        content: path.stages,
      },
    ] : [],
    metadata: {
      tagline: goal.tagline,
      stageCount: path?.stages?.length || 0,
    },
    related: [],
    rawData: { goal, path },
  });
}

// =============================================================================
// NAVIGATION TREE
// =============================================================================

/**
 * Get the complete navigation tree for the sidebar
 * Now includes the new automotive systems hierarchy as the primary section
 */
export function getNavigationTree() {
  return [
    // NEW: Automotive Systems (component-centric hierarchy)
    {
      key: 'automotive',
      title: 'Automotive Systems',
      icon: 'cog',
      children: getSystemsOrdered().map(system => {
        const components = getComponentsForSystem(system.slug);
        return {
          key: `auto.${system.slug}`,
          title: system.name,
          icon: system.icon,
          color: system.color,
          count: components.length,
          children: components.map(comp => {
            const topics = getTopicsForComponent(comp.slug);
            return {
              key: `auto.${system.slug}.${comp.slug}`,
              title: comp.name,
              count: topics.length,
              children: topics.map(topic => ({
                key: `topic.${topic.slug}`,
                title: topic.name,
                status: topic.status,
              })),
            };
          }),
        };
      }),
    },
    // Modifications (restructured with new 12 categories, 10 active + 2 deprecated)
    {
      key: 'modifications',
      title: 'Modifications',
      icon: 'wrench',
      children: Object.values(activeCategories)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(category => {
          // Get modifications for this new category using reassignment map
          const categoryMods = getModificationsByCategory(category.key);
          const categoryUpgrades = categoryMods
            .map(modKey => upgradeDetails[modKey])
            .filter(Boolean);
          
          return {
            key: `category.${category.key}`,
            title: category.name,
            icon: category.icon,
            color: category.color,
            count: categoryUpgrades.length,
            linkedSystems: category.linkedSystems,
            children: categoryUpgrades.map(upgrade => ({
              key: `mod.${upgrade.key}`,
              title: upgrade.name,
              linkedLearnTopic: getPrimaryLinkedTopic(upgrade.key),
            })),
          };
        }),
    },
    // Build Guides (preserved)
    {
      key: 'guides',
      title: 'Build Guides',
      icon: 'map',
      children: Object.values(buildGoals).map(goal => ({
        key: `guide.${goal.key}`,
        title: goal.name,
        icon: goal.icon,
        color: goal.color,
      })),
    },
    // NOTE: Technical Reference section has been eliminated
    // Content has been merged into Automotive Systems topics as technicalSpecs
    // Legacy system/component data is still accessible via getSystemArticle/getComponentArticle
    // for any existing deep links, but not shown in navigation
  ];
}

// =============================================================================
// SEARCH
// =============================================================================

/**
 * Search across all encyclopedia content
 * Now includes new topic hierarchy
 */
export function searchEncyclopedia(query) {
  if (!query || query.length < 2) return [];
  
  const results = [];
  const lowerQuery = query.toLowerCase();
  
  // Search new automotive systems
  Object.values(encyclopediaSystems).forEach(system => {
    if (system.name.toLowerCase().includes(lowerQuery) ||
        system.description.toLowerCase().includes(lowerQuery)) {
      results.push({
        id: `auto.${system.slug}`,
        title: system.name,
        subtitle: system.description,
        type: CONTENT_TYPES.AUTOMOTIVE_SYSTEM,
        section: 'Automotive Systems',
        icon: system.icon,
        color: system.color,
      });
    }
  });
  
  // Search new topics (highest priority for educational content)
  Object.values(encyclopediaTopics).forEach(topic => {
    const system = findSystemBySlug(topic.system);
    if (topic.name.toLowerCase().includes(lowerQuery) ||
        topic.definition.toLowerCase().includes(lowerQuery) ||
        topic.howItWorks.toLowerCase().includes(lowerQuery) ||
        topic.whyItMatters.toLowerCase().includes(lowerQuery)) {
      results.push({
        id: `topic.${topic.slug}`,
        title: topic.name,
        subtitle: topic.definition.slice(0, 100) + '...',
        type: CONTENT_TYPES.TOPIC,
        section: system?.name || 'Topics',
        icon: system?.icon || 'cog',
        color: system?.color || '#6b7280',
      });
    }
  });
  
  // NOTE: Legacy Technical Reference search results removed from primary search
  // The content has been merged into Automotive Systems topics as technicalSpecs
  // Legacy routes (system.*, component.*) are still supported for deep links
  // but no longer appear in search results to avoid duplication
  
  // Search modifications
  Object.values(upgradeDetails).forEach(mod => {
    if (mod.name.toLowerCase().includes(lowerQuery) ||
        mod.shortDescription?.toLowerCase().includes(lowerQuery) ||
        mod.fullDescription?.toLowerCase().includes(lowerQuery)) {
      const category = upgradeCategories[mod.category];
      results.push({
        id: `mod.${mod.key}`,
        title: mod.name,
        subtitle: mod.shortDescription,
        type: CONTENT_TYPES.MODIFICATION,
        section: category?.name || 'Modifications',
        icon: category?.icon,
        color: category?.color,
      });
    }
  });
  
  // Search build guides
  Object.values(buildGoals).forEach(goal => {
    if (goal.name.toLowerCase().includes(lowerQuery) ||
        goal.description.toLowerCase().includes(lowerQuery)) {
      results.push({
        id: `guide.${goal.key}`,
        title: goal.name,
        subtitle: goal.description,
        type: CONTENT_TYPES.BUILD_GUIDE,
        section: 'Build Guides',
        icon: goal.icon,
        color: goal.color,
      });
    }
  });
  
  // Sort by relevance (exact title matches first)
  return results.sort((a, b) => {
    const aExact = a.title.toLowerCase() === lowerQuery;
    const bExact = b.title.toLowerCase() === lowerQuery;
    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;
    
    const aStarts = a.title.toLowerCase().startsWith(lowerQuery);
    const bStarts = b.title.toLowerCase().startsWith(lowerQuery);
    if (aStarts && !bStarts) return -1;
    if (!aStarts && bStarts) return 1;
    
    // Prioritize topics over legacy components
    if (a.type === CONTENT_TYPES.TOPIC && b.type !== CONTENT_TYPES.TOPIC) return -1;
    if (a.type !== CONTENT_TYPES.TOPIC && b.type === CONTENT_TYPES.TOPIC) return 1;
    
    return a.title.localeCompare(b.title);
  }).slice(0, 20);
}

// =============================================================================
// SECTION OVERVIEW ARTICLES
// =============================================================================

/**
 * Create overview/landing page articles for top-level sections
 * This allows the "View all" button to navigate to a dedicated page
 * showing all items in a section
 */
function getSectionOverviewArticle(sectionKey) {
  const section = ENCYCLOPEDIA_SECTIONS[sectionKey];
  if (!section) return null;

  switch (sectionKey) {
    case 'automotive': {
      const systems = getSystemsOrdered();
      return createArticle({
        id: 'automotive',
        type: 'sectionOverview',
        title: section.title,
        subtitle: section.subtitle,
        icon: section.icon,
        color: '#1a4d6e',
        breadcrumb: ['Encyclopedia', section.title],
        summary: section.description,
        sections: [
          {
            title: 'All Systems',
            type: 'systemList',
            content: systems.map(system => ({
              id: `auto.${system.slug}`,
              name: system.name,
              description: system.description,
              color: system.color,
              componentCount: getComponentsForSystem(system.slug).length,
            })),
          },
        ],
        metadata: {
          sectionKey,
          itemCount: systems.length,
        },
        related: [],
      });
    }

    case 'modifications': {
      const categories = Object.values(activeCategories)
        .sort((a, b) => a.sortOrder - b.sortOrder);
      
      return createArticle({
        id: 'modifications',
        type: 'sectionOverview',
        title: section.title,
        subtitle: section.subtitle,
        icon: section.icon,
        color: '#D4AF37',
        breadcrumb: ['Encyclopedia', section.title],
        summary: section.description,
        sections: [
          {
            title: 'All Categories',
            type: 'modificationList',
            content: categories.map(category => {
              const categoryMods = getModificationsByCategory(category.key);
              const categoryUpgrades = categoryMods
                .map(modKey => upgradeDetails[modKey])
                .filter(Boolean);
              
              return {
                id: `category.${category.key}`,
                name: category.name,
                description: category.description,
                cost: `${categoryUpgrades.length} mods`,
              };
            }),
          },
        ],
        metadata: {
          sectionKey,
          itemCount: categories.length,
        },
        related: [],
      });
    }

    case 'guides': {
      const guides = Object.values(buildGoals).sort((a, b) => {
        const orderA = buildPaths[a.key]?.order || 999;
        const orderB = buildPaths[b.key]?.order || 999;
        return orderA - orderB;
      });

      return createArticle({
        id: 'guides',
        type: 'sectionOverview',
        title: section.title,
        subtitle: section.subtitle,
        icon: section.icon,
        color: '#059669',
        breadcrumb: ['Encyclopedia', section.title],
        summary: section.description,
        sections: [
          {
            title: 'All Build Guides',
            type: 'modificationList',
            content: guides.map(guide => ({
              id: `guide.${guide.key}`,
              name: guide.title,
              description: guide.subtitle || guide.description,
              difficulty: guide.difficulty,
            })),
          },
        ],
        metadata: {
          sectionKey,
          itemCount: guides.length,
        },
        related: [],
      });
    }

    default:
      return null;
  }
}

// =============================================================================
// GET ARTICLE BY ID
// =============================================================================

/**
 * Get any article by its ID
 * Now handles new hierarchy IDs (auto.*, topic.*)
 */
export function getArticleById(id) {
  if (!id) return null;
  
  // Handle top-level section overview pages
  if (id === 'automotive') {
    return getSectionOverviewArticle('automotive');
  }
  if (id === 'modifications') {
    return getSectionOverviewArticle('modifications');
  }
  if (id === 'guides') {
    return getSectionOverviewArticle('guides');
  }
  
  const parts = id.split('.');
  const type = parts[0];
  
  switch (type) {
    // New hierarchy
    case 'auto':
      if (parts.length === 2) {
        // auto.engine -> system article
        return getAutomotiveSystemArticle(parts[1]);
      } else if (parts.length === 3) {
        // auto.engine.cylinder-head -> component article
        return getAutomotiveComponentArticle(parts[1], parts[2]);
      }
      return null;
    
    case 'topic':
      // topic.bore -> topic article
      return getTopicArticle(parts[1]);
    
    // Legacy
    case 'system':
      return getSystemArticle(parts.slice(1).join('.'));
    
    case 'component':
      return getComponentArticle(parts.slice(1).join('.'));
    
    case 'category':
      // Support both new and legacy category keys
      const categoryKey = parts.slice(1).join('.');
      const category = modificationCategories[categoryKey] || upgradeCategories[categoryKey];
      if (!category) return null;
      return getModificationCategoryArticles().find(a => a.id === id) ||
             // Fallback for deprecated categories - return their replacement
             getModificationCategoryArticles().find(a => a.id === `category.${category.migratedTo || categoryKey}`);
    
    case 'mod':
      return getModificationArticle(parts.slice(1).join('.'));
    
    case 'guide':
      return getBuildGuideArticle(parts.slice(1).join('.'));
    
    default:
      return null;
  }
}

// =============================================================================
// STATS
// =============================================================================

/**
 * Get encyclopedia statistics
 * Returns stats for the 3-section structure (Automotive Systems, Modifications, Build Guides)
 * Technical Reference has been merged into Automotive Systems
 */
export function getEncyclopediaStats() {
  const hierarchyStats = getHierarchyStats();
  
  return {
    // Primary stats (3 sections)
    automotiveSystems: hierarchyStats.systems,
    automotiveComponents: hierarchyStats.components,
    topics: hierarchyStats.topics,
    topicsComplete: hierarchyStats.complete,
    topicsStub: hierarchyStats.stubs,
    topicCompletionRate: hierarchyStats.completionRate,
    modifications: Object.keys(upgradeDetails).length,
    // Updated category counts for new structure
    categories: activeCategoryKeys.length,
    totalCategories: Object.keys(modificationCategories).length,
    deprecatedCategories: Object.keys(modificationCategories).length - activeCategoryKeys.length,
    buildGuides: Object.keys(buildGoals).length,
    // Technical Reference merged stats (for reference)
    mergedTechnicalNodes: Object.keys(nodes).length,
    // Total content pieces
    totalSections: 3, // Automotive Systems, Modifications, Build Guides
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  // New hierarchy
  encyclopediaSystems,
  encyclopediaComponents,
  encyclopediaTopics,
  upgradeKeyToTopics,
  getSystemsOrdered,
  getComponentsForSystem,
  getTopicsForComponent,
  getTopicsForUpgrade,
  // Restructured modification categories
  modificationCategories,
  activeCategories,
  activeCategoryKeys,
  modificationCategoryReassignment,
  modificationTopicLinks,
  getLinkedTopics,
  getPrimaryLinkedTopic,
  isCategoryDeprecated,
  getModificationsByCategory,
  // Legacy (preserved for backward compatibility)
  systems,
  nodes,
  edges,
  upgradeCategories,
  upgradeDetails,
  buildGoals,
  buildPaths,
};

const encyclopediaData = {
  CONTENT_TYPES,
  ENCYCLOPEDIA_SECTIONS,
  getNavigationTree,
  getArticleById,
  searchEncyclopedia,
  getEncyclopediaStats,
  // New hierarchy
  getAutomotiveSystemArticles,
  getAutomotiveSystemArticle,
  getAutomotiveComponentArticle,
  getTopicArticle,
  // Legacy
  getSystemArticles,
  getSystemArticle,
  getComponentArticle,
  getModificationCategoryArticles,
  getModificationArticle,
  getBuildGuideArticles,
  getBuildGuideArticle,
};

export default encyclopediaData;
