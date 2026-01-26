# PAGE AUDIT: /al - AI Mechanic (AL)

> **Audit ID:** Page-26  
> **Category:** AI Feature Page  
> **Priority:** 25 of 36  
> **Route:** `/al`  
> **Auth Required:** Yes  
> **Special:** AI-powered feature with safety considerations

---

## PAGE OVERVIEW

The AL (AI Mechanic) page provides an **AI-powered chat interface** where users can ask questions about their vehicles, modifications, maintenance, and automotive topics. This is a premium feature with tier gating.

**Key Features:**
- Chat interface with AI
- Vehicle context awareness
- Conversation history
- Share conversations
- Citation/source display
- Usage tracking/limits
- Safety guardrails

---

## FILES TO EXAMINE

### Page Files

| File | Purpose |
|------|---------|
| `app/(app)/al/page.jsx` | AL page (server) |
| `app/(app)/al/ALPageClient.jsx` | Client component |
| `app/(app)/al/page.module.css` | Page styles |

### Related Components

| File | Purpose |
|------|---------|
| `components/ALChatMessage.jsx` | Message display |
| `components/ALChatInput.jsx` | Input component |
| `components/ALAttachmentMenu.jsx` | Attachments |
| `components/ALAttachmentMenu.module.css` | Menu styles |
| `components/ALFeedbackButtons.jsx` | Thumbs up/down |
| `components/ALFeedbackButtons.module.css` | Feedback styles |
| `components/AskALButton.jsx` | CTA button |
| `components/AskALButton.module.css` | Button styles |

### Related Services

| File | Purpose |
|------|---------|
| `app/api/ai-mechanic/route.js` | AI API endpoint |
| `lib/alService.js` | AL service layer |
| `lib/alCitationParser.js` | Citation parsing |

### Safety & Testing

| File | Purpose |
|------|---------|
| `tests/safety/al-safety.test.js` | Safety tests |
| `tests/unit/al-citation-parser.test.js` | Citation tests |
| `tests/unit/al-daily-usage.test.js` | Usage tests |
| `tests/unit/al-circuit-breaker.test.js` | Circuit breaker |
| `tests/unit/al-evaluation-service.test.js` | Evaluation tests |

---

## CRITICAL: Read These First

Before making ANY changes:

1. `docs/SOURCE_OF_TRUTH.md` - AL/AI section, Safety guidelines
2. `docs/BRAND_GUIDELINES.md` - Chat UI patterns
3. Cross-cutting audit findings:
   - B (Security) - Input validation, rate limiting
   - E (Accessibility) - Chat accessibility
   - G (Testing) - AL-specific tests

---

## IMPORTANT: INVESTIGATE BEFORE FIX

Before changing ANY code:

1. ✅ Verify chat sends/receives correctly
2. ✅ Test vehicle context is included
3. ✅ Check safety guardrails work
4. ❌ Do NOT change AI prompts without review
5. ❓ If responses wrong, check API route logic

---

## CHECKLIST

### A. Functionality

- [ ] Chat interface loads
- [ ] Can send messages
- [ ] AI responses display
- [ ] Vehicle context included
- [ ] Conversation history loads
- [ ] Can start new conversation
- [ ] Citations display correctly
- [ ] Share conversation works

### B. Data Flow

- [ ] Messages sent via API
- [ ] Responses streamed (if streaming)
- [ ] History persists to database
- [ ] Vehicle context from provider
- [ ] Usage tracked per user

### C. UI/UX Design System

- [ ] **User messages** = Right-aligned, distinct
- [ ] **AI messages** = Left-aligned, distinct
- [ ] **Send button** = Lime
- [ ] **Citations** = Teal links
- [ ] **Feedback** = Thumbs up/down
- [ ] No hardcoded colors
- [ ] 44px touch targets

### D. Chat Layout

```
┌─────────────────────────────────────────────────┐
│  AL - AI Mechanic                    [New Chat] │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────────────────────────────┐           │
│  │ User: How do I change the oil on │           │
│  │ my 2024 BMW M3?                  │  (right)  │
│  └──────────────────────────────────┘           │
│                                                 │
│  ┌──────────────────────────────────┐           │
│  │ AL: For your 2024 BMW M3, here   │           │
│  │ are the steps to change...       │  (left)   │
│  │                                  │           │
│  │ [Source: BMW Manual] [👍] [👎]   │           │
│  └──────────────────────────────────┘           │
│                                                 │
├─────────────────────────────────────────────────┤
│  [Attach] [                    ] [Send ➤]       │
│           Message input           (lime)        │
└─────────────────────────────────────────────────┘
```

- [ ] Messages clearly distinguished
- [ ] User vs AI visually different
- [ ] Input at bottom
- [ ] Send button prominent
- [ ] Feedback on AI messages

