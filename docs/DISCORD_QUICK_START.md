# Discord Quick Start Guide

**Your Discord is now a powerful intelligence dashboard!**

---

## 🚀 Start Your Day (9am CST)

### 1. Check #daily-digest
**Look for:**
- 🚀 Wins (celebrate!)
- ⚠️ Alerts (need attention?)
- 📋 Action Items (your todo list for today)
- 📈 Trends (what's growing/shrinking)

### 2. Check #al-conversations
**Look for:**
- 💡 Content Gaps (what to write next)
- 🔥 Hot Topics (what users care about)
- ⚖️ Popular Comparisons (content ideas)

### 3. Prioritize Your Day
Use the action items from digest to plan your work.

---

## 📱 Throughout the Day

### #errors (Check when you see a notification)
**What you'll see:**
- Aggregated errors (not spam!)
- User impact (how many affected)
- Severity indicators

**What to do:**
- 🔴 Red = Critical → Fix immediately
- ⚠️ Amber = Major → Fix this week
- 🟡 Yellow = Minor → Backlog

### #signups (Real-time growth tracking)
**What you'll see:**
- Where they came from
- What car they were viewing
- Their first action

**What to do:**
- Note high-converting pages
- Celebrate when you see Google referrals
- Watch for patterns

### #contacts (Prioritized leads)
**What you'll see:**
- 🔥 HOT leads (engaged users) → Respond in 2 hours
- ⚡ WARM leads (some activity) → Respond in 24 hours
- ❄️ COLD leads (new visitors) → Respond when you can

**What to do:**
- Always prioritize HOT leads
- Check their activity history for context

### #feedback
User feedback (unchanged - already good)

### #event-submissions
Community event proposals (unchanged)

### #cron-summary
Automated job status (unchanged)

### #deployments
Code deployments with commit messages (already working)

---

## 📊 Weekly Review

### Monday Morning:
1. Review last week's daily digests for patterns
2. Note top AL topics → Plan content calendar
3. Review contact quality trends → Optimize acquisition

### What to Look For:
- **Consistent content gaps** → Write that content!
- **Trending cars** → Feature them prominently
- **Popular comparisons** → Create comparison guides
- **Expensive AL conversations** → Optimize prompts
- **High-converting pages** → Double down on that strategy

---

## 🎯 Quick Wins

### If you see this → Do this:
| Signal | Action |
|--------|--------|
| "GT3 vs GT4" asked 5x | Write comparison article |
| "What's Stage 2?" content gap | Add to encyclopedia |
| 0 signups alert | Check site/check Google Analytics |
| Hot lead from Performance Hub | Respond immediately with upgrade help |
| AL cost spike | Review conversation lengths |
| Error affecting 20+ users | Drop everything, fix now |

---

## 🧪 Testing

### Verify Everything Works:
```bash
cd "/Volumes/10TB External HD/01. Apps - WORKING/AutoRev"
node scripts/verify-discord-webhooks.js
```

### Test Digest Manually:
```bash
curl -X POST https://autorev.app/api/cron/daily-digest \
  -H "authorization: Bearer $CRON_SECRET"
```

---

## 📱 Discord Mobile App Tips

1. **Enable notifications for:**
   - #daily-digest (9am reminder)
   - #contacts (don't miss hot leads)
   - #errors (critical only)

2. **Mute everything else** (check when you want)

3. **Pin important channels** for quick access

---

## 🎓 Understanding the Data

### Lead Quality Scores:
- **🔥 HOT:** Active user (10+ actions in 7 days) OR new user with specific intent
- **⚡ WARM:** Some activity (3-9 actions) OR recent signup with general interest
- **❄️ COLD:** New visitor OR inactive user

### Error Severity:
- **Blocking:** Users can't complete actions → Fix immediately
- **Major:** Degraded experience → Fix soon
- **Minor:** Cosmetic/edge case → Backlog

### AL Content Gaps:
When AL says "I don't have specific data on..." → Content opportunity!

---

## 💡 Pro Tips

1. **Morning routine matters** - Check Discord before email
2. **Hot leads = money** - Always respond to 🔥 first
3. **Content gaps = SEO gold** - What users ask = what they Google
4. **Trends > absolutes** - ↑20% is more important than raw number
5. **Action items = priorities** - Do these before anything else

---

## ❓ Common Questions

**Q: Why didn't I get an error notification?**  
A: Errors are aggregated! Check #errors every 5 minutes, or if critical (10+ users) you'll get notified immediately.

**Q: Where are all my AL conversation notifications?**  
A: They're in the daily AL Intelligence Report (posted to #al-conversations once daily). This prevents spam.

**Q: How do I test if webhooks are working?**  
A: Run `node scripts/verify-discord-webhooks.js` from your project directory.

**Q: Can I get the digest at a different time?**  
A: Yes! Edit `vercel.json` cron schedule (currently `0 14 * * *` = 9am CST).

---

## 🆘 Troubleshooting

### Not getting notifications?
1. Check environment variables in Vercel
2. Run verification script
3. Check Discord webhook URLs are valid

### Digest looks wrong?
1. Manually trigger: `curl -X POST https://autorev.app/api/cron/daily-digest -H "authorization: Bearer $CRON_SECRET"`
2. Check logs in Vercel
3. Verify Supabase connection

---

## 📚 Full Documentation

- **Complete Analysis:** `DISCORD_CRITICAL_ANALYSIS.md`
- **Technical Audit:** `DISCORD_WEBHOOK_AUDIT.md`
- **Implementation Details:** `DISCORD_ENHANCEMENTS_COMPLETE.md`
- **Channel Reference:** `docs/DISCORD_CHANNEL_REFERENCE.md`

---

**You're all set! 🎉**

Your Discord is now your mission control for AutoRev.  
Check it daily, act on insights, and watch your product grow.

**Questions?** Just ask in chat!

