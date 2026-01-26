# PAGE AUDIT: /settings - Account Settings

> **Audit ID:** Page-12  
> **Category:** Settings & Profile  
> **Priority:** 27 of 36  
> **Route:** `/settings`  
> **Auth Required:** Yes

---

## PAGE OVERVIEW

The Settings page allows users to **manage their account settings**, including profile information, preferences, notifications, subscription, and account actions (delete, export).

**Key Features:**
- Profile editing (avatar, username, bio)
- Notification preferences
- Subscription management
- Theme preferences
- Account actions (export, delete)
- Connected accounts

---

## FILES TO EXAMINE

### Page Files

| File | Purpose |
|------|---------|
| `app/(app)/settings/page.jsx` | Settings page |
| `app/(app)/settings/page.module.css` | Settings styles |
| `app/(app)/settings/layout.jsx` | Settings layout |

### Related Components

| File | Purpose |
|------|---------|
| `components/SettingsSection.jsx` | Section wrapper |
| `components/SettingsToggle.jsx` | Toggle switch |
| `components/AvatarUploader.jsx` | Avatar upload |
| `components/SubscriptionCard.jsx` | Plan display |

### Related Services

| File | Purpose |
|------|---------|
| `lib/userDataService.js` | User data updates |
| `app/api/users/` | User API routes |
| `app/api/subscription/` | Subscription API |

---

## CRITICAL: Read These First

Before making ANY changes:

1. `docs/SOURCE_OF_TRUTH.md` - Settings patterns
2. `docs/BRAND_GUIDELINES.md` - Form patterns, toggles
3. Cross-cutting audit findings:
   - B (Security) - Profile update security
   - D (UI/UX) - Form patterns
   - E (Accessibility) - Form accessibility

---

## IMPORTANT: INVESTIGATE BEFORE FIX

Before changing ANY code:

1. ✅ Verify settings load correctly
2. ✅ Test saving changes works
3. ✅ Check destructive actions have confirmation
4. ❌ Do NOT change account deletion without review
5. ❓ If saves fail, check API validation

---

## CHECKLIST

### A. Functionality

- [ ] Settings page loads
- [ ] Profile info editable
- [ ] Avatar upload works
- [ ] Username validation works
- [ ] Notification toggles work
- [ ] Theme preference works
- [ ] Subscription info displays
- [ ] Data export works
- [ ] Account deletion works (with confirmation)

### B. Data Flow

- [ ] Uses `useUserData()` for profile
- [ ] Updates via API correctly
- [ ] Optimistic updates where appropriate
- [ ] Proper validation feedback
- [ ] Success/error toasts

### C. UI/UX Design System

- [ ] **Save button** = Lime
- [ ] **Destructive actions** = Red/amber warning
- [ ] **Toggles** = Lime when active
- [ ] **Form inputs** = Standard styling
- [ ] No hardcoded colors
- [ ] 44px touch targets

### D. Settings Layout

```
┌─────────────────────────────────────────────────┐
│  Settings                                       │
├─────────────────────────────────────────────────┤
│  Profile                                        │
│  ┌───────┐                                      │
│  │Avatar │  [Change Photo]                      │
│  └───────┘                                      │
│                                                 │
│  Username: [@_________]                         │
│  Email:    [_________]  (readonly)              │
│  Bio:      [________________]                   │
│                                                 │
│            [Save Changes] (lime)                │
├─────────────────────────────────────────────────┤
│  Notifications                                  │
│                                                 │
│  Email updates         [====○] On              │
│  Community activity    [○====] Off              │
│  New features          [====○] On              │
├─────────────────────────────────────────────────┤
│  Subscription                                   │
│                                                 │
│  Current Plan: Pro ($9.99/mo)                   │
│  Next billing: Feb 15, 2026                     │
│                                                 │
│  [Manage Subscription]                          │
├─────────────────────────────────────────────────┤
│  Data & Privacy                                 │
│                                                 │
│  [Export My Data]                               │
│  [Delete Account]  (red/destructive)            │
└─────────────────────────────────────────────────┘
```

- [ ] Clear section headers
- [ ] Logical grouping
- [ ] Save per section or global
- [ ] Destructive at bottom

### E. Profile Section

- [ ] Avatar upload with preview
- [ ] Username with validation
- [ ] Email (readonly or verified change)
- [ ] Bio with character limit
- [ ] Save button (lime)

### F. Form Validation

| Field | Validation |
|-------|------------|
| Username | Min 3 chars, unique, alphanumeric |
| Bio | Max 160 chars |
| Avatar | Image types, max size |

- [ ] Client-side validation
- [ ] Server-side validation
- [ ] Error messages clear
- [ ] Success feedback

### G. Notification Preferences

