# Evaluation Criteria Reference

This document provides detailed checklists and examples for each design dimension.

## Visual Hierarchy Checklist

### Size & Scale
- [ ] Most important element is largest
- [ ] Font sizes follow clear hierarchy (h1 > h2 > h3 > body)
- [ ] CTAs are prominent through size
- [ ] Icon sizes match their importance

**Example:**
```
❌ Bad: All text same size
Welcome to Dashboard (16px regular)
View your analytics (16px regular)
[Button] (32px height)

✅ Good: Clear hierarchy
Welcome to Dashboard (32px bold)
View your analytics (14px regular)
[Button] (48px height)
```

### Color & Contrast
- [ ] Primary actions use brand color
- [ ] Destructive actions use red/warning color
- [ ] Secondary actions are muted
- [ ] Background colors create depth
- [ ] Color draws attention to important elements

**Example:**
```css
/* ❌ Bad: Everything equally prominent */
.primary-button { background: blue; }
.delete-button { background: blue; }
.cancel-button { background: blue; }

/* ✅ Good: Color hierarchy */
.primary-button { background: blue; }
.delete-button { background: red; }
.cancel-button { background: gray; border: 1px solid gray; }
```

### Spacing & Grouping
- [ ] Related items are grouped together
- [ ] White space separates sections
- [ ] Consistent spacing scale (4/8/16/24/32/48/64px)
- [ ] Adequate breathing room around important elements
- [ ] Dense areas are intentionally dense

**Example:**
```tsx
// ❌ Bad: Inconsistent spacing
<div className="mt-3 mb-5">
  <h2 className="mb-2">Title</h2>
  <p className="mb-7">Description</p>
  <button className="mt-1">Action</button>
</div>

// ✅ Good: Consistent spacing system
<div className="space-y-6">
  <div className="space-y-2">
    <h2>Title</h2>
    <p>Description</p>
  </div>
  <button>Action</button>
</div>
```

### Weight & Emphasis
- [ ] Bold used for important text
- [ ] Font weights follow hierarchy (700 > 600 > 400)
- [ ] All-caps used sparingly for labels
- [ ] Italic used for emphasis, not decoration

### Position & Flow
- [ ] Most important content above the fold
- [ ] Logical reading order (top-to-bottom, left-to-right in Western UIs)
- [ ] Primary actions positioned expectedly (Save on right, Cancel on left)
- [ ] Sticky elements for persistent navigation

## Accessibility Checklist

### Color & Contrast
- [ ] Text contrast ≥ 4.5:1 (normal text)
- [ ] Text contrast ≥ 3:1 (large text 18px+)
- [ ] UI elements contrast ≥ 3:1
- [ ] Information not conveyed by color alone

**Testing:**
```
Use browser DevTools or tools like:
- WebAIM Contrast Checker
- Stark (Figma plugin)
- axe DevTools browser extension
```

### Interactive Elements
- [ ] Touch targets ≥ 44x44px (mobile)
- [ ] Click targets ≥ 24x24px (desktop)
- [ ] Interactive elements clearly distinguished
- [ ] Disabled state visually distinct
- [ ] Hover/focus states visible

**Example:**
```tsx
// ❌ Bad: Small touch target
<button className="p-1 text-sm">
  <IconTrash />
</button>

// ✅ Good: Adequate touch target
<button className="p-3 min-w-[44px] min-h-[44px]">
  <IconTrash className="w-5 h-5" />
</button>
```

### Keyboard Navigation
- [ ] All interactive elements focusable
- [ ] Focus order is logical
- [ ] Focus indicators visible (≥ 3:1 contrast)
- [ ] No keyboard traps
- [ ] Skip links for main content

**Example:**
```tsx
// ❌ Bad: No focus indicator
<button className="bg-blue-500">Click me</button>

// ✅ Good: Clear focus state
<button className="bg-blue-500 focus:ring-2 focus:ring-blue-300 focus:outline-none">
  Click me
</button>
```

### Semantic HTML
- [ ] Buttons for actions (`<button>`)
- [ ] Links for navigation (`<a>`)
- [ ] Headings in hierarchical order
- [ ] Forms use `<label>` and `<input>`
- [ ] Lists use `<ul>`/`<ol>`

### Screen Reader Support
- [ ] Images have alt text
- [ ] Form inputs have labels
- [ ] Error messages associated with inputs
- [ ] Dynamic content announces updates
- [ ] Icons have aria-label when text-less

**Example:**
```tsx
// ❌ Bad: No screen reader support
<div onClick={handleDelete}>
  <TrashIcon />
</div>

// ✅ Good: Accessible button
<button 
  onClick={handleDelete}
  aria-label="Delete item"
>
  <TrashIcon aria-hidden="true" />
</button>
```

### Text Readability
- [ ] Body text ≥ 16px
- [ ] Line height 1.5+ for body text
- [ ] Line length 50-75 characters
- [ ] Text resizable to 200%
- [ ] Font legible (avoid decorative fonts for body)

## User Flow Checklist

### Clarity of Next Action
- [ ] Primary action obvious
- [ ] Button labels action-oriented ("Save Changes" not "Submit")
- [ ] One clear path forward
- [ ] Related actions grouped

**Example:**
```tsx
// ❌ Bad: Unclear actions
<div>
  <button>OK</button>
  <button>Cancel</button>
  <button>Apply</button>
</div>

// ✅ Good: Clear, action-oriented
<div className="flex gap-3 justify-end">
  <button variant="ghost">Cancel</button>
  <button variant="primary">Save Changes</button>
</div>
```

