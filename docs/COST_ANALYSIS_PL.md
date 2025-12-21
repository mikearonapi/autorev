# AutoRev Cost Analysis & P&L

> Comprehensive breakdown of all project costs organized by category
>
> **Created:** December 20, 2024
> **Last Updated:** December 20, 2024

---

## Executive Summary

| Category | Monthly Cost | Type |
|----------|-------------|------|
| **Fixed Monthly Costs** | ~$365 | Recurring |
| **Variable Monthly Costs** | ~$10-100 | Usage-based |
| **R&D / Development Costs** | ~$2,300+ | Investment phase |
| **TOTAL OPERATING** | **~$375-465/mo** | Excluding R&D |

---

## 1. Fixed Monthly Costs

> Predictable recurring costs regardless of usage

### 1.1 Infrastructure

| Service | Cost/Month | Notes |
|---------|-----------|-------|
| **Supabase Pro** | $45 | Database, auth, storage |
| **Vercel Pro** | $20 | Hosting, serverless, cron jobs |
| **Domain (autorev.app)** | ~$1 | Annual amortized |
| **SUBTOTAL** | **$66** | |

### 1.2 Communication & Email

| Service | Cost/Month | Notes |
|---------|-----------|-------|
| **Resend** | $0 | Free tier (3K emails/mo) |
| **Discord** | $0 | Webhooks are free |
| **SUBTOTAL** | **$0** | |

### 1.3 Development Tools (Ongoing)

| Service | Cost/Month | Notes |
|---------|-----------|-------|
| **Cursor Max** | $200 | AI-powered IDE |
| **Claude Pro/Max** | $100 | Development AI assistant |
| **SUBTOTAL** | **$300** | |

### 📊 Fixed Monthly Total: **$366**

---

## 2. Variable Monthly Costs

> Costs that scale with product usage (tied to users over time)

### 2.1 AI Production Costs (User-Facing)

| Service | Cost Structure | Est. Monthly |
|---------|---------------|--------------|
| **Anthropic Claude API** (AL Assistant) | $3/M input, $15/M output | $10-50 |
| **OpenAI Embeddings** | $0.02/M tokens | $0-5 |
| **SUBTOTAL** | | **$10-55** |

**Usage Scaling:**
| User Level | AL Chats/Mo | Est. API Cost |
|------------|------------|---------------|
| 100 users | ~200 chats | ~$5-10 |
| 500 users | ~1,000 chats | ~$20-40 |
| 1,000 users | ~2,000 chats | ~$40-80 |
| 5,000 users | ~10,000 chats | ~$150-300 |

### 2.2 Infrastructure Overages

| Service | Cost Structure | Est. Monthly |
|---------|---------------|--------------|
| **Vercel Bandwidth** | $0.15/GB over 100GB | $0-40 |
| **Vercel Functions** | $0.18/GB-hr over 100GB-hrs | $0-20 |
| **Vercel Blob Storage** | $0.15/GB + reads | $0-10 |
| **Supabase Overages** | After 8GB storage | $0 |
| **SUBTOTAL** | | **$0-70** |

### 2.3 External APIs

| Service | Cost Structure | Est. Monthly |
|---------|---------------|--------------|
| **Google Cloud** | $200/mo free credit | $0 |
| **YouTube API** | 10K units/day free | $0 |
| **NHTSA/EPA** | Government (free) | $0 |
| **SUBTOTAL** | | **$0** |

### 📊 Variable Monthly Total: **$10-125**

---

## 3. R&D / Development Costs

> One-time or investment-phase costs for building the product

### 3.1 AI Development Usage (Cursor API)

| Period | Cost | Notes |
|--------|------|-------|
| **Development to Date** | ~$2,000+ | Cursor API usage beyond $200/mo |
| **Ongoing R&D** | ~$100-500/mo | New feature development |

### 3.2 Initial Data Pipeline Costs

| Item | Cost | Status |
|------|------|--------|
| Initial data seeding (AI) | ~$30 | ✅ Complete |
| Knowledge base embedding | ~$10 | ✅ Complete |
| YouTube video processing | ~$15 | ✅ Complete |
| Forum insight extraction | ~$25 | ✅ Complete |
| **SUBTOTAL** | **~$80** | One-time |

