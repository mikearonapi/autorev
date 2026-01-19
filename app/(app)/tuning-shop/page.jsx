import { redirect } from 'next/navigation';

/**
 * Redirect /tuning-shop to /garage/tuning-shop
 * This maintains backwards compatibility for existing links.
 */
export default function TuningShopRedirect({ searchParams }) {
  // Preserve any query parameters
  const params = new URLSearchParams(searchParams).toString();
  const destination = params ? `/garage/tuning-shop?${params}` : '/garage/tuning-shop';
  redirect(destination);
}
