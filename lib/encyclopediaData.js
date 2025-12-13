/**
 * AutoRev Encyclopedia - Unified Data Layer
 * 
 * This module provides a unified interface to all educational content:
 * - Vehicle Systems & Components (how cars work)
 * - Modifications & Upgrades (what you can do)
 * - Build Guides (goal-based learning paths)
 * 
 * All content is organized into a consistent structure for the Encyclopedia UI.
 */

import { systems, nodes, edges, relationshipTypes } from '@/data/connectedTissueMatrix';
import { upgradeCategories, upgradeDetails, getAllUpgradesGrouped } from '@/data/upgradeEducation';
import { buildGoals, buildPaths } from '@/lib/educationData';

// =============================================================================
// CONTENT TYPES
// =============================================================================

export const CONTENT_TYPES = {
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
  systems: {
    key: 'systems',
    title: 'How Cars Work',
    subtitle: 'Vehicle systems and components explained',
    icon: 'cog',
    description: 'Understand how your car works as an interconnected system. Every modification affects multiple components.',
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
};

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
// SYSTEM ARTICLES
// =============================================================================

/**
 * Get all system articles
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
 * Get a single system article by key
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
 * Get related systems based on edges
 */
function getRelatedSystems(systemKey) {
  const relatedSystemKeys = new Set();
  
  // Find edges that connect to nodes in this system
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
// COMPONENT ARTICLES
// =============================================================================

/**
 * Get a component article by key
 */
export function getComponentArticle(componentKey) {
  const node = nodes[componentKey];
  if (!node) return null;
  
  const system = systems[node.system];
  
  // Find related edges
  const relatedEdges = edges.filter(e => e.from === componentKey || e.to === componentKey);
  
  // Find mods that affect this component
  const affectingMods = Object.entries(upgradeDetails)
    .filter(([key, mod]) => {
      // Check if this mod affects this node (simplified check)
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
 */
export function getModificationCategoryArticles() {
  return Object.values(upgradeCategories).map(category => {
    const mods = Object.values(upgradeDetails).filter(m => m.category === category.key);
    
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
          })),
        },
      ],
      metadata: {
        modCount: mods.length,
      },
      related: [],
      rawData: category,
    });
  });
}

/**
 * Get a single modification article
 */
export function getModificationArticle(modKey) {
  const mod = upgradeDetails[modKey];
  if (!mod) return null;
  
  const category = upgradeCategories[mod.category];
  
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
    ].filter(Boolean),
    metadata: {
      category: mod.category,
      tier: mod.tier,
      cost: mod.cost,
      difficulty: mod.difficulty,
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
  
  // Add works well with mods
  if (mod.worksWellWith) {
    mod.worksWellWith.forEach(name => {
      // Try to find the mod by name
      const found = Object.entries(upgradeDetails).find(([key, m]) => 
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
  
  // Add same category mods
  const sameCategoryMods = Object.entries(upgradeDetails)
    .filter(([key, m]) => m.category === mod.category && m.key !== mod.key)
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
 */
export function getNavigationTree() {
  return [
    {
      key: 'systems',
      title: 'How Cars Work',
      icon: 'cog',
      children: Object.values(systems).map(system => {
        const systemNodes = Object.values(nodes).filter(n => n.system === system.key);
        return {
          key: `system.${system.key}`,
          title: system.name,
          icon: system.icon,
          color: system.color,
          count: systemNodes.length,
          children: systemNodes.map(node => ({
            key: `component.${node.key}`,
            title: node.name,
          })),
        };
      }),
    },
    {
      key: 'modifications',
      title: 'Modifications',
      icon: 'wrench',
      children: Object.values(upgradeCategories).map(category => {
        const mods = Object.values(upgradeDetails).filter(m => m.category === category.key);
        return {
          key: `category.${category.key}`,
          title: category.name,
          icon: category.icon,
          color: category.color,
          count: mods.length,
          children: mods.map(mod => ({
            key: `mod.${mod.key}`,
            title: mod.name,
          })),
        };
      }),
    },
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
  ];
}

// =============================================================================
// SEARCH
// =============================================================================

/**
 * Search across all encyclopedia content
 */
export function searchEncyclopedia(query) {
  if (!query || query.length < 2) return [];
  
  const results = [];
  const lowerQuery = query.toLowerCase();
  
  // Search systems
  Object.values(systems).forEach(system => {
    if (system.name.toLowerCase().includes(lowerQuery) ||
        system.description.toLowerCase().includes(lowerQuery)) {
      results.push({
        id: `system.${system.key}`,
        title: system.name,
        subtitle: system.description,
        type: CONTENT_TYPES.SYSTEM,
        section: 'How Cars Work',
        icon: system.icon,
        color: system.color,
      });
    }
  });
  
  // Search components
  Object.values(nodes).forEach(node => {
    if (node.name.toLowerCase().includes(lowerQuery) ||
        node.description.toLowerCase().includes(lowerQuery)) {
      const system = systems[node.system];
      results.push({
        id: `component.${node.key}`,
        title: node.name,
        subtitle: node.description,
        type: CONTENT_TYPES.COMPONENT,
        section: system?.name || 'Components',
        icon: system?.icon,
        color: system?.color,
      });
    }
  });
  
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
    
    return a.title.localeCompare(b.title);
  }).slice(0, 20);
}

// =============================================================================
// GET ARTICLE BY ID
// =============================================================================

/**
 * Get any article by its ID
 */
export function getArticleById(id) {
  if (!id) return null;
  
  const [type, ...keyParts] = id.split('.');
  const key = keyParts.join('.');
  
  switch (type) {
    case 'system':
      return getSystemArticle(key);
    case 'component':
      return getComponentArticle(key);
    case 'category':
      const category = upgradeCategories[key];
      if (!category) return null;
      return getModificationCategoryArticles().find(a => a.id === id);
    case 'mod':
      return getModificationArticle(key);
    case 'guide':
      return getBuildGuideArticle(key);
    default:
      return null;
  }
}

// =============================================================================
// STATS
// =============================================================================

/**
 * Get encyclopedia statistics
 */
export function getEncyclopediaStats() {
  return {
    systems: Object.keys(systems).length,
    components: Object.keys(nodes).length,
    modifications: Object.keys(upgradeDetails).length,
    categories: Object.keys(upgradeCategories).length,
    buildGuides: Object.keys(buildGoals).length,
    relationships: edges.length,
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  systems,
  nodes,
  edges,
  upgradeCategories,
  upgradeDetails,
  buildGoals,
  buildPaths,
};

export default {
  CONTENT_TYPES,
  ENCYCLOPEDIA_SECTIONS,
  getNavigationTree,
  getArticleById,
  searchEncyclopedia,
  getEncyclopediaStats,
  getSystemArticles,
  getSystemArticle,
  getComponentArticle,
  getModificationCategoryArticles,
  getModificationArticle,
  getBuildGuideArticles,
  getBuildGuideArticle,
};








