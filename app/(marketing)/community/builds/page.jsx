/**
 * Community Builds Page - Netflix-style Gallery
 * 
 * Features:
 * - Hero carousel with featured builds
 * - Horizontal scrolling rows by brand
 * - Filter/explorer by make and model
 * - Mobile-optimized layout
 */

import Link from 'next/link';
import Image from 'next/image';
import { fetchCommunityPosts, fetchBuildsByBrand, fetchBuildBrands, fetchMostViewedBuilds } from '@/lib/communityService';
import MyBuildsSection from './MyBuildsSection';
import styles from './page.module.css';

export const metadata = {
  title: 'Community Builds | AutoRev',
  description: 'Browse real-world sports car builds from the AutoRev community. See mods, performance gains, and get inspiration for your own project.',
  openGraph: {
    title: 'Community Builds | AutoRev',
    description: 'Real builds from real enthusiasts. See mods, dyno results, and more.',
    type: 'website',
  },
};

export const revalidate = 60; // Revalidate every minute for fresher content

export default async function CommunityBuildsPage({ searchParams }) {
  const params = await searchParams;
  const brandFilter = params?.brand;
  const carFilter = params?.car;
  
  // Fetch data in parallel
  const [
    { data: latestBuilds },
    { data: mostViewedBuilds },
    { data: buildsByBrand },
    { data: brands }
  ] = await Promise.all([
    fetchCommunityPosts({ postType: 'build', carSlug: carFilter, limit: 12 }),
    fetchMostViewedBuilds({ limit: 12 }),
    fetchBuildsByBrand({ limitPerBrand: 12 }),
    fetchBuildBrands(),
  ]);
  
  // Get builds by brand, filtered if needed
  let displayBrands = buildsByBrand || [];
  if (brandFilter) {
    displayBrands = displayBrands.filter(b => b.brand === brandFilter.toLowerCase());
  }

  const hasBuilds = (latestBuilds || []).length > 0 || (mostViewedBuilds || []).length > 0;

  return (
    <div className={styles.page} data-no-main-offset>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroBackground}>
          {latestBuilds?.[0]?.images?.[0]?.blob_url && (
            <Image
              src={latestBuilds[0].images[0].blob_url}
              alt=""
              fill
              className={styles.heroBackgroundImage}
              priority
              sizes="100vw"
              quality={60}
            />
          )}
          <div className={styles.heroOverlay} />
        </div>
        
        <div className={styles.heroContent}>
          <span className={styles.badge}>Community Builds</span>
          <h1 className={styles.heroTitle}>
            Real Builds, Real Results
          </h1>
          <p className={styles.heroSubtitle}>
            Explore builds shared by enthusiasts worldwide. Get inspired for your next project.
          </p>
          
          <div className={styles.heroActions}>
            <Link href="/garage/tuning-shop" className={styles.primaryBtn}>
              Create Your Build
            </Link>
            <a href="#explorer" className={styles.secondaryBtn}>
              Explore Builds
            </a>
          </div>

          {/* My Public Builds - Compact Version */}
          <MyBuildsSection />
        </div>
      </section>

      {hasBuilds ? (
        <div className={styles.content} id="explorer">
          {/* Latest Builds Row */}
          {!brandFilter && latestBuilds && latestBuilds.length > 0 && (
            <section className={styles.row}>
              <div className={styles.rowHeader}>
                <h2 className={styles.rowTitle}>Latest Builds</h2>
                <Link href="/community/builds?sort=latest" className={styles.seeAll}>
                  See All
                </Link>
              </div>
              <div className={styles.carousel}>
                <div className={styles.carouselTrack}>
                  {latestBuilds.map((build, index) => (
                    <BuildCard key={build.id} build={build} eager={index < 3} />
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Most Viewed Builds Row */}
          {!brandFilter && mostViewedBuilds && mostViewedBuilds.length > 0 && (
            <section className={styles.row}>
              <div className={styles.rowHeader}>
                <h2 className={styles.rowTitle}>Most Viewed Builds</h2>
                <Link href="/community/builds?sort=popular" className={styles.seeAll}>
                  See All
                </Link>
              </div>
              <div className={styles.carousel}>
                <div className={styles.carouselTrack}>
                  {mostViewedBuilds.map((build, index) => (
                    <BuildCard key={build.id} build={build} eager={index < 2} />
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Builds by Brand Rows */}
          {displayBrands.map(brandData => (
            <section key={brandData.brand} className={styles.row}>
              <div className={styles.rowHeader}>
                <h2 className={styles.rowTitle}>
                  {brandData.brand_display} Builds
                </h2>
                <Link 
                  href={`/community/builds?brand=${brandData.brand}`} 
                  className={styles.seeAll}
                >
                  See All ({brandData.build_count})
                </Link>
              </div>
              <div className={styles.carousel}>
                <div className={styles.carouselTrack}>
                  {brandData.builds.map(build => (
                    <BuildCard key={build.id} build={build} />
                  ))}
                </div>
              </div>
            </section>
          ))}

          {/* Empty state for brand filter with no results */}
          {brandFilter && displayBrands.length === 0 && (
            <div className={styles.emptyState}>
              <h3>No {brandFilter} builds yet</h3>
              <p>Be the first to share a {brandFilter} build!</p>
              <Link href="/garage/tuning-shop" className={styles.primaryBtn}>
                Create a Build
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className={styles.content}>
          <div className={styles.emptyState}>
            <h3>No builds shared yet</h3>
            <p>Be the first to share your build with the community!</p>
            <Link href="/garage/tuning-shop" className={styles.primaryBtn}>
              Create Your First Build
            </Link>
          </div>
        </div>
      )}

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaContent}>
          <h2>Share Your Build</h2>
          <p>Got a project you're proud of? Share it with thousands of enthusiasts.</p>
          <Link href="/garage/tuning-shop" className={styles.ctaBtn}>
            Go to Tuning Shop
          </Link>
        </div>
      </section>
    </div>
  );
}

function BuildCard({ build, featured = false, eager = false }) {
  // Handle both nested and flat image structures
  const primaryImage = build.primary_image || build.images?.find(img => img.is_primary) || build.images?.[0];
  // Use user uploaded image, or fall back to car's default hero image
  // Prefer thumbnail for faster loading
  const imageUrl = primaryImage?.thumbnail_url || primaryImage?.blob_url || build.car_image_url;
  
  return (
    <Link 
      href={`/community/builds/${build.slug}`} 
      className={`${styles.card} ${featured ? styles.cardFeatured : ''}`}
    >
      <div className={styles.cardImage}>
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={build.title}
            fill
            className={styles.image}
            sizes="(max-width: 640px) 280px, 320px"
            loading={eager ? 'eager' : 'lazy'}
            quality={70}
          />
        ) : (
          <div className={styles.placeholderImage}>
            <span>No Image</span>
          </div>
        )}
        {/* Hover overlay */}
        <div className={styles.cardOverlay}>
          <span className={styles.viewBtn}>View Build</span>
        </div>
      </div>
      
      <div className={styles.cardContent}>
        <h3 className={styles.cardTitle}>{build.title}</h3>
        {build.car_name && (
          <p className={styles.cardCar}>{build.car_name}</p>
        )}
        
        <div className={styles.cardMeta}>
          {build.author && (
            <div className={styles.authorInfo}>
              {build.author.avatar_url && (
                <Image
                  src={build.author.avatar_url}
                  alt={build.author.display_name || 'User'}
                  width={20}
                  height={20}
                  className={styles.authorAvatar}
                />
              )}
              <span>{build.author.display_name || 'Anonymous'}</span>
            </div>
          )}
          <span className={styles.viewCount}>
            {build.view_count || 0} views
          </span>
        </div>
      </div>
    </Link>
  );
}