### 3.3 Future R&D Investments

| Item | Est. Cost | Timeline |
|------|----------|----------|
| Stripe integration | ~$50 (dev time) | Post-beta |
| Rate limiting (Upstash) | $10-25/mo | At 1K users |
| Advanced caching (Redis) | $25/mo | At 1K users |
| Error tracking (Sentry) | $0-26/mo | Optional |

### 📊 R&D Total to Date: **~$2,300+**

---

## 4. Cost Summary by Category

### Operating Costs (Monthly)

| Category | Fixed | Variable | Total Range |
|----------|-------|----------|-------------|
| Infrastructure | $66 | $0-70 | $66-136 |
| AI Production | $0 | $10-55 | $10-55 |
| Communication | $0 | $0 | $0 |
| Dev Tools | $300 | $0 | $300 |
| **MONTHLY OPERATING** | **$366** | **$10-125** | **$376-491** |

### R&D Costs (Investment)

| Category | To Date | Monthly Ongoing |
|----------|---------|-----------------|
| Cursor API (dev usage) | $2,000+ | $100-500 |
| Data pipeline setup | $80 | $0 |
| **TOTAL R&D** | **$2,080+** | **$100-500** |

---

## 5. Service Inventory

### Production Services (Required)

| Service | Tier | Cost | Purpose |
|---------|------|------|---------|
| Supabase | Pro | $45/mo | PostgreSQL, Auth, Storage |
| Vercel | Pro | $20/mo | Hosting, Serverless, Cron |
| Anthropic | API | Variable | AL Assistant |
| OpenAI | API | Variable | Embeddings |
| Resend | Free | $0 | Transactional email |
| Discord | Free | $0 | Webhooks/notifications |
| Google Cloud | Free tier | $0 | YouTube, Maps, Geocoding |

### Development Services (R&D)

| Service | Tier | Cost | Purpose |
|---------|------|------|---------|
| Cursor | Max | $200/mo | AI IDE |
| Claude | Pro/Max | $100/mo | Development AI |
| GitHub | Free | $0 | Version control |

### Free/Government APIs

| Service | Purpose |
|---------|---------|
| NHTSA | Safety ratings, recalls, complaints |
| EPA | Fuel economy data |
| Eventbrite | Event discovery |

---

## 6. Revenue Model & Break-Even

### Subscription Tiers (Post-Beta)

| Tier | Price | Net (after Stripe) | Target User |
|------|-------|-------------------|-------------|
| Free | $0 | $0 | Browsers |
| Enthusiast | $4.99/mo | $4.54 | Car owners |
| Tuner | $9.99/mo | $9.40 | Modifiers |

### Break-Even Analysis

**Monthly Operating Costs:** ~$375-450

| Scenario | Paying Users | Avg Revenue | MRR | Profit |
|----------|-------------|-------------|-----|--------|
| Break-even (min) | 50 | $7.50 | $375 | $0 |
| Break-even (safe) | 60 | $7.50 | $450 | $0 |
| Target (100 users) | 100 | $7.50 | $750 | +$300 |
| Growth (500 users) | 500 | $7.50 | $3,750 | +$3,300 |

### Conversion Assumptions

| Total Users | Conversion Rate | Paying Users |
|-------------|----------------|--------------|
| 500 | 10% | 50 |
| 600 | 10% | 60 |
| 1,000 | 10% | 100 |
| 5,000 | 10% | 500 |

---

## 7. Scaling Projections

### Cost Scaling by User Count

| Users | Fixed | Variable | R&D | Total |
|-------|-------|----------|-----|-------|
| 100 | $366 | $15 | $200 | $581 |
| 500 | $366 | $35 | $200 | $601 |
| 1,000 | $366 | $60 | $200 | $626 |
| 5,000 | $366 | $200 | $200 | $766 |
| 10,000 | $466* | $400 | $200 | $1,066 |

