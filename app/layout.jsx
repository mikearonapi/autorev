import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata = {
  title: {
    default: 'SuperNatural Motorsports | Unleash Your Racing Spirit',
    template: '%s | SuperNatural Motorsports',
  },
  description: 'Expert sports car advisory, performance upgrades, and motorsports services. Find your perfect track car with unbiased recommendations for all budgets.',
  keywords: ['sports cars', 'track cars', 'performance upgrades', 'motorsports', 'car advisory', 'Porsche', 'BMW M', 'Corvette', 'GT cars'],
  authors: [{ name: 'SuperNatural Motorsports' }],
  creator: 'SuperNatural Motorsports',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://supernaturalmotorsports.com',
    siteName: 'SuperNatural Motorsports',
    title: 'SuperNatural Motorsports | Unleash Your Racing Spirit',
    description: 'Expert sports car advisory, performance upgrades, and motorsports services. Find your perfect track car with unbiased recommendations for all budgets.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SuperNatural Motorsports | Unleash Your Racing Spirit',
    description: 'Expert sports car advisory, performance upgrades, and motorsports services.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main style={{ flex: 1, paddingTop: 'var(--header-height-mobile)' }}>
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}

