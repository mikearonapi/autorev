export const metadata = {
  title: 'Sports Car Selector | Compare 98 Performance Vehicles',
  description: 'Select your perfect sports car with our intelligent comparison tool. Compare 98 vehicles from $25K-$300K based on sound, track capability, reliability, daily comfort, and value. Real owner insights included.',
  keywords: ['sports car selector', 'car comparison', 'track cars', 'sports car buying guide', 'Porsche comparison', 'BMW M comparison', 'Corvette comparison', 'best sports car under 100k', 'muscle cars', 'import tuners', 'drift cars'],
  openGraph: {
    title: 'Sports Car Selector | Compare 98 Performance Vehicles',
    description: 'Select your perfect sports car. Compare 98 vehicles based on what matters most to you.',
    url: '/car-selector',
    type: 'website',
  },
  twitter: {
    title: 'Sports Car Selector | Compare 98 Performance Vehicles',
    description: 'Select your perfect sports car. Compare 98 vehicles from $25K-$300K.',
  },
  alternates: {
    canonical: '/car-selector',
  },
};

export default function CarSelectorLayout({ children }) {
  return children;
}
