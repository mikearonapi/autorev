# AutoRev Website - Complete Owner's Guide

> **Prepared for**: AutoRev Management  
> **Last Updated**: December 2024  
> **Website URL**: https://autorev.app

---

## Table of Contents

1. [What Is This Website?](#1-what-is-this-website)
2. [The Pages On Your Site](#2-the-pages-on-your-site)
3. [How The Technology Works](#3-how-the-technology-works)
4. [What's In The Database](#4-whats-in-the-database)
5. [The 35 Cars & How They Were Added](#5-the-35-cars--how-they-were-added)
6. [How Car Finder Works](#6-how-car-finder-works)
7. [How Performance HUB Works](#7-how-performance-hub-works)
8. [How Leads & Contact Forms Work](#8-how-leads--contact-forms-work)
9. [The Scoring System Explained](#9-the-scoring-system-explained)
10. [Images & Media](#10-images--media)
11. [Common Questions](#11-common-questions)

---

## 1. What Is This Website?

AutoRev is a **sports car advisory platform** that helps car enthusiasts find the right vehicle based on their personal priorities. Think of it as a matchmaking service between people and sports cars.

### The Core Philosophy

- **Unbiased**: No affiliate links, no dealerships paying for placement
- **For Everyone**: All budgets welcome ($25K-$100K+)
- **Expert-Driven**: Real ownership experience, not just spec sheets
- **Free to Use**: No email required to use the advisory tools

### What It Does

1. **Helps people find cars**: Users tell us what they care about (sound, track performance, reliability, etc.), and we match them with the best cars for their priorities
2. **Shows upgrade potential**: For people who already have a car, we show them how different upgrades would improve their vehicle
3. **Captures interested leads**: When people want to learn more or need help, they can contact you through the site
4. **Showcases your services**: The Services page explains what hands-on work you offer

---

## 2. The Pages On Your Site

Your website has **7 main pages** that visitors can access:

### Home Page (`/`)
- **What it is**: The front door of your website
- **What's on it**: 
  - Hero banner with "Find What Drives You"
  - Three pillars explaining what you do (Car Finder, Performance HUB, Service Center)
  - A carousel showing all 35 cars
  - How it works steps
  - Call-to-action to find a car

### Car Finder (`/car-finder`)
- **What it is**: Your main recommendation tool
- **What's on it**: 
  - 7 priority sliders (Sound, Interior, Track, Reliability, Value, Fun, Aftermarket)
  - Must-have filters (Manual transmission, RWD only, etc.)
  - Personalized recommendations (Top Match, Best Sound, Best Value, etc.)
  - A sortable table of all 35 cars with scores
  - Each car links to its detail page

### Performance HUB (`/performance`)
- **What it is**: An upgrade visualization tool (like Gran Turismo video game)
- **What's on it**: 
  - Two modes: "Plan Your Build" and "Learn About Upgrades"
  - A grid of all 35 cars to select from
  - When a car is selected: performance metrics, upgrade packages, cost estimates
  - Shows how upgrades change HP, 0-60 time, braking, grip, etc.

### Individual Car Pages (`/cars/[car-name]`)
- **What they are**: Detailed profiles for each of the 35 cars
- **What's on them**: 
  - Hero image of the car
  - All specifications (engine, HP, transmission, 0-60, etc.)
  - 7-category score breakdown with visual bars
  - Pros and cons
  - "Best For" audience types
  - Links to Performance HUB and Upgrades

### Services (`/services`)
- **What it is**: Information about your hands-on service work
- **What's on it**: 
  - Six service categories (Suspension, Brakes, Power, Alignment, Track Prep, Reliability)
  - Each service shows: description, typical time, budget range, what's included
  - Your 5-step process (Consult → Plan → Source → Install → Test)
  - Call-to-action to contact you

### Contact (`/contact`)
- **What it is**: How people reach out to you
- **What's on it**: 
  - Contact form (Name, Email, Interest, Car, Message)
  - Interest options (Sports Car Finder, Performance HUB, Service Center, Pre-Purchase, Other)
  - Your email and response time info
  - FAQ section

### Upgrades (`/upgrades`)
- **What it does**: Redirects to Performance HUB
- This was a separate page before, but upgrade planning is now built into the Performance HUB

---

## 3. How The Technology Works

Don't worry—you don't need to understand programming. Here's the simple version:

### The Website Builder: Next.js

Your website is built with **Next.js**, which is like a very fancy website building tool made by Vercel (the company that also hosts your site). It's what companies like Netflix and TikTok use.

**Why this matters to you**: The site loads fast, works well on phones, and is good for Google search rankings.

### The Database: Supabase

Your car data, upgrade packages, and lead information are stored in a **database called Supabase**. Think of it like a really organized spreadsheet that the website can read and write to.

**Why this matters to you**: You can update car information without touching the website code. Leads are safely stored and can be exported.

### The Hosting: Vercel

Your website lives on **Vercel's servers**. When someone types your website address, Vercel delivers the page to them instantly from wherever they are in the world.

**Why this matters to you**: The site is fast globally, automatically scales if you get lots of traffic, and rarely goes down.

### The Images: Vercel Blob Storage

All the car images and page banners are stored in **Vercel Blob**, which is a special place for images that loads them super fast.

**Why this matters to you**: Images load quickly even on slow connections.

---

## 4. What's In The Database

Your database has **four main tables** (think of them as four different spreadsheets):

### 1. Cars Table (35 cars)
Each car has **60+ fields** of information:

**Basic Info:**
- Name, Year range, Price range
- Tier (Premium, Upper, Mid, Budget)
- Category (Mid-Engine, Front-Engine, Rear-Engine)
- Brand, Country of origin

**Advisory Scores (1-10 scale):**
- Sound & Character
- Interior & Comfort
- Track Capability
- Reliability & Ownership
- Value for Money
- Driver Engagement
- Aftermarket & Tuning

**Performance Specs:**
- Engine, Horsepower, Torque
- Transmission, Drivetrain
- 0-60 time, Quarter mile, Top speed
- Braking distance, Lateral G
- Curb weight

**Performance HUB Scores (1-10 scale):**
- Power & Acceleration
- Grip & Cornering
- Braking
- Track Pace
- Drivability
- Reliability & Heat
- Sound & Emotion

**Ownership Info:**
- Manual available (yes/no)
- Number of seats
- Daily usability (Dailyable, Weekend warrior, Track focused)
- Maintenance cost rating (1-5)
- Insurance cost rating (1-5)
- Fuel economy
- Common issues list
- Years to avoid
- Ownership cost notes

**Content:**
- Notes, Highlight, Tagline
- Pros list, Cons list
- Best For list
- Hero image URL

### 2. Leads Table
Every person who fills out a form is stored here:

- Email address
- Name
- Source (where they came from: contact page, newsletter, car page, etc.)
- Interest (what they're interested in)
- Message
- Which car they were looking at (if applicable)
- When they submitted

### 3. Upgrade Packages Table
The upgrade options shown in Performance HUB:

- Package name and description
- Type (Package or Individual Module)
- Tier (Street/Sport, Track Pack, Time Attack)
- Category (Exhaust, Suspension, Brakes, Power, etc.)
- Estimated cost range
- Performance improvements (how much it adds to each score)
- What's included
- Considerations/trade-offs

### 4. Upgrade Education Table
Educational content about individual upgrades:

- Upgrade name (Cold Air Intake, Coilovers, etc.)
- What it does
- How it works
- Cost range
- Installation difficulty
- Pros and cons
- What it works well with

---

## 5. The 35 Cars & How They Were Added

### The Car Lineup

Your database includes **35 sports cars** across four price tiers:

#### Premium Tier ($75K+) - 7 cars
1. 718 Cayman GT4 (2020-2024)
2. 718 Cayman GTS 4.0 (2020-2024)
3. Audi R8 V8 (2008-2015)
4. Audi R8 V10 (2010-2015)
5. Lamborghini Gallardo (2004-2014)
6. Lotus Emira (2022-2024)
7. Dodge Viper (2013-2017)

#### Upper-Mid Tier ($55K-75K) - 7 cars
1. C8 Corvette Stingray (2020-2024)
2. 981 Cayman GTS (2015-2016)
3. 991.1 Carrera S (2012-2016)
4. 997.2 Carrera S (2009-2012)
5. Nissan GT-R (2009-2020)
6. Shelby GT500 (2020-2022)
7. Lotus Evora GT (2020-2021)

#### Mid Tier ($40K-55K) - 11 cars
1. 981 Cayman S (2013-2016)
2. Shelby GT350 (2016-2020)
3. Jaguar F-Type R (2015-2020)
4. C7 Corvette Grand Sport (2017-2019)
5. C7 Corvette Z06 (2015-2019)
6. Camaro ZL1 (2017-2023)
7. BMW M2 Competition (2019-2021)
8. Alfa Romeo 4C (2015-2020)
9. Aston Martin V8 Vantage (2008-2017)
10. Lotus Evora S (2010-2015)
11. Lexus LC 500 (2018-2024)

#### Budget Tier ($25K-40K) - 10 cars
1. 987.2 Cayman S (2009-2012)
2. Jaguar F-Type V6 S (2014-2020)
3. Lexus RC F (2015-2022)
4. Nissan 370Z NISMO (2009-2020)
5. Mercedes C63 AMG W204 (2008-2014)
6. BMW M4 F82 (2015-2020)
7. Mustang GT PP2 (2018-2023)
8. Camaro SS 1LE (2017-2023)
9. Toyota GR Supra (2020-2024)
10. Maserati GranTurismo (2008-2019)

### How The Data Was Created

1. **Base specifications**: Engine, HP, 0-60 times, etc. came from manufacturer data and trusted automotive sources

2. **Advisory scores**: These are based on real ownership experience, forum research, automotive journalism, and enthusiast consensus. Each score represents:
   - 9-10: Exceptional (best in class)
   - 7-8: Great
   - 5-6: Good
   - 3-4: Average
   - 1-2: Below Average

3. **Ownership information**: Common issues, years to avoid, and cost notes came from owner forums, repair databases, and automotive communities

4. **Performance HUB scores**: These are derived from hard metrics (0-60, braking distance, lateral G) combined with real-world track reports

### Adding or Updating Cars

To add a new car or update existing data:
- The data is stored in two places: a local file (`data/cars.js`) and the Supabase database
- The website reads from Supabase first, then falls back to the local file if Supabase is unavailable
- Changes to Supabase are reflected immediately on the live site

---

## 6. How Car Finder Works

The Car Finder is your main tool for matching people with cars. Here's exactly how it works:

### Step 1: User Sets Their Priorities

The user sees **7 sliders**, each representing something they might care about:

| Category | What It Measures |
|----------|-----------------|
| **Sound & Character** | Exhaust note, engine character, emotional response |
| **Interior & Comfort** | Materials quality, ergonomics, daily livability |
| **Track Capability** | Lap times, handling limits, cooling, brake fade |
| **Reliability & Ownership** | Maintenance costs, known issues, dependability |
| **Value for Money** | Performance per dollar, depreciation |
| **Driver Engagement** | Steering feel, throttle response, connection |
| **Aftermarket & Tuning** | Tuning support, parts availability, community |

Each slider goes from **0 to 3**:
- 0 = "I don't care about this at all"
- 1 = "Normal priority" (default)
- 2 = "This is more important than average"
- 3 = "This is my top priority"

### Step 2: The Math (Weighted Scoring)

For each car, the system calculates a **weighted total score**:

```
Total Score = (Sound Score × Sound Weight) + (Interior Score × Interior Weight) + ... etc.
```

**Example**: If a user sets Sound to 3× priority and Reliability to 2× priority, and a car scores:
- Sound: 9/10 × 3 = 27 points
- Reliability: 7/10 × 2 = 14 points
- All other categories at normal (1×): calculated similarly

The car with the highest total wins.

### Step 3: Must-Have Filters

Users can also set **hard requirements**:
- ✅ Manual Transmission Only
- ✅ RWD Only (or AWD Only)
- ✅ 2-Seater Only (or 4+ Seats)

Cars that don't meet these requirements are hidden entirely.

### Step 4: Price & Category Filters

Users can filter by:
- Price range ($25K-50K, $40K-75K, $60K-100K, or all)
- Engine layout (Mid-Engine, Front-Engine, Rear-Engine, or all)

### Step 5: Personalized Recommendations

Based on the user's priorities, they see **4-5 recommendation cards**:

- **Your Top Match**: The overall best car for their weighted priorities
- **Your Sound Pick**: Best car for sound (if they weighted sound highly)
- **Your Track Pick**: Best car for track capability
- **Your Value Pick**: Best car for value
- **Your Reliability Pick**: Best car for reliability

These change dynamically based on what the user cares about most.

### Step 6: The Full List

Below the recommendations, users see **all 35 cars** in a sortable table showing:
- Rank (based on their priorities)
- Vehicle name and tier
- All 7 scores
- Total weighted score
- Price range

Clicking any car takes them to that car's detail page.

---

## 7. How Performance HUB Works

The Performance HUB is like the upgrade screen in Gran Turismo or Forza video games. It shows people what their car could become with modifications.

### How To Use It

1. **Select a Car**: Choose from the grid of 35 vehicles
2. **View Stock Performance**: See the car's baseline metrics
3. **Select Upgrade Packages**: Choose from Street/Sport, Track Pack, or Time Attack
4. **See the Impact**: Watch the performance bars grow

### What It Shows

#### Real Metrics
- **Power**: Actual HP with gains (e.g., "490 hp → 530 hp, +40 hp")
- **0-60 Time**: Acceleration with improvement (e.g., "3.2s → 2.9s, -0.3s")
- **60-0 Braking**: Stopping distance with improvement
- **Lateral G**: Cornering grip with improvement

#### Experience Scores (1-10)
- **Drivability**: Daily usability and comfort
- **Reliability & Heat**: Track endurance
- **Sound & Emotion**: Exhaust note and engagement

### Upgrade Packages

There are three tiers of upgrade packages:

**1. Street/Sport** (~$3,000-$8,000)
- Bolt-on upgrades for spirited street driving
- Intake, exhaust, basic suspension
- No warranty concerns
- Good for: Daily drivers who want more fun

**2. Track Pack** (~$8,000-$20,000)
- Serious upgrades for track days
- Coilovers, big brakes, ECU tune
- May affect warranty
- Good for: Weekend track warriors

**3. Time Attack** (~$20,000-$50,000+)
- Race-oriented modifications
- Roll cage, aero, full engine build
- Not street-legal in some cases
- Good for: Competitive drivers

### Brand-Specific Pricing

The system knows that upgrades cost different amounts depending on the car brand:

| Platform Tier | Cost Multiplier | Brands |
|--------------|-----------------|--------|
| Exotic | 2.0× | Ferrari, Lamborghini, McLaren, Aston Martin |
| Premium | 1.5× | Porsche, BMW, Mercedes-AMG, Audi |
| Luxury | 1.3× | Lexus, Jaguar, Maserati, Alfa Romeo, Lotus |
| Mainstream | 1.0× | Ford, Chevrolet, Dodge, Nissan, Toyota |

So a brake kit that costs $3,000 for a Mustang might cost $4,500+ for a Porsche.

### Individual Modules

Users can also fine-tune their build with individual upgrades:
- Cold Air Intake
- Exhaust (Cat-back, Headers, etc.)
- Coilovers
- Big Brake Kit
- ECU Tune
- Wheels/Tires
- And more...

Each module shows:
- What it does
- How much it costs
- How much HP it adds (if applicable)
- What scores it improves

---

## 8. How Leads & Contact Forms Work

### Where Leads Come From

People can submit their contact information from several places:

| Source | Where It Appears |
|--------|-----------------|
| **Contact Page** | Main contact form at `/contact` |
| **Newsletter** | Footer on every page |
| **Car Pages** | "Want to learn more?" forms |
| **Performance HUB** | "Get help with your build" |

### What Gets Captured

When someone submits a form, the database stores:
- Their email address (required)
- Their name (if provided)
- Where they submitted from (contact, newsletter, etc.)
- What they're interested in (Car Finder, Performance HUB, Services, etc.)
- Their message (if provided)
- Which car they were looking at (if applicable)
- When they submitted

### How It Works

1. User fills out form
2. Website sends data to Supabase database
3. Lead is stored with all relevant information
4. User sees "Thank you" confirmation

### Duplicate Handling

If the same email address submits multiple times:
- The system updates the existing record instead of creating duplicates
- The most recent information and any new messages are added
- You always have one clean record per person

### Accessing Your Leads

You can view leads by:
1. Logging into your Supabase dashboard
2. Going to the "leads" table
3. Viewing, filtering, or exporting the data

---

## 9. The Scoring System Explained

### Advisory Scores (Car Finder)

Every car has **7 scores on a 1-10 scale**:

| Score | What It Means |
|-------|--------------|
| **Sound & Character** | How good does it sound? How emotionally engaging is the engine? Does the exhaust note give you chills? |
| **Interior & Comfort** | How nice is it inside? Quality materials? Good ergonomics? Comfortable for long drives? |
| **Track Capability** | How fast is it on a track? Good cooling? Brakes that don't fade? Communicative handling? |
| **Reliability & Ownership** | Is it dependable? Expensive to maintain? Known problems? Easy to find parts? |
| **Value for Money** | How much performance per dollar? Does it hold value? Is it a smart buy? |
| **Driver Engagement** | Is the steering alive? Does the throttle respond instantly? Do you feel connected? |
| **Aftermarket & Tuning** | Can you easily modify it? Big parts community? Lots of tuning options? |

### What The Numbers Mean

| Score | Rating | Description |
|-------|--------|-------------|
| 9-10 | Exceptional | Best in class, this is what the car does best |
| 7-8 | Great | Very strong in this area |
| 5-6 | Good | Acceptable, middle of the pack |
| 3-4 | Average | Below average, a weak point |
| 1-2 | Poor | Significant weakness |

### Performance HUB Scores

These are different scores used specifically for the upgrade visualization:

| Score | What It Measures |
|-------|-----------------|
| **Power & Acceleration** | Raw horsepower, torque, 0-60, quarter mile |
| **Grip & Cornering** | Tire grip, suspension balance, lateral G |
| **Braking** | Stopping distance, fade resistance, pedal feel |
| **Track Pace** | Overall lap time potential |
| **Drivability** | Daily comfort, ride quality, ease of use |
| **Reliability & Heat** | Track endurance, cooling capacity |
| **Sound & Emotion** | Exhaust note, intake sound, engagement |

### How Upgrades Change Scores

Each upgrade has a **delta value** (how much it adds):

Example: A sport exhaust might add:
- +0 to Power (no HP gain from exhaust alone)
- +1.5 to Sound & Emotion (sounds way better)
- -0.5 to Drivability (louder drone on highway)

The Performance HUB adds up all the deltas from selected upgrades to show the improved scores.

---

## 10. Images & Media

### Where Images Are Stored

All images are stored in **Vercel Blob Storage**, which is a cloud service that serves images fast worldwide.

The images have URLs like:
```
https://abqnp7qrs0nhv5pw.public.blob.vercel-storage.com/cars/718-cayman-gt4-hero.png
```

### Types of Images

**Car Images (35 total)**
- Each car has a hero image
- Used on car detail pages and in the carousel
- AI-generated consistent style images

**Page Images (7 total)**
- Home page hero
- Car Finder hero
- Performance HUB hero
- Services hero
- Contact hero
- About images

### Image Fallback

If an image fails to load:
1. The website shows a **styled placeholder** instead
2. The placeholder shows the car's initials
3. Everything still works—images are cosmetic

### Adding New Images

To add images:
1. Upload to Vercel Blob storage
2. Update the `imageHeroUrl` field in the car's database record
3. Images appear immediately

---

## 11. Common Questions

### "How do I update a car's information?"

Two options:
1. **Direct database edit**: Log into Supabase, find the car, change the field
2. **Code update**: Edit the `data/cars.js` file and redeploy (this also updates the database)

### "How do I add a new car?"

1. Add all required fields to the database (or the code file)
2. Create/upload a hero image
3. The car will appear in all lists automatically

### "How do I see my leads?"

1. Go to your Supabase dashboard
2. Navigate to Table Editor → leads
3. View, filter, or export as CSV

### "Why does a car show a placeholder instead of an image?"

Either:
- The image hasn't been uploaded yet
- The image URL is incorrect
- There's a temporary issue with Vercel Blob

### "Can I change the scoring methodology?"

Yes. The scoring formulas are in `lib/scoring.js`. The weights and calculations can be adjusted.

### "What happens if the database goes down?"

The website has a **fallback system**:
1. It tries to load from Supabase first
2. If that fails, it uses local data from the code
3. Users never see an error—just potentially slightly older data

### "How do people find this site on Google?"

The site is optimized for search engines with:
- Proper page titles and descriptions
- Semantic HTML structure
- Fast loading times
- Mobile-friendly design
- Automatic sitemap generation

### "Can I add a blog or news section?"

Yes, but it would require development work. The architecture supports adding new pages easily.

### "How secure is the lead data?"

- All data transmission is encrypted (HTTPS)
- Supabase has enterprise-grade security
- Leads table has "row-level security" so random visitors can't read other people's submissions
- Only you can access lead data with your admin credentials

---

## Quick Reference Card

| What | Where |
|------|-------|
| Live Website | Your Vercel URL |
| Database Dashboard | Supabase dashboard |
| Image Storage | Vercel Blob |
| Source Code | GitHub repository |
| Number of Cars | 35 |
| Price Range | $25K - $100K+ |
| Scoring Categories | 7 (Advisory) + 7 (Performance) |
| Upgrade Tiers | 3 (Street/Sport, Track, Time Attack) |
| Lead Sources | 7+ (Contact, Newsletter, Car Pages, etc.) |

---

## Need Help?

For technical support or questions about the website:
- Contact your developer
- Check the `SOURCE_OF_TRUTH.md` file for technical details
- The codebase is well-documented with comments

---

*This guide covers everything you need to know about how your AutoRev website works. Keep it handy for reference, and feel free to ask questions about anything that's not clear.*







