// Contact page layout with SEO metadata
// Since the contact page is a client component, we export metadata from this layout

export const metadata = {
  title: 'Contact Us | Ask a Question',
  description: 'Have a question about sports cars, performance upgrades, or the Car Selector? Reach out—we\'re drivers helping drivers. No sales pitch, just honest advice.',
  keywords: ['contact', 'sports car questions', 'car advice', 'performance help', 'motorsports community'],
  openGraph: {
    title: 'Contact Us | AutoRev',
    description: 'Have a question? Reach out—we\'re drivers helping drivers. No sales pitch, just honest advice.',
    url: '/contact',
    type: 'website',
  },
  twitter: {
    title: 'Contact Us | AutoRev',
    description: 'Have a question? Reach out—we\'re drivers helping drivers.',
  },
  alternates: {
    canonical: '/contact',
  },
};

export default function ContactLayout({ children }) {
  return children;
}


