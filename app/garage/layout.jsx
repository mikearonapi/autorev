/**
 * Garage Layout - SEO Metadata
 * 
 * Provides metadata for the Garage page since the main page is a client component.
 */

export const metadata = {
  title: 'Garage | Explore ~100 Sports Cars',
  description: 'Browse our collection of ~100 sports cars from budget-friendly track toys to premium performance machines. Filter by price tier, layout, brand, and performance metrics. Find detailed specs, scores, and ownership insights for every vehicle.',
  keywords: [
    'sports car collection',
    'car gallery',
    'sports car database',
    'performance cars',
    'track cars',
    'Porsche collection',
    'BMW M cars',
    'Corvette',
    'muscle cars',
    'import tuners',
    'mid-engine sports cars',
    'car comparison',
    'sports car specs',
  ],
  openGraph: {
    title: 'Garage | Explore ~100 Sports Cars',
    description: 'Browse ~100 sports cars from budget-friendly track toys to premium performance machines. Filter by what matters to you.',
    url: '/garage',
    type: 'website',
  },
  twitter: {
    title: 'Garage | Explore ~100 Sports Cars',
    description: 'Browse ~100 sports cars from budget-friendly track toys to premium performance machines.',
  },
  alternates: {
    canonical: '/garage',
  },
};

export default function GarageLayout({ children }) {
  return children;
}






