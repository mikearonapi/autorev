/**
 * One-time script to send Discord notifications for all existing users
 * Run with: node scripts/notify-all-users.mjs
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK_SIGNUPS;

if (!DISCORD_WEBHOOK) {
  console.error('❌ DISCORD_WEBHOOK_SIGNUPS not configured');
  process.exit(1);
}

// All existing users from the database
const users = [
  {
    id: '3260fb82-c202-42c4-b51c-98dd6d83a390',
    email: 'mjaron5@gmail.com',
    name: 'Mike',
    provider: 'google',
    created_at: '2025-12-13 02:11:58'
  },
  {
    id: '5d5ea494-f799-459d-ac7a-0688417e471a',
    email: 'corhughes@gmail.com',
    name: 'Cory Hughes',
    provider: 'google',
    created_at: '2025-12-13 06:47:03'
  },
  {
    id: 'c33ab736-07ce-474b-987b-2708c267d1b2',
    email: 'brown.add@gmail.com',
    name: 'Aaron ZB',
    provider: 'google',
    created_at: '2025-12-18 01:30:03'
  },
  {
    id: '5485b823-3817-4b3e-9eab-6fd6cf2fc916',
    email: 'melle.oudega110@gmail.com',
    name: 'Melle Oudega',
    provider: 'google',
    created_at: '2025-12-27 20:56:32'
  }
];

async function sendNotification(user) {
  const signupDate = new Date(user.created_at);
  const formattedDate = signupDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const embed = {
    title: '👋 User Roster',
    color: 0x22c55e, // green
    fields: [
      { name: 'Name', value: user.name || 'Not provided', inline: true },
      { name: 'Email', value: user.email, inline: true },
      { name: 'Provider', value: user.provider || 'email', inline: true },
      { name: 'Tier', value: 'Free', inline: true },
      { name: '📅 Signed Up', value: formattedDate, inline: true },
    ],
    footer: { text: `User ID: ${user.id.slice(0, 8)}` },
    timestamp: new Date().toISOString(),
  };

  const response = await fetch(DISCORD_WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ embeds: [embed] }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return true;
}

async function main() {
  console.log(`📤 Sending notifications for ${users.length} users...\n`);

  for (const user of users) {
    try {
      await sendNotification(user);
      console.log(`✅ ${user.name} (${user.email})`);
      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 500));
    } catch (error) {
      console.error(`❌ Failed for ${user.email}:`, error.message);
    }
  }

  console.log('\n🎉 Done!');
}

main();

