# SuperNatural Motorsports - Image Inventory

This document lists all images needed for the site. Each image has a unique filename that indicates where it belongs.

## Image Storage
- **Local Generation**: Use Google AI (Imagen/Gemini) to generate images locally
- **Upload Destination**: Vercel Blob Storage
- **Base URL**: Set via `VITE_VERCEL_BLOB_URL` environment variable
- **Format**: WebP preferred for web optimization (JPEG as fallback)

---

## 1. Page Hero Images

These are large banner/background images for page heroes.

| Filename | Location | Description | Dimensions | Notes |
|----------|----------|-------------|------------|-------|
| `pages/home/hero.webp` | Home page hero | Dynamic sports car on track, motion blur, dramatic lighting | 1920x1080 | Main brand image, should feel premium and exciting |
| `pages/home/value-prop.webp` | Home "Built for Enthusiasts" section | Mechanic working on car OR group of enthusiasts in garage | 1200x800 | Should feel authentic, not stock-photo-ish |
| `pages/advisory/hero.webp` | Advisory page background | Multiple sports cars arranged artfully | 1920x600 | Subtle, doesn't compete with UI |
| `pages/performance/hero.webp` | Performance HUB hero | GT-style racing visualization | 1920x600 | Inspired by Gran Turismo aesthetic |
| `pages/upgrades/hero.webp` | Upgrades page hero | Close-up of performance parts (turbo, exhaust, suspension) | 1920x600 | Technical, detailed |
| `pages/services/hero.webp` | Services page hero | Professional shop/garage environment | 1920x600 | Clean, professional |
| `pages/contact/hero.webp` | Contact page hero | Subtle automotive background | 1920x400 | Minimal, doesn't distract |

---

## 2. Section Images

Medium-sized images used within page sections.

| Filename | Location | Description | Dimensions | Notes |
|----------|----------|-------------|------------|-------|
| `sections/how-it-works/step-1.webp` | Home "How It Works" | Person at computer browsing cars | 600x400 | Illustrative |
| `sections/how-it-works/step-2.webp` | Home "How It Works" | Recommendation/comparison visualization | 600x400 | |
| `sections/how-it-works/step-3.webp` | Home "How It Works" | Planning/notes with car image | 600x400 | |
| `sections/how-it-works/step-4.webp` | Home "How It Works" | Person driving/enjoying car | 600x400 | |
| `sections/pillars/selector.webp` | Home pillars | Sports car lineup | 400x300 | Card thumbnail |
| `sections/pillars/advisory.webp` | Home pillars | Wrench/tools | 400x300 | Card thumbnail |
| `sections/pillars/services.webp` | Home pillars | Garage/shop | 400x300 | Card thumbnail |
| `sections/services/consultation.webp` | Services page | Advisor talking with customer | 600x400 | |
| `sections/services/performance.webp` | Services page | Performance work being done | 600x400 | |
| `sections/services/installation.webp` | Services page | Parts installation | 600x400 | |

---

## 3. Car Hero Images

One hero image per car in the database. These appear on CarDetail pages and in the Performance HUB.

**Naming Convention**: `cars/{slug}/hero.webp`

| Filename | Car Name | Description |
|----------|----------|-------------|
| `cars/718-cayman-gt4/hero.webp` | 718 Cayman GT4 | 3/4 front view, dynamic pose |
| `cars/718-cayman-gts-4/hero.webp` | 718 Cayman GTS 4.0 | 3/4 front view, dynamic pose |
| `cars/718-boxster-gts-4/hero.webp` | 718 Boxster GTS 4.0 | 3/4 front view, top down |
| `cars/987-cayman-s/hero.webp` | 987 Cayman S | Classic angle |
| `cars/981-cayman-gts/hero.webp` | 981 Cayman GTS | 3/4 front view |
| `cars/981-boxster-gts/hero.webp` | 981 Boxster GTS | 3/4 front view, top down |
| `cars/996-gt3/hero.webp` | 996 GT3 | Iconic angle |
| `cars/997-gt3/hero.webp` | 997.1 GT3 | Dynamic pose |
| `cars/c7-corvette-z06/hero.webp` | C7 Corvette Z06 | Aggressive angle |
| `cars/c7-corvette-gs/hero.webp` | C7 Corvette Grand Sport | 3/4 front view |
| `cars/c6-corvette-z06/hero.webp` | C6 Corvette Z06 | Classic muscle |
| `cars/c8-corvette-stingray/hero.webp` | C8 Corvette Stingray | Modern supercar |
| `cars/s2000-ap2/hero.webp` | Honda S2000 AP2 | Clean JDM style |
| `cars/s2000-ap1/hero.webp` | Honda S2000 AP1 | Clean JDM style |
| `cars/370z-nismo/hero.webp` | 370Z NISMO | Aggressive stance |
| `cars/370z/hero.webp` | 370Z | Sport compact |
| `cars/350z-hr/hero.webp` | 350Z HR | Classic Z |
| `cars/supra-mk5-3/hero.webp` | GR Supra 3.0 | Modern sports car |
| `cars/supra-mk4-turbo/hero.webp` | MK4 Supra Turbo | JDM legend |
| `cars/gr86/hero.webp` | Toyota GR86 | Clean lines |
| `cars/brz/hero.webp` | Subaru BRZ | Twin aesthetic |
| `cars/frs-86/hero.webp` | Toyota 86/FR-S | First gen twin |
| `cars/nd2-miata/hero.webp` | ND2 MX-5 Miata | Roadster perfection |
| `cars/nd1-miata/hero.webp` | ND1 MX-5 Miata | Roadster |
| `cars/nc-miata/hero.webp` | NC MX-5 Miata | Previous gen |
| `cars/nb-miata/hero.webp` | NB MX-5 Miata | Classic |
| `cars/na-miata/hero.webp` | NA MX-5 Miata | OG roadster |
| `cars/mustang-gt-s550/hero.webp` | Mustang GT S550 | American muscle |
| `cars/mustang-gt-s197/hero.webp` | Mustang GT S197 | Retro muscle |
| `cars/camaro-ss-6th/hero.webp` | Camaro SS 6th Gen | Modern muscle |
| `cars/camaro-ss-5th/hero.webp` | Camaro SS 5th Gen | Revival |
| `cars/genesis-coupe-38/hero.webp` | Genesis Coupe 3.8 | Korean GT |
| `cars/challenger-scat-pack/hero.webp` | Challenger Scat Pack | Muscle car |
| `cars/nissan-gtr-r35/hero.webp` | Nissan GT-R R35 | Godzilla |
| `cars/m2-f87/hero.webp` | BMW M2 F87 | Compact beast |
| `cars/m240i/hero.webp` | BMW M240i | Sport luxury |
| `cars/c63-amg-w204/hero.webp` | Mercedes C63 AMG W204 | V8 sedan |

