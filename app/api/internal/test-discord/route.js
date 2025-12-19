/**
 * Discord Webhook Test Endpoint
 * 
 * Tests all 8 Discord notification channels with realistic data.
 * 
 * Channel Configuration:
 * - #feedback: User feedback submissions (bug reports, feature requests, data corrections)
 * - #signups: New user account creations
 * - #contacts: Contact form submissions (partnerships, media inquiries, general)
 * - #event-submissions: User-submitted events requiring moderation
 * - #al-conversations: New AL (AI assistant) chat sessions
 * - #cron-summary: Scheduled job completion notifications
 * - #errors: Critical errors and cron job failures
 * - #daily-digest: End-of-day summary posted at 9am EST
 * 
 * Usage: GET /api/internal/test-discord?secret=CRON_SECRET
 */

import { NextResponse } from 'next/server';
import {
  notifyFeedback,
  notifyContact,
  notifyError,
  notifySignup,
  notifyEventSubmission,
  notifyALConversation,
  notifyCronCompletion,
  postDailyDigest,
} from '@/lib/discord';

export async function GET(request) {
  // Simple auth check - require secret in query param
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results = {};

  // Test 1: Feedback - Bug report with severity
  results.feedback = await notifyFeedback({
    id: 'fb_8a7c3d21',
    category: 'bug',
    severity: 'major',
    message: 'The lap time comparison chart is showing incorrect data for Laguna Seca. When I select my 2023 Porsche 718 Cayman GT4, it displays times from a different track. This is affecting my ability to benchmark my performance.',
    page_url: '/garage/my-718-cayman-gt4/track',
    user_tier: 'Tuner',
  });

  // Test 2: Contact - Partnership inquiry
  results.contact = await notifyContact({
    name: 'Sarah Mitchell',
    email: 'sarah.mitchell@speedshop.com',
    interest: 'partnership',
    message: 'Hi! I run a performance tuning shop in Southern California specializing in Porsche and BMW builds. We\'d love to discuss partnering with AutoRev to provide verified dyno data and track times for our customer builds. We have over 200 documented builds with full performance data.',
  });

  // Test 3: Error - Cron job failure
  results.error = await notifyError(
    new Error('Failed to fetch YouTube transcripts: API rate limit exceeded'),
    { 
      source: 'YouTube Enrichment Cron',
      job: 'youtube-transcripts',
      route: '/api/cron/youtube-enrichment',
      details: 'Quota exceeded for youtube.videos.list. Daily limit: 10,000 units. Reset at midnight PST.'
    }
  );

  // Test 4: Signup - New user via Google OAuth
  results.signup = await notifySignup({
    id: 'usr_9k2m4p6l',
    email: 'james.rodriguez@gmail.com',
    provider: 'Google',
  });

  // Test 5: Event Submission - User-submitted track day
  results.eventSubmission = await notifyEventSubmission({
    id: 'evt_sub_7h3n2k',
    name: 'Buttonwillow Raceway Park - Advanced HPDE',
    event_type_slug: 'track-day',
    start_date: '2025-03-15',
    city: 'Buttonwillow',
    state: 'CA',
    source_url: 'https://speedventures.com/buttonwillow-march',
  });

  // Test 6: AL Conversation - User asking about upgrades
  results.alConversation = await notifyALConversation({
    id: 'conv_5t8r2w9q',
    firstMessage: 'I have a 2019 Mazda MX-5 Miata Club with the Brembo/BBS package. I want to add about 50hp naturally aspirated and improve handling for canyon driving. What upgrades do you recommend staying under $8k total?',
    carContext: '2019 Mazda MX-5 Miata',
    userTier: 'Enthusiast',
  });

  // Test 7: Cron Completion - YouTube enrichment success
  results.cronCompletion = await notifyCronCompletion('YouTube Enrichment', {
    duration: 127500, // 2 minutes 7.5 seconds
    processed: 47,
    succeeded: 44,
    failed: 3,
  });

  // Test 8: Daily Digest - End of day summary
  results.dailyDigest = await postDailyDigest({
    signups: 12,
    feedback: 8,
    contacts: 4,
    alConversations: 89,
    eventSubmissions: 3,
    errors: 2,
    unresolvedBugs: 5,
    topFeedbackCategories: ['bug (3)', 'feature (2)', 'data (2)', 'performance (1)'],
    cronJobs: {
      total: 6,
      succeeded: 5,
    },
  });

  // Summary
  const summary = {
    total: Object.keys(results).length,
    succeeded: Object.values(results).filter(r => r.success).length,
    failed: Object.values(results).filter(r => !r.success).length,
    results,
  };

  return NextResponse.json(summary);
}




