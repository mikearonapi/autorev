# Service Level Objectives (SLOs)

This document defines the Service Level Objectives for the AutoRev application.
SLOs help us set expectations for reliability and guide operational decisions.

---

## Table of Contents

1. [Overview](#overview)
2. [Availability SLO](#availability-slo)
3. [Latency SLOs](#latency-slos)
4. [Error Budget](#error-budget)
5. [Core Web Vitals Targets](#core-web-vitals-targets)
6. [Alert Thresholds](#alert-thresholds)
7. [Monitoring & Measurement](#monitoring--measurement)

---

## Overview

### What Are SLOs?

**Service Level Objectives (SLOs)** are target values for service reliability.
They define "good enough" performance that balances reliability with innovation velocity.

### Our Philosophy

- **User-Centric**: SLOs reflect real user experience, not system metrics
- **Actionable**: Each SLO has clear measurement and alert thresholds
- **Balanced**: High enough to maintain quality, low enough to allow iteration

---

## Availability SLO

### Target: 99.5% Monthly Availability

| Metric | Target | Allowed Downtime |
|--------|--------|------------------|
| Monthly | 99.5% | 3.6 hours/month |
| Weekly | 99.5% | 50 minutes/week |
| Daily | 99.5% | 7 minutes/day |

### What Counts as "Available"?

A request is considered **successful** if:
- HTTP status code is 2xx or 3xx
- Response time is under 10 seconds
- No server errors (5xx)

### Exclusions

The following do not count against availability:
- Scheduled maintenance (announced 24h+ in advance)
- Dependency failures (Supabase, Stripe, OpenAI outages)
- Client-side errors (4xx responses)
- Bot/crawler traffic

---

## Latency SLOs

### Page Load (Time to First Contentful Paint)

| Percentile | Target | Description |
|------------|--------|-------------|
| p50 | < 1.5s | Median user experience |
| p95 | < 3.0s | 95% of users |
| p99 | < 5.0s | Edge cases |

### API Response Time

| Endpoint Type | p50 | p95 | p99 |
|--------------|-----|-----|-----|
| Read (GET) | < 200ms | < 500ms | < 1s |
| Write (POST/PATCH) | < 300ms | < 800ms | < 2s |
| Search | < 500ms | < 1.5s | < 3s |
| AI/AL Requests | < 3s | < 8s | < 15s |

### Time to Interactive (TTI)

| Percentile | Target |
|------------|--------|
| p50 | < 2.5s |
| p95 | < 5.0s |

---

## Error Budget

### How It Works

**Error Budget** = (1 - SLO target) × time period

For our 99.5% monthly SLO:
- **Error Budget**: 0.5% of requests can fail per month
- **Approximately**: 3.6 hours of downtime OR equivalent error rate

### Budget Allocation

| Category | Budget Share | Monthly Allowance |
|----------|-------------|-------------------|
| Planned Deployments | 40% | ~1.4 hours |
| Unexpected Incidents | 40% | ~1.4 hours |
| Experimentation | 20% | ~0.7 hours |

### Budget States

| Budget Remaining | Action |
|------------------|--------|
| > 50% | Normal operations, full velocity |
| 25-50% | Increased caution, prefer safe changes |
| < 25% | Freeze non-critical changes, focus on reliability |
| Exhausted | Emergency mode, only critical fixes |

### Monthly Reset

Error budget resets on the 1st of each month at 00:00 UTC.

---

## Core Web Vitals Targets

Based on Google's "Good" thresholds:

| Metric | Target | Definition |
|--------|--------|------------|
| **LCP** (Largest Contentful Paint) | < 2.5s | Time until main content visible |
| **INP** (Interaction to Next Paint) | < 200ms | Responsiveness to user input |
| **CLS** (Cumulative Layout Shift) | < 0.1 | Visual stability |
| **FCP** (First Contentful Paint) | < 1.8s | Time to first render |
| **TTFB** (Time to First Byte) | < 800ms | Server response time |

### Goals by Percentile

| Metric | p50 Target | p75 Target |
|--------|------------|------------|
| LCP | < 2.0s | < 2.5s |
| INP | < 150ms | < 200ms |
| CLS | < 0.05 | < 0.1 |
| FCP | < 1.5s | < 1.8s |
| TTFB | < 600ms | < 800ms |

---

## Alert Thresholds

### Severity Levels

| Level | Response Time | Criteria |
|-------|---------------|----------|
| **P1 (Critical)** | < 15 min | Service completely down |
| **P2 (High)** | < 1 hour | Major feature broken, >25% users affected |
| **P3 (Medium)** | < 4 hours | Minor feature broken, <25% users affected |
| **P4 (Low)** | Next business day | Degraded experience, workaround exists |

### Automatic Alerts

| Condition | Severity | Channel |
|-----------|----------|---------|
| Error rate > 5% for 5 min | P1 | PagerDuty, Slack |
| Error rate > 2% for 15 min | P2 | Slack |
| p95 latency > 5s for 10 min | P2 | Slack |
| p50 latency > 2s for 30 min | P3 | Slack |
| Error budget < 25% | P3 | Slack |
| Error budget < 10% | P2 | Slack |

### Sentry Alert Rules

```yaml
# Critical: High error rate
- condition: error_rate > 5%
  window: 5m
  action: pagerduty_p1

# Warning: Elevated errors
- condition: error_rate > 2%
  window: 15m
  action: slack_notify

# Performance: Slow responses
- condition: p95_latency > 5000ms
  window: 10m
  action: slack_notify
```

---

## Monitoring & Measurement

### Data Sources

| Metric Type | Source | Dashboard |
|-------------|--------|-----------|
| Availability | Vercel Analytics | Admin Panel |
| Latency | Speed Insights + Custom | Admin Panel |
| Error Rate | Sentry | Admin Panel |
| Web Vitals | Speed Insights | Admin Panel |
| User Metrics | PostHog | PostHog |

### Calculation Methods

**Availability** = (successful_requests / total_requests) × 100

**Latency Percentiles**: Calculated from sampled response times
- Sample rate: 50% of production traffic
- Window: Rolling 7 days for trends, 1 hour for alerts

**Error Budget Burn Rate** = current_error_rate / allowed_error_rate
- Burn rate > 1.0 = consuming budget faster than sustainable
- Burn rate < 1.0 = operating within budget

### Review Cadence

| Review | Frequency | Participants |
|--------|-----------|--------------|
| SLO Health Check | Weekly | Engineering |
| Error Budget Review | Monthly | Engineering + Product |
| SLO Revision | Quarterly | All stakeholders |

---

## Appendix: SLO Decision Log

| Date | Change | Rationale |
|------|--------|-----------|
| Jan 2026 | Initial SLOs defined | Baseline from best practices |

---

## Related Documents

- [SOURCE_OF_TRUTH.md](./SOURCE_OF_TRUTH.md) - Core architecture reference
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System design
- [Best Practices/Analytics and Observability.md](./Best%20Practices/Analytics%20and%20Observability.md) - Observability standards
