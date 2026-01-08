/**
 * Individual Community Build Page
 * 
 * Shows a single shared build with hero image, performance comparison,
 * detailed mods/parts list, image gallery, and social sharing.
 */

import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { fetchCommunityPostBySlug, getPostShareUrl } from '@/lib/communityService';
import { supabase } from '@/lib/supabase';
import ShareButtons from './ShareButtons';
import BuildModsList from './BuildModsList';
import ImageGallery from './ImageGallery';
import ViewTracker from './ViewTracker';
import OwnerActions from './OwnerActions';
import PerformanceComparison from './PerformanceComparison';
import ExperienceScores from './ExperienceScores';
import styles from './page.module.css';

// Fetch full car data for performance comparison and experience scores
async function getCarData(carSlug) {
  if (!carSlug || !supabase) return null;
  
  try {
    const { data, error } = await supabase
      .from('cars')
      .select('*')
      .eq('slug', carSlug)
      .single();
    
    if (error || !data) return null;
    
    return data;
  } catch (err) {
    console.error('Error fetching car data:', err);
    return null;
  }
}

/**
 * Generate comprehensive SEO metadata for public build pages.
 * This runs automatically for every build page and ensures proper SEO.
 */
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const { data: post } = await fetchCommunityPostBySlug(slug);
  
  if (!post) {
    return { 
      title: 'Build Not Found | AutoRev',
      robots: { index: false, follow: false },
    };
  }

  const primaryImage = post.images?.find(img => img.is_primary) || post.images?.[0];
  const ogImageUrl = primaryImage?.blob_url || post.carImageUrl;
  const canonicalUrl = `https://autorev.app/community/builds/${slug}`;
  
  // Build a rich, SEO-optimized description
  const buildDescription = generateSEODescription(post);
  
  // Generate relevant keywords based on build content
  const keywords = generateBuildKeywords(post);
  
  // Author name for article metadata
  const authorName = post.author?.display_name || 'AutoRev Community';
  
  return {
    title: `${post.title} | ${post.car_name || 'Build'} | AutoRev Community`,
    description: buildDescription,
    keywords: keywords,
    authors: [{ name: authorName }],
    creator: authorName,
    publisher: 'AutoRev',
    
    // Canonical URL prevents duplicate content issues
    alternates: {
      canonical: canonicalUrl,
    },
    
    // Ensure public builds are indexable
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    
    // Open Graph for social sharing (Facebook, LinkedIn, etc.)
    openGraph: {
      title: post.title,
      description: buildDescription,
      type: 'article',
      url: canonicalUrl,
      siteName: 'AutoRev',
      locale: 'en_US',
      images: ogImageUrl ? [{
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: `${post.title} - ${post.car_name || 'Custom Build'}`,
      }] : [],
      // Article-specific metadata for rich snippets
      article: {
        publishedTime: post.published_at,
        modifiedTime: post.updated_at || post.published_at,
        authors: [authorName],
        section: 'Community Builds',
        tags: keywords.slice(0, 10), // First 10 keywords as tags
      },
    },
    
    // Twitter Card for Twitter/X sharing
    twitter: {
      card: 'summary_large_image',
      site: '@autorev',
      creator: '@autorev',
      title: post.title,
      description: buildDescription,
      images: ogImageUrl ? [{
        url: ogImageUrl,
        alt: `${post.title} - ${post.car_name || 'Custom Build'}`,
      }] : [],
    },
    
    // Additional metadata for rich results
    category: 'automotive',
    other: {
      'article:section': 'Community Builds',
      'og:price:amount': post.buildData?.total_cost_low || '',
      'og:price:currency': 'USD',
    },
  };
}

/**
 * Generate an SEO-optimized description for the build.
 * Includes car name, HP gains, mod count, and cost when available.
 */
