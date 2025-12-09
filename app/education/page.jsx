'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import Button from '@/components/Button';
import UpgradeGuide from '@/components/UpgradeGuide';
import styles from './page.module.css';
import { systems, nodes, edges } from '@/data/connectedTissueMatrix';

// Blob URL for hero image
const BLOB_BASE = 'https://abqnp7qrs0nhv5pw.public.blob.vercel-storage.com';
const heroImageUrl = `${BLOB_BASE}/pages/performance/hero.webp`;

// Icons
const Icons = {
  arrowRight: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/>
      <polyline points="12 5 19 12 12 19"/>
    </svg>
  ),
  info: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="16" x2="12" y2="12"/>
      <line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
  ),
  bolt: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  link: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    </svg>
  ),
  alert: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  check: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  book: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
  ),
  grid: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/>
      <rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/>
      <rect x="3" y="14" width="7" height="7"/>
    </svg>
  ),
  flow: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5" cy="6" r="3"/>
      <path d="M5 9v6"/>
      <circle cx="5" cy="18" r="3"/>
      <path d="M19 6h-8.5a2.5 2.5 0 0 0 0 5H15a2.5 2.5 0 0 1 0 5H5"/>
    </svg>
  ),
  chevronDown: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  ),
  chevronRight: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
};

// Get system objects as array
const systemsList = Object.values(systems);

// Component Tooltip - Shows description on hover/tap
function ComponentTooltip({ node, children }) {
  const [isVisible, setIsVisible] = useState(false);
  
  return (
    <div 
      className={styles.tooltipWrapper}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onClick={() => setIsVisible(!isVisible)}
    >
      {children}
      {isVisible && node.description && (
        <div className={styles.tooltip}>
          <strong>{node.name}</strong>
          <p>{node.description}</p>
          {node.unit && node.unit !== 'state' && node.unit !== 'type' && node.unit !== 'rating' && (
            <span className={styles.tooltipUnit}>Measured in: {node.unit}</span>
          )}
        </div>
      )}
    </div>
  );
}

