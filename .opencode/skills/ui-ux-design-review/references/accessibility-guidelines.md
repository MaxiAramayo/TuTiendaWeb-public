# Accessibility Guidelines

Comprehensive accessibility standards based on WCAG 2.1 Level AA requirements.

## WCAG 2.1 Principles (POUR)

### Perceivable
Information and UI components must be presentable to users in ways they can perceive.

### Operable
UI components and navigation must be operable by all users.

### Understandable
Information and UI operation must be understandable.

### Robust
Content must be robust enough to be interpreted by a wide variety of user agents, including assistive technologies.

---

## Color & Contrast (WCAG 1.4)

### Minimum Contrast Ratios

**Normal Text** (< 18px or < 14px bold)
- Minimum: 4.5:1 (Level AA)
- Enhanced: 7:1 (Level AAA)

**Large Text** (≥ 18px or ≥ 14px bold)
- Minimum: 3:1 (Level AA)
- Enhanced: 4.5:1 (Level AAA)

**UI Components & Graphics**
- Minimum: 3:1 (Level AA)
- Includes: buttons, form borders, focus indicators, icons

### Testing Tools

```bash
# Browser DevTools
# Chrome/Edge: DevTools > Elements > Accessibility pane
# Firefox: DevTools > Accessibility inspector

# Online Tools
# - WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/
# - Contrast Ratio: https://contrast-ratio.com/

# Browser Extensions
# - axe DevTools (Chrome/Firefox)
# - WAVE (Chrome/Firefox)
# - Accessibility Insights (Chrome/Edge)
```

### Color Independence (1.4.1)

Information must not be conveyed by color alone.

```tsx
// ❌ Bad: Color-only status
<span className="text-red-500">Error</span>
<span className="text-green-500">Success</span>

// ✅ Good: Icon + color + text
<div className="flex items-center gap-2 text-red-600">
  <AlertCircleIcon className="w-5 h-5" />
  <span className="font-medium">Error:</span>
  <span>Please correct the following fields</span>
</div>

// ✅ Good: Color + shape for charts
<BarChart>
  {data.map((item, i) => (
    <Bar 
      fill={colors[i]}
      pattern={patterns[i]} // Different patterns for colorblind users
      aria-label={`${item.name}: ${item.value}`}
    />
  ))}
</BarChart>
```

### Use of Color (1.4.3)

Ensure sufficient contrast between text and background.

```tsx
// ❌ Bad: Insufficient contrast
<button className="bg-gray-300 text-gray-400">
  Submit // Contrast ratio: ~2:1 ❌
</button>

// ✅ Good: Sufficient contrast
<button className="bg-blue-600 text-white">
  Submit // Contrast ratio: 8.6:1 ✅
</button>

// ✅ Good: Dark mode with adequate contrast
<button className="bg-slate-800 text-slate-100 dark:bg-slate-200 dark:text-slate-900">
  Submit
</button>
```

---

## Keyboard Accessibility (WCAG 2.1)

### Keyboard Access (2.1.1)

All functionality must be operable via keyboard.

```tsx
// ❌ Bad: Click-only dropdown
<div onClick={openMenu}>Menu</div>
<div className="dropdown">{items}</div>

// ✅ Good: Keyboard-accessible dropdown
<button 
  onClick={openMenu}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') openMenu()
    if (e.key === 'ArrowDown') focusFirstItem()
  }}
  aria-expanded={isOpen}
  aria-haspopup="menu"
>
  Menu
</button>
```

### No Keyboard Trap (2.1.2)

Users must be able to navigate away from any component using keyboard.

```tsx
// ❌ Bad: Modal traps focus
<Modal isOpen={isOpen}>
  <input autoFocus />
  {/* No way to close with keyboard */}
</Modal>

// ✅ Good: Modal with keyboard escape
<Modal 
  isOpen={isOpen}
  onClose={closeModal}
  onKeyDown={(e) => {
    if (e.key === 'Escape') closeModal()
  }}
>
  <button onClick={closeModal} aria-label="Close">×</button>
  <input autoFocus />
</Modal>
```

### Focus Order (2.4.3)

Focus order must be logical and intuitive.

```tsx
// ❌ Bad: Visual order doesn't match DOM order
<div className="grid grid-cols-2">
  <button tabIndex={2}>Step 2</button>
  <button tabIndex={1}>Step 1</button>
</div>

// ✅ Good: DOM order matches visual order
<div className="grid grid-cols-2">
  <button>Step 1</button>
  <button>Step 2</button>
</div>
```

### Focus Visible (2.4.7)

Focus indicators must be visible and distinct.

