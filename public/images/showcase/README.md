# Feature Phone Showcase Images

This directory contains iPhone screenshots for the Feature Phone Showcase section on the homepage.

## Expected Files

Place the following screenshots in this directory:

1. **garage-phone.png** - Screenshot of My Garage feature
2. **tuning-phone.png** - Screenshot of Tuning Shop feature  
3. **al-phone.png** - Screenshot of AL AI assistant chat

## Image Specifications

- **Dimensions**: 390×844px (iPhone 14 Pro screen size recommended)
- **Format**: PNG or WebP
- **Quality**: High resolution for clarity when scaled

## Usage

These images are displayed inside realistic iPhone 17 Pro frames with:
- Dynamic Island at top
- Side buttons (volume + power)
- Content scaled to 70% for realistic presentation
- Responsive sizing across mobile, tablet, and desktop

## Fallback

If images are not yet available, the component displays placeholder screens with:
- Feature icon
- Feature name
- "Screenshot Coming Soon" message

## Future Enhancement

To replace placeholders with actual screenshots:

1. Add your screenshot files to this directory
2. Update `FeaturePhoneShowcase.jsx`:
   - Replace `<div className={styles.placeholderScreen}>` with:
   ```jsx
   <img 
     src="/images/showcase/garage-phone.png" 
     alt="My Garage feature"
     className={styles.screenshot}
   />
   ```
3. Repeat for tuning-phone.png and al-phone.png