- [ ] Toggle switches
- [ ] Labels clear
- [ ] Instant save or explicit save
- [ ] Accessible labels

### H. Toggle Switch Pattern

```javascript
// Toggles should use accessible pattern
<label className={styles.toggleLabel}>
  <span>Email updates</span>
  <button
    role="switch"
    aria-checked={enabled}
    onClick={() => setEnabled(!enabled)}
    className={cn(styles.toggle, enabled && styles.enabled)}
  >
    <span className={styles.thumb} />
  </button>
</label>

// Active toggle in lime
.toggle.enabled {
  background: var(--color-accent-lime);
}
```

- [ ] Uses `role="switch"`
- [ ] `aria-checked` attribute
- [ ] Lime when on
- [ ] Thumb position changes

### I. Subscription Section

- [ ] Current plan displayed
- [ ] Price/billing cycle
- [ ] Next billing date
- [ ] Manage/cancel link
- [ ] Works with Stripe portal

### J. Destructive Actions

| Action | Confirmation |
|--------|--------------|
| Delete account | Modal with type confirmation |
| Export data | Simple confirmation |
| Cancel subscription | Stripe handles |

- [ ] Delete requires typing "DELETE"
- [ ] Clear warning message
- [ ] Red/amber styling
- [ ] Cannot be undone message

### K. Loading States

- [ ] Save button loading state
- [ ] Upload progress
- [ ] Section loading skeletons

### L. Error States

- [ ] Validation errors inline
- [ ] Save error toast
- [ ] Network error handling
- [ ] Recovery guidance

### M. Accessibility

- [ ] Form labels linked to inputs
- [ ] Toggle accessibility
- [ ] Error announcements
- [ ] Focus management

### N. Mobile Responsiveness

- [ ] Full-width sections
- [ ] Touch-friendly toggles
- [ ] 44px touch targets
- [ ] Keyboard handling

---

## SPECIFIC CHECKS

### Profile Form Pattern

```javascript
// Profile form should validate
const ProfileSection = () => {
  const { user, updateUser } = useUserData();
  const [form, setForm] = useState({
    username: user.username || '',
    bio: user.bio || '',
  });
  const [errors, setErrors] = useState({});
  
  const validate = () => {
    const errs = {};
    if (form.username.length < 3) {
      errs.username = 'Username must be at least 3 characters';
    }
    if (form.bio.length > 160) {
      errs.bio = 'Bio must be 160 characters or less';
    }
    return errs;
  };
  
  const handleSave = async () => {
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    await updateUser(form);
    toast.success('Profile updated');
  };
  
  return (
    <section>
      <h2>Profile</h2>
      <Input
        label="Username"
        value={form.username}
        onChange={(e) => setForm({ ...form, username: e.target.value })}
        error={errors.username}
      />
      <Textarea
        label="Bio"
        value={form.bio}
        onChange={(e) => setForm({ ...form, bio: e.target.value })}
        maxLength={160}
        error={errors.bio}
      />
      <Button onClick={handleSave} variant="primary">
        Save Changes
      </Button>
    </section>
  );
};
```

### Delete Account Pattern

```javascript
// Delete must have strong confirmation
const DeleteAccountSection = () => {
  const [showModal, setShowModal] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  
  const handleDelete = async () => {
    if (confirmation !== 'DELETE') return;
    await deleteAccount();
    // Redirect to goodbye page
  };
  
  return (
    <>
      <Button 
        onClick={() => setShowModal(true)}
        variant="destructive"
      >
        Delete Account
      </Button>
      
      <Modal open={showModal} onClose={() => setShowModal(false)}>
        <h3>Delete Account</h3>
        <p className={styles.warning}>
          This action cannot be undone. All your data will be permanently deleted.
        </p>
        <Input
          label="Type DELETE to confirm"
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
        />
        <Button 
          onClick={handleDelete}
          disabled={confirmation !== 'DELETE'}
          variant="destructive"
        >
          Permanently Delete Account
        </Button>
      </Modal>
    </>
  );
};
```

### Avatar Upload Pattern

```javascript
// Avatar upload with preview
const AvatarUploader = ({ currentAvatar, onUpload }) => {
  const [preview, setPreview] = useState(currentAvatar);
  const [uploading, setUploading] = useState(false);
  
  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Please upload a JPG, PNG, or WebP image');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }
    
    // Preview
    setPreview(URL.createObjectURL(file));
    
    // Upload
    setUploading(true);
    const url = await uploadAvatar(file);
    await onUpload(url);
    setUploading(false);
  };
  
  return (
    <div className={styles.avatarUploader}>
      <UserAvatar src={preview} size="lg" />
      <label className={styles.uploadButton}>
        {uploading ? 'Uploading...' : 'Change Photo'}
        <input 
          type="file" 
          accept="image/*" 
          onChange={handleFile}
          hidden 
        />
      </label>
    </div>
  );
};
```

