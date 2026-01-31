// Contact page layout with SEO metadata
// Since the contact page is a client component, we export metadata from this layout

import SchemaOrg from '@/components/SchemaOrg';
import { generatePageMetadata, generateContactPageSchema } from '@/lib/seoUtils';

export const metadata = generatePageMetadata({
  title: 'Contact Us | Ask a Question',
  description:
    "Have a question about sports cars, performance upgrades, or the Car Selector? Reach out—we're drivers helping drivers. No sales pitch, just honest advice.",
  path: '/contact',
  keywords: [
    'contact',
    'sports car questions',
    'car advice',
    'performance help',
    'motorsports community',
  ],
});

// ContactPage schema for local SEO
const contactSchema = generateContactPageSchema({
  path: '/contact',
  description:
    "Have a question about sports cars, performance upgrades, or the Car Selector? Reach out—we're drivers helping drivers. No sales pitch, just honest advice.",
});

export default function ContactLayout({ children }) {
  return (
    <>
      <SchemaOrg schema={contactSchema} />
      {children}
    </>
  );
}
