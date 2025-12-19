'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import styles from './page.module.css';
import {
  getNavigationTree,
  getArticleById,
  searchEncyclopedia,
  getEncyclopediaStats,
  CONTENT_TYPES,
  upgradeDetails,
} from '@/lib/encyclopediaData';

// =============================================================================
// ICONS
// =============================================================================

const Icons = {
  search: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  chevronRight: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
  chevronDown: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  ),
  book: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
  ),
  cog: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  wrench: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    </svg>
  ),
  map: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
      <line x1="8" y1="2" x2="8" y2="18"/>
      <line x1="16" y1="6" x2="16" y2="22"/>
    </svg>
  ),
  bolt: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  home: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  check: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  x: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  arrowRight: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/>
      <polyline points="12 5 19 12 12 19"/>
    </svg>
  ),
  dollar: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"/>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  ),
  clock: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  menu: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="12" x2="21" y2="12"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  ),
  close: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
};

const iconMap = {
  search: Icons.search,
  book: Icons.book,
  cog: Icons.cog,
  wrench: Icons.wrench,
  map: Icons.map,
  bolt: Icons.bolt,
  home: Icons.home,
  check: Icons.check,
  x: Icons.x,
};

// =============================================================================
// SEARCH BAR
// =============================================================================

function SearchBar({ onSearch, onSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (query.length >= 2) {
      const searchResults = searchEncyclopedia(query);
      setResults(searchResults);
      setIsOpen(true);
    } else {
      setResults([]);
      setIsOpen(false);
    }
  }, [query]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (result) => {
    onSelect(result.id);
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div className={styles.searchContainer} ref={containerRef}>
      <div className={styles.searchInputWrapper}>
        <Icons.search size={16} />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search encyclopedia..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={styles.searchInput}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
        />
        {query && (
          <button 
            className={styles.searchClear}
            onClick={() => { setQuery(''); setIsOpen(false); }}
          >
            <Icons.x size={14} />
          </button>
        )}
      </div>
      
      {isOpen && results.length > 0 && (
        <div className={styles.searchResults}>
          {results.map((result) => (
            <button
              key={result.id}
              className={styles.searchResult}
              onClick={() => handleSelect(result)}
            >
              <div 
                className={styles.searchResultIcon}
                style={{ backgroundColor: result.color || '#6b7280' }}
              >
                {result.type === CONTENT_TYPES.SYSTEM && <Icons.cog size={14} />}
                {result.type === CONTENT_TYPES.COMPONENT && <Icons.cog size={14} />}
                {result.type === CONTENT_TYPES.MODIFICATION && <Icons.wrench size={14} />}
                {result.type === CONTENT_TYPES.CATEGORY && <Icons.wrench size={14} />}
                {result.type === CONTENT_TYPES.BUILD_GUIDE && <Icons.map size={14} />}
              </div>
              <div className={styles.searchResultContent}>
                <span className={styles.searchResultTitle}>{result.title}</span>
                <span className={styles.searchResultSection}>{result.section}</span>
              </div>
            </button>
          ))}
        </div>
      )}
      
      {isOpen && query.length >= 2 && results.length === 0 && (
        <div className={styles.searchResults}>
          <div className={styles.searchNoResults}>No results found</div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// NAVIGATION TREE ITEM
// =============================================================================

function NavTreeItem({ item, level = 0, selectedId, onSelect, expandedKeys, onToggle }) {
  const hasChildren = item.children && item.children.length > 0;
  const isExpanded = expandedKeys.has(item.key);
  const isSelected = selectedId === item.key;

  const handleClick = () => {
    if (hasChildren) {
      onToggle(item.key);
    }
    // Always navigate when clicking
    onSelect(item.key);
  };

  return (
    <div className={styles.navTreeItem}>
      <button
        className={`${styles.navTreeButton} ${isSelected ? styles.navTreeButtonActive : ''}`}
        onClick={handleClick}
        style={{ paddingLeft: `${12 + level * 16}px` }}
      >
        {hasChildren && (
          <span className={styles.navTreeExpander}>
            {isExpanded ? <Icons.chevronDown size={14} /> : <Icons.chevronRight size={14} />}
          </span>
        )}
        {!hasChildren && level > 0 && <span className={styles.navTreeDot} />}
        {item.color && level <= 1 && (
          <span 
            className={styles.navTreeColorDot} 
            style={{ backgroundColor: item.color }}
          />
        )}
        <span className={styles.navTreeLabel}>{item.title}</span>
        {item.count !== undefined && (
          <span className={styles.navTreeCount}>{item.count}</span>
        )}
      </button>
      
      {hasChildren && isExpanded && (
        <div className={styles.navTreeChildren}>
          {item.children.map((child) => (
            <NavTreeItem
              key={child.key}
              item={child}
              level={level + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              expandedKeys={expandedKeys}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// SIDEBAR
// =============================================================================

function Sidebar({ selectedId, onSelect, isOpen, onClose }) {
  const navTree = useMemo(() => getNavigationTree(), []);
  const [expandedKeys, setExpandedKeys] = useState(new Set(['automotive', 'modifications', 'guides']));

  const handleToggle = (key) => {
    setExpandedKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  // Auto-expand parent when item is selected
  useEffect(() => {
    if (selectedId) {
      const parts = selectedId.split('.');
      if (parts.length > 1) {
        const type = parts[0];
        // Handle new automotive hierarchy (auto.system.component or topic.slug)
        if (type === 'auto' || type === 'topic') {
          setExpandedKeys(prev => new Set([...prev, 'automotive', `auto.${parts[1]}`]));
        // Handle legacy system/component routes (still supported for deep links)
        } else if (type === 'system' || type === 'component') {
          // Redirect to equivalent automotive section if possible
          setExpandedKeys(prev => new Set([...prev, 'automotive']));
        } else if (type === 'mod' || type === 'category') {
          const mod = upgradeDetails[parts.slice(1).join('.')];
          if (mod) {
            setExpandedKeys(prev => new Set([...prev, 'modifications', `category.${mod.category}`]));
          }
        } else if (type === 'guide') {
          setExpandedKeys(prev => new Set([...prev, 'guides']));
        }
      }
    }
  }, [selectedId]);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && <div className={styles.sidebarOverlay} onClick={onClose} />}
      
      <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarHeader}>
          <button className={styles.sidebarClose} onClick={onClose}>
            <Icons.close size={20} />
          </button>
          <SearchBar onSelect={(id) => { onSelect(id); onClose(); }} />
        </div>
        
        <nav className={styles.sidebarNav}>
          <div className={styles.navSection}>
            <button
              className={`${styles.navHomeButton} ${!selectedId ? styles.navHomeButtonActive : ''}`}
              onClick={() => { onSelect(null); onClose(); }}
            >
              <Icons.home size={16} />
              <span>Encyclopedia Home</span>
            </button>
          </div>
          
          <div className={styles.navTree}>
            {navTree.map((section) => (
              <NavTreeItem
                key={section.key}
                item={section}
                selectedId={selectedId}
                onSelect={(id) => { onSelect(id); onClose(); }}
                expandedKeys={expandedKeys}
                onToggle={handleToggle}
              />
            ))}
          </div>
        </nav>
      </aside>
    </>
  );
}

// =============================================================================
// BREADCRUMB
// =============================================================================

function Breadcrumb({ items, onNavigate }) {
  if (!items || items.length === 0) return null;

  return (
    <nav className={styles.breadcrumb}>
      <button 
        className={styles.breadcrumbItem}
        onClick={() => onNavigate(null)}
      >
        Encyclopedia
      </button>
      {items.slice(1).map((item, index) => (
        <React.Fragment key={index}>
          <span className={styles.breadcrumbSeparator}>/</span>
          <span className={styles.breadcrumbItem}>{item}</span>
        </React.Fragment>
      ))}
    </nav>
  );
}

// =============================================================================
// ARTICLE SECTIONS
// =============================================================================

function ArticleSection({ section, onNavigate }) {
  switch (section.type) {
    case 'text':
      return (
        <div className={styles.sectionText}>
          <p>{section.content}</p>
        </div>
      );

    case 'keyValue':
      return (
        <div className={styles.sectionKeyValue}>
          {section.content.map((item, index) => (
            <div key={index} className={styles.keyValueItem}>
              <span className={styles.keyValueLabel}>{item.label}</span>
              <span className={styles.keyValueValue}>{item.value}</span>
            </div>
          ))}
        </div>
      );

    case 'gains':
      return (
        <div className={styles.sectionGains}>
          {section.content.hp && (
            <div className={styles.gainItem}>
              <span className={styles.gainLabel}>Horsepower</span>
              <span className={styles.gainValue}>{section.content.hp}</span>
            </div>
          )}
          {section.content.torque && (
            <div className={styles.gainItem}>
              <span className={styles.gainLabel}>Torque</span>
              <span className={styles.gainValue}>{section.content.torque}</span>
            </div>
          )}
          {section.content.handling && (
            <div className={styles.gainItem}>
              <span className={styles.gainLabel}>Handling</span>
              <span className={styles.gainValue}>{section.content.handling}</span>
            </div>
          )}
          {section.content.note && (
            <p className={styles.gainNote}>{section.content.note}</p>
          )}
        </div>
      );

    case 'prosCons':
      return (
        <div className={styles.sectionProsCons}>
          {section.content.pros?.length > 0 && (
            <div className={styles.prosColumn}>
              <h4 className={styles.prosTitle}>
                <Icons.check size={16} /> Pros
              </h4>
              <ul>
                {section.content.pros.map((pro, i) => (
                  <li key={i}>{pro}</li>
                ))}
              </ul>
            </div>
          )}
          {section.content.cons?.length > 0 && (
            <div className={styles.consColumn}>
              <h4 className={styles.consTitle}>
                <Icons.x size={16} /> Cons
              </h4>
              <ul>
                {section.content.cons.map((con, i) => (
                  <li key={i}>{con}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );

    case 'tags':
      return (
        <div className={styles.sectionTags}>
          {section.content.map((tag, index) => (
            <span key={index} className={styles.tag}>{tag}</span>
          ))}
        </div>
      );

    case 'componentList':
      return (
        <div className={styles.sectionComponentList}>
          {section.content.map((component) => (
            <button
              key={component.id}
              className={styles.componentCard}
              onClick={() => onNavigate(component.id)}
            >
              <h4 className={styles.componentName}>{component.name}</h4>
              <p className={styles.componentDesc}>{component.description}</p>
              {component.unit && (
                <span className={styles.componentUnit}>Measured in: {component.unit}</span>
              )}
            </button>
          ))}
        </div>
      );

    // NEW: Automotive component list (for system pages)
    case 'automotiveComponentList':
      return (
        <div className={styles.sectionComponentList}>
          {section.content.map((component) => (
            <button
              key={component.id}
              className={styles.componentCard}
              onClick={() => onNavigate(component.id)}
            >
              <h4 className={styles.componentName}>{component.name}</h4>
              <p className={styles.componentDesc}>{component.description}</p>
              {component.topicCount > 0 && (
                <span className={styles.componentUnit}>{component.topicCount} topics</span>
              )}
            </button>
          ))}
        </div>
      );

    // NEW: Topic list (for component pages)
    case 'topicList':
      return (
        <div className={styles.sectionTopicList}>
          {section.content.map((topic) => (
            <button
              key={topic.id}
              className={`${styles.topicCard} ${topic.status === 'stub' ? styles.topicCardStub : ''}`}
              onClick={() => onNavigate(topic.id)}
            >
              <div className={styles.topicCardHeader}>
                <h4 className={styles.topicName}>{topic.name}</h4>
                {topic.status === 'stub' && (
                  <span className={styles.stubBadge}>Coming Soon</span>
                )}
              </div>
              <p className={styles.topicDefinition}>{topic.definition}</p>
            </button>
          ))}
        </div>
      );

    // NEW: Topic links (for modification pages)
    case 'topicLinks':
      return (
        <div className={styles.sectionTopicLinks}>
          {section.content.map((topic) => (
            <button
              key={topic.id}
              className={styles.topicLinkChip}
              onClick={() => onNavigate(topic.id)}
            >
              <Icons.book size={14} />
              <span>{topic.name}</span>
            </button>
          ))}
        </div>
      );

    // NEW: Upgrade links (for topic pages)
    case 'upgradeLinks':
      return (
        <div className={styles.sectionUpgradeLinks}>
          {section.content.map((upgrade) => (
            <button
              key={upgrade.key}
              className={styles.upgradeLinkChip}
              onClick={() => onNavigate(`mod.${upgrade.key}`)}
            >
              <Icons.wrench size={14} />
              <span>{upgrade.name}</span>
            </button>
          ))}
        </div>
      );

    case 'modificationList':
      return (
        <div className={styles.sectionModList}>
          {section.content.map((mod) => (
            <button
              key={mod.id}
              className={styles.modCard}
              onClick={() => onNavigate(mod.id)}
            >
              <div className={styles.modCardHeader}>
                <h4 className={styles.modCardName}>{mod.name}</h4>
                {mod.cost && <span className={styles.modCardCost}>{mod.cost}</span>}
              </div>
              <p className={styles.modCardDesc}>{mod.description}</p>
              {mod.difficulty && (
                <span className={styles.modCardDifficulty}>{mod.difficulty}</span>
              )}
            </button>
          ))}
        </div>
      );

    case 'relationships':
      return (
        <div className={styles.sectionRelationships}>
          {section.content.map((rel, index) => (
            <div key={index} className={styles.relationshipItem}>
              <span className={`${styles.relationType} ${styles[`rel${rel.type}`]}`}>
                {rel.type}
              </span>
              <span className={styles.relationshipNode}>{rel.node}</span>
              {rel.description && (
                <p className={styles.relationshipDesc}>{rel.description}</p>
              )}
            </div>
          ))}
        </div>
      );

    case 'buildStages':
      return (
        <div className={styles.sectionBuildStages}>
          {section.content.map((stage, index) => (
            <div key={index} className={styles.buildStage}>
              <div className={styles.stageHeader}>
                <span className={styles.stageNumber}>{stage.stage}</span>
                <div className={styles.stageInfo}>
                  <h4 className={styles.stageName}>{stage.name}</h4>
                  <p className={styles.stageDesc}>{stage.description}</p>
                </div>
                <div className={styles.stageMeta}>
                  <span className={styles.stageBudget}>{stage.budget}</span>
                  <span className={styles.stageGains}>{stage.expectedGains}</span>
                </div>
              </div>
              
              {stage.upgrades && (
                <div className={styles.stageUpgrades}>
                  {stage.upgrades.map((upgradeKey) => {
                    const upgrade = upgradeDetails[upgradeKey];
                    if (!upgrade) return null;
                    return (
                      <button
                        key={upgradeKey}
                        className={styles.stageUpgradeChip}
                        onClick={() => onNavigate(`mod.${upgradeKey}`)}
                      >
                        {upgrade.name}
                        {upgradeKey === stage.primaryUpgrade && (
                          <span className={styles.primaryBadge}>Key</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
              
              {stage.considerations && stage.considerations.length > 0 && (
                <ul className={styles.stageConsiderations}>
                  {stage.considerations.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      );

    // NEW: Modification potential section with structured content
    case 'modPotential':
      return (
        <div className={styles.sectionModPotential}>
          {section.content.summary && (
            <p className={styles.modPotentialSummary}>{section.content.summary}</p>
          )}
          {section.content.gains && (
            <div className={styles.modPotentialItem}>
              <span className={styles.modPotentialLabel}>What You Gain:</span>
              <p>{section.content.gains}</p>
            </div>
          )}
          {section.content.considerations && (
            <div className={styles.modPotentialItem}>
              <span className={styles.modPotentialLabel}>Considerations:</span>
              <p>{section.content.considerations}</p>
            </div>
          )}
        </div>
      );

    // NEW: Technical specifications merged from Technical Reference
    case 'technicalSpecs':
      return (
        <div className={styles.sectionTechnicalSpecs}>
          {section.content.specifications.map((spec, index) => (
            <div key={index} className={styles.technicalSpecItem}>
              <div className={styles.technicalSpecHeader}>
                <h4 className={styles.technicalSpecName}>{spec.name}</h4>
                {spec.unit && (
                  <span className={styles.technicalSpecUnit}>({spec.unit})</span>
                )}
              </div>
              <p className={styles.technicalSpecDesc}>{spec.description}</p>
              {spec.applicableEngines && (
                <span className={styles.technicalSpecEngines}>
                  Applies to: {spec.applicableEngines.join(', ')}
                </span>
              )}
            </div>
          ))}
        </div>
      );

    default:
      return null;
  }
}

// =============================================================================
// ARTICLE VIEW
// =============================================================================

function ArticleView({ article, onNavigate }) {
  if (!article) return null;

  // Determine icon based on content type
  const renderIcon = () => {
    switch (article.type) {
      case CONTENT_TYPES.AUTOMOTIVE_SYSTEM:
      case CONTENT_TYPES.AUTOMOTIVE_COMPONENT:
      case CONTENT_TYPES.SYSTEM:
      case CONTENT_TYPES.COMPONENT:
        return <Icons.cog size={24} />;
      case CONTENT_TYPES.TOPIC:
        return <Icons.book size={24} />;
      case CONTENT_TYPES.MODIFICATION:
      case CONTENT_TYPES.CATEGORY:
        return <Icons.wrench size={24} />;
      case CONTENT_TYPES.BUILD_GUIDE:
        return <Icons.map size={24} />;
      default:
        return <Icons.book size={24} />;
    }
  };

  // Show summary for topics and modifications
  const showSummary = article.type === CONTENT_TYPES.MODIFICATION || 
                      article.type === CONTENT_TYPES.TOPIC;

  return (
    <article className={styles.article}>
      <Breadcrumb items={article.breadcrumb} onNavigate={onNavigate} />
      
      <header className={styles.articleHeader}>
        <div 
          className={styles.articleIcon}
          style={{ backgroundColor: article.color || '#6b7280' }}
        >
          {renderIcon()}
        </div>
        <div className={styles.articleHeaderContent}>
          <h1 className={styles.articleTitle}>{article.title}</h1>
          {article.subtitle && (
            <p className={styles.articleSubtitle}>{article.subtitle}</p>
          )}
          {article.metadata?.status === 'stub' && (
            <span className={styles.articleStubBadge}>Content Coming Soon</span>
          )}
        </div>
      </header>

      {article.summary && showSummary && (
        <div className={styles.articleSummary}>
          <p>{article.summary}</p>
        </div>
      )}

      <div className={styles.articleBody}>
        {article.sections.map((section, index) => (
          <section key={index} className={styles.articleSection}>
            {section.title && (
              <h2 className={styles.sectionTitle}>{section.title}</h2>
            )}
            <ArticleSection section={section} onNavigate={onNavigate} />
          </section>
        ))}
      </div>

      {article.related && article.related.length > 0 && (
        <aside className={styles.articleRelated}>
          <h3 className={styles.relatedTitle}>Related Articles</h3>
          <div className={styles.relatedGrid}>
            {article.related.map((item) => (
              <button
                key={item.id}
                className={styles.relatedCard}
                onClick={() => onNavigate(item.id)}
              >
                <span className={styles.relatedCardTitle}>{item.title}</span>
                <Icons.arrowRight size={14} />
              </button>
            ))}
          </div>
        </aside>
      )}
    </article>
  );
}

// =============================================================================
// HOME VIEW
// =============================================================================

function HomeView({ onNavigate }) {
  const navTree = useMemo(() => getNavigationTree(), []);

  return (
    <div className={styles.homeView}>
      <div className={styles.homeSections}>
        {navTree.map((section) => (
          <div key={section.key} className={styles.homeSection}>
            <div className={styles.homeSectionHeader}>
              {section.key === 'automotive' && <Icons.cog size={20} />}
              {section.key === 'modifications' && <Icons.wrench size={20} />}
              {section.key === 'guides' && <Icons.map size={20} />}
              <h2 className={styles.homeSectionTitle}>{section.title}</h2>
            </div>
            <div className={styles.homeSectionGrid}>
              {section.children.slice(0, 8).map((item) => (
                <button
                  key={item.key}
                  className={styles.homeSectionCard}
                  onClick={() => onNavigate(item.key)}
                >
                  {item.color && (
                    <span 
                      className={styles.homeSectionCardDot}
                      style={{ backgroundColor: item.color }}
                    />
                  )}
                  <span className={styles.homeSectionCardTitle}>{item.title}</span>
                  {item.count !== undefined && (
                    <span className={styles.homeSectionCardCount}>{item.count}</span>
                  )}
                </button>
              ))}
              {section.children.length > 8 && (
                <button
                  className={styles.homeSectionCardMore}
                  onClick={() => onNavigate(section.key)}
                >
                  View all {section.children.length} →
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// MAIN PAGE
// =============================================================================

// =============================================================================
// PAGE BANNER - With scroll-collapse for mobile
// =============================================================================

function PageBanner({ isCollapsed }) {
  const stats = useMemo(() => getEncyclopediaStats(), []);

  return (
    <div className={`${styles.pageBanner} ${isCollapsed ? styles.pageBannerCollapsed : ''}`}>
      <div className={styles.bannerContent}>
        <div className={styles.bannerText}>
          <h1 className={styles.bannerTitle}>Automotive Encyclopedia</h1>
          <p className={styles.bannerSubtitle}>
            Master every system, component, and modification—from how your engine breathes to which upgrades actually matter.
          </p>
        </div>
        <div className={styles.bannerStats}>
          <div className={styles.bannerStat}>
            <span className={styles.bannerStatNumber}>{stats.automotiveSystems}</span>
            <span className={styles.bannerStatLabel}>Systems</span>
          </div>
          <div className={styles.bannerStatDivider} />
          <div className={styles.bannerStat}>
            <span className={styles.bannerStatNumber}>{stats.topics}</span>
            <span className={styles.bannerStatLabel}>Topics</span>
          </div>
          <div className={styles.bannerStatDivider} />
          <div className={styles.bannerStat}>
            <span className={styles.bannerStatNumber}>{stats.modifications}</span>
            <span className={styles.bannerStatLabel}>Mods</span>
          </div>
          <div className={styles.bannerStatDivider} />
          <div className={styles.bannerStat}>
            <span className={styles.bannerStatNumber}>{stats.buildGuides}</span>
            <span className={styles.bannerStatLabel}>Guides</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// QUICK NAV TABS - Mobile horizontal scroll navigation
// =============================================================================

function QuickNavTabs({ selectedId, onNavigate }) {
  const quickLinks = useMemo(() => [
    { key: null, label: 'Home', icon: 'home' },
    { key: 'auto.engine', label: 'Engine', icon: 'cog' },
    { key: 'auto.suspension', label: 'Suspension', icon: 'cog' },
    { key: 'auto.brakes', label: 'Brakes', icon: 'cog' },
    { key: 'modifications', label: 'Mods', icon: 'wrench' },
    { key: 'guides', label: 'Guides', icon: 'map' },
  ], []);

  const getActiveKey = () => {
    if (!selectedId) return null;
    // Match based on prefix
    for (const link of quickLinks) {
      if (link.key && selectedId.startsWith(link.key)) {
        return link.key;
      }
    }
    return null;
  };

  const activeKey = getActiveKey();

  return (
    <div className={styles.quickNavTabs}>
      {quickLinks.map((link) => (
        <button
          key={link.key || 'home'}
          className={`${styles.quickNavTab} ${activeKey === link.key ? styles.quickNavTabActive : ''}`}
          onClick={() => onNavigate(link.key)}
        >
          {link.icon === 'home' && <Icons.home size={14} />}
          {link.icon === 'cog' && <Icons.cog size={14} />}
          {link.icon === 'wrench' && <Icons.wrench size={14} />}
          {link.icon === 'map' && <Icons.map size={14} />}
          <span>{link.label}</span>
        </button>
      ))}
    </div>
  );
}

// =============================================================================
// MAIN PAGE
// =============================================================================

function EncyclopediaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedId, setSelectedId] = useState(null);
  const [article, setArticle] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bannerCollapsed, setBannerCollapsed] = useState(false);

  // Read topic from URL on mount
  useEffect(() => {
    const topic = searchParams.get('topic');
    if (topic) {
      setSelectedId(topic);
    }
  }, [searchParams]);

  // Load article when selection changes
  useEffect(() => {
    if (selectedId) {
      const loadedArticle = getArticleById(selectedId);
      setArticle(loadedArticle);
    } else {
      setArticle(null);
    }
  }, [selectedId]);

  // Scroll-based banner collapse (mobile only)
  useEffect(() => {
    let lastScrollY = 0;
    const handleScroll = () => {
      const scrollY = window.scrollY;
      // Collapse after scrolling 50px
      if (scrollY > 50 && !bannerCollapsed) {
        setBannerCollapsed(true);
      } else if (scrollY <= 20 && bannerCollapsed) {
        setBannerCollapsed(false);
      }
      lastScrollY = scrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [bannerCollapsed]);

  const handleNavigate = useCallback((id) => {
    setSelectedId(id);
    // Update URL without full navigation
    if (id) {
      window.history.pushState({}, '', `/encyclopedia?topic=${id}`);
    } else {
      window.history.pushState({}, '', '/encyclopedia');
    }
    // Scroll to top on navigation
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Handle search trigger - opens sidebar with search focused
  const handleSearchTrigger = () => {
    setSidebarOpen(true);
    // Focus search input after sidebar opens
    setTimeout(() => {
      const searchInput = document.querySelector(`.${styles.searchInput}`);
      if (searchInput) searchInput.focus();
    }, 100);
  };

  return (
    <div className={styles.page}>
      {/* Page Banner */}
      <PageBanner isCollapsed={bannerCollapsed} />

      {/* Mobile header */}
      <header className={styles.mobileHeader}>
        <button 
          className={styles.menuButton}
          onClick={() => setSidebarOpen(true)}
          aria-label="Open navigation menu"
        >
          <Icons.menu size={22} />
        </button>
        <span className={styles.mobileTitle}>Encyclopedia</span>
        <button 
          className={styles.mobileSearchTrigger}
          onClick={handleSearchTrigger}
          aria-label="Search encyclopedia"
        >
          <Icons.search size={18} />
        </button>
      </header>

      {/* Quick Navigation Tabs - Mobile only */}
      <QuickNavTabs selectedId={selectedId} onNavigate={handleNavigate} />

      <div className={styles.layout}>
        <Sidebar
          selectedId={selectedId}
          onSelect={handleNavigate}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        
        <main className={styles.main}>
          {article ? (
            <ArticleView article={article} onNavigate={handleNavigate} />
          ) : (
            <HomeView onNavigate={handleNavigate} />
          )}
        </main>
      </div>
    </div>
  );
}

export default function EncyclopediaPage() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>}>
      <EncyclopediaContent />
    </Suspense>
  );
}