function generateSEODescription(post) {
  const parts = [];
  
  // Start with custom description if available
  if (post.description && post.description.length > 20) {
    // Use first 120 chars of description
    const truncated = post.description.slice(0, 120).trim();
    parts.push(truncated + (post.description.length > 120 ? '...' : ''));
  } else if (post.car_name) {
    parts.push(`Check out this ${post.car_name} build`);
  }
  
  // Add performance highlights
  const highlights = [];
  if (post.buildData?.final_hp) {
    highlights.push(`${post.buildData.final_hp} HP`);
  }
  if (post.buildData?.total_hp_gain > 0) {
    highlights.push(`+${post.buildData.total_hp_gain} HP gain`);
  }
  
  // Count total mods
  const partsCount = post.parts?.length || 0;
  const buildUpgradesCount = post.buildData?.selected_upgrades 
    ? (Array.isArray(post.buildData.selected_upgrades) 
        ? post.buildData.selected_upgrades.length 
        : post.buildData.selected_upgrades?.upgrades?.length || 0)
    : 0;
  const totalMods = partsCount + buildUpgradesCount;
  if (totalMods > 0) {
    highlights.push(`${totalMods} mods`);
  }
  
  // Add cost estimate
  if (post.buildData?.total_cost_low && post.buildData?.total_cost_high) {
    highlights.push(`$${post.buildData.total_cost_low.toLocaleString()}-$${post.buildData.total_cost_high.toLocaleString()}`);
  } else if (post.buildData?.total_cost_low || post.buildData?.total_cost_high) {
    const cost = post.buildData.total_cost_low || post.buildData.total_cost_high;
    highlights.push(`$${cost.toLocaleString()}`);
  }
  
  if (highlights.length > 0) {
    parts.push(highlights.join(' • '));
  }
  
  // Add call to action
  parts.push('Shared on AutoRev Community.');
  
  return parts.join(' ');
}

/**
 * Generate relevant keywords for the build based on car and mods.
 */
function generateBuildKeywords(post) {
  const keywords = new Set([
    'car build',
    'car modification',
    'custom build',
    'automotive',
    'AutoRev',
  ]);
  
  // Add car-specific keywords
  if (post.car_name) {
    keywords.add(post.car_name);
    keywords.add(`${post.car_name} build`);
    keywords.add(`${post.car_name} mods`);
    keywords.add(`${post.car_name} modifications`);
    
    // Extract brand from car name (usually first word)
    const brand = post.car_name.split(' ')[0];
    if (brand && brand.length > 2) {
      keywords.add(brand);
      keywords.add(`${brand} tuning`);
    }
  }
  
  // Add performance-related keywords
  if (post.buildData?.total_hp_gain > 0) {
    keywords.add('horsepower upgrade');
    keywords.add('performance mods');
    keywords.add('engine tuning');
  }
  
  // Add mod category keywords based on parts
  if (post.parts && post.parts.length > 0) {
    post.parts.forEach(part => {
      if (part.category) {
        keywords.add(part.category.toLowerCase());
      }
    });
  }
  
  // Add build upgrade categories
  if (post.buildData?.selected_upgrades) {
    const upgrades = Array.isArray(post.buildData.selected_upgrades)
      ? post.buildData.selected_upgrades
      : post.buildData.selected_upgrades?.upgrades || [];
    
    upgrades.forEach(upgrade => {
      if (upgrade.category) {
        keywords.add(upgrade.category.toLowerCase());
      }
    });
  }
  
  // Add location keywords if available
  if (post.author?.location_city) {
    keywords.add(`${post.author.location_city} car scene`);
  }
  if (post.author?.location_state) {
    keywords.add(`${post.author.location_state} car builds`);
  }
  
  return Array.from(keywords);
}

/**
 * Generate comprehensive JSON-LD structured data for SEO.
 * Includes Article, Vehicle, and Product schemas for rich Google results.
 */