// System Card Component - Educational-first design
function SystemCard({ system }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('components');
  
  const systemNodes = Object.values(nodes).filter(n => n.system === system.key);
  const relatedEdges = edges.filter(e => 
    e.from.startsWith(system.key + '.') || e.to.startsWith(system.key + '.')
  );
  
  return (
    <div 
      className={`${styles.systemCard} ${isExpanded ? styles.expanded : ''}`}
      style={{ '--system-color': system.color }}
    >
      <button 
        className={styles.systemCardHeader}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className={styles.systemCardIcon}>
          <Icons.bolt size={20} />
        </div>
        <h3>{system.name}</h3>
        <span className={styles.expandIcon}>
          {isExpanded ? <Icons.chevronDown size={16} /> : <Icons.chevronRight size={16} />}
        </span>
      </button>
      
      <p className={styles.systemCardDesc}>{system.description}</p>
      
      <div className={styles.systemCardStats}>
        <span>{systemNodes.length} components</span>
        <span>{relatedEdges.length} connections</span>
      </div>
      
      {/* Component tags with tooltips - always show first 4 */}
      <div className={styles.systemCardNodes}>
        {systemNodes.slice(0, isExpanded ? undefined : 4).map(node => (
          <ComponentTooltip key={node.key} node={node}>
            <span className={styles.nodeTag} title={node.description}>
              {node.name}
            </span>
          </ComponentTooltip>
        ))}
        {!isExpanded && systemNodes.length > 4 && (
          <span className={styles.nodeMore}>+{systemNodes.length - 4} more</span>
        )}
      </div>
      
      {/* Expanded content: Educational tabs */}
      {isExpanded && (
        <div className={styles.systemCardExpanded}>
          {/* Tab Navigation */}
          <div className={styles.expandedTabs}>
            <button 
              className={`${styles.expandedTab} ${activeTab === 'components' ? styles.activeTab : ''}`}
              onClick={(e) => { e.stopPropagation(); setActiveTab('components'); }}
            >
              <Icons.info size={14} />
              What&apos;s Inside
            </button>
            <button 
              className={`${styles.expandedTab} ${activeTab === 'connections' ? styles.activeTab : ''}`}
              onClick={(e) => { e.stopPropagation(); setActiveTab('connections'); }}
            >
              <Icons.link size={14} />
              Connections
            </button>
          </div>
          
          {/* Components Tab - Educational explanations */}
          {activeTab === 'components' && (
            <div className={styles.expandedSection}>
              <p className={styles.sectionHint}>
                <Icons.info size={14} />
                Click any component above to learn more
              </p>
              <div className={styles.componentsList}>
                {systemNodes.map(node => (
                  <div key={node.key} className={styles.componentItem}>
                    <div className={styles.componentHeader}>
                      <span className={styles.componentName}>{node.name}</span>
                      {node.unit && node.unit !== 'state' && node.unit !== 'type' && node.unit !== 'rating' && (
                        <span className={styles.componentUnit}>{node.unit}</span>
                      )}
                    </div>
                    <p className={styles.componentDesc}>{node.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Connections Tab */}
          {activeTab === 'connections' && (
            <div className={styles.expandedSection}>
              <p className={styles.sectionHint}>
                <Icons.link size={14} />
                How this system connects to others
              </p>
              <div className={styles.connectionsList}>
                {relatedEdges.slice(0, 8).map((edge, idx) => {
                  const relType = relationshipTypes[edge.type];
                  const fromNode = nodes[edge.from];
                  const toNode = nodes[edge.to];
                  const isOutgoing = edge.from.startsWith(system.key + '.');
                  
                  return (
                    <div key={idx} className={styles.connectionItem} data-type={edge.type}>
                      <span className={styles.connectionType}>{relType?.name || edge.type}</span>
                      <span className={styles.connectionPath}>
                        {isOutgoing ? (
                          <>{fromNode?.name} → {toNode?.name}</>
                        ) : (
                          <>{toNode?.name} ← {fromNode?.name}</>
                        )}
                      </span>
                    </div>
                  );
                })}
                {relatedEdges.length > 8 && (
                  <span className={styles.connectionMore}>+{relatedEdges.length - 8} more connections</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Main Education Page Content
function EducationContent() {
  const [activeSection, setActiveSection] = useState('concepts');
  
  const conceptsRef = useRef(null);
  const systemsRef = useRef(null);
  const encyclopediaRef = useRef(null);
  
  const scrollToSection = (section) => {
    setActiveSection(section);
    let ref;
    switch (section) {
      case 'concepts':
        ref = conceptsRef;
        break;
      case 'systems':
        ref = systemsRef;
        break;
      case 'encyclopedia':
        ref = encyclopediaRef;
        break;
      default:
        ref = conceptsRef;
    }
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  
  return (
    <div className={styles.page}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroImageWrapper}>
          <Image
            src={heroImageUrl}
            alt="Understanding car modifications and performance upgrades"
            fill
            priority
            quality={85}
            className={styles.heroImage}
            sizes="100vw"
          />
        </div>
        <div className={styles.heroOverlay} />
        <div className={styles.container}>
          <div className={styles.heroContent}>
            <span className={styles.badge}>Education Center</span>
            <h1 className={styles.title}>
              Build Your Skills,<br />
              <span className={styles.titleAccent}>Not Just Your Ego</span>
            </h1>
            <p className={styles.subtitle}>
              Real mastery comes from understanding how your car works as a system. 
              Learn what each modification actually does, how upgrades affect connected 
              components, and why the best builds are planned—not impulse buys.
            </p>
            
            {/* Section Navigation */}
            <div className={styles.heroNav}>
              <button
                className={`${styles.heroNavBtn} ${activeSection === 'concepts' ? styles.active : ''}`}
                onClick={() => scrollToSection('concepts')}
              >
                <Icons.info size={18} />
                Key Concepts
              </button>
              <button
                className={`${styles.heroNavBtn} ${activeSection === 'systems' ? styles.active : ''}`}
                onClick={() => scrollToSection('systems')}
              >
                <Icons.grid size={18} />
                Vehicle Systems
              </button>
              <button
                className={`${styles.heroNavBtn} ${activeSection === 'encyclopedia' ? styles.active : ''}`}
                onClick={() => scrollToSection('encyclopedia')}
              >
                <Icons.book size={18} />
                Upgrade Encyclopedia
              </button>
            </div>
          </div>
        </div>
      </section>
      
      {/* ================================================================
          SECTION 1: KEY CONCEPTS - General Introduction (Progressive Disclosure Level 1)
          ================================================================ */}
      <section ref={conceptsRef} id="concepts" className={styles.conceptsSection}>
        <div className={styles.container}>
          <div className={styles.conceptsHeader}>
            <span className={styles.sectionBadge}>Start Here</span>
            <h2 className={styles.sectionTitleLight}>Understanding Upgrade Relationships</h2>
            <p className={styles.conceptsSubtitle}>
              Before diving into specific mods, understand these four fundamental concepts 
              that govern how modifications interact with each other and your car.
            </p>
          </div>
          
          <div className={styles.conceptsGrid}>
            <div className={styles.conceptCard} style={{ '--concept-color': '#c0392b' }}>
              <div className={styles.conceptIcon} style={{ backgroundColor: '#c0392b' }}>
                <Icons.link size={28} />
              </div>
              <h3>Hard Requirements</h3>
              <p>
                Some upgrades <strong>require</strong> others to function. A Stage 2+ tune 
                needs a downpipe. A supercharger needs upgraded fuel delivery. Skip the 
                requirements and you risk damage or poor results.
              </p>
            </div>
            
            <div className={styles.conceptCard} style={{ '--concept-color': '#f39c12' }}>
              <div className={styles.conceptIcon} style={{ backgroundColor: '#f39c12' }}>
                <Icons.alert size={28} />
              </div>
              <h3>Stress Points</h3>
              <p>
                Power upgrades <strong>stress</strong> downstream components. Add 200 HP 
                and your stock clutch may slip. Sticky tires let you brake harder, which 
                can boil brake fluid. Plan ahead.
              </p>
            </div>
            
            <div className={styles.conceptCard} style={{ '--concept-color': '#1abc9c' }}>
              <div className={styles.conceptIcon} style={{ backgroundColor: '#1abc9c' }}>
                <Icons.check size={28} />
              </div>
              <h3>Smart Pairings</h3>
              <p>
                Some upgrades <strong>work best together</strong>. Coilovers + sway bars + 
                alignment is the classic handling combo. Track tires + track pads + 
                high-temp fluid is the complete brake package.
              </p>
            </div>
            
            <div className={styles.conceptCard} style={{ '--concept-color': '#9b59b6' }}>
              <div className={styles.conceptIcon} style={{ backgroundColor: '#9b59b6' }}>
                <Icons.info size={28} />
              </div>
              <h3>Recalibration Needed</h3>
              <p>
                Mods can <strong>invalidate</strong> existing settings. Lower your car and 
                alignment is wrong. Change wheel size and speedometer reads off. Budget 
                for the follow-up work.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* ================================================================
          SECTION 2: VEHICLE SYSTEMS - Foundational Knowledge (Level 2)
          ================================================================ */}
      <section ref={systemsRef} id="systems" className={styles.systemsSection}>
        <div className={styles.container}>
          <div className={styles.systemsIntro}>
            <span className={styles.sectionBadge}>The Foundation</span>
            <h2 className={styles.sectionTitle}>Vehicle Systems Overview</h2>
            <p className={styles.sectionSubtitle}>
              Your car isn&apos;t a collection of independent parts—it&apos;s a complex 
              system where everything affects everything else. Click any system to explore 
              its components and connections.
            </p>
          </div>
          
          <div className={styles.systemsStats}>
            <div className={styles.systemStatCard}>
              <span className={styles.systemStatNumber}>{systemsList.length}</span>
              <span className={styles.systemStatLabel}>Vehicle Systems</span>
            </div>
            <div className={styles.systemStatCard}>
              <span className={styles.systemStatNumber}>{Object.keys(nodes).length}</span>
              <span className={styles.systemStatLabel}>Components Tracked</span>
            </div>
            <div className={styles.systemStatCard}>
              <span className={styles.systemStatNumber}>{edges.length}+</span>
              <span className={styles.systemStatLabel}>Relationships Mapped</span>
            </div>
          </div>
          
          <div className={styles.systemsGrid}>
            {systemsList.map(system => (
              <SystemCard key={system.key} system={system} />
            ))}
          </div>
        </div>
      </section>
      
      {/* ================================================================
          SECTION 3: UPGRADE ENCYCLOPEDIA - Detailed Mod Information (Level 3)
          ================================================================ */}
      <section ref={encyclopediaRef} id="encyclopedia" className={styles.encyclopediaSection}>
        <div className={styles.container}>
          <UpgradeGuide />
        </div>
      </section>
      
      {/* CTA Section - Drive to Performance HUB */}
      <section className={styles.ctaSection}>
        <div className={styles.container}>
          <div className={styles.ctaCard}>
            <div className={styles.ctaContent}>
              <h2>Ready to Build Your Car?</h2>
              <p>
                Head to the Performance HUB to select your specific car and start planning 
                upgrades. Our <strong>Build Planner</strong> validates your selections in 
                real-time, showing dependencies, conflicts, and recommendations tailored to 
                your exact vehicle.
              </p>
              <div className={styles.ctaFeatures}>
                <div className={styles.ctaFeature}>
                  <Icons.check size={18} />
                  <span>Real-time build validation</span>
                </div>
                <div className={styles.ctaFeature}>
                  <Icons.alert size={18} />
                  <span>Conflict &amp; dependency warnings</span>
                </div>
                <div className={styles.ctaFeature}>
                  <Icons.bolt size={18} />
                  <span>Car-specific recommendations</span>
                </div>
              </div>
              <div className={styles.ctaButtons}>
                <Button href="/performance" variant="primary" size="lg">
                  <Icons.arrowRight size={18} />
                  Go to Performance HUB
                </Button>
                <Button href="/car-selector" variant="outlineLight" size="lg">
                  Find Your Car First
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// Main export
export default function EducationPage() {
  return <EducationContent />;
}
