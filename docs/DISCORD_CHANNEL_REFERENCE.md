# Discord Channel Quick Reference

## 📺 Channel Overview

| Channel | Purpose | Trigger | Frequency |
|---------|---------|---------|-----------|
| **#deployments** | New code deployed | Vercel webhook | Per deployment |
| **#errors** | Site errors & bugs | Auto-errors, failures | As errors occur |
| **#cron-summary** | Automated jobs | Cron completion | Per scheduled job |
| **#feedback** | User feedback | Feedback form | As submitted |
| **#signups** | New users | Account creation | Per new user |
| **#contacts** | Contact form | Contact submission | As submitted |
| **#event-submissions** | Event proposals | Event form | As submitted |
| **#al-conversations** | AI questions | New AL chat | Per new conversation |
| **#daily-digest** | Daily summary | Scheduled cron | 9:00 AM CST daily |

---

## 🔧 Integration Map

```
USER ACTIONS                    DISCORD CHANNEL
═══════════════                 ═══════════════════

📝 Submits feedback          → #feedback
🐛 Error occurs             → #errors (auto)
📧 Submits contact form     → #contacts
👤 Creates account          → #signups
📅 Submits event            → #event-submissions
🤖 Starts AL conversation   → #al-conversations


SYSTEM ACTIONS                  DISCORD CHANNEL
══════════════                  ═══════════════════

🚀 Deployment completes     → #deployments
⏰ Cron job finishes        → #cron-summary
📊 Daily summary (9am)      → #daily-digest
```

---

## 📊 Cron Schedule

| Job | Schedule | Channel |
|-----|----------|---------|
| Process Scrape Jobs | Every 15 min | #cron-summary |
| Schedule Ingestion | Sundays 2am UTC | #cron-summary |
| Refresh Recalls | Sundays 2:30am UTC | #cron-summary |
| YouTube Enrichment | Mondays 4am UTC | #cron-summary |
| Refresh Complaints | Sundays 4am UTC | #cron-summary |
| Forum Scrape | Tue/Fri 5am UTC | #cron-summary |
| Refresh Events | Daily 6am UTC | #cron-summary |
| **Daily Digest** | **Daily 9am CST** | **#daily-digest** |

---

## 🎯 Environment Variables

```bash
# Production (Set in Vercel)
DISCORD_WEBHOOK_DEPLOYMENTS    # Vercel deployment hook
DISCORD_WEBHOOK_ERRORS         # Error logging
DISCORD_WEBHOOK_CRON           # Cron summaries
DISCORD_WEBHOOK_FEEDBACK       # User feedback
DISCORD_WEBHOOK_SIGNUPS        # New users
DISCORD_WEBHOOK_CONTACTS       # Contact form
DISCORD_WEBHOOK_EVENTS         # Event submissions
DISCORD_WEBHOOK_AL             # AL conversations
DISCORD_WEBHOOK_DIGEST         # Daily digest
```

---

## 🧪 Testing

```bash
# Verify all webhooks configured
node scripts/verify-discord-webhooks.js

# Test all webhooks with live messages
node scripts/verify-discord-webhooks.js --test

# Test specific webhook via API
curl -X POST "https://autorev.app/api/internal/test-discord?channel=al"
```

---

## 📂 Code Locations

| Integration | File Path |
|------------|-----------|
| Discord library | `lib/discord.js` |
| Deployments | `app/api/webhooks/vercel/route.js` |
| Errors | `lib/discord.js` (used everywhere) |
| Cron summary | `lib/discord.js` + all cron routes |
| Feedback | `app/api/feedback/route.js` |
| Signups | `app/auth/callback/route.js` |
| Contacts | `app/api/contact/route.js` |
| Events | `app/api/events/submit/route.js` |
| AL conversations | `app/api/ai-mechanic/route.js` |
| Daily digest | `app/api/cron/daily-digest/route.js` |

---

## 🚨 Troubleshooting

### Webhook not firing?

1. **Check environment variable is set:**
   ```bash
   node scripts/verify-discord-webhooks.js
   ```

2. **Check Vercel environment variables:**
   - Go to Vercel dashboard → Project Settings → Environment Variables
   - Verify the webhook URL is present and correct

3. **Test the webhook directly:**
   ```bash
   node scripts/verify-discord-webhooks.js --test
   ```

4. **Check Discord webhook URL is valid:**
   - Webhook should start with `https://discord.com/api/webhooks/` or `https://discordapp.com/api/webhooks/`
   - Test by sending a manual POST request

### AL conversations not showing?

**This is expected!** AL conversations only fire when a **new conversation** is created, not on every message. To verify it's working:

1. Start a completely new AL conversation (not in existing chat)
2. Check #al-conversations for the notification
3. Each conversation = 1 notification (prevents spam)

### Daily digest not arriving?

**Scheduled for 9:00 AM CST (14:00 UTC)**

Check:
1. Vercel cron job is enabled (check `vercel.json`)
2. `DISCORD_WEBHOOK_DIGEST` is set
3. Check Vercel logs for cron execution

---

## ✅ Health Check

Run this quick health check anytime:

```bash
# 1. Verify env vars
node scripts/verify-discord-webhooks.js

# 2. Test a webhook
curl -X POST "https://autorev.app/api/internal/test-discord?channel=feedback"

# 3. Check recent errors
# Visit: https://autorev.app/api/feedback?category=auto-error&limit=10
```

---

**Last Updated:** December 20, 2025

