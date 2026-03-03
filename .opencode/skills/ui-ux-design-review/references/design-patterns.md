# Design Patterns Reference

Common UI patterns, when to use them, and implementation examples.

## Navigation Patterns

### Sidebar Navigation

**When to use:**
- Applications with many sections
- Admin dashboards
- Content management systems
- Desktop-first applications

**Best practices:**
- Collapsible on mobile (hamburger menu)
- Current page highlighted
- Icons + text labels
- Logical grouping of related items

```tsx
// ✅ Accessible sidebar
<nav className="w-64 border-r" aria-label="Main navigation">
  <ul className="space-y-1 p-4">
    <li>
      <a
        href="/dashboard"
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-lg",
          isActive ? "bg-blue-100 text-blue-900" : "hover:bg-gray-100"
        )}
        aria-current={isActive ? "page" : undefined}
      >
        <HomeIcon className="w-5 h-5" />
        <span>Dashboard</span>
      </a>
    </li>
    {/* More items */}
  </ul>
</nav>
```

### Breadcrumbs

**When to use:**
- Deep navigation hierarchies
- E-commerce (category > subcategory > product)
- Documentation sites
- File systems

**Best practices:**
- Show hierarchy clearly
- Last item is current page (not clickable)
- Use chevron or slash separators
- Implement keyboard navigation

```tsx
// ✅ Accessible breadcrumbs
<nav aria-label="Breadcrumb">
  <ol className="flex items-center gap-2 text-sm">
    <li>
      <a href="/" className="text-blue-600 hover:underline">
        Home
      </a>
    </li>
    <li aria-hidden="true">/</li>
    <li>
      <a href="/patients" className="text-blue-600 hover:underline">
        Patients
      </a>
    </li>
    <li aria-hidden="true">/</li>
    <li aria-current="page" className="text-gray-900">
      John Doe
    </li>
  </ol>
</nav>
```

### Tabs

**When to use:**
- Related content sections
- Settings/preferences
- Profile pages
- Data tables with different views

**Best practices:**
- Active tab visually distinct
- Keyboard arrow navigation
- ARIA roles and states
- Content loads without page refresh

```tsx
// ✅ Accessible tabs with Radix UI
<Tabs defaultValue="overview" className="w-full">
  <TabsList>
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="details">Details</TabsTrigger>
    <TabsTrigger value="history">History</TabsTrigger>
  </TabsList>
  
  <TabsContent value="overview">
    <OverviewPanel />
  </TabsContent>
  
  <TabsContent value="details">
    <DetailsPanel />
  </TabsContent>
  
  <TabsContent value="history">
    <HistoryPanel />
  </TabsContent>
</Tabs>
```

---

## Form Patterns

### Single-Column Forms

**When to use:**
- Default for most forms
- Mobile-first designs
- Simple data entry

**Best practices:**
- Labels above inputs
- Full-width inputs
- Logical field order
- Group related fields

```tsx
// ✅ Single-column form
<form className="max-w-md space-y-6">
  <div className="space-y-2">
    <label htmlFor="name" className="block font-medium">
      Full Name
    </label>
    <input
      id="name"
      type="text"
      className="w-full px-3 py-2 border rounded-lg"
    />
  </div>
  
  <div className="space-y-2">
    <label htmlFor="email" className="block font-medium">
      Email
    </label>
    <input
      id="email"
      type="email"
      className="w-full px-3 py-2 border rounded-lg"
    />
  </div>
  
  <button type="submit" className="w-full">
    Submit
  </button>
</form>
```

### Multi-Step Forms

**When to use:**
- Long forms (10+ fields)
- Registration/onboarding
- Checkout flows
- Complex data entry

**Best practices:**
- Progress indicator
- Save progress between steps
- Back button available
- Validate per step

