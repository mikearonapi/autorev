# PAGE AUDIT: /garage/my-photos - Photo Gallery

> **Audit ID:** Page-20  
> **Category:** Core App Page (Garage Sub-Page)  
> **Priority:** 19 of 36  
> **Route:** `/garage/my-photos`  
> **Auth Required:** Yes  
> **Parent:** `/garage`

---

## PAGE OVERVIEW

The My Photos page manages the user's **vehicle photo gallery**. Users can upload photos, organize them, set a primary photo, and potentially tag photos with mods or dates.

**Key Features:**
- Photo upload
- Gallery display
- Primary photo selection
- Photo deletion
- Lightbox/zoom view
- Photo organization/tagging

---

## FILES TO EXAMINE

### Page Files

| File | Purpose |
|------|---------|
| `app/(app)/garage/my-photos/page.jsx` | Main page component |
| `app/(app)/garage/my-photos/page.module.css` | Page styles |

### Related Components

| File | Purpose |
|------|---------|
| `components/PhotoGallery.jsx` | Gallery grid display |
| `components/PhotoUploader.jsx` | Upload component |
| `components/PhotoCard.jsx` | Individual photo |
| `components/Lightbox.jsx` | Full-screen view |
| `components/ImageCropper.jsx` | Image editing |

### Related Services

| File | Purpose |
|------|---------|
| `lib/uploadService.js` | Image upload handling |
| `app/api/uploads/` | Upload API routes |
| `app/api/user-photos/` | Photo management API |

---

## CRITICAL: Read These First

Before making ANY changes:

1. `docs/SOURCE_OF_TRUTH.md` - Upload patterns, Image handling
2. `docs/BRAND_GUIDELINES.md` - Image display, Aspect ratios
3. Cross-cutting audit findings:
   - A (Performance) - Image optimization
   - B (Security) - Upload validation
   - D (UI/UX) - Gallery patterns

---

## IMPORTANT: INVESTIGATE BEFORE FIX

Before changing ANY code:

1. ✅ Verify photo upload works
2. ✅ Test gallery loads existing photos
3. ✅ Check delete functionality
4. ❌ Do NOT change upload logic without understanding storage
5. ❓ If uploads fail, check Supabase storage config

---

## CHECKLIST

### A. Functionality

- [ ] Page loads existing photos
- [ ] Can upload new photos
- [ ] Upload shows progress
- [ ] Can delete photos
- [ ] Can set primary photo
- [ ] Lightbox opens on click
- [ ] Photos load for correct vehicle

### B. Data Flow

- [ ] Uses `useSelectedCar()` for vehicle context
- [ ] Photos scoped to selected vehicle
- [ ] Uses Supabase Storage correctly
- [ ] Proper cache invalidation after upload
- [ ] Optimistic delete with rollback

### C. Upload Experience

- [ ] Drag-and-drop supported
- [ ] File picker fallback
- [ ] File type validation (jpg, png, webp)
- [ ] File size validation
- [ ] Upload progress indicator
- [ ] Error messages clear
- [ ] Success confirmation

### D. UI/UX Design System

- [ ] **Upload CTA** = Lime
- [ ] **Primary badge** = Teal
- [ ] **Delete** = Red/destructive
- [ ] No hardcoded colors
- [ ] 44px touch targets
- [ ] Consistent aspect ratios

### E. Gallery Grid

```
┌──────┐ ┌──────┐ ┌──────┐
│ ⭐   │ │      │ │      │
│ img  │ │ img  │ │ img  │
│      │ │      │ │      │
└──────┘ └──────┘ └──────┘
┌──────┐ ┌──────┐ ┌──────┐
│      │ │      │ │  +   │
│ img  │ │ img  │ │ Add  │
│      │ │      │ │      │
└──────┘ └──────┘ └──────┘
```

- [ ] Grid responsive (3 cols desktop, 2 tablet, 1-2 mobile)
- [ ] Consistent aspect ratio (16:9 or square)
- [ ] Primary photo marked with star/badge
- [ ] Hover shows actions
- [ ] Add button in grid (lime)

### F. Image Optimization

- [ ] Uses Next.js `<Image>` component
- [ ] Proper width/height or fill
- [ ] Placeholder blur or skeleton
- [ ] srcset for responsive
- [ ] Lazy loading for below-fold

