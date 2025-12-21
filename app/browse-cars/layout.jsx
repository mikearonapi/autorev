/**
 * Browse Cars Layout - SEO Metadata
 * 
 * Provides metadata for the Browse Cars page (car catalog).
 * URL: /browse-cars
 */

import { getPlatformStats } from '@/lib/statsService';

export async function generateMetadata() {
  let carCount = 98; // Fallback
  try {
    const stats = await getPlatformStats();
    carCount = stats.cars || 98;
  } catch (e) {
    console.warn('[browse-cars/layout] Failed to fetch stats for metadata:', e.message);
  }

  return {
    title: `Browse Cars | Explore ${carCount} Sports & Performance Vehicles`,
    description: `Browse our collection of ${carCount} sports cars, from budget-friendly Miatas to exotic supercars. Filter by make, price tier, and category. Compare specs, find your perfect match.`,
    keywords: [
      'sports cars',
      'performance cars',
      'car catalog',
      'browse sports cars',
      'Porsche',
      'BMW M',
      'Corvette',
      'Mustang',
      'Miata',
      'sports car comparison',
      'track cars',
      'muscle cars',
      'import tuners',
    ],
    openGraph: {
      title: `Browse Cars | Explore ${carCount} Sports & Performance Vehicles`,
      description: `Browse our collection of ${carCount} sports cars. Filter by make, price, and category. Find your perfect match.`,
      url: '/browse-cars',
      type: 'website',
    },
    twitter: {
      title: `Browse Cars | Explore ${carCount} Sports & Performance Vehicles`,
      description: `Browse ${carCount} sports cars. Filter by make, price, and category.`,
    },
    alternates: {
      canonical: '/browse-cars',
    },
  };
}

export default function BrowseCarsLayout({ children }) {
  return children;
}





