function generateBuildJsonLd(post, primaryImage, shareUrl, totalModsCount, carData) {
  const authorName = post.author?.display_name || 'AutoRev Community';
  const imageUrl = primaryImage?.blob_url || post.carImageUrl;
  
  // Main Article schema with enhanced properties
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${shareUrl}#article`,
    headline: post.title,
    description: post.description || `Custom ${post.car_name || 'car'} build shared on AutoRev`,
    datePublished: post.published_at,
    dateModified: post.updated_at || post.published_at,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': shareUrl,
    },
    author: {
      '@type': 'Person',
      name: authorName,
      url: post.author?.public_slug 
        ? `https://autorev.app/garage/${post.author.public_slug}` 
        : undefined,
    },
    publisher: {
      '@type': 'Organization',
      name: 'AutoRev',
      url: 'https://autorev.app',
      logo: {
        '@type': 'ImageObject',
        url: 'https://autorev.app/apple-icon',
      },
    },
    image: imageUrl ? {
      '@type': 'ImageObject',
      url: imageUrl,
      width: 1200,
      height: 630,
    } : undefined,
    articleSection: 'Community Builds',
    keywords: post.car_name ? `${post.car_name}, car build, modifications, tuning` : 'car build, modifications',
    wordCount: post.description?.split(/\s+/).length || 0,
    interactionStatistic: [
      {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/ViewAction',
        userInteractionCount: post.view_count || 0,
      },
    ],
  };

  // Vehicle schema (when car data is available)
  const vehicleSchema = carData ? {
    '@context': 'https://schema.org',
    '@type': 'Vehicle',
    '@id': `${shareUrl}#vehicle`,
    name: post.car_name || carData.model,
    manufacturer: {
      '@type': 'Organization',
      name: carData.brand,
    },
    model: carData.model,
    vehicleModelDate: carData.year?.toString(),
    description: `Modified ${post.car_name || carData.model}${post.buildData?.total_hp_gain > 0 ? ` with +${post.buildData.total_hp_gain} HP` : ''}`,
    vehicleEngine: carData.engine ? {
      '@type': 'EngineSpecification',
      name: carData.engine,
    } : undefined,
    // Add performance specs if available
    ...(post.buildData?.final_hp && {
      vehicleConfiguration: `${post.buildData.final_hp} HP Modified`,
    }),
  } : null;

  // HowTo schema for build guide (when mods are present)
  const howToSchema = totalModsCount > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    '@id': `${shareUrl}#howto`,
    name: `How to Build: ${post.title}`,
    description: `A build guide for ${post.car_name || 'this car'} with ${totalModsCount} modifications`,
    totalTime: 'P30D', // Estimated 30 days for a full build
    estimatedCost: post.buildData?.total_cost_low ? {
      '@type': 'MonetaryAmount',
      currency: 'USD',
      value: post.buildData.total_cost_low,
      minValue: post.buildData.total_cost_low,
      maxValue: post.buildData.total_cost_high || post.buildData.total_cost_low,
    } : undefined,
    image: imageUrl,
    supply: collectBuildSupplies(post),
    tool: [
      { '@type': 'HowToTool', name: 'Basic hand tools' },
      { '@type': 'HowToTool', name: 'Jack and jack stands' },
    ],
  } : null;

  // Product schema for the build (useful for showcasing cost/value)
  const productSchema = post.buildData?.total_cost_low ? {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${shareUrl}#product`,
    name: `${post.title} Build Package`,
    description: `Complete modification package for ${post.car_name || 'vehicle'}`,
    image: imageUrl,
    brand: {
      '@type': 'Organization',
      name: 'AutoRev Community',
    },
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'USD',
      lowPrice: post.buildData.total_cost_low,
      highPrice: post.buildData.total_cost_high || post.buildData.total_cost_low,
      offerCount: totalModsCount,
    },
    // Performance gains as product features
    ...(post.buildData?.total_hp_gain > 0 && {
      additionalProperty: {
        '@type': 'PropertyValue',
        name: 'Horsepower Gain',
        value: `+${post.buildData.total_hp_gain} HP`,
      },
    }),
  } : null;

  // BreadcrumbList schema for navigation
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Community',
        item: 'https://autorev.app/community',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Builds',
        item: 'https://autorev.app/community/builds',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: post.title,
        item: shareUrl,
      },
    ],
  };

  // Combine all schemas
  const schemas = [articleSchema, breadcrumbSchema];
  if (vehicleSchema) schemas.push(vehicleSchema);
  if (howToSchema) schemas.push(howToSchema);
  if (productSchema) schemas.push(productSchema);

  return schemas;
}

/**
 * Collect parts/supplies from the build for HowTo schema.
 */
function collectBuildSupplies(post) {
  const supplies = [];
  
  // Add parts
  if (post.parts && post.parts.length > 0) {
    post.parts.forEach(part => {
      supplies.push({
        '@type': 'HowToSupply',
        name: part.name || part.part_name,
        estimatedCost: part.price ? {
          '@type': 'MonetaryAmount',
          currency: 'USD',
          value: part.price,
        } : undefined,
      });
    });
  }
  
  // Add build upgrades
  if (post.buildData?.selected_upgrades) {
    const upgrades = Array.isArray(post.buildData.selected_upgrades)
      ? post.buildData.selected_upgrades
      : post.buildData.selected_upgrades?.upgrades || [];
    
    upgrades.forEach(upgrade => {
      supplies.push({
        '@type': 'HowToSupply',
        name: upgrade.name || upgrade.upgrade_name,
        estimatedCost: upgrade.price_low ? {
          '@type': 'MonetaryAmount',
          currency: 'USD',
          value: upgrade.price_low,
        } : undefined,
      });
    });
  }
  
  return supplies.slice(0, 20); // Limit to 20 items for schema
}