### G. Lightbox/Zoom

- [ ] Opens on photo click
- [ ] Shows full resolution
- [ ] Close button visible (44px)
- [ ] Escape key closes
- [ ] Click outside closes
- [ ] Navigation if multiple photos
- [ ] Focus trapped

### H. Photo Actions

| Action | Trigger | Confirmation |
|--------|---------|--------------|
| Set Primary | Click star/button | Immediate |
| Delete | Click trash | Confirm dialog |
| Download | Click download | Browser download |

- [ ] Actions accessible on hover/focus
- [ ] Delete has confirmation
- [ ] Primary updates immediately

### I. Loading States

- [ ] Skeleton grid while loading
- [ ] Upload progress bar
- [ ] Individual photo placeholders

### J. Empty State

- [ ] No photos message
- [ ] CTA to upload first photo
- [ ] No vehicle selected guidance

### K. Error States

- [ ] Upload failed message
- [ ] Network error handling
- [ ] Storage quota exceeded
- [ ] Invalid file type message

### L. Accessibility

- [ ] Images have alt text
- [ ] Gallery keyboard navigable
- [ ] Lightbox focus management
- [ ] Upload button accessible
- [ ] Delete confirmation accessible

### M. Mobile Responsiveness

- [ ] Grid adapts to screen size
- [ ] Touch-friendly actions
- [ ] Lightbox mobile-friendly
- [ ] Upload works on mobile
- [ ] 44px touch targets

### N. Security (Cross-ref B audit)

- [ ] File type validated server-side
- [ ] File size limited
- [ ] User can only see own photos
- [ ] Delete authorization checked

---

## SPECIFIC CHECKS

### Image Component Usage

```javascript
// MUST use Next.js Image component
import Image from 'next/image';

// Correct usage
<Image
  src={photo.url}
  alt={`${car.year} ${car.make} ${car.model}`}
  width={400}
  height={225}
  placeholder="blur"
  blurDataURL={photo.blur_hash}
  className={styles.galleryImage}
/>

// OR with fill
<div className={styles.imageContainer}>
  <Image
    src={photo.url}
    alt="Vehicle photo"
    fill
    sizes="(max-width: 768px) 50vw, 33vw"
    style={{ objectFit: 'cover' }}
  />
</div>
```

### Upload Handler Pattern

```javascript
// Upload should handle progress and errors
const handleUpload = async (files) => {
  for (const file of files) {
    // Validate
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Only JPG, PNG, and WebP files allowed');
      continue;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File must be under 10MB');
      continue;
    }
    
    // Upload with progress
    setUploading(true);
    setProgress(0);
    
    try {
      const url = await uploadToStorage(file, (progress) => {
        setProgress(progress);
      });
      // Save to database
      await savePhotoRecord(carId, url);
      // Invalidate cache
      queryClient.invalidateQueries(['car-photos', carId]);
    } catch (error) {
      toast.error('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }
};
```

### Primary Photo Pattern

```javascript
// Set primary should update both local and server
const setPrimaryPhoto = useMutation({
  mutationFn: async (photoId) => {
    return await updatePrimaryPhoto(carId, photoId);
  },
  onMutate: async (photoId) => {
    // Optimistic update
    queryClient.setQueryData(['car-photos', carId], (old) => 
      old.map(p => ({ ...p, is_primary: p.id === photoId }))
    );
  },
  onError: (err, photoId, context) => {
    // Rollback
    queryClient.setQueryData(['car-photos', carId], context.previousPhotos);
  },
});
```

---

## TESTING SCENARIOS

### Test Case 1: View Gallery

1. Select vehicle with existing photos
2. Navigate to /garage/my-photos
3. **Expected:** Grid of photos loads
4. **Verify:** Primary photo marked, all photos visible

### Test Case 2: Upload Photo

1. Click upload button or drag file
2. Select valid image file
3. **Expected:** Progress indicator, then photo appears
4. **Verify:** Photo in grid, persists on refresh

### Test Case 3: Set Primary

1. Click star on non-primary photo
2. **Expected:** Star moves to new photo
3. **Verify:** Primary updates in database

### Test Case 4: Delete Photo