```tsx
// ✅ Multi-step form with progress
<div className="max-w-2xl mx-auto">
  {/* Progress indicator */}
  <div className="mb-8">
    <div className="flex items-center justify-between mb-2">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center">
          <div
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center",
              i <= currentStep
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-600"
            )}
          >
            {i < currentStep ? <CheckIcon /> : i + 1}
          </div>
          {i < steps.length - 1 && (
            <div
              className={cn(
                "w-16 h-1 mx-2",
                i < currentStep ? "bg-blue-600" : "bg-gray-200"
              )}
            />
          )}
        </div>
      ))}
    </div>
    <p className="text-sm text-gray-600">
      Step {currentStep + 1} of {steps.length}: {steps[currentStep].title}
    </p>
  </div>

  {/* Form content */}
  <form onSubmit={handleNext}>
    {renderStepContent(currentStep)}
    
    <div className="flex justify-between mt-8">
      {currentStep > 0 && (
        <button type="button" onClick={handleBack} variant="ghost">
          Back
        </button>
      )}
      <button type="submit">
        {currentStep === steps.length - 1 ? "Submit" : "Next"}
      </button>
    </div>
  </form>
</div>
```

### Inline Validation

**When to use:**
- All forms (best practice)
- Complex validation rules
- Real-time feedback needed

**Best practices:**
- Validate on blur (not on every keystroke)
- Show success state for valid inputs
- Specific error messages
- Don't block submission to see all errors

```tsx
// ✅ Inline validation
const [email, setEmail] = useState('')
const [emailError, setEmailError] = useState('')

const validateEmail = (value: string) => {
  if (!value) {
    setEmailError('Email is required')
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    setEmailError('Please enter a valid email address')
  } else {
    setEmailError('')
  }
}

return (
  <div className="space-y-2">
    <label htmlFor="email">Email</label>
    <div className="relative">
      <input
        id="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onBlur={(e) => validateEmail(e.target.value)}
        className={cn(
          "w-full px-3 py-2 border rounded-lg",
          emailError && "border-red-500",
          !emailError && email && "border-green-500"
        )}
        aria-invalid={!!emailError}
        aria-describedby={emailError ? "email-error" : undefined}
      />
      {!emailError && email && (
        <CheckCircleIcon className="absolute right-3 top-3 text-green-500" />
      )}
    </div>
    {emailError && (
      <p id="email-error" className="text-sm text-red-600">
        {emailError}
      </p>
    )}
  </div>
)
```

---

## Data Display Patterns

### Card Grid

**When to use:**
- Product listings
- User profiles
- Dashboard widgets
- Content previews

**Best practices:**
- Consistent card sizes
- Responsive grid (1/2/3/4 columns)
- Clear hover states
- Accessible card actions

```tsx
// ✅ Responsive card grid
<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
  {items.map((item) => (
    <article
      key={item.id}
      className="border rounded-lg p-6 hover:shadow-lg transition-shadow"
    >
      <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
      <p className="text-gray-600 mb-4">{item.description}</p>
      <a
        href={item.url}
        className="text-blue-600 hover:underline"
        aria-label={`View details for ${item.title}`}
      >
        Learn more →
      </a>
    </article>
  ))}
</div>
```

### Data Table

**When to use:**
- Large datasets
- Sortable/filterable data
- Comparisons
- Admin interfaces

**Best practices:**
- Sortable columns
- Pagination or virtual scrolling
- Row actions (edit, delete)
- Responsive (stack on mobile)
- Loading states

```tsx
// ✅ Accessible data table
<div className="overflow-x-auto">
  <table className="w-full border-collapse">
    <thead>
      <tr className="border-b bg-gray-50">
        <th className="px-4 py-3 text-left font-medium">
          <button
            onClick={() => handleSort('name')}
            className="flex items-center gap-2 hover:text-blue-600"
          >
            Name
            {sortBy === 'name' && (
              <ChevronUpIcon
                className={cn(
                  "w-4 h-4 transition-transform",
                  sortOrder === 'desc' && "rotate-180"
                )}
              />
            )}
          </button>
        </th>
        <th className="px-4 py-3 text-left font-medium">Email</th>
        <th className="px-4 py-3 text-left font-medium">Role</th>
        <th className="px-4 py-3 text-right font-medium">Actions</th>
      </tr>
    </thead>
    <tbody>
      {data.map((row) => (
        <tr key={row.id} className="border-b hover:bg-gray-50">
          <td className="px-4 py-3">{row.name}</td>
          <td className="px-4 py-3">{row.email}</td>
          <td className="px-4 py-3">
            <span className="px-2 py-1 bg-blue-100 text-blue-900 rounded text-sm">
              {row.role}
            </span>
          </td>
          <td className="px-4 py-3 text-right">
            <button aria-label={`Edit ${row.name}`}>Edit</button>
            <button aria-label={`Delete ${row.name}`}>Delete</button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>

{/* Mobile: Stack as cards */}
<div className="sm:hidden space-y-4">
  {data.map((row) => (
    <div key={row.id} className="border rounded-lg p-4">
      <div className="font-medium mb-2">{row.name}</div>
      <div className="text-sm text-gray-600 mb-1">{row.email}</div>
      <div className="mb-3">
        <span className="px-2 py-1 bg-blue-100 text-blue-900 rounded text-sm">
          {row.role}
        </span>
      </div>
      <div className="flex gap-2">
        <button>Edit</button>
        <button>Delete</button>
      </div>
    </div>
  ))}
</div>
```

