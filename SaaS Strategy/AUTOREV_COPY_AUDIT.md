# AutoRev Copy Audit
## Specific Updates Needed Across Site & App

> **Purpose**: Line-by-line identification of copy that needs updating based on the Copy Guide.
> 
> **Priority Key**: 🔴 High (conversion impact) | 🟡 Medium (engagement) | 🟢 Low (polish)

---

## Table of Contents

1. [Homepage](#homepage)
2. [Join/Pricing Page](#joinpricing-page)
3. [Auth Modal](#auth-modal)
4. [My Garage](#my-garage)
5. [My Data](#my-data)
6. [Community](#community)
7. [AL Chat](#al-chat)
8. [Empty States](#empty-states)
9. [Global Components](#global-components)

---

## Homepage

**File**: `app/(marketing)/page.jsx`

### 🔴 Hero Headline (Lines 177-183)

**Current**:
```jsx
<span className={styles.headlineAccent}>OPTIMIZE</span>
<span className={styles.headlineWhite}> YOUR CAR,</span>
<br />
<span className={styles.headlineAccent}>MAXIMIZE</span>
<span className={styles.headlineWhite}> YOUR GAINS</span>
```

**Issue**: "Optimize" and "Maximize" are corporate buzzwords. Doesn't communicate the core problem/solution.

**Recommended**:
```jsx
<span className={styles.headlineAccent}>STOP GUESSING.</span>
<br />
<span className={styles.headlineWhite}>START BUILDING.</span>
```

**Alternative**:
```jsx
<span className={styles.headlineWhite}>BUILD WITH</span>
<br />
<span className={styles.headlineAccent}>CONFIDENCE</span>
```

---

### 🔴 Hero Subtext (Lines 186-189)

**Current**:
```jsx
Research mods for your car, compare different brands, find deals, 
get straight answers — all in one app built for speed.
```

**Issue**: Feature-focused, doesn't address user outcome. "Built for speed" is vague.

**Recommended**:
```jsx
Know exactly what to do to your car, which parts to buy, 
and what you'll actually get.
```

---

### 🔴 Primary CTA Button (Lines 192-197)

**Current**:
```jsx
LOGIN / GET STARTED FREE
```

**Issue**: "LOGIN /" is confusing for new users. Combined action dilutes clarity.

**Recommended**:
```jsx
Start Free
```

**Note**: Add separate "Log In" link in header/below button for returning users.

---

### 🟡 AL Introduction Copy (Lines 263-268)

**Current**:
```jsx
<p className={styles.alGreeting}>
  Hi, I'm <span className={styles.alName}>AL</span>, your AutoRev AI.
</p>
<p className={styles.alTagline}>
  Tony Stark had Jarvis. <span className={styles.alHighlight}>You have AL.</span>
</p>
```

**Issue**: Pop culture reference may not resonate with all users. Doesn't communicate value.

**Recommended**:
```jsx
<p className={styles.alGreeting}>
  Meet <span className={styles.alName}>AL</span>
</p>
<p className={styles.alTagline}>
  Expert answers, instantly. <span className={styles.alHighlight}>No more forum hunting.</span>
</p>
```

---

### 🟡 AL Data Access List (Lines 289-299)

**Current**:
```jsx
<p className={styles.alDataLabel}>AL has instant access to:</p>
<ul className={styles.alDataList}>
  <li>Platform-specific specs & known issues</li>
  <li>Modification compatibility & gains</li>
  <li>Torque specs & service intervals</li>
  <li>Real dyno results & owner experiences</li>
  <li>Part fitment & current pricing</li>
</ul>
```

**Issue**: Technical language. Doesn't show user benefit.

**Recommended**:
```jsx
<p className={styles.alDataLabel}>Ask AL about:</p>
<ul className={styles.alDataList}>
  <li>What mods to do first (and in what order)</li>
  <li>Which parts actually fit your car</li>
  <li>Real-world gains from specific upgrades</li>
  <li>Common problems to watch for</li>
  <li>Maintenance you shouldn't skip</li>
</ul>
```

---

### 🟡 Feature Section Titles (Lines 28-82)

**Current** → **Recommended**:

| Feature | Current Title | Current Accent | Recommended Title | Recommended Accent |
|---------|---------------|----------------|-------------------|--------------------|
| My Garage | YOUR GARAGE | YOUR COMMAND CENTER | YOUR GARAGE | YOUR BUILD, TRACKED |
| Upgrades | PLAN YOUR BUILD | PARTS THAT FIT | PLAN YOUR BUILD | KNOW WHAT FITS |
| Performance | KNOW YOUR NUMBERS | PERFORMANCE METRICS | SEE YOUR GAINS | CALCULATED |
| Dyno | VIRTUAL DYNO | SEE YOUR POWER | DYNO ESTIMATES | BEFORE YOU BUY |
| Lap Times | LAP TIME ESTIMATOR | TRACK YOUR TIMES | TRACK TIMES | PREDICTED |
| Community | COMMUNITY BUILDS | REAL ENTHUSIASTS | COMMUNITY | REAL BUILDS |
| AL | ASK AL ANYTHING | YOUR AI EXPERT | ASK AL | GET REAL ANSWERS |

---

### 🟡 Feature Descriptions (Lines 32-82)

**Current** (My Garage):
```
Add the cars you own and love. Track specs, mileage, and ownership history. 
Your garage is always ready when you are.
```

**Recommended**:
```
Add your car. See exactly what's possible. Track your progress as you build.
```

---

**Current** (Upgrades):
```
Curated upgrade paths for track, street, or daily driving. See exactly what 
each mod delivers — power gains, real-world feel, and compatibility.
```

**Recommended**:
```
Upgrade paths based on your goals. See what each mod delivers — gains, cost, 
and what else you'll need.
```

---

**Current** (Performance):
```
See calculated 0-60, quarter mile, and experience scores. Understand exactly 
how your mods translate to real-world performance.
```

**Recommended**:
```
Estimated 0-60, quarter mile, and track times. See how your build stacks up 
before you spend.
```

---

**Current** (Dyno):
```
Visualize estimated HP and torque curves based on your modifications. 
Track gains from each upgrade and log real dyno results.
```

**Recommended**:
```
See estimated HP and torque from your mods. Log real dyno results to compare.
```

---

**Current** (Lap Times):
```
Predict lap times at popular tracks based on your build. Log real sessions 
and compare your progress over time.
```

**Recommended**:
```
Estimated lap times based on your build. Log your real times to track improvement.
```

---

**Current** (Community):
```
Get inspiration from real builds. Share your progress, find local events, 
and connect with owners who share your passion.
```

**Recommended**:
```
See what others have built. Share your progress. No forum drama.
```

---

**Current** (AL):
```
No more hours of forum searching. AL knows your car, your mods, and your goals. 
Get instant answers to any question.
```

**Issue**: Good, but can be tighter.

**Recommended**:
```
Your car questions, answered instantly. AL knows your specific build and goals.
```

---

### 🟢 Feature Card Section (Lines 303-310)

**Current**:
```jsx
<p className={styles.featureCardLabel}>Built for enthusiasts who want more</p>
<h2 className={styles.featureCardTitle}>
  <span className={styles.featureCardBold}>SMARTER BUILDS</span>
  <br />
  THAT LEAD TO RESULTS
</h2>
```

**Recommended**:
```jsx
<p className={styles.featureCardLabel}>For enthusiasts who want answers, not opinions</p>
<h2 className={styles.featureCardTitle}>
  <span className={styles.featureCardBold}>KNOW BEFORE YOU BUILD.</span>
  <br />
  BUILD WITH CONFIDENCE.
</h2>
```

---

### 🔴 Final CTA Section (Lines 342-357)

**Current**:
```jsx
<h2 className={styles.finalHeadline}>
  STOP GUESSING.
  <br />
  <span className={styles.finalAccent}>START BUILDING.</span>
</h2>
<p className={styles.finalSubtext}>
  100% free to start. No credit card required.
</p>
<button ...>
  GET STARTED FREE <LocalIcons.arrow />
</button>
```

**Issue**: Headline is good (keep it). CTA button text can be more specific.

**Recommended**:
```jsx
<h2 className={styles.finalHeadline}>
  STOP GUESSING.
  <br />
  <span className={styles.finalAccent}>START BUILDING.</span>
</h2>
<p className={styles.finalSubtext}>
  Free forever. No credit card required.
</p>
<button ...>
  ADD YOUR FIRST CAR <LocalIcons.arrow />
</button>
```

---

## Join/Pricing Page

**File**: `app/(marketing)/join/page.jsx`

### 🔴 Hero Headline (Lines 175-183)

**Current**:
```jsx
<h1 className={styles.title}>
  Join the Auto{' '}
  <span className={styles.revWord}>
    <span className={styles.accent}>REV</span>
    <span className={...}>{brandSuffixes[suffixIndex]}</span>
  </span>
</h1>
```

**Issue**: Animated wordplay (REVival, REVelation, REVolution) is clever but doesn't communicate value. Users don't know what they're joining.

**Recommended**:
```jsx
<h1 className={styles.title}>
  Build smarter.
  <br />
  <span className={styles.accent}>Start free.</span>
</h1>
```

Or keep brand play but add subhead:
```jsx
<h1>Join the Auto<span>REV</span>olution</h1>
<p>The research is done. Your build plan is ready.</p>
```

---

### 🟡 Tiers Header (Lines 193-194)

**Current**:
```jsx
<h2>Choose Your Path</h2>
<p>All tiers are free during our beta. Help us shape the future of AutoRev.</p>
```

**Recommended**:
```jsx
<h2>Pick Your Plan</h2>
<p>All plans are free during beta. Upgrade when your build demands it.</p>
```

---

### 🟡 Tier Taglines (Lines 27-28, 45-46, 63-64)

**Current** → **Recommended**:

| Tier | Current Tagline | Recommended |
|------|-----------------|-------------|
| Free | "Research any sports car" | "Everything you need to start" |
| Enthusiast | "Own & maintain your car" | "For active builders" |
| Tuner | "Build & modify your car" | "Unlimited everything" |

---

### 🟡 Tier CTAs (Lines 36, 54, 72)

**Current**: All say `'Join Free'`

**Recommended**:
- Free: `"Start Free"`
- Enthusiast: `"Start Free"` (during beta), `"Go Enthusiast"` (post-beta)
- Tuner: `"Start Free"` (during beta), `"Go Tuner"` (post-beta)

---

### 🟡 Tier Features - Use Outcomes (Lines 31-34, 49-52, 67-70)

**Current**:
```javascript
features: [
  'Garage Intelligence system',
  'VIN decode, specs & service logs',
  'Maintenance schedules & recalls',
],
```

**Issue**: Feature names, not outcomes.

**Recommended**:
```javascript
features: [
  'Track every car you own',
  'Know what maintenance is due',
  'Get recall alerts automatically',
],
```

---

### 🔴 Final CTA Section (Lines 289-302)

**Current**:
```jsx
<h2>Ready to Find What <span>Drives You</span>?</h2>
<p>Join AutoRev today. It's completely free during our launch.</p>
<button>Create Free Account</button>
```

**Issue**: "Find what drives you" doesn't match product value. Generic.

**Recommended**:
```jsx
<h2>Ready to <span>build smarter</span>?</h2>
<p>Start free. No credit card required.</p>
<button>Add Your First Car</button>
```

---

## Auth Modal

**File**: `components/AuthModal.jsx`

### 🟡 Sign In Title (Line 509)

**Current**: `"Log Into Your Account"`

**Recommended**: `"Welcome Back"`

---

### 🟡 Sign In Info Box (Lines 511-519)

**Current**:
```jsx
Access your garage, saved cars, and personalized recommendations.
```

**Recommended**:
```jsx
Your garage is waiting.
```

---

### 🟡 Sign Up Title (Line 356)

**Current**: `"Create an Account"`

**Recommended**: `"Join AutoRev"`

---

### 🟡 Sign Up Info Box (Lines 358-360)

**Current**:
```jsx
Join AutoRev to save favorites, track your garage, and get AI advice.
```

**Issue**: Feature list. Not outcome-focused.

**Recommended**:
```jsx
Build smarter. Track your progress. Get expert answers.
```

---

### 🟡 Verification Sent Title (Line 254)

**Current**: `"Check Your Email"`

**Recommended**: `"Check Your Email"` ✓ (This is good)

---

### 🟡 CTA Button Text (Lines 459, 562)

**Current**: `"Create Account"`, `"Log In"`

**Recommended**: `"Create Account"` ✓, `"Log In"` ✓ (These are fine)

---

### 🟡 Switch Mode Links (Lines 463-466, 567-569)

**Current**:
```jsx
Already have an account? <button>Log In</button>
<button>Create an Account</button>
```

**Recommended**:
```jsx
Already have an account? <button>Log In</button>
New here? <button>Create Account</button>
```

---

## My Garage

**File**: `app/(app)/garage/page.jsx` (large file - key sections)

### 🟡 Page Header

**Current** (likely):
```jsx
<h1>My Garage</h1>
```

**Recommended**:
```jsx
<h1>My Garage</h1>
<p className={styles.subtitle}>Your build command center</p>
```

---

### 🟡 Empty State (No Vehicles)

**Current** (from data/page.jsx pattern, lines 517-526):
```jsx
<CarIcon size={48} />
<p>Add a vehicle to your garage to see performance data</p>
<Link href="/garage">
  <PlusIcon />
  Add Vehicle
</Link>
```

**Recommended**:
```jsx
<CarIcon size={48} />
<h3>Your garage is empty</h3>
<p>Let's fix that.</p>
<Link href="/garage">
  Add Your First Car
</Link>
```

---

### 🟡 Build Prompt (No mods configured)

**Current** (from data/page.jsx, lines 656-664):
```jsx
<p>Configure your build to see accurate power estimates</p>
<Link href={...}>
  Configure Build
  <ChevronRightIcon />
</Link>
```

**Recommended**:
```jsx
<p>No mods yet? Every build starts somewhere.</p>
<Link href={...}>
  Plan Your Build
  <ChevronRightIcon />
</Link>
```

---

## My Data

**File**: `app/(app)/data/page.jsx`

### 🟡 Page Header (Lines 539-578)

**Current**:
```jsx
<h1 className={styles.title}>My Data</h1>
<p className={styles.subtitle}>
  <span className={styles.tabHint}><strong>Power</strong> for HP/TQ estimates</span>
  <span className={styles.tabHintSeparator}>•</span>
  <span className={styles.tabHint}><strong>Track</strong> for lap times</span>
  <span className={styles.tabHintSeparator}>•</span>
  <span className={styles.tabHint}><strong>Analysis</strong> for build insights</span>
</p>
```

**Recommended**:
```jsx
<h1 className={styles.title}>My Data</h1>
<p className={styles.subtitle}>
  See what your build should deliver. Log what it actually does.
</p>
```

---

### 🟡 Empty State - No Auth (Lines 475-492)

**Current**:
```jsx
<h2>Your Data Hub</h2>
<p>Track sessions, performance estimates, and data logs—all in one place.</p>
<button>Sign In to Get Started</button>
```

**Recommended**:
```jsx
<h2>Your Performance Data</h2>
<p>Estimated dyno numbers, lap times, and build analysis — all in one place.</p>
<button>Sign In to Start</button>
```

---

### 🟡 Dyno Log Section (Lines 671-681)

**Current**:
```jsx
<h3 className={styles.logDataTitle}>Your Dyno Results</h3>
<p className={styles.logDataSubtitle}>
  Log your actual dyno numbers to compare against estimates and help us improve predictions for your car
</p>
```

**Recommended**:
```jsx
<h3 className={styles.logDataTitle}>Your Dyno Results</h3>
<p className={styles.logDataSubtitle}>
  Log your real numbers. See how they compare to estimates.
</p>
```

---

### 🟡 Track Time Section (Lines 807-812)

**Current**:
```jsx
<h3 className={styles.logDataTitle}>Your Lap Times</h3>
<p className={styles.logDataSubtitle}>
  Log your actual track times for deeper insights and to help us improve predictions for your car
</p>
```

**Recommended**:
```jsx
<h3 className={styles.logDataTitle}>Your Lap Times</h3>
<p className={styles.logDataSubtitle}>
  Log your sessions. Track your improvement.
</p>
```

---

### 🟡 Empty Dyno State (Lines 744-748)

**Current**:
```jsx
<p>No dyno results logged yet</p>
<span>Your data helps refine estimates for this model</span>
```

**Recommended**:
```jsx
<p>No dyno results yet</p>
<span>Log your first run to compare against estimates</span>
```

---

### 🟡 Empty Track Time State (Lines 860-864)

**Current**:
```jsx
<p>No lap times logged yet</p>
<span>Your data helps refine track estimates for this model</span>
```

**Recommended**:
```jsx
<p>No lap times yet</p>
<span>Log your first session to start tracking progress</span>
```

---

### 🟡 Estimate Explainer (Lines 597-603)

**Current**:
```jsx
All figures are <strong>estimates</strong> for <em>relative comparison</em>—actual results vary with tune quality and conditions.
```

**Issue**: Good disclaimer but could be clearer.

**Recommended**:
```jsx
All numbers are <strong>estimates</strong>. Your actual results depend on tune, conditions, and driver skill.
```

---

## Community

**File**: `app/(app)/community/page.jsx`

### 🟡 Page Documentation (Lines 17-25)

The component documentation is fine, but let's check the user-facing copy.

---

### 🟡 Empty Feed State

**Current** (from EmptyState component):
```jsx
<EmptyState
  icon={Icons.car}
  title="No builds found"
  description="Be the first to share a build"
/>
```

**Recommended**:
```jsx
<EmptyState
  icon={Icons.car}
  title="Nothing here yet"
  description="Be the first to share a build in this category"
  action={{ label: "Share Your Build", onClick: handleShare }}
/>
```

---

## AL Chat

**File**: `app/(app)/al/ALPageClient.jsx`

### 🟡 Empty State Title (Line 665)

**Current**: `"How can I help?"`

**Recommended**: `"How can I help?"` ✓ (This is perfect)

---

### 🟡 Empty State Subtitle (Lines 666-668)

**Current**:
```jsx
{selectedCar ? `Ask me anything about your ${selectedCar.name}` : 'Ask me anything about cars'}
```

**Issue**: Good personalization.

**Recommended**: Keep as-is ✓

---

### 🟡 Suggested Prompts (Lines 155-160)

**Current**:
```javascript
const SUGGESTED_PROMPTS = [
  { text: "What mods should I do first?" },
  { text: "Compare two cars for me" },
  { text: "Help me diagnose an issue" },
  { text: "What's the best oil for my car?" },
];
```

**Recommended** (more specific, outcome-focused):
```javascript
const SUGGESTED_PROMPTS = [
  { text: "What's the best first mod for under $500?" },
  { text: "Is [Part X] worth it for my car?" },
  { text: "My car is making a [noise] — what could it be?" },
  { text: "What maintenance should I do at [X] miles?" },
];
```

---

### 🟡 Sign-In Prompt (Lines 497-505)

**Current**:
```jsx
<h1 className={styles.title}>Meet AL</h1>
<p className={styles.subtitle}>Your AutoRev AI Assistant</p>
<p className={styles.description}>
  Get personalized car recommendations, learn about modifications, 
  compare models, and get expert automotive advice.
</p>
<button>Sign In to Chat with AL</button>
```

**Recommended**:
```jsx
<h1 className={styles.title}>Meet AL</h1>
<p className={styles.subtitle}>Expert answers, instantly</p>
<p className={styles.description}>
  Ask anything about your car, mods, or build. 
  Get real answers with real sources — no forum hunting.
</p>
<button>Sign In to Ask AL</button>
```

---

### 🟡 Loading State (Lines 520-521)

**Current**: `"Loading AL"`, `"Connecting to your AI assistant..."`

**Recommended**: `"Loading AL"`, `"Getting ready..."` ✓ (Shorter is better for loading)

---

### 🟡 History Empty State (Lines 549-552)

**Current**:
```jsx
<p>No conversations yet</p>
<p className={styles.noConversationsHint}>Start chatting with AL!</p>
```

**Recommended**:
```jsx
<p>No conversations yet</p>
<p className={styles.noConversationsHint}>Ask your first question</p>
```

---

### 🟡 Feedback Thank You (Lines 731-735)

**Current**:
```jsx
{feedbackGiven[i] === 'positive' 
  ? <><LocalIcons.thumbsUp size={14} /> Thanks!</> 
  : <><LocalIcons.thumbsDown size={14} /> Thanks for the feedback</>
}
```

**Recommended**:
```jsx
{feedbackGiven[i] === 'positive' 
  ? <><LocalIcons.thumbsUp size={14} /> Thanks!</> 
  : <><LocalIcons.thumbsDown size={14} /> Thanks — we'll improve</>
}
```

---

### 🟡 Input Placeholder (Line 853)

**Current**:
```jsx
placeholder={selectedCar ? `Ask about ${selectedCar.name}...` : "Ask AL anything..."}
```

**Recommended**: Keep as-is ✓ (Good personalization)

---

## Empty States

**File**: `components/ui/EmptyState.jsx`

### 🟡 NoResults Preset (Lines 110-120)

**Current**:
```jsx
title="No results found"
description={query ? `No results for "${query}"` : "Try adjusting your search or filters"}
action={onClear ? { label: "Clear filters", onClick: onClear } : undefined}
```

**Recommended**:
```jsx
title="No matches"
description={query ? `Nothing matches "${query}"` : "Try different filters"}
action={onClear ? { label: "Clear Filters", onClick: onClear } : undefined}
```

---

### 🟡 NoData Preset (Lines 125-135)

**Current**:
```jsx
title={`No ${itemType} yet`}
description={`When you add ${itemType}, they'll appear here`}
```

**Issue**: "When you add" is passive.

**Recommended**:
```jsx
title={`No ${itemType} yet`}
description={`Add your first ${itemType} to get started`}
```

---

### 🟡 Error Preset (Lines 140-150)

**Current**:
```jsx
title="Something went wrong"
description={message || "An error occurred while loading data"}
action={onRetry ? { label: "Try again", onClick: onRetry } : undefined}
```

**Recommended**:
```jsx
title="That didn't work"
description={message || "Something went wrong. Let's try again."}
action={onRetry ? { label: "Try Again", onClick: onRetry } : undefined}
```

---

### 🟡 NotFound Preset (Lines 168-180)

**Current**:
```jsx
title={`${itemType} not found`}
description={`The ${itemType.toLowerCase()} you're looking for doesn't exist or has been removed`}
```

**Recommended**:
```jsx
title={`${itemType} not found`}
description={`We couldn't find that ${itemType.toLowerCase()}. It may have been moved or removed.`}
```

---

### 🟡 Premium Preset (Lines 185-195)

**Current**:
```jsx
title="Premium Feature"
description={feature ? `${feature} is available to premium members` : "Upgrade to unlock this feature"}
```

**Issue**: "Premium members" is corporate. "Unlock" is overused.

**Recommended**:
```jsx
title="Tuner Feature"
description={feature ? `${feature} is available with Tuner` : "Go Tuner to access this"}
action={{ label: "See Plans", href: "/join" }}
```

---

## Global Components

### 🟡 Footer Copy

**File**: `components/Footer.jsx`

**Current**: Minimal and functional ✓

**Recommendation**: Keep as-is. Footer is appropriately minimal.

---

### 🟡 Loading States Throughout

**Pattern to update** — search for loading text:

| Current | Recommended |
|---------|-------------|
| "Loading..." | "Loading..." ✓ |
| "Loading your data..." | "Loading..." |
| "Fetching performance insights..." | "Crunching numbers..." |
| "Processing..." | "Working on it..." |

---

## Summary: Priority Updates

### 🔴 High Priority (Conversion Impact)

1. **Homepage Hero Headline** — "OPTIMIZE/MAXIMIZE" → "STOP GUESSING. START BUILDING."
2. **Homepage Hero Subtext** — Feature list → Outcome statement
3. **Homepage Primary CTA** — "LOGIN / GET STARTED FREE" → "Start Free"
4. **Join Page Headline** — Animated wordplay → Clear value prop
5. **Final CTAs everywhere** — "Get Started" → "Add Your First Car"

### 🟡 Medium Priority (Engagement)

1. **AL Introduction Section** — Remove pop culture reference, add value
2. **Feature Descriptions** — Feature names → User outcomes
3. **Auth Modal Info Boxes** — Feature lists → Outcome statements
4. **Empty States** — Passive voice → Active, encouraging
5. **Tier Features** — System names → What users get

### 🟢 Low Priority (Polish)

1. **Loading state messages** — Make more human
2. **Error messages** — Make more helpful
3. **Feedback thank you** — Add personality
4. **Button microcopy** — Consistency pass

---

## Implementation Checklist

Use this to track progress:

### Homepage (`app/(marketing)/page.jsx`)
- [ ] Update hero headline
- [ ] Update hero subtext
- [ ] Update primary CTA
- [ ] Update AL introduction
- [ ] Update feature titles
- [ ] Update feature descriptions
- [ ] Update final CTA

### Join Page (`app/(marketing)/join/page.jsx`)
- [ ] Update hero headline
- [ ] Update tiers header
- [ ] Update tier taglines
- [ ] Update tier features
- [ ] Update final CTA

### Auth Modal (`components/AuthModal.jsx`)
- [ ] Update sign-in title
- [ ] Update sign-in info box
- [ ] Update sign-up info box
- [ ] Update switch mode text

### Data Page (`app/(app)/data/page.jsx`)
- [ ] Update page subtitle
- [ ] Update empty states
- [ ] Update log section headers
- [ ] Update estimate explainer

### AL Page (`app/(app)/al/ALPageClient.jsx`)
- [ ] Update suggested prompts
- [ ] Update sign-in prompt
- [ ] Update history empty state

### Empty States (`components/ui/EmptyState.jsx`)
- [ ] Update NoResults preset
- [ ] Update NoData preset
- [ ] Update Error preset
- [ ] Update Premium preset

---

*Audit created: January 2026*
*Based on: AUTOREV_COPY_GUIDE.md*
