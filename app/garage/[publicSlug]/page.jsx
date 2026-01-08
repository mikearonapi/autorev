/**
 * Public Garage Page
 * 
 * Displays a user's public garage with their vehicles and builds.
 * SEO-optimized with social sharing support.
 */

import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { fetchPublicGarage, getGarageShareUrl, getFacebookShareUrl, getTwitterShareUrl, getInstagramShareInfo } from '@/lib/communityService';
import GarageShareButtons from './GarageShareButtons';
import styles from './page.module.css';

export async function generateMetadata({ params }) {
  const { publicSlug } = await params;
  const { data } = await fetchPublicGarage(publicSlug);
  
  if (!data?.profile) {
    return { title: 'Garage Not Found | AutoRev' };
  }

  const { profile, stats } = data;
  const vehicleCount = stats?.vehicle_count || 0;
  const description = profile.bio || 
    `${profile.display_name}'s garage on AutoRev. ${vehicleCount} vehicle${vehicleCount !== 1 ? 's' : ''}.`;
  
  return {
    title: `${profile.display_name}'s Garage | AutoRev`,
    description,
    openGraph: {
      title: `${profile.display_name}'s Garage`,
      description,
      type: 'profile',
      images: profile.avatar_url ? [{ url: profile.avatar_url }] : [],
    },
    twitter: {
      card: 'summary',
      title: `${profile.display_name}'s Garage`,
      description,
    },
  };
}

export const revalidate = 300;

export default async function PublicGaragePage({ params }) {
  const { publicSlug } = await params;
  const { data, error } = await fetchPublicGarage(publicSlug);

  if (error || !data?.profile) {
    notFound();
  }

  const { profile, vehicles, builds, stats } = data;
  const shareUrl = getGarageShareUrl(publicSlug);

  return (
    <div className={styles.page}>
      {/* Profile Header */}
      <section className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.profileInfo}>
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={profile.display_name}
                width={100}
                height={100}
                className={styles.avatar}
              />
            ) : (
              <div className={styles.avatarPlaceholder}>
                {profile.display_name?.charAt(0).toUpperCase() || '?'}
              </div>
            )}
            
            <div className={styles.profileDetails}>
              <h1 className={styles.displayName}>
                {profile.display_name}
                {profile.tier && profile.tier !== 'free' && (
                  <span className={styles.tierBadge}>{profile.tier}</span>
                )}
              </h1>
              
              {profile.location_city && (
                <p className={styles.location}>
                  📍 {profile.location_city}{profile.location_state ? `, ${profile.location_state}` : ''}
                </p>
              )}
              
              {profile.bio && (
                <p className={styles.bio}>{profile.bio}</p>
              )}
              
              {/* Social Links */}
              <div className={styles.socialLinks}>
                {profile.social_instagram && (
                  <a 
                    href={`https://instagram.com/${profile.social_instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.socialLink}
                  >
                    Instagram
                  </a>
                )}
                {profile.social_youtube && (
                  <a 
                    href={profile.social_youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.socialLink}
                  >
                    YouTube
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className={styles.stats}>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{stats?.vehicle_count || 0}</span>
              <span className={styles.statLabel}>Vehicles</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{stats?.build_count || 0}</span>
              <span className={styles.statLabel}>Builds</span>
            </div>
          </div>
        </div>
      </section>

      <div className={styles.content}>
        {/* Vehicles Section */}
        {vehicles && vehicles.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>🚗 Garage</h2>
            <div className={styles.vehicleGrid}>
              {vehicles.map(vehicle => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} />
              ))}
            </div>
          </section>
        )}

        {/* Builds Section */}
        {builds && builds.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>🔧 Builds</h2>
            <div className={styles.buildsGrid}>
              {builds.map(build => (
                <BuildCard key={build.id} build={build} />
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {(!vehicles || vehicles.length === 0) && (!builds || builds.length === 0) && (
          <div className={styles.emptyState}>
            <p>This garage is empty. Check back later!</p>
          </div>
        )}

        {/* Share Section */}
        <section className={styles.shareSection}>
          <p>Share this garage</p>
          <GarageShareButtons 
            shareUrl={shareUrl}
            displayName={profile.display_name}
          />
        </section>
      </div>
    </div>
  );
}

function VehicleCard({ vehicle }) {
  const title = vehicle.nickname || 
    `${vehicle.year} ${vehicle.make} ${vehicle.model}${vehicle.trim ? ` ${vehicle.trim}` : ''}`;
  
  return (
    <div className={styles.vehicleCard}>
      <div className={styles.vehicleIcon}>🚗</div>
      <div className={styles.vehicleInfo}>
        <h3 className={styles.vehicleTitle}>{title}</h3>
        {vehicle.color && (
          <span className={styles.vehicleColor}>{vehicle.color}</span>
        )}
        {vehicle.matched_car_slug && (
          <Link 
            href={`/browse-cars/${vehicle.matched_car_slug}`}
            className={styles.vehicleLink}
          >
            View specs →
          </Link>
        )}
      </div>
    </div>
  );
}

function BuildCard({ build }) {
  return (
    <div className={styles.buildCard}>
      <div className={styles.buildHeader}>
        <h3 className={styles.buildName}>{build.build_name || 'Unnamed Build'}</h3>
        <span className={styles.buildCar}>{build.car_name}</span>
      </div>
      <div className={styles.buildStats}>
        {build.total_hp_gain > 0 && (
          <span className={styles.buildStat}>+{build.total_hp_gain} HP</span>
        )}
        {build.final_hp && (
          <span className={styles.buildStat}>{build.final_hp} Final HP</span>
        )}
        {(build.total_cost_low || build.total_cost_high) && (
          <span className={styles.buildStat}>
            ${build.total_cost_low?.toLocaleString() || 0} - ${build.total_cost_high?.toLocaleString() || 0}
          </span>
        )}
      </div>
      {build.notes && (
        <p className={styles.buildNotes}>
          {build.notes.length > 100 ? `${build.notes.slice(0, 100)}...` : build.notes}
        </p>
      )}
    </div>
  );
}

