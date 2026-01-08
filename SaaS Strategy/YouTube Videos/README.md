# YouTube GTM Research - Setup Guide

This directory contains YouTube video transcripts for analyzing SaaS go-to-market strategies.

## 📋 Overview

We've created a script (`scripts/fetch-youtube-gtm-research.mjs`) that:

1. **Fetches transcripts** for seed YouTube videos using Supadata API (with fallback to youtube-transcript library)
2. **Discovers similar videos** using Exa AI to find related SaaS/GTM content  
3. **Extracts metadata** like title, channel, views, and description
4. **Saves everything** as markdown files for easy analysis

## 🔑 Required API Keys

To run the script successfully, you need these API keys in your `.env.local` file:

### 1. **SUPADATA_API_KEY** (Required for reliable transcripts)

Supadata provides the most reliable YouTube transcript fetching, especially for:
- Age-restricted videos
- Videos with disabled captions
- Multiple language support

**Get your key:**
- Sign up at [https://supadata.ai](https://supadata.ai)
- Navigate to API settings
- Copy your API key
- Add to `.env.local`:

```bash
SUPADATA_API_KEY=your_key_here
```

**Pricing:** Free tier includes 100 requests, paid plans available for higher volume.

### 2. **EXA_API_KEY** (Optional - for video discovery)

Exa enables semantic search to discover similar SaaS/GTM videos based on your seed list.

**Get your key:**
- Sign up at [https://exa.ai](https://exa.ai)
- Get API key from dashboard
- Add to `.env.local`:

```bash
EXA_API_KEY=your_key_here
```

**Note:** Without this key, the script will only process your seed videos (no discovery).

### 3. **GOOGLE_API_KEY** (Optional - for video metadata)

YouTube Data API v3 provides video metadata (title, channel, views, description).

**Get your key:**
- Go to [Google Cloud Console](https://console.cloud.google.com/)
- Enable YouTube Data API v3
- Create API credentials
- Add to `.env.local`:

```bash
GOOGLE_API_KEY=your_key_here
```

**Note:** Without this key, videos will be saved with IDs only (no titles/metadata).

## 🚀 Running the Script

Once you have at least the `SUPADATA_API_KEY` configured:

```bash
cd "/Volumes/10TB External HD/01. Apps - WORKING/AutoRev"
node scripts/fetch-youtube-gtm-research.mjs
```

The script will:
1. Process all 17 seed videos
2. Discover up to 20 additional similar videos (if Exa key is set)
3. Save transcripts as markdown files in this directory
4. Create an INDEX.md file with all processed videos

## 📁 Output Format

Each video gets saved as a markdown file with:

```markdown
# Video Title

## Video Information
- Channel: Channel Name
- Published: Date
- Views: 1,234,567
- Likes: 12,345
- URL: https://www.youtube.com/watch?v=...

## Description
Video description here...

---

## Transcript
Full transcript text here...

---
*Fetched: 2025-01-06T...*
```

## 🎯 Seed Videos

The script processes these 17 videos by default:

1. https://www.youtube.com/watch?v=xeUhKuJbeWQ
2. https://www.youtube.com/watch?v=6P_H9eDNBcA
3. https://www.youtube.com/watch?v=RynySryqM_0
4. https://www.youtube.com/watch?v=8BtHk-oNlN0
5. https://www.youtube.com/watch?v=rO3dIBMXD2g
6. https://www.youtube.com/watch?v=67zh8_yiPh4
7. https://www.youtube.com/watch?v=jpSY4MlWX50
8. https://www.youtube.com/watch?v=Fzz1Xnnt17s
9. https://www.youtube.com/watch?v=LuOZ2PKvd4s
10. https://www.youtube.com/watch?v=k2jecxFu2as
11. https://www.youtube.com/watch?v=jSWuepkuFrU
12. https://www.youtube.com/watch?v=uWdIgftpvBI
13. https://www.youtube.com/watch?v=FCGpgPZqmkY
14. https://www.youtube.com/watch?v=ar9JCsiq6hs
15. https://www.youtube.com/watch?v=DJ4wg4eM1-o
16. https://www.youtube.com/watch?v=SddMq2nKsUA
17. https://www.youtube.com/watch?v=z_fARFqjLoY

## 🔍 Discovery Topics

If Exa API is enabled, the script searches for videos on these topics:

- SaaS go-to-market strategy lessons learned
- Product-led growth strategies for SaaS
- SaaS marketing and customer acquisition strategies
- Building a SaaS business from scratch
- SaaS pricing and monetization strategies
- Community-driven SaaS growth

## 📊 Analysis Ideas

Once you have the transcripts, you can analyze them for:

### GTM Strategy Patterns
- Customer acquisition channels that work
- Common mistakes to avoid
- Pricing strategy evolution
- Product-market fit signals

### Community Building
- How successful SaaS companies build communities
- Discord vs other platforms
- User-generated content strategies
- Beta program structures

### Marketing Tactics
- Content marketing approaches
- SEO strategies for SaaS
- Paid vs organic growth
- Viral loop mechanics

### Monetization
- Freemium vs paid-only
- Pricing tier structure
- Feature gating strategies
- Upsell and expansion revenue

## 🛠️ Customization

To modify the seed videos or discovery queries, edit `scripts/fetch-youtube-gtm-research.mjs`:

```javascript
// Change seed videos
const SEED_VIDEOS = [
  'https://www.youtube.com/watch?v=...',
  // Add more URLs here
];

// Change discovery queries
const searchQueries = [
  'Your custom query here',
  // Add more search terms
];

// Adjust limits
const MAX_DISCOVER_VIDEOS = 20; // Increase/decrease as needed
const DELAY_BETWEEN_REQUESTS = 1000; // Adjust rate limiting
```

## 📝 Next Steps

1. **Add API keys** to `.env.local`
2. **Run the script** to fetch all transcripts
3. **Review INDEX.md** to see what was fetched
4. **Analyze transcripts** for GTM insights
5. **Document findings** in a separate analysis document

## ⚠️ Important Notes

- **Rate Limits:** The script includes 1-second delays between requests to be respectful of APIs
- **Transcript Availability:** Not all videos have transcripts (creators can disable them)
- **Language:** The script prefers English transcripts but may return other languages
- **Cost:** Be aware of API usage limits on paid tiers
- **Privacy:** Don't commit `.env.local` with API keys to version control

## 🆘 Troubleshooting

### "No transcript available"
- Video may have captions disabled
- Video may be private or age-restricted
- Try with Supadata API key (more reliable than free library)

### "YouTube API error: 403"
- Google API key not set or quota exceeded
- Videos will still be processed, just without metadata

### "Exa search failed"
- Exa API key not set or invalid
- Only seed videos will be processed (no discovery)

---

**Last Updated:** 2025-01-06

