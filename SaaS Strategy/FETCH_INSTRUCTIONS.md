# YouTube GTM Research - Fetch Instructions

## Quick Start

I've created a comprehensive script to fetch **47 YouTube video transcripts** for your SaaS GTM strategy research:

- **17 seed videos** (your original list)
- **10 videos** on GTM mistakes and lessons
- **10 videos** on community building and PLG
- **10 videos** on pricing and monetization

## Getting the SUPADATA_API_KEY

The Supadata API key is required to fetch transcripts. You have several options:

### Option 1: From Vercel Environment

The key is likely already set in your Vercel project. To get it:

```bash
# Install Vercel CLI if you haven't
npm i -g vercel

# Login to Vercel
vercel login

# Pull environment variables
vercel env pull

# This will create a .env.local file with all your Vercel env vars
```

### Option 2: From Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Select your AutoRev project
3. Go to Settings → Environment Variables
4. Find `SUPADATA_API_KEY`
5. Copy the value

### Option 3: Get a New Key

If the key isn't in Vercel, get a new one:

1. Go to [https://supadata.ai](https://supadata.ai)
2. Sign up / Log in
3. Navigate to API settings
4. Copy your API key
5. Add to `.env.local`:

```bash
SUPADATA_API_KEY=your_key_here
EXA_API_KEY=your_exa_key_here  # Optional, for video discovery
GOOGLE_API_KEY=your_google_key_here  # Optional, for video metadata
```

## Running the Script

Once you have the SUPADATA_API_KEY:

```bash
# Method 1: If key is in .env.local
cd "/Volumes/10TB External HD/01. Apps - WORKING/AutoRev"
node scripts/fetch-youtube-gtm-research.mjs

# Method 2: Pass key directly
SUPADATA_API_KEY=your_key_here node scripts/fetch-youtube-gtm-research.mjs

# Method 3: Export and run
export SUPADATA_API_KEY=your_key_here
node scripts/fetch-youtube-gtm-research.mjs
```

## What the Script Does

The script will:

1. ✅ Fetch transcripts for all 47 videos using Supadata API
2. ✅ Extract video metadata (title, channel, views, description) if Google API key is available
3. ✅ Save each video as a formatted markdown file
4. ✅ Create an INDEX.md file organizing videos by category
5. ✅ Report success/failure stats

## Expected Output

```
📁 SaaS Strategy/YouTube Videos/
├── INDEX.md                                          # Master index
├── README.md                                         # Setup guide
├── FETCH_INSTRUCTIONS.md                             # This file
├── top-10-gtm-mistakes-jason-lemkin-7igT_vZGxsA.md  # Example video
├── freemium-vs-premium-gvV-ZgXdfUM.md                # Example video
└── ... (47 total video transcript files)
```

Each markdown file contains:
- Video title and metadata
- Full transcript (formatted for readability)
- Direct YouTube link
- Fetch timestamp

## Video Categories

### 🎯 Seed Videos (17)
Your original list of videos

### 🚫 GTM Mistakes & Lessons (10)
- Top 10 GTM Mistakes (Jason Lemkin, SaaStr)
- Vertical SaaS pitfalls
- Common avoidable mistakes
- Scaling strategies

### 👥 Community & PLG Strategy (10)
- Community-led growth
- Product-led growth tactics
- PLG + Sales-led hybrid
- Community activation strategies

### 💰 Pricing & Monetization (10)
- Freemium vs Premium
- Value-based pricing
- Tier strategies
- 2025-2026 monetization trends

## Next Steps After Fetching

Once you have all transcripts:

1. **Cross-Reference Analysis**: Compare strategies across successful SaaS companies
2. **Extract Patterns**: Identify common themes in GTM approaches
3. **Avoid Mistakes**: Document frequently mentioned pitfalls
4. **Apply to AutoRev**: Map lessons to AutoRev's specific context (car enthusiast community, tier-based pricing, Discord integration)

## Troubleshooting

### "SUPADATA_API_KEY is required"
- The API key isn't set. Follow instructions above to get it.

### "No transcript available"
- Some videos may have captions disabled
- Supadata usually handles this better than free libraries
- Check if video is private or age-restricted

### "YouTube API error: 403"
- Google API key not set or quota exceeded
- Script will still work, just without metadata
- Videos will be named by ID instead of title

### Rate Limits
- Script includes 2-second delays between requests
- Respects API rate limits
- For 47 videos: ~2-3 minutes total runtime

## Cost Estimate

- **Supadata API**: Free tier includes 100 requests (47 videos = 47 requests)
- **Google YouTube Data API**: Free quota should cover this easily
- **Total cost**: $0 if using free tiers

## Questions?

If you encounter issues:
1. Check that API key is properly set in environment
2. Verify the key works by testing with one video first
3. Check Supadata dashboard for quota/usage
4. Ensure internet connection is stable

---

**Created**: 2025-01-06  
**Last Updated**: 2025-01-06  
**Script Location**: `scripts/fetch-youtube-gtm-research.mjs`

