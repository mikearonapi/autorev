// Quick test script to verify Discord webhook
// Run with: node test-webhook.js

const webhookUrl = 'https://discordapp.com/api/webhooks/1450615733393559683/duU5xxlRV2pJAuaOZrl6DCq6tMdOORI5NF0Isb-VHbT4tGdl-LRZo_1S6XYWKmQvH05_';

const embed = {
  title: `✅ Deployment Succeeded`,
  color: 0x22c55e, // green
  fields: [
    { name: 'Project', value: 'autorev', inline: true },
    { name: 'Branch', value: 'main', inline: true },
    { name: 'Author', value: 'mikearonapi', inline: true },
    { name: 'Commit', value: '`ac51d04` feat: Add Vercel deployment webhook handler', inline: false },
    { name: 'URL', value: 'https://autorev.com', inline: false },
  ],
  timestamp: new Date().toISOString(),
};

fetch(webhookUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ embeds: [embed] }),
})
  .then(res => {
    console.log('Discord response status:', res.status);
    if (res.ok) {
      console.log('✅ Message sent successfully!');
    } else {
      console.error('❌ Discord returned error:', res.status);
      return res.text().then(text => console.error('Response:', text));
    }
  })
  .catch(err => console.error('❌ Error:', err));

