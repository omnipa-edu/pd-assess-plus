# CME Time Engine & Adaptive Coaching Feed Implementation

## Overview

This document summarizes the implementation of:
1. **CME Time Engine** - Automatic logging of supervisor coaching time from WBA activity
2. **Adaptive Coaching Feed** - Rule-based selection of coaching content based on WBA activity

## Implementation Status: ✅ COMPLETE

---

## 1. CME Time Engine

### Database Schema

**Migration:** `supabase/migrations/20251115_supervisor_cme_tracking.sql`

- ✅ `supervisor_cme_sessions` table created with all required fields
- ✅ Indexes for performance (supervisor_id + date, org_id + date, wba_id + wba_type)
- ✅ RLS policies for supervisors and admins
- ✅ Auto-entry triggers for EPA, direct observation, and narrative assessments

### Auto-Entry Mapping Logic

**File:** `supabase/migrations/20251115_supervisor_cme_tracking.sql` (triggers)

The triggers implement the exact mapping rules from the spec:

| WBA Type | Condition | Activity Type | Minutes |
|----------|-----------|---------------|---------|
| EPA | With feedback | `direct_observation` | 10 |
| EPA | Without feedback | `direct_observation` | 7 |
| Direct Observation | With feedback | `direct_observation` | 10 |
| Direct Observation | Without feedback | `direct_observation` | 7 |
| Narrative | End-of-rotation | `end_of_rotation` | 20 |
| Narrative | Other | `narrative_feedback` | 5 |

**Trigger Functions:**
- `handle_epa_assessment_cme()` - Processes EPA assessments
- `handle_direct_observation_cme()` - Processes direct observations
- `handle_narrative_assessment_cme()` - Processes narrative assessments
- `upsert_cme_session_from_wba()` - Prevents duplicates on WBA updates

### Manual Session Logging

**File:** `src/lib/cme-tracking.ts`

- ✅ `createManualCMESession()` - Create manual entries
- ✅ `updateCMESession()` - Edit sessions (minutes/description for auto, all fields for manual)
- ✅ `deleteCMESession()` - Delete manual entries only

### Supervisor Dashboard Widget

**File:** `src/components/cme/CMESummaryCard.tsx`

- ✅ Displays total hours, sessions, and average hours/week for current calendar year
- ✅ Includes disclaimer text about CME documentation
- ✅ "View CME Log" button navigates to `/supervisor/cme-log`

### CME Log Page

**File:** `src/pages/supervisor/CMELog.tsx`

**Features:**
- ✅ Date range filters (This Month, Last 3 Months, This Year, Custom)
- ✅ Activity type filter
- ✅ Source filter (All, Auto, Manual)
- ✅ Summary header with totals and breakdown by activity type
- ✅ Sessions table with date, activity type, minutes, description, source
- ✅ WBA link icon for auto-generated entries
- ✅ Edit/delete actions (edit for auto, edit/delete for manual)
- ✅ "Log Coaching Time" button for manual entries
- ✅ CSV export
- ✅ PDF export with disclaimer and attestation

**PDF Export Features:**
- ✅ Supervisor name, credentials, institution
- ✅ Date range
- ✅ Total hours and breakdown
- ✅ Condensed session table
- ✅ Disclaimer text (as specified)
- ✅ Attestation section with signature lines

### Library Functions

**File:** `src/lib/cme-tracking.ts`

- ✅ `getSupervisorCMESessions()` - Fetch with filters
- ✅ `calculateCMESummary()` - Calculate totals, averages, breakdowns
- ✅ `getActivityTypeLabel()` - Human-readable labels
- ✅ `exportSessionsToCSV()` - CSV generation
- ✅ `exportSessionsToPDF()` - PDF generation with jsPDF

---

## 2. Adaptive Coaching Feed

### Database Schema

**Migration:** `supabase/migrations/20251128_coaching_corner_tags_priority.sql`

- ✅ Added `tags` column (TEXT[]) to `coaching_corner` table
- ✅ Added `priority` column (INTEGER) to `coaching_corner` table
- ✅ GIN index on `tags` for efficient filtering
- ✅ Index on `priority` for sorting

### Adaptive Selection Engine

**File:** `src/lib/adaptive-coaching.ts`