### Feedback & Confirmation
- [ ] Loading states for async operations
- [ ] Success confirmations
- [ ] Error messages specific and actionable
- [ ] Progress indicators for multi-step flows
- [ ] Confirmation for destructive actions

**Example:**
```tsx
// ❌ Bad: Silent failure
const handleSave = async () => {
  await saveData()
}

// ✅ Good: Clear feedback
const handleSave = async () => {
  setIsLoading(true)
  try {
    await saveData()
    toast.success("Changes saved successfully")
  } catch (error) {
    toast.error("Failed to save. Please try again.")
  } finally {
    setIsLoading(false)
  }
}
```

### Error Prevention
- [ ] Validation on input (not just submit)
- [ ] Smart defaults when possible
- [ ] Undo for destructive actions
- [ ] Confirmation dialogs for irreversible actions
- [ ] Constraints prevent invalid input

### Microcopy
- [ ] Concise and scannable
- [ ] Avoids jargon
- [ ] Positive tone
- [ ] Helpful placeholder text
- [ ] Descriptive error messages

**Example:**
```tsx
// ❌ Bad: Technical error
"Error: 422 Unprocessable Entity"

// ✅ Good: User-friendly message
"Email address is already in use. Try signing in instead?"
```

## Consistency Checklist

### Visual Consistency
- [ ] Colors from defined palette
- [ ] Font sizes from type scale
- [ ] Spacing from spacing scale
- [ ] Border radius consistent
- [ ] Shadow system consistent

**Example:**
```tsx
// ❌ Bad: Random values
<div className="mt-7 p-5 rounded-[13px] shadow-[0_2px_8px_rgba(0,0,0,0.15)]">

// ✅ Good: Design system values
<div className="mt-8 p-6 rounded-lg shadow-md">
```

### Component Consistency
- [ ] Same component for same function
- [ ] Button variants used correctly
- [ ] Form inputs styled consistently
- [ ] Cards follow same pattern
- [ ] Icons from same family/style

### Interaction Consistency
- [ ] Click/tap behaves predictably
- [ ] Hover states consistent
- [ ] Gestures work across app
- [ ] Animations match in timing/easing
- [ ] Navigation patterns consistent

### Language Consistency
- [ ] Terminology consistent (e.g., "Remove" everywhere, not "Delete" sometimes)
- [ ] Tone consistent
- [ ] Button labels follow same pattern
- [ ] Capitalization consistent

## Mobile Responsiveness Checklist

### Layout
- [ ] Single column on mobile
- [ ] Collapsible navigation
- [ ] Stacked form fields
- [ ] Horizontal scrolling avoided
- [ ] Content fits viewport

### Touch Targets
- [ ] Buttons ≥ 44x44px
- [ ] Adequate spacing between tappable elements
- [ ] No hover-only interactions
- [ ] Swipe gestures intuitive

### Typography
- [ ] Text readable without zoom
- [ ] Line length appropriate
- [ ] Font size scales properly

### Performance
- [ ] Images optimized for mobile
- [ ] Minimal data usage
- [ ] Fast load times

## Real-World Examples

### Example 1: Dashboard Header

```tsx
// ❌ Problems:
// - Poor hierarchy (all same size)
// - No clear CTA
// - Inconsistent spacing
<div className="p-2">
  <h1 className="text-base">Dashboard</h1>
  <p className="text-base">Welcome back, user</p>
  <button className="text-sm bg-blue-500 p-1">New Report</button>
</div>

// ✅ Improved:
// - Clear hierarchy
// - Prominent CTA
// - Consistent spacing system
<div className="p-6 space-y-4">
  <div className="space-y-2">
    <h1 className="text-3xl font-bold">Dashboard</h1>
    <p className="text-gray-600">Welcome back, Dr. Martinez</p>
  </div>
  <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-medium">
    Create New Report
  </button>
</div>
```

### Example 2: Form with Errors

```tsx
// ❌ Problems:
// - No error association
// - Generic error message
// - No validation timing
<div>
  <input type="email" placeholder="Email" />
  {error && <span className="text-red-500">Invalid</span>}
</div>

// ✅ Improved:
// - Error associated with input (aria-describedby)
// - Specific error message
// - Inline validation
<div className="space-y-2">
  <label htmlFor="email" className="block font-medium">
    Email address
  </label>
  <input
    id="email"
    type="email"
    className={cn(
      "w-full px-3 py-2 border rounded",
      error && "border-red-500"
    )}
    aria-invalid={error ? "true" : "false"}
    aria-describedby={error ? "email-error" : undefined}
    onBlur={validateEmail}
  />
  {error && (
    <p id="email-error" className="text-sm text-red-600">
      Please enter a valid email address (e.g., name@example.com)
    </p>
  )}
</div>
```

### Example 3: Loading State

```tsx
// ❌ Problems:
// - No loading indicator
// - Layout shift when data loads
// - No skeleton for context
{isLoading ? (
  <p>Loading...</p>
) : (
  <DataTable data={data} />
)}

// ✅ Improved:
// - Skeleton matches content structure
// - No layout shift
// - Clear loading context
{isLoading ? (
  <div className="space-y-3" role="status" aria-label="Loading patients">
    {[1, 2, 3, 4, 5].map(i => (
      <div key={i} className="flex items-center gap-4 p-4 border rounded">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    ))}
  </div>
) : (
  <DataTable data={data} />
)}
```
