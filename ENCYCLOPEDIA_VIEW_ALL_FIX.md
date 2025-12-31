# Encyclopedia "View All" Button Fix

## Issue
The "View All" button in the Encyclopedia home view was not working properly. When clicked, it would attempt to navigate to section keys like `'automotive'`, `'modifications'`, or `'guides'`, but these keys were not recognized by the `getArticleById()` function, resulting in no content being displayed.

## Root Cause
The `getArticleById()` function in `lib/encyclopediaData.js` only handled specific article ID patterns like:
- `auto.{system}` - Automotive system articles
- `topic.{slug}` - Topic articles
- `category.{key}` - Modification category articles
- `mod.{key}` - Modification articles
- `guide.{key}` - Build guide articles

It did not handle top-level section keys (`'automotive'`, `'modifications'`, `'guides'`), which are what the "View All" buttons were trying to navigate to.

## Solution
Created dedicated section overview articles that display all items within a section when the "View All" button is clicked.

### Changes Made

#### 1. `lib/encyclopediaData.js`
- **Added `getSectionOverviewArticle()` function**: Creates overview pages for each top-level section
  - **Automotive section**: Shows all systems with component counts
  - **Modifications section**: Shows all active categories with mod counts
  - **Guides section**: Shows all build guides

- **Updated `getArticleById()` function**: Added checks at the beginning to handle top-level section keys and route them to the overview article generator

#### 2. `app/encyclopedia/page.jsx`
- **Added new `systemList` section type**: Special rendering for the automotive systems overview
  - Displays systems with color indicators
  - Shows component counts
  - Properly formatted labels (e.g., "5 components" vs "1 component")

#### 3. `app/encyclopedia/page.module.css`
- **Added `.systemColorIndicator` styles**: Visual color strip on the left edge of system cards
  - 4px wide vertical bar
  - Uses system-specific colors
  - Positioned absolutely within the card

## Article Structure
Each section overview article includes:
- **id**: The section key (`'automotive'`, `'modifications'`, `'guides'`)
- **type**: `'sectionOverview'`
- **title/subtitle**: From the section definition
- **breadcrumb**: Shows navigation path
- **summary**: Section description
- **sections**: Contains a single section with all items in that category
- **metadata**: Tracks section key and item count

## User Experience
When users click "View all {N} →" on any section:
1. They navigate to a dedicated overview page for that section
2. The page shows ALL items in that section (not just the first 8)
3. Each item is clickable and navigates to its detailed article
4. The breadcrumb clearly shows they're viewing a section overview
5. The page header includes the section icon and description

## Testing Recommendations
1. Navigate to the Encyclopedia home page
2. Click "View all 9 →" in the Automotive Systems section
3. Verify all 9 systems are displayed
4. Click "View all 10 →" in the Modifications section
5. Verify all active modification categories are displayed
6. Click "View all {N} →" in the Build Guides section
7. Verify all build guides are displayed
8. From each overview page, click individual items to verify navigation works

## Files Modified
- `lib/encyclopediaData.js`
- `app/encyclopedia/page.jsx`
- `app/encyclopedia/page.module.css`



