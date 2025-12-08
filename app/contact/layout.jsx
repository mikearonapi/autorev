// Contact page layout with SEO metadata
// Since the contact page is a client component, we export metadata from this layout

export const metadata = {
  title: 'Contact Us | Book a Consultation',
  description: 'Get in touch with SuperNatural Motorsports. Schedule a consultation about your next sports car purchase, performance upgrades, or track preparation. Expert advice for enthusiasts.',
  keywords: ['contact', 'consultation', 'sports car advice', 'performance consultation', 'track preparation', 'pre-purchase inspection'],
  openGraph: {
    title: 'Contact Us | SuperNatural Motorsports',
    description: 'Get in touch about your next sports car purchase, performance upgrades, or track preparation.',
    url: '/contact',
    type: 'website',
  },
  twitter: {
    title: 'Contact Us | SuperNatural Motorsports',
    description: 'Get in touch about your next sports car purchase or performance upgrades.',
  },
  alternates: {
    canonical: '/contact',
  },
};

export default function ContactLayout({ children }) {
  return children;
}


