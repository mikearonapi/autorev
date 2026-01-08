import { redirect } from 'next/navigation';

/**
 * /events route - redirects to /community/events
 * 
 * The main events browsing page is at /community/events.
 * This redirect ensures users who navigate directly to /events
 * are taken to the correct page.
 * 
 * Route structure:
 * - /community/events - Browse all events
 * - /events/saved - User's saved events
 * - /events/submit - Submit a new event
 */
export default function EventsPage() {
  redirect('/community/events');
}