### E. Message Display

| Type | Alignment | Background |
|------|-----------|------------|
| User | Right | Accent/distinct |
| AI | Left | Card/default |
| System | Center | Muted |
| Error | Center | Amber |

- [ ] Clear sender indication
- [ ] Timestamp (optional)
- [ ] Loading state for AI thinking

### F. Input Area

- [ ] Text input expandable
- [ ] Placeholder text helpful
- [ ] Attachment button (if supported)
- [ ] Send button (lime, 44px)
- [ ] Keyboard shortcut (Enter to send)
- [ ] Disabled while sending

### G. Citations & Sources

- [ ] Citations parsed from response
- [ ] Links in teal
- [ ] Open in new tab
- [ ] Clear source attribution

### H. Feedback Mechanism

- [ ] Thumbs up/down on AI messages
- [ ] Feedback saves to database
- [ ] Visual confirmation of feedback
- [ ] One-time per message

### I. Conversation Management

- [ ] Start new conversation
- [ ] History accessible
- [ ] Can continue previous
- [ ] Clear conversation option

### J. Loading States

- [ ] Thinking indicator for AI
- [ ] "AL is typing..." or dots
- [ ] Input disabled while waiting
- [ ] Skeleton for history

### K. Error States

- [ ] API error message
- [ ] Rate limit message
- [ ] Network error handling
- [ ] Retry mechanism

### L. Accessibility

- [ ] Chat region labeled
- [ ] Messages announced
- [ ] Input accessible
- [ ] Focus management
- [ ] Screen reader friendly

### M. Mobile Responsiveness

- [ ] Full-width on mobile
- [ ] Keyboard handling
- [ ] Input stays visible
- [ ] 44px touch targets

### N. Tier Gating & Usage

- [ ] Usage limits enforced
- [ ] Tier access checked
- [ ] Usage count displayed
- [ ] Upgrade prompt when limit reached

### O. Safety & Security (CRITICAL)

- [ ] Input sanitized
- [ ] Prompt injection prevention
- [ ] Rate limiting in place
- [ ] Content filtering
- [ ] No sensitive data exposure

---

## SPECIFIC CHECKS

### Chat Message Component

```javascript
// Messages should be clearly typed
const ChatMessage = ({ message, onFeedback }) => {
  const isUser = message.role === 'user';
  
  return (
    <div 
      className={cn(
        styles.message,
        isUser ? styles.userMessage : styles.aiMessage
      )}
      role="article"
      aria-label={`${isUser ? 'You' : 'AL'} said`}
    >
      <div className={styles.content}>
        {message.content}
        {message.citations && (
          <Citations citations={message.citations} />
        )}
      </div>
      {!isUser && (
        <ALFeedbackButtons 
          messageId={message.id}
          onFeedback={onFeedback}
        />
      )}
    </div>
  );
};
```

### Input Component Pattern

```javascript
// Input should handle sending properly
const ChatInput = ({ onSend, disabled }) => {
  const [input, setInput] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSend(input.trim());
      setInput('');
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className={styles.inputForm}>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Ask AL about your vehicle..."
        disabled={disabled}
        className={styles.input}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
          }
        }}
      />
      <button 
        type="submit" 
        disabled={!input.trim() || disabled}
        className={styles.sendButton}
        aria-label="Send message"
      >
        Send
      </button>
    </form>
  );
};
```

### Vehicle Context Integration

```javascript
// AL should have vehicle context
const { selectedCar } = useSelectedCar();

// Include in API call
const sendMessage = async (content) => {
  const response = await fetch('/api/ai-mechanic', {
    method: 'POST',
    body: JSON.stringify({
      message: content,
      carContext: selectedCar ? {
        year: selectedCar.year,
        make: selectedCar.make,
        model: selectedCar.model,
        modifications: selectedCar.modifications,
      } : null,
      conversationId,
    }),
  });
};
```

### Usage Tracking

```javascript
// Check usage before sending
const { usage, limit, canSend } = useALUsage();

if (!canSend) {
  showUpgradePrompt();
  return;
}
```

---

## TESTING SCENARIOS

### Test Case 1: Send Message

1. Type a question and click Send
2. **Expected:** Message appears, AI responds
3. **Verify:** Both messages display correctly

### Test Case 2: Vehicle Context

1. With vehicle selected, ask "What oil does my car need?"
2. **Expected:** AI references your specific vehicle
3. **Verify:** Response mentions year/make/model

### Test Case 3: Citations

1. Ask a question that returns sources
2. **Expected:** Citations displayed as teal links
3. **Verify:** Links work, open correctly

### Test Case 4: Feedback

1. Click thumbs up on AI response
2. **Expected:** Button shows selected state
3. **Verify:** Feedback saved (check network)

