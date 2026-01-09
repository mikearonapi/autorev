import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.css';
import EventCard from '@/components/EventCard';
import { fetchMostViewedBuilds } from '@/lib/communityService';
import { getPublicClient, isConfigured } from '@/lib/supabaseServer';

export const revalidate = 60; // Revalidate every minute for fresh content

export const metadata = {
  title: 'Community Hub | Events, Resources & Enthusiast Network | AutoRev',
  description: 'Connect with fellow car enthusiasts. Explore community builds, discover local events, and share your projects.',
};

// Icons (Lucide style) - color prop for explicit stroke color
const Icons = {
  arrowRight: ({ size = 20, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/>
      <polyline points="12 5 19 12 12 19"/>
    </svg>
  ),
  wrench: ({ size = 24, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    </svg>
  ),
  calendar: ({ size = 24, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  eye: ({ size = 20, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  star: ({ size = 20, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
};

// Server-side function to fetch featured events
async function fetchFeaturedEvents(limit = 4) {
  const supabase = getPublicClient();
  if (!isConfigured || !supabase) {
    return [];
  }

  try {
    const { data: events, error } = await supabase
      .from('events')
      .select(`
        id,
        slug,
        name,
        description,
        start_date,
        end_date,
        start_time,
        end_time,
        venue_name,
        city,
        state,
        image_url,
        is_free,
        cost_text,
        featured,
        event_types (
          slug,
          name,
          icon,
          is_track_event
        )
      `)
      .eq('status', 'approved')
      .eq('featured', true)
      .gte('start_date', new Date().toISOString().split('T')[0])
      .order('start_date', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('[CommunityPage] Error fetching events:', error);
      return [];
    }

    // Transform to response shape
    return (events || []).map(event => ({
      id: event.id,
      slug: event.slug,
      name: event.name,
      description: event.description,
      start_date: event.start_date,
      end_date: event.end_date,
      start_time: event.start_time,
      end_time: event.end_time,
      venue_name: event.venue_name,
      city: event.city,
      state: event.state,
      image_url: event.image_url,
      is_free: event.is_free,
      cost_text: event.cost_text,
      featured: event.featured,
      event_type: event.event_types ? {
        slug: event.event_types.slug,
        name: event.event_types.name,
        icon: event.event_types.icon,
        is_track_event: event.event_types.is_track_event,
      } : null,
    }));
  } catch (err) {
    console.error('[CommunityPage] Error fetching events:', err);
    return [];
  }
}

// Build Card component for displaying community builds
function BuildCard({ build }) {
  const primaryImage = build.primary_image || build.images?.find(img => img.is_primary) || build.images?.[0];
  const imageUrl = primaryImage?.thumbnail_url || primaryImage?.blob_url || build.car_image_url;
  
  return (
    <Link href={`/community/builds/${build.slug}`} className={styles.buildCard}>
      <div className={styles.buildCardImage}>
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={build.title}
            fill
            className={styles.buildImage}
            sizes="(max-width: 640px) 260px, 300px"
          />
        ) : (
          <div className={styles.buildPlaceholder}>
            <Icons.wrench size={32} />
          </div>
        )}
        {build.is_featured && (
          <span className={styles.featuredBadge}>
            <Icons.star size={10} />
            Featured
          </span>
        )}
        <div className={styles.buildCardOverlay}>
          <span className={styles.viewBuildBtn}>View Build</span>
        </div>
      </div>
      <div className={styles.buildCardContent}>
        <h3 className={styles.buildCardTitle}>{build.title}</h3>
        {build.car_name && (
          <p className={styles.buildCardCar}>{build.car_name}</p>
        )}
        <div className={styles.buildCardMeta}>
          {build.author && (
            <div className={styles.buildAuthor}>
              {build.author.avatar_url && (
                <Image
                  src={build.author.avatar_url}
                  alt={build.author.display_name || 'User'}
                  width={18}
                  height={18}
                  className={styles.buildAuthorAvatar}
                />
              )}
              <span>{build.author.display_name || 'Anonymous'}</span>
            </div>
          )}
          <span className={styles.buildViewCount}>
            <Icons.eye size={12} />
            {build.view_count || 0}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default async function CommunityPage() {
  // Fetch data server-side in parallel (same pattern as /community/builds)
  const [
    featuredEvents,
    { data: popularBuilds }
  ] = await Promise.all([
    fetchFeaturedEvents(4),
    fetchMostViewedBuilds({ limit: 6 }),
  ]);

  return (
    <div className={styles.page} data-no-main-offset>
      {/* Hero Section - Now broader community focus */}
      <section className={styles.hero}>
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <span className={styles.badge}>Community</span>
          <h1 className={styles.heroTitle}>
            Connect with <span className={styles.titleAccent}>Enthusiasts</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Explore community builds, discover local events, and connect with fellow car enthusiasts.
          </p>

          {/* Quick navigation cards */}
          <div className={styles.heroNav}>
            <Link href="/community/builds" className={styles.heroNavCard}>
              <div className={styles.heroNavIcon}>
                <svg 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="#d4af37" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  style={{ display: 'block', minWidth: '20px', minHeight: '20px' }}
                >
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                </svg>
              </div>
              <div className={styles.heroNavText}>
                <span className={styles.heroNavTitle}>Community Builds</span>
                <span className={styles.heroNavDesc}>Browse real projects</span>
              </div>
              <Icons.arrowRight size={16} />
            </Link>
            <Link href="/community/events" className={styles.heroNavCard}>
              <div className={styles.heroNavIcon}>
                <svg 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="#d4af37" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  style={{ display: 'block', minWidth: '20px', minHeight: '20px' }}
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </div>
              <div className={styles.heroNavText}>
                <span className={styles.heroNavTitle}>Local Events</span>
                <span className={styles.heroNavDesc}>Find meetups near you</span>
              </div>
              <Icons.arrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Most Viewed Builds Section */}
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Most Viewed Builds</h2>
            <Link href="/community/builds" className={styles.viewAllLink}>
              View All Builds
              <Icons.arrowRight size={16} />
            </Link>
          </div>

          {popularBuilds && popularBuilds.length > 0 ? (
            <div className={styles.buildsCarousel}>
              <div className={styles.buildsTrack}>
                {popularBuilds.map(build => (
                  <BuildCard key={build.id} build={build} />
                ))}
              </div>
            </div>
          ) : (
            <div className={styles.emptyBuildsState}>
              <Icons.wrench size={40} />
              <h3>No builds yet</h3>
              <p>Be the first to share your project with the community!</p>
              <Link href="/tuning-shop" className={styles.ctaButton}>
                Create Your Build
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Featured Events */}
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Featured Events</h2>
            <Link href="/community/events" className={styles.viewAllLink}>
              View All Events
              <Icons.arrowRight size={16} />
            </Link>
          </div>

          {featuredEvents && featuredEvents.length > 0 ? (
            <div className={styles.eventsGrid}>
              {featuredEvents.map(event => (
                <EventCard 
                  key={event.id} 
                  event={event} 
                  featured 
                />
              ))}
            </div>
          ) : (
            <div className={styles.emptyEventsState}>
              <Icons.calendar size={40} />
              <h3>No upcoming events</h3>
              <p>Check back soon or submit an event you know about!</p>
              <Link href="/events/submit" className={styles.ctaButtonSecondary}>
                Submit an Event
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Share Your Build CTA */}
      <section className={styles.buildCtaSection}>
        <div className={styles.container}>
          <div className={styles.buildCtaContent}>
            <div className={styles.buildCtaText}>
              <h2>Share Your Project</h2>
              <p>
                Got a build you're proud of? Share photos, mods, and inspiration with thousands of enthusiasts.
              </p>
              <div className={styles.buildCtaFeatures}>
                <span>📸 Upload photos</span>
                <span>🔧 Document your mods</span>
                <span>📱 Share on social media</span>
              </div>
            </div>
            <Link href="/tuning-shop" className={styles.buildCtaButton}>
              Create Your Build
              <Icons.arrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Submit Event CTA */}
      <section className={styles.ctaSection}>
        <div className={styles.container}>
          <h2 className={styles.ctaTitle}>Know of an event we're missing?</h2>
          <p className={styles.ctaSubtitle}>Help the community discover great car events in their area</p>
          <Link href="/events/submit" className={styles.submitBtn}>
            Submit an Event
          </Link>
        </div>
      </section>
    </div>
  );
}
