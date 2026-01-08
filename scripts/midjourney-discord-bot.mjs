#!/usr/bin/env node
/**
 * MidJourney Discord Bot - Direct Integration
 * 
 * Automates MidJourney image generation by interacting directly with
 * the MidJourney Discord bot via Discord API (no third-party service needed)
 * 
 * Based on how useapi.net works, but free and self-hosted.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import WebSocket from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Load environment variables
const envPath = path.join(PROJECT_ROOT, '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && !key.startsWith('#')) {
      let value = valueParts.join('=').trim();
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      process.env[key.trim()] = value;
    }
  });
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const DISCORD_TOKEN = process.env.DISCORD_TOKEN; // Your Discord user token
const MIDJOURNEY_BOT_ID = '936929561302675456'; // MidJourney bot's Discord ID
const DISCORD_API_BASE = 'https://discord.com/api/v10';

// Your DM channel with MidJourney bot (get from Discord URL)
// Format: discord.com/channels/@me/CHANNEL_ID
const MIDJOURNEY_CHANNEL_ID = process.env.MIDJOURNEY_CHANNEL_ID;

// ============================================================================
// DISCORD API CLIENT
// ============================================================================

class DiscordClient {
  constructor(token) {
    this.token = token;
    this.headers = {
      'Authorization': token,
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    };
  }

  /**
   * Send a message to a Discord channel
   */
  async sendMessage(channelId, content) {
    const response = await fetch(`${DISCORD_API_BASE}/channels/${channelId}/messages`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Discord API error: ${response.status} - ${error}`);
    }

    return await response.json();
  }

  /**
   * Get messages from a channel
   */
  async getMessages(channelId, limit = 50) {
    const response = await fetch(
      `${DISCORD_API_BASE}/channels/${channelId}/messages?limit=${limit}`,
      { headers: this.headers }
    );

    if (!response.ok) {
      throw new Error(`Failed to get messages: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Send a slash command interaction (more advanced)
   */
  async sendSlashCommand(channelId, commandName, options) {
    // This requires Discord application ID and interaction endpoint
    // Simplified version - may need adjustment based on Discord's requirements
    const response = await fetch(`${DISCORD_API_BASE}/interactions`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({
        type: 2, // APPLICATION_COMMAND
        application_id: MIDJOURNEY_BOT_ID,
        channel_id: channelId,
        data: {
          name: commandName,
          options: options,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Interaction error: ${response.status} - ${error}`);
    }

    return await response.json();
  }

  /**
   * Download an attachment from Discord CDN
   */
  async downloadAttachment(url, outputPath) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download: ${response.status}`);
    }

    const buffer = await response.arrayBuffer();
    fs.writeFileSync(outputPath, Buffer.from(buffer));
    return outputPath;
  }
}

// ============================================================================
// MIDJOURNEY BOT CLIENT
// ============================================================================

class MidJourneyClient {
  constructor(discordToken, channelId) {
    this.discord = new DiscordClient(discordToken);
    this.channelId = channelId;
  }

  /**
   * Generate an image using /imagine
   * 
   * Method 1: Simple message-based approach
   * Send "/imagine prompt: <your prompt>" as a regular message
   */
  async imagine(prompt) {
    console.log(`🎨 Generating image with prompt: "${prompt}"`);
    
    // Send the imagine command as a message
    const command = `/imagine prompt: ${prompt}`;
    await this.discord.sendMessage(this.channelId, command);

    console.log('   ⏳ Waiting for MidJourney to respond...');
    
    // Poll for the response
    const result = await this.waitForImageGeneration(prompt);
    return result;
  }

  /**
   * Wait for MidJourney to finish generating the image
   * Polls the channel for new messages with attachments
   */
  async waitForImageGeneration(prompt, maxWaitTime = 120000) {
    const startTime = Date.now();
    const pollInterval = 5000; // Check every 5 seconds

    while (Date.now() - startTime < maxWaitTime) {
      await new Promise(r => setTimeout(r, pollInterval));

      // Get recent messages
      const messages = await this.discord.getMessages(this.channelId, 10);

      // Find messages from MidJourney bot
      for (const msg of messages) {
        // Check if it's from MidJourney and has attachments
        if (msg.author?.id === MIDJOURNEY_BOT_ID && msg.attachments?.length > 0) {
          // Check if message content contains our prompt (partial match)
          const isOurPrompt = msg.content?.toLowerCase().includes(
            prompt.toLowerCase().slice(0, 30)
          );

          if (isOurPrompt) {
            console.log('   ✅ Image generated!');
            
            // Get the first attachment (the generated image)
            const attachment = msg.attachments[0];
            
            return {
              url: attachment.url,
              filename: attachment.filename,
              message: msg,
            };
          }
        }
      }

      process.stdout.write('.');
    }

    throw new Error('Timeout waiting for MidJourney response');
  }

  /**
   * Download the generated image
   */
  async downloadImage(imageData, outputDir) {
    const outputPath = path.join(outputDir, imageData.filename);
    await this.discord.downloadAttachment(imageData.url, outputPath);
    console.log(`   💾 Saved to: ${outputPath}`);
    return outputPath;
  }

  /**
   * Upscale a specific variation (U1, U2, U3, U4)
   * 
   * This requires clicking the buttons on MidJourney's response message
   * Discord uses "components" for buttons - this is more complex
   */
  async upscale(messageId, index) {
    // TODO: Implement button interaction
    // This requires sending a MESSAGE_COMPONENT interaction
    console.log(`   ⚠️  Upscale feature not yet implemented (would click U${index})`);
  }

  /**
   * Create variations (V1, V2, V3, V4)
   */
  async variation(messageId, index) {
    // TODO: Implement button interaction
    console.log(`   ⚠️  Variation feature not yet implemented (would click V${index})`);
  }
}

// ============================================================================
// EXAMPLE USAGE
// ============================================================================

async function generateCarImage(car, type = 'opening') {
  if (!DISCORD_TOKEN) {
    throw new Error('DISCORD_TOKEN not found in .env.local');
  }

  if (!MIDJOURNEY_CHANNEL_ID) {
    throw new Error('MIDJOURNEY_CHANNEL_ID not found in .env.local');
  }

  const mj = new MidJourneyClient(DISCORD_TOKEN, MIDJOURNEY_CHANNEL_ID);

  // Define prompts
  const prompts = {
    opening: `${car.color} ${car.name} in a professional garage workshop, front angle, cinematic lighting, motorsport aesthetic, hyper-realistic photography --ar 9:16 --style raw`,
    scenic: `${car.color} ${car.name} on mountain road at golden hour, dramatic landscape, rear three-quarter view, automotive photography --ar 9:16 --style raw`,
    wheel: `close-up of ${car.color} ${car.name} wheel and tire, professional automotive photography, dramatic lighting --ar 9:16 --style raw`,
  };

  const prompt = prompts[type] || prompts.opening;

  try {
    // Generate image
    const imageData = await mj.imagine(prompt);

    // Download it
    const outputDir = path.join(PROJECT_ROOT, 'generated-videos', 'MidJourney', car.slug);
    fs.mkdirSync(outputDir, { recursive: true });
    
    const imagePath = await mj.downloadImage(imageData, outputDir);

    return imagePath;

  } catch (error) {
    console.error('❌ MidJourney generation failed:', error.message);
    throw error;
  }
}

// ============================================================================
// CLI
// ============================================================================

const args = process.argv.slice(2);
const command = args[0];

if (command === 'test') {
  // Test generation
  const testCar = {
    slug: 'bmw-m3',
    name: 'BMW M3',
    color: 'Alpine White',
  };

  generateCarImage(testCar, 'opening')
    .then(path => console.log(`\n✅ Success! Image saved to: ${path}`))
    .catch(err => console.error(`\n❌ Failed:`, err));

} else {
  console.log(`
╔══════════════════════════════════════════════════════════════════╗
║            MidJourney Discord Bot - Direct Integration            ║
╚══════════════════════════════════════════════════════════════════╝

This script interacts with MidJourney directly via Discord API.
No third-party service needed!

SETUP:
1. Add to .env.local:
   DISCORD_TOKEN="your_discord_token_here"
   MIDJOURNEY_CHANNEL_ID="your_dm_channel_id"

2. Get your Discord token:
   - Open Discord in browser
   - Press F12 (Developer Tools)
   - Go to Network tab
   - Refresh page
   - Filter by "/messages"
   - Find "Authorization" header - that's your token

3. Get your MidJourney DM channel ID:
   - Open MidJourney bot DM in Discord
   - Copy channel ID from URL: discord.com/channels/@me/CHANNEL_ID

USAGE:
  node midjourney-discord-bot.mjs test

FEATURES:
  ✅ /imagine command
  ✅ Wait for generation
  ✅ Download images
  ⏳ Upscale (TODO)
  ⏳ Variations (TODO)

IMPORTANT:
  - Don't share your Discord token
  - MidJourney subscription still required
  - Respect Discord rate limits
  - Don't spam commands
`);
}

export { MidJourneyClient, generateCarImage };