*At 10K users, may need Supabase Team ($599) and other scaling infrastructure.

### Infrastructure Trigger Points

| Milestone | Action Needed | Added Cost |
|-----------|--------------|------------|
| 1K users | Add Upstash Redis | +$10-25/mo |
| 1K users | Enable PgBouncer | $0 |
| 5K users | Upgrade Vercel | +$50+/mo |
| 10K users | Supabase Team | +$554/mo |
| 10K users | Cloudflare CDN | +$20-200/mo |

---

## 8. Environment Variables Reference

### Paid Services

```bash
# Supabase ($45/mo)
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY

# Anthropic (Variable)
ANTHROPIC_API_KEY
ANTHROPIC_MODEL                    # claude-sonnet-4-20250514

# OpenAI (Variable)
OPENAI_API_KEY
OPENAI_EMBEDDING_MODEL            # text-embedding-3-small

# Vercel Blob (Variable)
BLOB_READ_WRITE_TOKEN

# Resend ($0-20/mo)
RESEND_API_KEY
```

### Free Services

```bash
# Google Cloud ($200/mo free credit)
GOOGLE_API_KEY                    # Server-side
NEXT_PUBLIC_GOOGLE_MAPS_KEY       # Client-side
GOOGLE_CUSTOM_SEARCH_ENGINE_ID
YOUTUBE_API_KEY                   # Alias for GOOGLE_API_KEY

# Discord (Free)
DISCORD_WEBHOOK_DEPLOYMENTS
DISCORD_WEBHOOK_ERRORS
DISCORD_WEBHOOK_CRON
DISCORD_WEBHOOK_FEEDBACK
DISCORD_WEBHOOK_SIGNUPS
DISCORD_WEBHOOK_CONTACTS
DISCORD_WEBHOOK_EVENTS
DISCORD_WEBHOOK_AL
DISCORD_WEBHOOK_DIGEST

# Eventbrite (Free)
EVENTBRITE_API_TOKEN

# Internal
CRON_SECRET
INTERNAL_EVAL_KEY
```

---

## 9. Monthly Tracking Template

```markdown
## Month: ____________

### Fixed Costs
| Service | Budget | Actual | Variance |
|---------|--------|--------|----------|
| Supabase Pro | $45 | $ | |
| Vercel Pro | $20 | $ | |
| Domain | $1 | $ | |
| Cursor Max | $200 | $ | |
| Claude Pro | $100 | $ | |
| **FIXED TOTAL** | **$366** | **$** | |

### Variable Costs
| Service | Budget | Actual | Variance |
|---------|--------|--------|----------|
| Anthropic API | $30 | $ | |
| OpenAI API | $5 | $ | |
| Vercel Overages | $0 | $ | |
| **VARIABLE TOTAL** | **$35** | **$** | |

### R&D Costs
| Service | Budget | Actual | Notes |
|---------|--------|--------|-------|
| Cursor API Overages | $200 | $ | |
| Other Dev Costs | $0 | $ | |
| **R&D TOTAL** | **$200** | **$** | |

### Key Metrics
- Total users: ___
- New signups: ___
- AL conversations: ___
- Avg tokens/conversation: ___
- Paying users: ___
- MRR: $___

### GRAND TOTAL: $___
```

---

## 10. Cost Optimization Opportunities

### Quick Wins
- [ ] Enable PgBouncer for connection pooling (free)
- [ ] Add aggressive caching on static endpoints
- [ ] Monitor AI token usage and optimize prompts

### Medium-Term
- [ ] Batch AI requests where possible
- [ ] Implement request deduplication
- [ ] Add API response caching layer

### Long-Term
- [ ] Self-hosted embedding model for cost reduction
- [ ] Evaluate cheaper AI alternatives for non-critical tasks
- [ ] Consider CDN for static assets at scale

---

*This document should be reviewed and updated monthly to track actual costs vs. projections.*

*See [SCALABILITY.md](SCALABILITY.md) for infrastructure scaling guidance.*
*See [ARCHITECTURE.md](ARCHITECTURE.md) for system overview.*