export const revalidate = 300;

export default async function BuildDetailPage({ params }) {
  const { slug } = await params;
  const { data: post, error } = await fetchCommunityPostBySlug(slug);

  if (error || !post) {
    notFound();
  }

  const shareUrl = getPostShareUrl(post.slug);
  
  // Get hero source preference from build settings (stored in selected_upgrades JSONB)
  const buildSettings = post.buildData?.selected_upgrades || {};
  const heroSource = buildSettings.heroSource || 'stock';
  const heroImageId = buildSettings.heroImageId;
  
  // Determine hero image based on user preference
  const primaryImage = post.images?.find(img => img.is_primary) || post.images?.[0];
  const selectedHeroImage = heroImageId 
    ? post.images?.find(img => img.id === heroImageId)
    : primaryImage;
  
  // Use stock photo if heroSource is 'stock', otherwise use uploaded image
  const heroImageUrl = heroSource === 'stock' || !selectedHeroImage
    ? post.carImageUrl
    : selectedHeroImage?.blob_url || post.carImageUrl;
  
  const galleryImages = post.images?.filter(img => img.id !== selectedHeroImage?.id) || [];
  const hasUserImages = post.images && post.images.length > 0;

  // Calculate total mods count
  const partsCount = post.parts?.length || 0;
  const buildUpgradesCount = post.buildData?.selected_upgrades 
    ? (Array.isArray(post.buildData.selected_upgrades) 
        ? post.buildData.selected_upgrades.length 
        : post.buildData.selected_upgrades?.upgrades?.length || 0)
    : 0;
  const projectPartsCount = post.buildData?.project_parts?.length || 0;
  const totalModsCount = partsCount + buildUpgradesCount + projectPartsCount;

  // Fetch full car data for performance comparison and experience scores
  const carData = await getCarData(post.car_slug);

  // Generate comprehensive JSON-LD structured data for SEO
  const jsonLd = generateBuildJsonLd(post, primaryImage, shareUrl, totalModsCount, carData);

  return (
    <>
      {/* Render all JSON-LD schemas for comprehensive SEO */}
      {jsonLd.map((schema, index) => (
        <script
          key={`jsonld-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      
      {/* Track views with smart deduplication */}
      <ViewTracker postId={post.id} ownerId={post.author?.user_id} />
      
      <div className={styles.page} data-no-main-offset>
        {/* Hero Image with Overlay Stats */}
        {heroImageUrl && (
          <div className={styles.heroImage}>
            <Image
              src={heroImageUrl}
              alt={post.title}
              fill
              priority
              className={styles.mainImage}
            />
            <div className={styles.heroOverlay} />
            {!hasUserImages && (
              <span className={styles.stockImageBadge}>Stock Photo</span>
            )}
            
            {/* Hero Stats Overlay */}
            {post.buildData && (
              <div className={styles.heroStats}>
                {post.buildData.final_hp && (
                  <div className={styles.heroStat}>
                    <span className={styles.heroStatValue}>{post.buildData.final_hp}</span>
                    <span className={styles.heroStatLabel}>HP</span>
                  </div>
                )}
                {post.buildData.total_hp_gain > 0 && (
                  <div className={styles.heroStat}>
                    <span className={styles.heroStatValue}>+{post.buildData.total_hp_gain}</span>
                    <span className={styles.heroStatLabel}>HP Gain</span>
                  </div>
                )}
                {totalModsCount > 0 && (
                  <div className={styles.heroStat}>
                    <span className={styles.heroStatValue}>{totalModsCount}</span>
                    <span className={styles.heroStatLabel}>Mods</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className={styles.content}>
          {/* Breadcrumb */}
          <nav className={styles.breadcrumb}>
            <Link href="/community">Community</Link>
            <span>/</span>
            <Link href="/community/builds">Builds</Link>
            <span>/</span>
            <span>{post.title}</span>
          </nav>

                {/* Owner Edit Actions - Redirects to UpgradeCenter */}
                <OwnerActions 
                  postId={post.id} 
                  ownerId={post.author?.user_id} 
                  buildSlug={post.slug}
                  carSlug={post.car_slug}
                  userBuildId={post.buildData?.id}
                />

          {/* Header */}
          <header className={styles.header}>
            <h1 className={styles.title}>{post.title}</h1>
            
            {post.car_name && (
              <Link 
                href={`/browse-cars/${post.car_slug}`} 
                className={styles.carLink}
              >
                {post.car_name}
              </Link>
            )}

            <div className={styles.meta}>
              <div className={styles.authorInfo}>
                {post.author?.avatar_url && (
                  <Image
                    src={post.author.avatar_url}
                    alt={post.author.display_name}
                    width={44}
                    height={44}
                    className={styles.authorAvatar}
                  />
                )}
                <div className={styles.authorDetails}>
                  <span className={styles.authorName}>
                    {post.author?.display_name || 'Anonymous'}
                  </span>
                  {post.author?.tier && post.author.tier !== 'free' && (
                    <span className={styles.tierBadge}>{post.author.tier.toUpperCase()}</span>
                  )}
                  {post.author?.location_city && (
                    <span className={styles.location}>
                      📍 {post.author.location_city}{post.author.location_state && `, ${post.author.location_state}`}
                    </span>
                  )}
                </div>
              </div>
              <div className={styles.stats}>
                <span className={styles.statItem}>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                  {post.view_count || 0}
                </span>
                {post.like_count > 0 && (
                  <span className={styles.statItem}>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                    {post.like_count}
                  </span>
                )}
              </div>
            </div>
          </header>

          {/* Description */}
          {post.description && (
            <section className={styles.section}>
              <div className={styles.description}>{post.description}</div>
            </section>
          )}

          {/* Performance Comparison - Stock vs Modified */}
          {carData && post.buildData?.total_hp_gain > 0 && (
            <section className={styles.section}>
              <PerformanceComparison
                carData={carData}
                buildData={post.buildData}
                totalCost={post.buildData?.total_cost_low || post.buildData?.total_cost_high || 0}
              />
            </section>
          )}

          {/* Experience Scores - Comfort, Reliability, Sound */}
          {carData && (
            <section className={styles.section}>
              <ExperienceScores
                carData={carData}
                buildData={post.buildData}
              />
            </section>
          )}

          {/* Build Stats Summary */}
          {post.buildData && (
            <section className={styles.section}>
              <div className={styles.buildSummary}>
                <h2 className={styles.summaryTitle}>
                  <span className={styles.summaryIcon}>💰</span>
                  Build Investment
                </h2>
                <div className={styles.summaryGrid}>
                  {(post.buildData.total_cost_low > 0 || post.buildData.total_cost_high > 0) && (
                    <div className={styles.summaryCard}>
                      <span className={styles.summaryValue}>
                        {post.buildData.total_cost_low > 0 && post.buildData.total_cost_high > 0
                          ? `$${post.buildData.total_cost_low.toLocaleString()} - $${post.buildData.total_cost_high.toLocaleString()}`
                          : `$${(post.buildData.total_cost_low || post.buildData.total_cost_high).toLocaleString()}`
                        }
                      </span>
                      <span className={styles.summaryLabel}>Estimated Total Cost</span>
                    </div>
                  )}
                  {totalModsCount > 0 && post.buildData.total_hp_gain > 0 && (
                    <div className={styles.summaryCard}>
                      <span className={styles.summaryValue}>
                        ${Math.round((post.buildData.total_cost_low || post.buildData.total_cost_high || 0) / post.buildData.total_hp_gain).toLocaleString()}
                      </span>
                      <span className={styles.summaryLabel}>Cost per HP Gained</span>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Mods & Parts List */}
          {(totalModsCount > 0 || (post.parts && post.parts.length > 0)) && (
            <section className={styles.section}>
              <BuildModsList 
                parts={post.parts} 
                buildData={post.buildData}
              />
            </section>
          )}

          {/* Image Gallery */}
          {galleryImages.length > 0 && (
            <section className={styles.section}>
              <ImageGallery images={galleryImages} title="Build Gallery" />
            </section>
          )}

          {/* Share Section */}
          <section className={styles.shareSection}>
            <h3>Share this build</h3>
            <ShareButtons 
              shareUrl={shareUrl} 
              title={post.title} 
              carName={post.car_name}
            />
          </section>

          {/* Related Car CTA */}
          {post.car_slug && (
            <section className={styles.ctaSection}>
              <div className={styles.ctaContent}>
                <p>Want to learn more about this car?</p>
                <Link href={`/browse-cars/${post.car_slug}`} className={styles.ctaBtn}>
                  View {post.car_name} Details
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="5" y1="12" x2="19" y2="12"/>
                    <polyline points="12 5 19 12 12 19"/>
                  </svg>
                </Link>
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