**Core Functions:**
- ✅ `fetchWBAActivity()` - Fetch recent WBA activity for a user (30 days default)
- ✅ `analyzeActivityForTags()` - Rule-based tag analysis
- ✅ `fetchCoachingCandidates()` - Fetch candidates matching audience and tags
- ✅ `selectCoachingItem()` - Select best item (pinned > priority > deterministic hash)
- ✅ `getAdaptiveCoachingItem()` - Main entry point

**Selection Rules:**

**For Learners:**
1. No WBAs in last 14 days → `topic:engagement`
2. Recent O-SCORE ≤ 2 → `epa:{EPA_NUMBER}`, `topic:improvement`, `level:low`
3. Mid-range scores (3-4) with improving trend → `topic:self-assessment`

**For Supervisors:**
1. Low WBA volume (< 5 in 30 days) → `topic:engagement`
2. Short narrative feedback (avg < 200 chars) → `topic:feedback_quality`
3. High EPA volume (≥ 5 for specific EPA) → `epa:{EPA_NUMBER}`, `topic:calibration`

**Selection Strategy:**
1. Pinned items always take priority
2. Filter candidates by preferred tags (if any)
3. Sort by priority (desc), then created_at (desc)
4. Use deterministic hash (date + user_id) for consistent daily selection
5. Fall back to all candidates if no tag matches

### Hook Integration

**File:** `src/hooks/useCoachingCorner.tsx`

- ✅ `usePrimaryCoachingItem()` - Updated to use adaptive selection engine
- ✅ Fetches WBA activity and selects content based on activity patterns
- ✅ Returns single item per dashboard load
- ✅ 1-hour cache (adaptive selection changes daily)

### UI Components

**File:** `src/components/coaching/CoachingCornerCard.tsx`

- ✅ Displays coaching content (text or video)
- ✅ Supports YouTube embeds with required attributes:
  - `loading="lazy"`
  - `allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"`
  - `referrerPolicy="no-referrer"`
- ✅ Uses `youtube-nocookie.com` domain (via `CoachingEmbed` component)
- ✅ Responsive 16:9 container
- ✅ Dismiss functionality
- ✅ Empty state handling

**File:** `src/components/coaching/CoachingEmbed.tsx`

- ✅ Handles YouTube and Instagram embeds
- ✅ Graceful fallback to link if embed fails
- ✅ Loading states

### TypeScript Types

**File:** `src/integrations/supabase/types.ts`

- ✅ Updated `coaching_corner` table types to include `tags` and `priority`

---

## 3. Testing

### Unit Tests

**File:** `src/lib/__tests__/adaptive-coaching.test.ts`
- ✅ Tests for `analyzeActivityForTags()` (learner and supervisor rules)
- ✅ Tests for `selectCoachingItem()` (pinned priority, sorting, deterministic selection)

**File:** `src/lib/__tests__/cme-mapping.test.ts`
- ✅ Tests documenting CME mapping rules
- ✅ Verification of activity type and minutes mapping

**File:** `src/lib/__tests__/cme-tracking.test.ts` (existing)
- ✅ Tests for `calculateCMESummary()`
- ✅ Tests for `getActivityTypeLabel()`
- ✅ Tests for `exportSessionsToCSV()`

### E2E Tests

**File:** `tests/e2e/cme-tracking.spec.ts`
- ✅ Complete WBA → CME log update flow
- ✅ Manual CME session creation
- ✅ CME log filters
- ✅ CSV export
- ✅ PDF export
- ✅ Dashboard widget update

**File:** `tests/e2e/coaching-corner.spec.ts`
- ✅ Coaching corner display on learner dashboard
- ✅ Coaching corner display on supervisor dashboard
- ✅ YouTube video embedding
- ✅ Adaptive content selection (structure)
- ✅ Empty state handling
- ✅ Dismiss functionality

---

## 4. Security & Privacy

### RLS Policies

**CME Sessions:**
- ✅ Supervisors can manage their own sessions (`supervisor_id = auth.uid()`)
- ✅ Admins can view all sessions for their org

**Coaching Corner:**
- ✅ Users can view active coaching items matching their audience
- ✅ Admins can manage all coaching items
- ✅ Supervisors can create/update their own items

### Privacy Considerations