```css
/* ❌ Bad: Removed focus indicator */
button:focus {
  outline: none;
}

/* ✅ Good: Custom focus indicator with sufficient contrast */
button:focus-visible {
  outline: 2px solid #0066cc;
  outline-offset: 2px;
}

/* ✅ Better: Using ring utilities (Tailwind) */
.button {
  @apply focus:ring-2 focus:ring-blue-500 focus:ring-offset-2;
}
```

---

## Semantic HTML & ARIA

### Use Semantic HTML First

Always prefer native HTML elements over ARIA.

```tsx
// ❌ Bad: Div with ARIA
<div role="button" onClick={handleClick} tabIndex={0}>
  Click me
</div>

// ✅ Good: Native button
<button onClick={handleClick}>
  Click me
</button>

// ❌ Bad: Div links
<div onClick={() => navigate('/page')} role="link">Go to page</div>

// ✅ Good: Native link
<a href="/page">Go to page</a>
```

### Headings (1.3.1)

Use headings hierarchically without skipping levels.

```tsx
// ❌ Bad: Skipped heading level
<h1>Page Title</h1>
<h3>Subsection</h3> {/* Skipped h2 */}

// ✅ Good: Proper hierarchy
<h1>Page Title</h1>
<h2>Section</h2>
<h3>Subsection</h3>

// ✅ Good: Visual override with CSS
<h2 className="text-sm">Small but semantic h2</h2>
```

### Form Labels (3.3.2)

Every form input must have an associated label.

```tsx
// ❌ Bad: Placeholder as label
<input type="email" placeholder="Email address" />

// ❌ Bad: Label without association
<div>Email</div>
<input type="email" />

// ✅ Good: Properly associated label
<label htmlFor="email">Email address</label>
<input id="email" type="email" />

// ✅ Good: Implicit association
<label>
  Email address
  <input type="email" />
</label>

// ✅ Good: Visual label with aria-label
<input 
  type="search" 
  aria-label="Search patients"
  placeholder="Search..."
/>
```

### Button vs Link (4.1.2)

Use appropriate elements for actions vs navigation.

```tsx
// ✅ Button: Triggers action (submit, toggle, open modal)
<button onClick={handleSubmit}>Submit Form</button>
<button onClick={openModal}>Open Settings</button>

// ✅ Link: Navigates to URL
<a href="/dashboard">Go to Dashboard</a>
<Link to="/profile">View Profile</Link>

// ❌ Bad: Button for navigation
<button onClick={() => navigate('/page')}>Go to page</button>

// ❌ Bad: Link for action
<a href="#" onClick={handleSubmit}>Submit</a>
```

### ARIA Labels (1.1.1, 4.1.2)

Provide text alternatives for non-text content.

```tsx
// ✅ Images
<img src="chart.png" alt="Revenue growth chart showing 25% increase" />

// ✅ Decorative images
<img src="decoration.png" alt="" /> {/* Empty alt for decorative */}

// ✅ Icon buttons
<button aria-label="Delete patient record">
  <TrashIcon aria-hidden="true" />
</button>

// ✅ Complex interactions
<div
  role="slider"
  aria-label="Volume"
  aria-valuemin={0}
  aria-valuemax={100}
  aria-valuenow={volume}
  tabIndex={0}
>
  <div style={{ width: `${volume}%` }} />
</div>
```

### Live Regions (4.1.3)

Announce dynamic content changes to screen readers.

```tsx
// ✅ Status messages
<div role="status" aria-live="polite">
  {successMessage}
</div>

// ✅ Error alerts
<div role="alert" aria-live="assertive">
  {errorMessage}
</div>

// ✅ Loading state
<div role="status" aria-live="polite" aria-busy={isLoading}>
  {isLoading ? 'Loading...' : 'Content loaded'}
</div>
```

---

## Forms & Input (WCAG 3.3)

### Error Identification (3.3.1)

Clearly identify and describe input errors.

```tsx
// ❌ Bad: Generic error
{error && <span>Error</span>}

// ✅ Good: Specific, associated error
<div>
  <label htmlFor="email">Email</label>
  <input
    id="email"
    type="email"
    aria-invalid={!!error}
    aria-describedby={error ? "email-error" : undefined}
  />
  {error && (
    <p id="email-error" className="text-red-600">
      {error.message}
    </p>
  )}
</div>
```

### Error Suggestion (3.3.3)

Provide suggestions when possible.

```tsx
// ✅ Helpful error with suggestion
<p id="password-error">
  Password must be at least 8 characters and include one number.
  <br />
  Suggestion: Add a number to your current password.
</p>

// ✅ Did you mean...
<p id="email-error">
  Email address not found. Did you mean <button>john@example.com</button>?
</p>
```

### Error Prevention (3.3.4)

