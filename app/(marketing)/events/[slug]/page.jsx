import { redirect } from 'next/navigation';

/**
 * /events/[slug] route - redirects to /community/events/[slug]
 * 
 * The canonical event detail URLs are at /community/events/[slug].
 * This redirect ensures SEO consistency and prevents duplicate content.
 */
export default async function EventRedirectPage({ params }) {
  const { slug } = await params;
  redirect(`/community/events/${slug}`);
}