1. Click delete on a photo
2. Confirm deletion
3. **Expected:** Photo removed from grid
4. **Verify:** Deleted from storage

### Test Case 5: Lightbox

1. Click on any photo
2. **Expected:** Opens in lightbox
3. **Verify:** Close button works, escape works

### Test Case 6: Empty State

1. Vehicle with no photos
2. **Expected:** Empty state with upload CTA
3. **Verify:** Lime button to upload

### Test Case 7: Invalid File

1. Try to upload non-image file
2. **Expected:** Error message shown
3. **Verify:** File rejected, no partial upload

---

## AUTOMATED CHECKS

```bash
# 1. Check for Next.js Image usage
grep -rn "next/image\|<Image" app/\(app\)/garage/my-photos/*.jsx

# 2. Check for raw <img> tags (SHOULD NOT EXIST)
grep -rn "<img " app/\(app\)/garage/my-photos/*.jsx

# 3. Check for hardcoded colors
grep -rn "#[0-9a-fA-F]\{3,6\}" app/\(app\)/garage/my-photos/*.jsx app/\(app\)/garage/my-photos/*.css

# 4. Check for upload validation
grep -rn "file.type\|file.size\|accept=" app/\(app\)/garage/my-photos/*.jsx

# 5. Check for alt text
grep -rn "alt=" app/\(app\)/garage/my-photos/*.jsx

# 6. Check for console.log
grep -rn "console\.log" app/\(app\)/garage/my-photos/*.jsx
```

---

## CROSS-REFERENCE WITH FOUNDATION AUDITS

| Audit | Check On This Page |
|-------|-------------------|
| A. Performance | Image optimization, lazy loading |
| B. Security | Upload validation, authorization |
| D. UI/UX | Gallery patterns, lightbox |
| E. Accessibility | Alt text, keyboard nav |

---

## DELIVERABLES

### 1. Functionality Report

| Feature | Works | Issues |
|---------|-------|--------|
| View gallery | ✅/❌ | |
| Upload photo | ✅/❌ | |
| Delete photo | ✅/❌ | |
| Set primary | ✅/❌ | |
| Lightbox | ✅/❌ | |

### 2. Image Optimization Report

| Check | Status |
|-------|--------|
| Uses `<Image>` component | ✅/❌ |
| Has width/height or fill | ✅/❌ |
| Has placeholder | ✅/❌ |
| Has sizes attribute | ✅/❌ |
| Alt text present | ✅/❌ |

### 3. Issues Found

| Severity | Issue | File:Line | Fix |
|----------|-------|-----------|-----|
| | | | |

---

## VERIFICATION

- [ ] All images use Next.js `<Image>`
- [ ] Upload validates file type/size
- [ ] Gallery responsive on all devices
- [ ] Lightbox keyboard accessible
- [ ] Empty state has lime CTA
- [ ] Primary photo marked with teal

---

## SUCCESS CRITERIA

| # | Criterion |
|---|-----------|
| 1 | Photos load for selected vehicle |
| 2 | Upload works with progress indicator |
| 3 | Uses Next.js `<Image>` component |
| 4 | All images have alt text |
| 5 | Lightbox accessible (keyboard, focus) |
| 6 | Empty state guides to upload |
| 7 | No critical/high issues remaining |

---

## OUTPUT FORMAT

```
📷 PAGE AUDIT: /garage/my-photos

**Status:** ✅ Pass / ⚠️ Issues / ❌ Fail

**Image Optimization:**
- Next.js Image: ✅
- Width/height: ✅
- Placeholder: ⚠️ (missing blur)
- Alt text: ✅

**Functionality:**
- [x] View gallery
- [x] Upload photos
- [ ] Delete broken (issue #1)

**Issues Found:**
1. [High] Delete doesn't confirm - deletes immediately
2. [Medium] Missing placeholder blur
...

**Test Results:**
- View gallery: ✅
- Upload: ✅
- Delete: ❌
- Lightbox: ✅
```

---

## AUDIT EXECUTION LOG

| Date | Auditor | Status | Issues Fixed | Notes |
|------|---------|--------|--------------|-------|
| | | | | |

---

*Audit prompt generated: January 25, 2026*  
*Part of AutoRev Systematic Audit Suite (36 total audits)*
