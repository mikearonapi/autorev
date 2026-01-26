# PAGE AUDIT: /questionnaire - Enthusiast Onboarding

> **Audit ID:** Page-13  
> **Category:** Settings & Profile  
> **Priority:** 28 of 36  
> **Route:** `/questionnaire`  
> **Auth Required:** Yes

---

## PAGE OVERVIEW

The Questionnaire page is a **multi-step onboarding flow** that helps personalize the AutoRev experience by gathering information about the user's automotive interests, goals, and preferences.

**Key Features:**
- Multi-step questionnaire flow
- Progress indicator
- Category-based questions
- Skip/back navigation
- Persona/recommendation output
- Save progress functionality

---

## FILES TO EXAMINE

### Page Files

| File | Purpose |
|------|---------|
| `app/(app)/questionnaire/page.jsx` | Questionnaire page |

### Questionnaire Components

| File | Purpose |
|------|---------|
| `components/questionnaire/FullscreenQuestionnaire.jsx` | Main questionnaire |
| `components/questionnaire/FullscreenQuestionnaire.module.css` | Fullscreen styles |
| `components/questionnaire/QuestionCard.jsx` | Question display |
| `components/questionnaire/QuestionCard.module.css` | Question styles |
| `components/questionnaire/CategoryProgress.jsx` | Category progress |
| `components/questionnaire/CategoryProgress.module.css` | Progress styles |
| `components/questionnaire/ProgressRing.jsx` | Ring progress |
| `components/questionnaire/ProgressRing.module.css` | Ring styles |
| `components/questionnaire/PersonaSummary.jsx` | Results summary |
| `components/questionnaire/PersonaSummary.module.css` | Summary styles |
| `components/questionnaire/QuestionnaireHub.jsx` | Hub component |
| `components/questionnaire/QuestionnaireHub.module.css` | Hub styles |
| `components/questionnaire/QuestionnairePrompt.jsx` | Prompt component |
| `components/questionnaire/QuestionnairePrompt.module.css` | Prompt styles |
| `components/questionnaire/index.js` | Exports |

### Related Services

| File | Purpose |
|------|---------|
| `app/api/users/[userId]/questionnaire/route.js` | Questionnaire API |
| `app/api/users/[userId]/questionnaire/next/route.js` | Next question API |

---

## CRITICAL: Read These First

Before making ANY changes:

1. `docs/SOURCE_OF_TRUTH.md` - Onboarding, Questionnaire section
2. `docs/BRAND_GUIDELINES.md` - Progress indicators, CTAs
3. Cross-cutting audit findings:
   - D (UI/UX) - Progress patterns, animations
   - E (Accessibility) - Multi-step form accessibility

---

## IMPORTANT: INVESTIGATE BEFORE FIX

Before changing ANY code:

1. ✅ Verify questionnaire flow works end-to-end
2. ✅ Test skip and back navigation
3. ✅ Check progress saves correctly
4. ❌ Do NOT change question order without understanding
5. ❓ If progress doesn't save, check API routes

---

## CHECKLIST

### A. Functionality

- [ ] Questionnaire loads
- [ ] Questions display correctly
- [ ] Can select answers
- [ ] Can navigate to next question
- [ ] Can go back to previous
- [ ] Can skip questions
- [ ] Progress saves to database
- [ ] Completion shows results
- [ ] Can exit/resume later

### B. Data Flow

- [ ] Uses questionnaire API
- [ ] Progress persisted to Supabase
- [ ] Answers saved per question
- [ ] Can resume incomplete
- [ ] Persona calculated from answers

### C. UI/UX Design System

- [ ] **Next button** = Lime
- [ ] **Skip** = Subtle/secondary
- [ ] **Back** = Icon or secondary
- [ ] **Progress** = Teal ring/bar
- [ ] **Selected option** = Teal highlight
- [ ] No hardcoded colors
- [ ] 44px touch targets

### D. Questionnaire Flow Layout

```
┌─────────────────────────────────────────────────┐
│  ←  Back                        Skip →          │
├─────────────────────────────────────────────────┤
│                                                 │
│           ┌─────┐                               │
│           │ 3/8 │  (progress ring - teal)       │
│           └─────┘                               │
│                                                 │
│  Category: Driving Style                        │
│                                                 │
│  What type of driving do you enjoy most?        │
│                                                 │
│  ┌────────────────────────────────────┐         │
│  │ 🏎️  Track Days                     │ (teal)  │
│  └────────────────────────────────────┘         │
│  ┌────────────────────────────────────┐         │
│  │ 🛣️  Spirited Backroads            │         │
│  └────────────────────────────────────┘         │
│  ┌────────────────────────────────────┐         │
│  │ 🚗  Daily Commuting                │         │
│  └────────────────────────────────────┘         │
│  ┌────────────────────────────────────┐         │
│  │ 🏁  Drag/Straight Line             │         │
│  └────────────────────────────────────┘         │
│                                                 │
│           [Continue →]  (lime)                  │
│                                                 │
└─────────────────────────────────────────────────┘
```

