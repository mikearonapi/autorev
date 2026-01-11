/**
 * Browse Vehicles Layout - SEO Metadata
 * 
 * Provides metadata for the Browse Vehicles page (vehicle catalog).
 * URL: /browse-cars
 */

import { getPlatformStats } from '@/lib/statsService';

export async function generateMetadata() {
  let carCount = 188; // Fallback
  try {
    const stats = await getPlatformStats();
    carCount = stats.cars || 188;
  } catch (e) {
    console.warn('[browse-cars/layout] Failed to fetch stats for metadata:', e.message);
  }

  return {
    title: `Browse Vehicles | Explore ${carCount} Sports & Performance Vehicles`,
    description: `Browse our collection of ${carCount} vehicles - sports cars, sedans, hot hatches, trucks, and SUVs. Filter by make, price tier, and vehicle type. Compare specs, find your perfect match.`,
    keywords: [
      'sports cars',
      'performance vehicles',
      'vehicle catalog',
      'browse vehicles',
      'Porsche',
      'BMW M',
      'Corvette',
      'Mustang',
      'Miata',
      'sports car comparison',
      'track cars',
      'muscle cars',
      'import tuners',
      'sports sedan',
      'hot hatch',
      'wagon',
      'SUV',
      'truck',
    ],
    openGraph: {
      title: `Browse Vehicles | Explore ${carCount} Sports & Performance Vehicles`,
      description: `Browse our collection of ${carCount} vehicles. Filter by make, price, and vehicle type. Find your perfect match.`,
      url: '/browse-cars',
      type: 'website',
    },
    twitter: {
      title: `Browse Vehicles | Explore ${carCount} Sports & Performance Vehicles`,
      description: `Browse ${carCount} vehicles. Filter by make, price, and vehicle type.`,
    },
    alternates: {
      canonical: '/browse-cars',
    },
  };
}

export default function BrowseCarsLayout({ children }) {
  return children;
}





















