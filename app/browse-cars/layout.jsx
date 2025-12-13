/**
 * Browse Cars Layout - SEO Metadata
 * 
 * Provides metadata for the Browse Cars page (car catalog).
 * URL: /browse-cars
 */

export const metadata = {
  title: 'Browse Cars | Explore 98 Sports & Performance Vehicles',
  description: 'Browse our collection of 98 sports cars, from budget-friendly Miatas to exotic supercars. Filter by make, price tier, and category. Compare specs, find your perfect match.',
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
    title: 'Browse Cars | Explore 98 Sports & Performance Vehicles',
    description: 'Browse our collection of 98 sports cars. Filter by make, price, and category. Find your perfect match.',
    url: '/browse-cars',
    type: 'website',
  },
  twitter: {
    title: 'Browse Cars | Explore 98 Sports & Performance Vehicles',
    description: 'Browse 98 sports cars. Filter by make, price, and category.',
  },
  alternates: {
    canonical: '/browse-cars',
  },
};

export default function BrowseCarsLayout({ children }) {
  return children;
}