Prevent errors before they happen.

```tsx
// ✅ Confirmation for destructive actions
<AlertDialog>
  <AlertDialogTrigger asChild>
    <button variant="destructive">Delete Patient</button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
    <AlertDialogDescription>
      This will permanently delete the patient record. This action cannot be undone.
    </AlertDialogDescription>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>

// ✅ Input validation with hints
<div>
  <label htmlFor="phone">Phone Number</label>
  <input
    id="phone"
    type="tel"
    pattern="[0-9]{3}-[0-9]{3}-[0-9]{4}"
    aria-describedby="phone-hint"
  />
  <p id="phone-hint" className="text-sm text-gray-600">
    Format: 123-456-7890
  </p>
</div>
```

---

## Interactive Elements

### Touch Targets (2.5.5)

Minimum 44x44px for touch targets.

```tsx
// ❌ Bad: Small touch target
<button className="p-1">
  <IconTrash className="w-4 h-4" />
</button>

// ✅ Good: Adequate touch target
<button className="p-3 min-w-[44px] min-h-[44px]">
  <IconTrash className="w-5 h-5" />
</button>

// ✅ Good: Invisible padding for small visuals
<button className="p-2 -m-2 min-w-[44px] min-h-[44px]">
  <IconTrash className="w-4 h-4" />
</button>
```

### Pointer Cancellation (2.5.2)

Allow users to cancel actions.

```tsx
// ✅ Good: Cancel on pointer up (default for onClick)
<button onClick={handleAction}>Action</button>

// ⚠️ Use with caution: Immediate on pointer down
<button onPointerDown={handleAction}>Action</button>

// ✅ Good: Drag with cancel ability
const handleDragStart = (e) => {
  setIsDragging(true)
}

const handleDragEnd = (e) => {
  if (isValidDrop(e)) {
    applyDrop()
  }
  setIsDragging(false)
}
```

---

## Testing Checklist

### Automated Testing

```bash
# Install axe-core for testing
npm install -D @axe-core/playwright
# or
npm install -D @axe-core/react

# Run automated accessibility tests
npx playwright test accessibility.spec.ts
```

```typescript
// Example Playwright test
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('should not have accessibility violations', async ({ page }) => {
  await page.goto('http://localhost:3000')
  
  const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
  
  expect(accessibilityScanResults.violations).toEqual([])
})
```

### Manual Testing

**Keyboard Navigation**
- [ ] Tab through all interactive elements
- [ ] Shift+Tab works in reverse
- [ ] Enter/Space activates buttons
- [ ] Arrow keys work in custom components (dropdowns, sliders)
- [ ] Escape closes modals/dropdowns

**Screen Reader Testing**
- [ ] Test with NVDA (Windows), JAWS (Windows), or VoiceOver (Mac)
- [ ] All content announced correctly
- [ ] Form labels read aloud
- [ ] Error messages announced
- [ ] Dynamic content updates announced

**Color Contrast**
- [ ] Run contrast checker on all text
- [ ] Test in dark mode if applicable
- [ ] Check focus indicators
- [ ] Verify chart/graph colors

**Zoom & Reflow**
- [ ] Test at 200% zoom
- [ ] No horizontal scroll
- [ ] Content reflows properly
- [ ] No overlapping text

---

## Quick Reference

### Common ARIA Roles
- `role="button"` - Clickable element that triggers action
- `role="link"` - Navigational link (prefer `<a>`)
- `role="dialog"` - Modal window
- `role="alert"` - Important message requiring immediate attention
- `role="status"` - Live region with advisory information
- `role="navigation"` - Navigation section
- `role="main"` - Main content area
- `role="search"` - Search functionality

### Common ARIA Properties
- `aria-label` - Text label for element
- `aria-labelledby` - ID of element that labels this one
- `aria-describedby` - ID of element that describes this one
- `aria-hidden` - Hide from screen readers (keep in DOM)
- `aria-live` - Announce dynamic changes (polite/assertive)
- `aria-expanded` - Whether element is expanded (true/false)
- `aria-selected` - Whether element is selected (true/false)
- `aria-disabled` - Whether element is disabled (true/false)
- `aria-invalid` - Whether input has error (true/false)
- `aria-required` - Whether input is required (true/false)

### Accessibility Priority Order
1. **Critical**: Blocks functionality for users with disabilities
   - Keyboard traps, missing alt text on functional images, form inputs without labels
2. **High**: Significantly degrades experience
   - Low contrast text, missing focus indicators, unclear error messages
3. **Medium**: Noticeable issues
   - Small touch targets, inconsistent heading hierarchy
4. **Low**: Best practice improvements
   - Enhanced contrast (AAA), redundant descriptions