- [ ] Progress indicator visible
- [ ] Question text clear
- [ ] Options as cards/buttons
- [ ] Selected option highlighted
- [ ] Continue button prominent

### E. Progress Indicator

- [ ] Shows current/total
- [ ] Ring or bar style
- [ ] Teal color for progress
- [ ] Animates on advance
- [ ] Reduced motion support

### F. Question Types

| Type | UI Pattern |
|------|------------|
| Single choice | Radio cards |
| Multiple choice | Checkbox cards |
| Slider/scale | Range input |
| Text input | Text field |

- [ ] Each type styled consistently
- [ ] Selection state clear
- [ ] Teal for selected
- [ ] Touch targets 44px

### G. Option Cards

```javascript
// Option cards should highlight selection
const OptionCard = ({ option, selected, onSelect }) => (
  <button
    onClick={() => onSelect(option.id)}
    className={cn(
      styles.optionCard,
      selected && styles.selected
    )}
    aria-pressed={selected}
  >
    {option.icon && <span className={styles.icon}>{option.icon}</span>}
    <span className={styles.label}>{option.label}</span>
  </button>
);

// Styles
.optionCard.selected {
  background: var(--color-accent-teal-bg);
  border-color: var(--color-accent-teal);
}
```

- [ ] Selected = teal border/background
- [ ] Icon + label pattern
- [ ] Full-width cards
- [ ] 44px minimum height

### H. Navigation

| Action | Button | Location |
|--------|--------|----------|
| Back | ← icon | Top left |
| Skip | "Skip" text | Top right |
| Continue | "Continue →" | Bottom center |

- [ ] Back available after first
- [ ] Skip always available
- [ ] Continue = lime, prominent
- [ ] Disabled until selection (if required)

### I. Completion/Results

- [ ] Shows persona/summary
- [ ] Recommendations based on answers
- [ ] CTA to continue to app
- [ ] Celebration/success state

### J. Loading States

- [ ] Question loading skeleton
- [ ] Progress animation
- [ ] Submit loading state

### K. Error States

- [ ] Save error handling
- [ ] Network error retry
- [ ] Validation errors

### L. Accessibility

- [ ] Form semantics
- [ ] Radio/checkbox roles
- [ ] Progress announced
- [ ] Focus management step-to-step
- [ ] Keyboard navigation

### M. Mobile Responsiveness

- [ ] Full-screen on mobile
- [ ] Cards stack vertically
- [ ] Touch-friendly options
- [ ] Bottom navigation sticky
- [ ] 44px touch targets

### N. Resume Functionality

- [ ] Detect incomplete questionnaire
- [ ] Prompt to resume
- [ ] Load from saved progress
- [ ] Can restart if desired

---

## SPECIFIC CHECKS

### Progress Ring Component

```javascript
// Progress ring should use teal
const ProgressRing = ({ current, total }) => {
  const percentage = (current / total) * 100;
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (percentage / 100) * circumference;
  
  return (
    <svg className={styles.progressRing} viewBox="0 0 100 100">
      <circle
        className={styles.bgCircle}
        cx="50" cy="50" r="40"
        fill="none"
        stroke="var(--color-border)"
        strokeWidth="8"
      />
      <circle
        className={styles.progressCircle}
        cx="50" cy="50" r="40"
        fill="none"
        stroke="var(--color-accent-teal)"
        strokeWidth="8"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 50 50)"
      />
      <text x="50" y="55" textAnchor="middle" className={styles.text}>
        {current}/{total}
      </text>
    </svg>
  );
};
```

### Question Card Pattern

```javascript
// Questions should handle different types
const QuestionCard = ({ question, value, onChange }) => {
  const renderOptions = () => {
    switch (question.type) {
      case 'single':
        return question.options.map(opt => (
          <OptionCard
            key={opt.id}
            option={opt}
            selected={value === opt.id}
            onSelect={() => onChange(opt.id)}
          />
        ));
      case 'multiple':
        return question.options.map(opt => (
          <OptionCard
            key={opt.id}
            option={opt}
            selected={value?.includes(opt.id)}
            onSelect={() => {
              const newValue = value?.includes(opt.id)
                ? value.filter(v => v !== opt.id)
                : [...(value || []), opt.id];
              onChange(newValue);
            }}
          />
        ));
      // ... other types
    }
  };
  
  return (
    <div className={styles.questionCard}>
      <h2 className={styles.question}>{question.text}</h2>
      <div className={styles.options}>
        {renderOptions()}
      </div>
    </div>
  );
};
```

### Save Progress Pattern

```javascript
// Progress should auto-save
const saveProgress = useMutation({
  mutationFn: async (data) => {
    await fetch(`/api/users/${userId}/questionnaire`, {
      method: 'POST',
      body: JSON.stringify({
        questionId: currentQuestion.id,
        answer: data.answer,
        progress: currentIndex,
      }),
    });
  },
  onError: () => {
    toast.error('Failed to save. Your progress will be saved when you continue.');
  },
});

// Auto-save on answer
useEffect(() => {
  if (answer !== undefined) {
    saveProgress.mutate({ answer });
  }
}, [answer]);
```

