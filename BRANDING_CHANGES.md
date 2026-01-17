# Branding Changes - Verity Clinical

## Summary
All branding has been updated from "Adaptive Competency" to "Verity Clinical" with the new tagline and description.

## Changes Made

### 1. Centralized Branding File
**File:** `src/lib/branding.ts`
- Created centralized branding constants
- Contains new values and legacy values for easy reversion

### 2. Content Strings
**File:** `src/content/strings.ts`
- Updated hero title, tagline, and subtitle
- Updated copyright notice
- Updated auth welcome message
- Updated onboarding welcome message

### 3. HTML Meta Tags
**File:** `index.html`
- Updated page title
- Updated meta description
- Updated author
- Updated Open Graph tags

### 4. Logo Components
**Files:**
- `src/components/brand/LogoWordmark.tsx` - Now displays "Verity Clinical"
- `src/components/ui/Logo.tsx` - Updated alt text and text display

### 5. Page Components
**Files:**
- `src/pages/Index.tsx` - Updated subtitle
- `src/components/marketing/Footer.tsx` - Updated subtitle

## New Branding Values

- **App Name:** Verity Clinical
- **Tagline:** "Truthful insight. Trustworthy growth."
- **Description:** "Verity Clinical is a clinical intelligence platform that transforms observation, feedback, and assessment data into actionable insight—for learners, supervisors, and programs."

## How to Revert

To revert all changes back to "Adaptive Competency":

1. Open `src/lib/branding.ts`
2. Change the values to use the `legacy` values:

```typescript
export const branding = {
  appName: branding.legacy.appName,
  tagline: branding.legacy.tagline,
  description: branding.legacy.description,
  // ... keep legacy object for future reference
}
```

Or simply swap the values:

```typescript
appName: "Adaptive Competency",
tagline: "From observation to readiness.",
description: "Transform observations and feedback into adaptive learning trajectories—powered by data, coaching, and evidence.",
```

All components will automatically update since they reference the centralized branding constants.

## Files Modified

1. `src/lib/branding.ts` (NEW)
2. `src/content/strings.ts`
3. `index.html`
4. `src/components/brand/LogoWordmark.tsx`
5. `src/components/ui/Logo.tsx`
6. `src/pages/Index.tsx`
7. `src/components/marketing/Footer.tsx`

## Testing

After changes, verify:
- [ ] Landing page displays "Verity Clinical" as title
- [ ] Tagline appears correctly: "Truthful insight. Trustworthy growth."
- [ ] Description appears in hero section
- [ ] Logo wordmark shows "Verity Clinical"
- [ ] Page title in browser shows "Verity Clinical"
- [ ] Footer copyright shows "Verity Clinical"
- [ ] Auth page welcome message shows "Verity Clinical"