**Note**: Generate images as you add cars to the database. The full list should match `src/data/cars.js`.

---

## 4. Car Gallery Images (Optional)

Additional angles/detail shots for car pages. Lower priority.

**Naming Convention**: `cars/{slug}/gallery-{n}.webp` (n = 1, 2, 3...)

| Pattern | Description |
|---------|-------------|
| `gallery-1.webp` | Interior/cockpit |
| `gallery-2.webp` | Engine bay |
| `gallery-3.webp` | Rear 3/4 view |
| `gallery-4.webp` | Detail shot (wheel, exhaust, etc.) |

---

## 5. UI/Icon Images

Small images used in the UI. Most icons are SVG inline, but some decorative elements may be images.

| Filename | Location | Description | Dimensions |
|----------|----------|-------------|------------|
| `ui/placeholder-car.webp` | Fallback for car images | Generic sports car silhouette | 400x300 |
| `ui/placeholder-page.webp` | Fallback for page images | Abstract automotive pattern | 1920x600 |
| `ui/logo-dark.webp` | Footer/about | Logo on dark background | 200x60 |
| `ui/logo-light.webp` | Header | Logo on light background | 200x60 |

---

## Image Generation Prompts

When using Google AI (Imagen) to generate images, use these prompt templates:

### Car Hero Images
```
Professional automotive photography of a {year} {car_name}, 3/4 front angle, {color} color, 
dramatic lighting, cinematic composition, high detail, 8k resolution, Gran Turismo style,
clean background with subtle motion blur, showroom quality
```

### Page Hero Images
```
Wide cinematic shot of {description}, professional photography, dramatic lighting,
motion blur effect, automotive atmosphere, 8k resolution, aspect ratio 16:9
```

### Section Images
```
{description}, professional photography, clean composition, automotive context,
warm lighting, realistic, high detail
```

---

## Generation Workflow

1. **Run locally**: Use the prompt templates above with Google AI Studio or API
2. **Save locally**: Save generated images to `generated-images/` folder (gitignored)
3. **Review & Select**: Choose the best generation for each image
4. **Optimize**: Convert to WebP, resize to target dimensions
5. **Upload**: Use Vercel Blob upload (CLI or dashboard)
6. **Update database**: For car images, update `image_hero_url` in Supabase

---

## Vercel Blob Upload

### Via Dashboard
1. Go to Vercel Dashboard → Storage → Blob
2. Upload files maintaining the folder structure
3. Copy public URLs

### Via CLI (recommended for batch)
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Upload a file
vercel blob put cars/718-cayman-gt4/hero.webp ./generated-images/718-cayman-gt4-hero.webp

# Or use the upload script (when ready)
node scripts/upload-images.js
```

---

## Priority Order

Generate images in this order:

1. **Critical (needed for launch)**:
   - `pages/home/hero.webp`
   - `ui/placeholder-car.webp`
   - `ui/placeholder-page.webp`

2. **High (significantly improves UX)**:
   - All car hero images for top 10 most popular cars
   - `pages/advisory/hero.webp`
   - `pages/performance/hero.webp`

3. **Medium (nice to have)**:
   - Remaining car hero images
   - Section images
   - Other page heroes

4. **Low (future enhancement)**:
   - Car gallery images
   - Additional section images

