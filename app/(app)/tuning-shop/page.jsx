import { redirect } from 'next/navigation';

/**
 * LEGACY ROUTE - Redirects directly to /garage/my-build
 * 
 * Simplified from: /tuning-shop → /garage/tuning-shop → /garage/my-build
 * Now goes directly to final destination.
 */
export default function TuningShopRedirect({ searchParams }) {
  const params = new URLSearchParams(searchParams).toString();
  const destination = params ? `/garage/my-build?${params}` : '/garage/my-build';
  redirect(destination);
}