### Test Case 5: Rate Limit

1. Exhaust daily limit (if testable)
2. **Expected:** Message shows limit reached
3. **Verify:** Upgrade prompt appears

### Test Case 6: Error Handling

1. Simulate network error
2. **Expected:** Error message displayed
3. **Verify:** Retry option available

### Test Case 7: New Conversation

1. Click "New Chat"
2. **Expected:** Conversation clears
3. **Verify:** History accessible separately

### Test Case 8: Safety (CRITICAL)

1. Try prompt injection ("Ignore instructions...")
2. **Expected:** Handled safely
3. **Verify:** No unsafe behavior

---

## AUTOMATED CHECKS

```bash
# 1. Check for hardcoded colors
grep -rn "#[0-9a-fA-F]\{3,6\}" app/\(app\)/al/*.jsx app/\(app\)/al/*.css components/AL*.jsx

# 2. Check for design tokens
grep -rn "accent-lime\|accent-teal" app/\(app\)/al/*.jsx components/AL*.jsx

# 3. Check for input sanitization
grep -rn "sanitize\|escape\|DOMPurify" app/\(app\)/al/*.jsx lib/alService.js

# 4. Check for rate limiting
grep -rn "rateLimit\|throttle\|usage" app/api/ai-mechanic/*.js

# 5. Check for accessibility
grep -rn "aria-\|role=" app/\(app\)/al/*.jsx components/AL*.jsx

# 6. Check for console.log
grep -rn "console\.log" app/\(app\)/al/*.jsx components/AL*.jsx app/api/ai-mechanic/*.js
```

---

## CROSS-REFERENCE WITH FOUNDATION AUDITS

| Audit | Check On This Page |
|-------|-------------------|
| B. Security | Input validation, rate limiting |
| D. UI/UX | Chat patterns, CTA colors |
| E. Accessibility | Chat accessibility |
| G. Testing | AL safety tests |
| H. API | AI endpoint consistency |

---

## DELIVERABLES

### 1. Functionality Report

| Feature | Works | Issues |
|---------|-------|--------|
| Send message | ✅/❌ | |
| Receive response | ✅/❌ | |
| Vehicle context | ✅/❌ | |
| Citations | ✅/❌ | |
| Feedback | ✅/❌ | |
| History | ✅/❌ | |
| Share | ✅/❌ | |

### 2. UI Compliance Report

| Element | Expected | Actual | Status |
|---------|----------|--------|--------|
| Send button | Lime | | ✅/❌ |
| Citations | Teal | | ✅/❌ |
| User message | Distinct right | | ✅/❌ |
| AI message | Left | | ✅/❌ |
| Touch targets | 44px | | ✅/❌ |

### 3. Safety Report

| Check | Status |
|-------|--------|
| Input sanitized | ✅/❌ |
| Rate limiting | ✅/❌ |
| Prompt injection handled | ✅/❌ |
| No data exposure | ✅/❌ |

### 4. Issues Found

| Severity | Issue | File:Line | Fix |
|----------|-------|-----------|-----|
| | | | |

---

## VERIFICATION

- [ ] Chat sends/receives correctly
- [ ] Vehicle context included
- [ ] Send button is lime
- [ ] Citations in teal
- [ ] Safety tests pass
- [ ] Mobile responsive

---

## SUCCESS CRITERIA

| # | Criterion |
|---|-----------|
| 1 | Chat interface functional |
| 2 | Send button = lime |
| 3 | Citations = teal links |
| 4 | Vehicle context works |
| 5 | Feedback buttons work |
| 6 | Safety guardrails in place |
| 7 | No critical/high issues remaining |

---

## OUTPUT FORMAT

```
🤖 PAGE AUDIT: /al (AI Mechanic)

**Status:** ✅ Pass / ⚠️ Issues / ❌ Fail

**UI Compliance:** ✅ / ❌
- Send button: Lime ✅
- Citations: Teal ✅
- Message distinction: ✅

**Safety:** ✅ / ❌
- Input sanitized: ✅
- Rate limiting: ✅
- Prompt injection: ✅

**Functionality:**
- [x] Send message
- [x] AI response
- [x] Vehicle context
- [ ] Share broken (issue #1)

**Issues Found:**
1. [Medium] Share link generation fails
2. [Low] Feedback button too small (32px)
...

**Test Results:**
- Send/receive: ✅
- Vehicle context: ✅
- Citations: ✅
- Safety: ✅
- Share: ❌
```

---

## AUDIT EXECUTION LOG

| Date | Auditor | Status | Issues Fixed | Notes |
|------|---------|--------|--------------|-------|
| | | | | |

---

*Audit prompt generated: January 25, 2026*  
*Part of AutoRev Systematic Audit Suite (36 total audits)*