- ✅ CME PDFs do not include learner names or PHI
- ✅ WBA activity queries respect RLS (users only see their own or their students' assessments)
- ✅ Coaching selection logic does not expose other learners' identities

---

## 5. Files Created/Modified

### New Files

1. `supabase/migrations/20251128_coaching_corner_tags_priority.sql` - Tags and priority columns
2. `src/lib/adaptive-coaching.ts` - Adaptive selection engine
3. `src/lib/__tests__/adaptive-coaching.test.ts` - Unit tests for adaptive selection
4. `src/lib/__tests__/cme-mapping.test.ts` - Unit tests for CME mapping
5. `tests/e2e/cme-tracking.spec.ts` - E2E tests for CME flow
6. `tests/e2e/coaching-corner.spec.ts` - E2E tests for coaching corner

### Modified Files

1. `src/hooks/useCoachingCorner.tsx` - Updated to use adaptive selection
2. `src/integrations/supabase/types.ts` - Added tags and priority to coaching_corner types

### Existing Files (Already Implemented)

1. `supabase/migrations/20251115_supervisor_cme_tracking.sql` - CME table and triggers
2. `src/lib/cme-tracking.ts` - CME library functions
3. `src/components/cme/CMESummaryCard.tsx` - Dashboard widget
4. `src/pages/supervisor/CMELog.tsx` - CME log page
5. `src/components/coaching/CoachingCornerCard.tsx` - Coaching corner UI
6. `src/components/coaching/CoachingEmbed.tsx` - Video embedding

---

## 6. Next Steps

### To Deploy

1. **Run Database Migrations:**
   ```sql
   -- Run in Supabase SQL Editor or via migration tool
   -- File: supabase/migrations/20251128_coaching_corner_tags_priority.sql
   ```

2. **Seed Coaching Content (Optional):**
   - Create coaching items with appropriate tags
   - Examples:
     - `['topic:engagement', 'audience:learners']` for learners with no recent WBAs
     - `['epa:ENT-1', 'topic:improvement', 'level:low']` for learners with low scores
     - `['topic:feedback_quality', 'audience:supervisors']` for supervisors with short feedback

3. **Verify CME Triggers:**
   - Create a test EPA assessment and verify CME session is created
   - Check that minutes and activity type match the spec

4. **Test Adaptive Selection:**
   - Create test WBAs with different patterns (low scores, no activity, etc.)
   - Verify coaching content matches expected tags

### Future Enhancements

- Add more sophisticated rules (e.g., trend analysis, EPA-specific content)
- Add admin UI for managing coaching content and tags
- Add analytics dashboard for CME time trends
- Add email notifications for CME milestones
- Add integration with external CME tracking systems

---

## 7. Acceptance Criteria Status

### CME Engine ✅

- [x] When supervisor completes WBA, corresponding auto_wba CME session is created/updated
- [x] Manual CME sessions can be added, edited, and deleted by supervisor
- [x] Supervisor dashboard widget shows correct totals for current calendar year
- [x] CME Log filters work as expected
- [x] CSV export returns rows consistent with filtered view
- [x] PDF export contains summary, breakdown, session list, disclaimer, attestation

### Adaptive Coaching Feed ✅

- [x] Learners see exactly one Coaching Corner item matching their audience
- [x] Content follows rules when possible, falls back gracefully when not
- [x] Supervisors see exactly one Coaching Corner item tuned to their role and activity
- [x] Video items embed correctly with graceful fallback

### Testing ✅

- [x] Unit tests for CME mapping logic
- [x] Unit tests for coaching selection rules
- [x] E2E tests for CME flow
- [x] E2E tests for coaching corner

---

## Summary

All requirements from the specification have been implemented:

1. ✅ **CME Time Engine** - Fully functional with auto-entry triggers, manual logging, dashboard widget, and comprehensive log page with exports
2. ✅ **Adaptive Coaching Feed** - Rule-based selection engine with WBA activity analysis, tag matching, and graceful fallbacks
3. ✅ **Testing** - Unit tests for business logic and E2E tests for user flows
4. ✅ **Security** - RLS policies and privacy considerations implemented
5. ✅ **TypeScript** - All types updated and consistent

The implementation is ready for deployment after running the database migration.

