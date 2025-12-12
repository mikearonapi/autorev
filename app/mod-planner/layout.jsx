/**
 * Mod Planner Layout - SEO Metadata
 * 
 * Provides metadata for the Mod Planner page (formerly Performance HUB).
 * URL: /mod-planner
 */

export const metadata = {
  title: 'Mod Planner | Plan Your Car Build & Upgrades',
  description: 'Plan your sports car build with our Mod Planner. Select your car and explore upgrade recommendations for suspension, brakes, power, and handling. Get cost estimates and see how mods work together.',
  keywords: [
    'car mod planner',
    'build planner',
    'performance upgrades',
    'suspension upgrades',
    'brake upgrades',
    'engine tuning',
    'car modifications',
    'upgrade recommendations',
    'track preparation',
    'sports car mods',
  ],
  openGraph: {
    title: 'Mod Planner | Plan Your Car Build & Upgrades',
    description: 'Plan your sports car build. Select your car and explore upgrade recommendations with cost estimates.',
    url: '/mod-planner',
    type: 'website',
  },
  twitter: {
    title: 'Mod Planner | Plan Your Car Build & Upgrades',
    description: 'Plan your sports car build with upgrade recommendations and cost estimates.',
  },
  alternates: {
    canonical: '/mod-planner',
  },
};

export default function ModPlannerLayout({ children }) {
  return children;
}