---

## TESTING SCENARIOS

### Test Case 1: Complete Questionnaire

1. Start questionnaire from beginning
2. Answer all questions
3. **Expected:** Progress through all, see results
4. **Verify:** All answers saved

### Test Case 2: Skip Question

1. Click "Skip" on a question
2. **Expected:** Moves to next without saving answer
3. **Verify:** Progress advances, can go back

### Test Case 3: Go Back

1. Answer question, advance, then go back
2. **Expected:** Previous question with answer preserved
3. **Verify:** Answer still selected

### Test Case 4: Resume Questionnaire

1. Complete 3 questions, leave page
2. Return to questionnaire
3. **Expected:** Resume from question 4
4. **Verify:** Previous answers preserved

### Test Case 5: Selection State

1. Select an option
2. **Expected:** Card highlights with teal
3. **Verify:** Only selected option highlighted

### Test Case 6: Continue Button

1. View continue button
2. **Expected:** Lime color, prominent
3. **Verify:** Disabled until selection (if required)

### Test Case 7: Mobile View

1. View on mobile device
2. **Expected:** Full-screen, touch-friendly
3. **Verify:** Cards stack, 44px targets

---

## AUTOMATED CHECKS

```bash
# 1. Check for hardcoded colors
grep -rn "#[0-9a-fA-F]\{3,6\}" components/questionnaire/*.jsx components/questionnaire/*.css

# 2. Check for design tokens
grep -rn "accent-teal\|accent-lime" components/questionnaire/*.jsx components/questionnaire/*.css

# 3. Check for aria-pressed
grep -rn "aria-pressed\|role=" components/questionnaire/*.jsx

# 4. Check for reduced motion
grep -rn "prefers-reduced-motion" components/questionnaire/*.jsx components/questionnaire/*.css

# 5. Check for touch targets
grep -rn "h-11\|min-h-\[44px\]" components/questionnaire/*.jsx components/questionnaire/*.css

# 6. Check for console.log
grep -rn "console\.log" components/questionnaire/*.jsx app/\(app\)/questionnaire/*.jsx
```

---

## CROSS-REFERENCE WITH FOUNDATION AUDITS

| Audit | Check On This Page |
|-------|-------------------|
| D. UI/UX | Progress indicators, cards |
| E. Accessibility | Multi-step form, focus |
| I. State | Answer state management |
| A. Performance | Smooth transitions |

---

## DELIVERABLES

### 1. Functionality Report

| Feature | Works | Issues |
|---------|-------|--------|
| Questions load | ✅/❌ | |
| Answer selection | ✅/❌ | |
| Navigation | ✅/❌ | |
| Progress saves | ✅/❌ | |
| Resume | ✅/❌ | |
| Completion | ✅/❌ | |

### 2. UI Compliance Report

| Element | Expected | Actual | Status |
|---------|----------|--------|--------|
| Continue button | Lime | | ✅/❌ |
| Progress ring | Teal | | ✅/❌ |
| Selected option | Teal | | ✅/❌ |
| Touch targets | 44px | | ✅/❌ |

### 3. Issues Found

| Severity | Issue | File:Line | Fix |
|----------|-------|-----------|-----|
| | | | |

---

## VERIFICATION

- [ ] Full flow works end-to-end
- [ ] Progress ring uses teal
- [ ] Selected options use teal
- [ ] Continue button is lime
- [ ] Progress saves correctly
- [ ] Mobile responsive

---

## SUCCESS CRITERIA

| # | Criterion |
|---|-----------|
| 1 | Questionnaire completes end-to-end |
| 2 | Progress ring = teal |
| 3 | Selected options = teal |
| 4 | Continue button = lime |
| 5 | Progress persists |
| 6 | Resume works |
| 7 | No critical/high issues remaining |

---

## OUTPUT FORMAT

```
📋 PAGE AUDIT: /questionnaire

**Status:** ✅ Pass / ⚠️ Issues / ❌ Fail

**UI Compliance:** ✅ / ❌
- Continue: Lime ✅
- Progress: Teal ✅
- Selected: Teal ✅

**Functionality:**
- [x] Questions display
- [x] Selection works
- [x] Navigation
- [ ] Resume broken (issue #1)

**Issues Found:**
1. [High] Resume doesn't restore previous answers
2. [Medium] Progress ring uses hardcoded green
...

**Test Results:**
- Full flow: ✅
- Skip: ✅
- Back: ✅
- Resume: ❌
- Selection: ✅
```

---

## AUDIT EXECUTION LOG

| Date | Auditor | Status | Issues Fixed | Notes |
|------|---------|--------|--------------|-------|
| | | | | |

---

*Audit prompt generated: January 25, 2026*  
*Part of AutoRev Systematic Audit Suite (36 total audits)*
