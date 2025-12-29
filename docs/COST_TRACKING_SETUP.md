# Cost Tracking Integration Guide

> How to connect external service costs to the AutoRev Admin Dashboard

## Overview

The Admin Dashboard tracks costs from multiple sources:

| Source Type | Status | Automation Level |
|-------------|--------|------------------|
| **Anthropic API (AL)** | ✅ Already tracking | Full automation (internal + optional Admin API) |
| **Stripe Revenue** | ✅ Already connected | Full automation |
| **Supabase Usage** | ✅ Already tracking | Automated estimation |
| **Vercel Deployments** | ✅ Showing metrics | Manual cost entry |
| **Cursor IDE** | ⚠️ Manual entry | No API available |
| **Claude Pro subscription** | ⚠️ Manual entry | No API available |
| **Google Cloud** | ⚠️ Optional | Full automation available |

---

## 1. Anthropic Admin API (Recommended)

Get **real-time billing data** directly from Anthropic's servers.

### Setup Steps

1. Go to [console.anthropic.com/settings/admin-api-keys](https://console.anthropic.com/settings/admin-api-keys)
2. Create a new Admin API key (different from your regular API key)
3. Add to your environment variables:

```bash
ANTHROPIC_ADMIN_API_KEY=sk-admin-xxxxxxxxxxxx
```

### What It Provides

- Actual cost data from Anthropic's billing system
- Token usage broken down by model
- Historical cost reports by date range
- Compares against your internal tracking for discrepancies

### Cost

Free - uses your existing Anthropic account.

---

## 2. Internal Token Tracking (Already Active)

Your app already tracks every AL conversation with detailed token counts.

### How It Works

Every Claude API call logs to `al_usage_logs`:
- Input tokens
- Output tokens  
- Estimated cost (calculated from token pricing)
- Tool calls used
- Purpose (user chat vs admin insights)

### View in Admin Panel

Navigate to **Financials → Cost Tracking Integrations** to see:
- Total tokens used this period
- Cost estimates based on current pricing
- Comparison with Anthropic Admin API (if configured)

---

## 3. Cursor IDE Costs

**No API available.** Cursor doesn't expose billing data programmatically.

### Manual Tracking Options

1. **Monthly Cost Entry**: Add a recurring cost entry on your billing date
2. **Check Subscription**: Go to Cursor → Settings → Account to see your plan
3. **Pricing Reference**:
   - Hobby: Free
   - Pro: $20/month
   - Pro+: $60/month
   - Ultra: $200/month
   - Teams: $40/user/month

### How to Add Cost Entry

1. Go to Admin Dashboard → Financials tab
2. Click "Add Cost"
3. Fill in:
   - **Vendor**: Cursor
   - **Category**: Development Tools
   - **GL Code**: 6210 (Development Tools)
   - **Amount**: Your monthly subscription cost
   - **Description**: "Cursor Pro subscription"
   - **Recurring**: Yes, Monthly

### Pro Tip: Community Extension

There's a community-built [Cursor Usage Tracker extension](https://forum.cursor.com/t/cursor-usage-tracker-extension/47111) that shows your usage within the IDE, but it doesn't export to external systems.

---

## 4. Vercel Costs

**Limited API access.** Vercel shows deployment metrics but not billing data directly.

### What's Already Tracked

- Deployment success rate
- Build times
- Domain health
- Cron job status

### For Billing Data

Add monthly cost entries:
- **Hobby**: Free
- **Pro**: $20/month
- **Enterprise**: Custom pricing

---

## 5. Google Cloud Costs (Optional)

If you use Google Cloud services (Vertex AI, Cloud Functions, etc.), you can connect the billing API.

### Setup Steps

1. Enable the Cloud Billing API:
   ```
   gcloud services enable cloudbilling.googleapis.com
   ```

2. Create a service account with Billing Viewer role

3. Export billing to BigQuery for detailed analysis (recommended):
   - Cloud Console → Billing → Export
   - Export to BigQuery daily/monthly

4. Add environment variables:
   ```bash
   GOOGLE_CLOUD_BILLING_KEY=<service-account-json>
   GOOGLE_CLOUD_PROJECT_ID=your-project-id
   ```

### What It Provides

- Daily/monthly cost breakdowns
- Cost by service (Vertex AI, Cloud Run, etc.)
- Alerts for budget thresholds

---

## 6. Stripe (Already Connected)

Revenue tracking is fully automated through the Stripe API.

### What's Tracked

- Monthly Recurring Revenue (MRR)
- Annual Recurring Revenue (ARR)
- Active subscriptions
- Payment history
- Customer metrics

### View in Admin Panel

Navigate to **Revenue** tab or see the summary on **Overview**.

---

## Recommended Monthly Routine

### At Start of Month

1. Review last month's costs in Financials tab
2. Add any missing manual entries (Cursor, Vercel, etc.)
3. Check Anthropic Admin API alignment with internal tracking

### Weekly

1. Glance at Operations → AL Usage Analytics for token trends
2. Check for any alert spikes in variable costs

### On Billing Dates

Add cost entries for fixed subscriptions:
- Cursor: ~$20-200/month
- Vercel: ~$20/month (if Pro)
- Supabase: ~$25-50/month (if Pro)
- Claude Pro: ~$20/month (if applicable)
- Domain: ~$12/year

---

## Environment Variables Summary

```bash
# Required for enhanced cost tracking
ANTHROPIC_ADMIN_API_KEY=sk-admin-xxxx     # Anthropic Admin API (optional but recommended)

# Optional - Google Cloud Billing
GOOGLE_CLOUD_BILLING_KEY={"type":"service_account",...}
GOOGLE_CLOUD_PROJECT_ID=my-project-id

# Already configured (existing)
ANTHROPIC_API_KEY=sk-ant-xxxx             # Your regular API key (for AL)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxxxx
STRIPE_SECRET_KEY=sk_live_xxxx
```

---

## FAQ

### Why can't I connect Cursor directly?

Cursor doesn't offer a public billing API. Only Enterprise plans get access to analytics/audit features. For now, manual monthly entries are the only option.

### How accurate is the internal token tracking?

Very accurate for Claude API costs. We log actual token counts from each response. The main source of variance would be if there are API calls not routed through our logging system.

### Should I set up the Anthropic Admin API?

**Yes, recommended.** It's free and gives you an independent verification of your AI costs. It can catch discrepancies between what we track internally and what Anthropic actually charges.

### What about Vercel's AI Gateway?

If you're using Vercel's AI Gateway for LLM routing, they have their own usage endpoints. However, since you're calling Claude directly, this doesn't apply.

---

## Files Created/Modified

| File | Purpose |
|------|---------|
| `app/api/admin/external-costs/route.js` | API for fetching external service costs |
| `app/admin/components/CostIntegrations.jsx` | UI component showing integration status |
| `app/admin/components/CostIntegrations.module.css` | Styles for the component |
| `app/admin/page.jsx` | Updated to include CostIntegrations |

---

## Need Help?

- Check the Admin Dashboard → Financials → Cost Tracking Integrations
- Review the recommendations panel for specific setup guides
- Add cost entries manually for services without APIs


