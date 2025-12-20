/**
 * Join Page Layout - SEO Metadata
 * 
 * Provides metadata for the Join/Signup page.
 * URL: /join
 */

export const metadata = {
  title: 'Join AutoRev | Free Sports Car Community & Tools',
  description: 'Join AutoRev free during launch. Access our car selector, save favorites, plan builds, and get AI-powered advice from AL. No credit card required—just passionate car enthusiasts helping each other.',
  keywords: [
    'join autorev',
    'sports car community',
    'car enthusiast community',
    'free car tools',
    'car garage app',
    'build planner',
    'car comparison tool',
    'sports car selector',
    'automotive community',
    'car collectors',
    'car tuners',
  ],
  openGraph: {
    title: 'Join AutoRev | Free Sports Car Community & Tools',
    description: 'Join AutoRev free during launch. Access our car selector, save favorites, plan builds, and get AI-powered advice.',
    url: '/join',
    type: 'website',
  },
  twitter: {
    title: 'Join AutoRev | Free Sports Car Community & Tools',
    description: 'Join AutoRev free during launch. Access our car selector, save favorites, and plan builds.',
  },
  alternates: {
    canonical: '/join',
  },
};

export default function JoinLayout({ children }) {
  return children;
}













