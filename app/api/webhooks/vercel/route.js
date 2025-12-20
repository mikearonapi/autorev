import { NextResponse } from 'next/server';

// Vercel event types that indicate successful deployment
const SUCCESS_EVENTS = [
  'deployment.succeeded',
  'deployment-succeeded',
  'deployment.ready',
  'deployment-ready',
  'deployment_ready', // Vercel Integration webhook format
];

export async function POST(request) {
  try {
    const payload = await request.json();
    
    // Vercel sends different event types depending on webhook version
    const eventType = payload.type || payload.event;
    
    console.log('[Vercel Webhook] Received event:', eventType);
    console.log('[Vercel Webhook] Payload keys:', Object.keys(payload));
    
    // Only process deployment succeeded events
    if (!SUCCESS_EVENTS.includes(eventType)) {
      console.log('[Vercel Webhook] Ignoring event type:', eventType);
      return NextResponse.json({ message: 'Event ignored', eventType }, { status: 200 });
    }

    // Vercel webhook structure: { type, payload: { deployment: { meta: {...} } } }
    // Or sometimes: { type, payload: { meta: {...} } }
    const innerPayload = payload.payload || payload;
    const deployment = innerPayload.deployment || innerPayload;
    const meta = deployment.meta || innerPayload.meta || {};
    
    console.log('[Vercel Webhook] Inner payload keys:', Object.keys(innerPayload));
    console.log('[Vercel Webhook] Deployment keys:', Object.keys(deployment));
    console.log('[Vercel Webhook] Meta:', JSON.stringify(meta, null, 2));
    
    // Extract relevant info from meta (GitHub integration populates these)
    const projectName = deployment.name || innerPayload.name || payload.name || 'AutoRev';
    const url = deployment.url || innerPayload.url
      ? `https://${deployment.url || innerPayload.url}`
      : null;
    const commitMessage = meta.githubCommitMessage || meta.commitMessage || 'No commit message';
    const commitSha = (meta.githubCommitSha || meta.commitSha || '').slice(0, 7);
    const branch = meta.githubCommitRef || meta.branch || 'main';
    const author = meta.githubCommitAuthorName || meta.githubCommitAuthorLogin || deployment.creator?.username || 'Unknown';

    // Build Discord embed
    const embed = {
      title: `✅ Deployment Succeeded`,
      color: 0x22c55e, // green
      fields: [
        { name: 'Project', value: projectName, inline: true },
        { name: 'Branch', value: branch, inline: true },
        { name: 'Author', value: author, inline: true },
        { name: 'Commit', value: commitSha ? `\`${commitSha}\` ${commitMessage}` : commitMessage, inline: false },
      ],
      timestamp: new Date().toISOString(),
    };

    // Add URL if available
    if (url) {
      embed.url = url;
      embed.fields.push({ name: 'URL', value: url, inline: false });
    }

    // Send to Discord
    const webhookUrl = process.env.DISCORD_WEBHOOK_DEPLOYMENTS;
    
    if (!webhookUrl) {
      console.error('[Vercel Webhook] DISCORD_WEBHOOK_DEPLOYMENTS env var not set!');
      return NextResponse.json({ 
        error: 'No webhook configured',
        hint: 'Set DISCORD_WEBHOOK_DEPLOYMENTS environment variable'
      }, { status: 500 });
    }

    console.log('[Vercel Webhook] Sending to Discord...');
    console.log('[Vercel Webhook] Embed:', JSON.stringify(embed, null, 2));

    const discordResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] }),
    });

    if (!discordResponse.ok) {
      const errorText = await discordResponse.text().catch(() => 'No error body');
      console.error('[Vercel Webhook] Discord error:', discordResponse.status, errorText);
      return NextResponse.json({ 
        error: 'Discord webhook failed', 
        status: discordResponse.status,
        details: errorText 
      }, { status: 500 });
    }

    console.log('[Vercel Webhook] Successfully posted to Discord!');
    return NextResponse.json({ 
      success: true, 
      message: 'Deployment notification sent to Discord',
      project: projectName,
      branch 
    });

  } catch (error) {
    console.error('[Vercel Webhook] Error:', error);
    return NextResponse.json({ error: error.message, stack: error.stack?.slice(0, 500) }, { status: 500 });
  }
}

// Vercel may send GET to verify endpoint
export async function GET() {
  const hasWebhook = !!process.env.DISCORD_WEBHOOK_DEPLOYMENTS;
  return NextResponse.json({ 
    status: 'ok', 
    endpoint: 'vercel-webhook',
    discordConfigured: hasWebhook,
    acceptedEvents: SUCCESS_EVENTS,
    timestamp: new Date().toISOString() 
  });
}