### Empty States

**When to use:**
- No data to display
- Search returns no results
- First-time user experience

**Best practices:**
- Explain why it's empty
- Provide clear next action
- Use illustration/icon
- Make it helpful, not frustrating

```tsx
// ✅ Helpful empty state
<div className="flex flex-col items-center justify-center py-16 text-center">
  <div className="w-16 h-16 mb-4 rounded-full bg-gray-100 flex items-center justify-center">
    <InboxIcon className="w-8 h-8 text-gray-400" />
  </div>
  
  <h3 className="text-lg font-semibold mb-2">No patients yet</h3>
  
  <p className="text-gray-600 mb-6 max-w-sm">
    Get started by adding your first patient to the system.
    You'll be able to create medical reports and track their history.
  </p>
  
  <button onClick={openCreateModal}>
    <PlusIcon className="w-4 h-4 mr-2" />
    Add First Patient
  </button>
</div>
```

---

## Feedback Patterns

### Toast Notifications

**When to use:**
- Success confirmations
- Error messages
- Background process updates
- Non-blocking notifications

**Best practices:**
- Auto-dismiss (3-5 seconds)
- Dismiss button for user control
- Stack multiple toasts
- Position consistently (usually top-right)

```tsx
// ✅ Toast notification (using toast library)
import { toast } from 'sonner'

// Success
toast.success('Patient record saved successfully')

// Error with action
toast.error('Failed to save patient record', {
  action: {
    label: 'Retry',
    onClick: () => handleSave(),
  },
})

// Custom toast
toast.custom((t) => (
  <div className="bg-white border rounded-lg shadow-lg p-4">
    <div className="flex items-start gap-3">
      <CheckCircleIcon className="w-5 h-5 text-green-500" />
      <div className="flex-1">
        <p className="font-medium">Report generated</p>
        <p className="text-sm text-gray-600">
          Your report is ready to download
        </p>
      </div>
      <button onClick={() => toast.dismiss(t)}>×</button>
    </div>
  </div>
))
```

### Loading States

**When to use:**
- Data fetching
- Form submission
- File uploads
- Any async operation

**Best practices:**
- Skeleton screens over spinners
- Match skeleton to content structure
- Progress bars for determinate operations
- Disable actions during loading

```tsx
// ✅ Skeleton loading state
{isLoading ? (
  <div className="space-y-4">
    {[1, 2, 3].map((i) => (
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
  <PatientList data={patients} />
)}

// ✅ Button loading state
<button
  onClick={handleSave}
  disabled={isSubmitting}
  className={cn(isSubmitting && "opacity-50 cursor-not-allowed")}
>
  {isSubmitting ? (
    <>
      <SpinnerIcon className="animate-spin w-4 h-4 mr-2" />
      Saving...
    </>
  ) : (
    'Save Changes'
  )}
</button>

// ✅ Progress bar for determinate operation
<div className="space-y-2">
  <div className="flex justify-between text-sm">
    <span>Uploading {uploadedFiles} of {totalFiles} files</span>
    <span>{Math.round(progress)}%</span>
  </div>
  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
    <div
      className="h-full bg-blue-600 transition-all duration-300"
      style={{ width: `${progress}%` }}
    />
  </div>
</div>
```

### Confirmation Dialogs

**When to use:**
- Destructive actions (delete, remove)
- Irreversible operations
- High-impact changes

**Best practices:**
- Explain consequences
- Require explicit confirmation
- Make cancel easy
- Use appropriate button colors

