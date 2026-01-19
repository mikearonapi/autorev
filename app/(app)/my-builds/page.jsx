import { redirect } from 'next/navigation';

/**
 * LEGACY PAGE - Redirects to /garage
 * 
 * This page was consolidated into the main garage page.
 * Keeping redirect for backwards compatibility with bookmarks/links.
 * 
 * Original code preserved in git history (commit 355f347)
 */
export default function MyBuildsRedirect() {
  redirect('/garage');
}
