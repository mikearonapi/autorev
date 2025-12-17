import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const payload = await request.json();
    
    // Vercel sends different event types
    const eventType = payload.type;
    
    // Only process deployment succeeded events
    if (eventType !== 'deployment.succeeded' && eventType !== 'deployment-ready') {
      return NextResponse.json({ message: 'Event ignored' }, { status: 200 });
    }

    const deployment = payload.payload || payload;
    
    // Extract relevant info
    const projectName = deployment.name || deployment.project?.name || 'AutoRev';
    const url = deployment.url ? `https://${deployment.url}` : null;
    const commitMessage = deployment.meta?.githubCommitMessage || deployment.gitSource?.message || 'No commit message';
    const commitSha = deployment.meta?.githubCommitSha?.slice(0, 7) || deployment.gitSource?.sha?.slice(0, 7) || '';
    const branch = deployment.meta?.githubCommitRef || deployment.gitSource?.ref || 'main';
    const author = deployment.meta?.githubCommitAuthorName || deployment.creator?.username || 'Unknown';

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
      console.warn('[Vercel Webhook] No Discord webhook configured');
      return NextResponse.json({ message: 'No webhook configured' }, { status: 200 });
    }

    const discordResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] }),
    });

    if (!discordResponse.ok) {
      console.error('[Vercel Webhook] Discord error:', discordResponse.status);
      return NextResponse.json({ error: 'Discord webhook failed' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[Vercel Webhook] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Vercel may send GET to verify endpoint
export async function GET() {
  return NextResponse.json({ status: 'ok', endpoint: 'vercel-webhook', timestamp: new Date().toISOString() });
}