```tsx
// ✅ Confirmation dialog with clear consequences
<AlertDialog>
  <AlertDialogTrigger asChild>
    <button variant="destructive">
      <TrashIcon className="w-4 h-4 mr-2" />
      Delete Patient
    </button>
  </AlertDialogTrigger>
  
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Delete patient record?</AlertDialogTitle>
      <AlertDialogDescription>
        This will permanently delete the patient record for{' '}
        <strong>{patient.name}</strong>, including all medical reports and history.
        This action cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction
        onClick={handleDelete}
        className="bg-red-600 hover:bg-red-700"
      >
        Delete Patient
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

## Search & Filter Patterns

### Search Bar

**When to use:**
- Large lists/tables
- E-commerce
- Documentation
- Any searchable content

**Best practices:**
- Debounce input (300-500ms)
- Clear button when typing
- Show results count
- Keyboard shortcuts (⌘K / Ctrl+K)

```tsx
// ✅ Debounced search with clear button
const [query, setQuery] = useState('')
const debouncedQuery = useDebounce(query, 300)

useEffect(() => {
  if (debouncedQuery) {
    performSearch(debouncedQuery)
  }
}, [debouncedQuery])

return (
  <div className="relative">
    <SearchIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
    <input
      type="search"
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="Search patients..."
      className="w-full pl-10 pr-10 py-2 border rounded-lg"
      aria-label="Search patients"
    />
    {query && (
      <button
        onClick={() => setQuery('')}
        className="absolute right-3 top-3"
        aria-label="Clear search"
      >
        <XIcon className="w-5 h-5 text-gray-400" />
      </button>
    )}
  </div>
)
```

### Filters

**When to use:**
- E-commerce categories
- Admin dashboards
- Data tables
- Content filtering

**Best practices:**
- Show active filters
- Clear all option
- Filter count badges
- Persist filters in URL

```tsx
// ✅ Filters with active state
<div className="flex flex-wrap gap-2">
  {filterOptions.map((option) => (
    <button
      key={option.id}
      onClick={() => toggleFilter(option.id)}
      className={cn(
        "px-4 py-2 rounded-lg border transition-colors",
        activeFilters.includes(option.id)
          ? "bg-blue-600 text-white border-blue-600"
          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
      )}
    >
      {option.label}
      {option.count > 0 && (
        <span className="ml-2 text-sm">({option.count})</span>
      )}
    </button>
  ))}
  
  {activeFilters.length > 0 && (
    <button
      onClick={clearFilters}
      className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
    >
      Clear all
    </button>
  )}
</div>
```

---

## Mobile Patterns

### Bottom Sheet

**When to use:**
- Mobile actions menu
- Filters on mobile
- Quick selections
- Touch-friendly modals

```tsx
// ✅ Bottom sheet (using Vaul or similar)
<Drawer>
  <DrawerTrigger asChild>
    <button>Open Actions</button>
  </DrawerTrigger>
  
  <DrawerContent>
    <DrawerHeader>
      <DrawerTitle>Patient Actions</DrawerTitle>
      <DrawerDescription>Choose an action to perform</DrawerDescription>
    </DrawerHeader>
    
    <div className="p-4 space-y-2">
      <button className="w-full justify-start">
        <EditIcon className="mr-3" />
        Edit Patient
      </button>
      <button className="w-full justify-start">
        <FileIcon className="mr-3" />
        View Reports
      </button>
      <button className="w-full justify-start text-red-600">
        <TrashIcon className="mr-3" />
        Delete Patient
      </button>
    </div>
  </DrawerContent>
</Drawer>
```

### Pull to Refresh

**When to use:**
- Mobile feeds
- Live data lists
- Social media interfaces

**Best practices:**
- Visual feedback during pull
- Don't interfere with scrolling
- Haptic feedback (if supported)

---

## When to Break Patterns

Patterns are guidelines, not rules. Break them when:

1. **User research shows different behavior** - Your users don't match assumed patterns
2. **Technical constraints** - The pattern doesn't work with your stack
3. **Domain-specific needs** - Medical, finance, etc. have unique requirements
4. **Accessibility conflicts** - Always prioritize accessibility
5. **Performance issues** - Pattern causes performance problems

Always test with real users when deviating from established patterns.