---

## TESTING SCENARIOS

### Test Case 1: Edit Username

1. Change username to valid value
2. Click Save
3. **Expected:** Success toast, username updates
4. **Verify:** Persists on refresh

### Test Case 2: Invalid Username

1. Enter username with 2 characters
2. Try to save
3. **Expected:** Validation error shown
4. **Verify:** Cannot save, error message clear

### Test Case 3: Toggle Notification

1. Toggle a notification preference
2. **Expected:** Toggle switches, saves
3. **Verify:** Preference persists

### Test Case 4: Upload Avatar

1. Click change photo, select image
2. **Expected:** Preview shows, uploads
3. **Verify:** New avatar displays everywhere

### Test Case 5: Delete Account

1. Click Delete Account
2. **Expected:** Confirmation modal
3. Type "DELETE", confirm
4. **Verify:** Account deleted, logged out

### Test Case 6: Manage Subscription

1. Click Manage Subscription
2. **Expected:** Opens Stripe portal
3. **Verify:** Correct customer session

---

## AUTOMATED CHECKS

```bash
# 1. Check for hardcoded colors
grep -rn "#[0-9a-fA-F]\{3,6\}" app/\(app\)/settings/*.jsx app/\(app\)/settings/*.css

# 2. Check for design tokens
grep -rn "accent-lime\|destructive" app/\(app\)/settings/*.jsx

# 3. Check for form labels
grep -rn "htmlFor=\|<label" app/\(app\)/settings/*.jsx

# 4. Check for role="switch"
grep -rn "role=\"switch\"\|aria-checked" app/\(app\)/settings/*.jsx

# 5. Check for validation
grep -rn "validate\|error\|setError" app/\(app\)/settings/*.jsx

# 6. Check for console.log
grep -rn "console\.log" app/\(app\)/settings/*.jsx
```

---

## CROSS-REFERENCE WITH FOUNDATION AUDITS

| Audit | Check On This Page |
|-------|-------------------|
| B. Security | Profile update auth, deletion |
| D. UI/UX | Form patterns, toggles |
| E. Accessibility | Form accessibility |
| H. API | Update endpoints |

---

## DELIVERABLES

### 1. Functionality Report

| Feature | Works | Issues |
|---------|-------|--------|
| Profile edit | ✅/❌ | |
| Avatar upload | ✅/❌ | |
| Notifications | ✅/❌ | |
| Subscription | ✅/❌ | |
| Data export | ✅/❌ | |
| Delete account | ✅/❌ | |

### 2. Form Compliance Report

| Element | Expected | Actual | Status |
|---------|----------|--------|--------|
| Save button | Lime | | ✅/❌ |
| Active toggle | Lime | | ✅/❌ |
| Delete button | Red/destructive | | ✅/❌ |
| Form labels | Linked | | ✅/❌ |

### 3. Issues Found

| Severity | Issue | File:Line | Fix |
|----------|-------|-----------|-----|
| | | | |

---

## VERIFICATION

- [ ] Settings save correctly
- [ ] Toggles use lime when active
- [ ] Delete has confirmation
- [ ] Form validation works
- [ ] Mobile responsive
- [ ] Accessible forms

---

## SUCCESS CRITERIA

| # | Criterion |
|---|-----------|
| 1 | Settings load and save |
| 2 | Save button = lime |
| 3 | Active toggles = lime |
| 4 | Delete has confirmation |
| 5 | Form validation works |
| 6 | Accessible form elements |
| 7 | No critical/high issues remaining |

---

## OUTPUT FORMAT

```
⚙️ PAGE AUDIT: /settings

**Status:** ✅ Pass / ⚠️ Issues / ❌ Fail

**Form Compliance:** ✅ / ❌
- Save button: Lime ✅
- Active toggle: Lime ✅
- Delete: Destructive ✅

**Functionality:**
- [x] Profile edit
- [x] Avatar upload
- [x] Notifications
- [ ] Delete missing confirmation (issue #1)

**Issues Found:**
1. [Critical] Delete account has no confirmation
2. [Medium] Toggle missing aria-checked
...

**Test Results:**
- Edit username: ✅
- Validation: ✅
- Toggle: ⚠️
- Delete: ❌
```

---

## AUDIT EXECUTION LOG

| Date | Auditor | Status | Issues Fixed | Notes |
|------|---------|--------|--------------|-------|
| | | | | |

---

*Audit prompt generated: January 25, 2026*  
*Part of AutoRev Systematic Audit Suite (36 total audits)*
