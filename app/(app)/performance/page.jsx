import { redirect } from 'next/navigation';

/**
 * LEGACY PAGE - Redirects to /data
 * 
 * Performance data functionality has been consolidated into the
 * /data page (My Data hub).
 * 
 * Original code preserved in git history (commit 355f347)
 */
export default function PerformanceRedirect({ searchParams }) {
  // Preserve query params (vehicle ID, etc.)
  const params = new URLSearchParams(searchParams).toString();
  const destination = params ? `/data?${params}` : '/data';
  redirect(destination);
}
