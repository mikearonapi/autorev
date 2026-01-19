import { redirect } from 'next/navigation';

/**
 * LEGACY PAGE - Redirects to /garage/my-build
 * 
 * The mod-planner functionality has been consolidated into the
 * My Garage → My Build flow.
 * 
 * Original code preserved in git history (commit 355f347)
 */
export default function ModPlannerRedirect({ searchParams }) {
  // Preserve query params (car slug, build ID, etc.)
  const params = new URLSearchParams(searchParams).toString();
  const destination = params ? `/garage/my-build?${params}` : '/garage/my-build';
  redirect(destination);
}
