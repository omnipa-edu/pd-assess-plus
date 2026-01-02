# Onboarding Setup Guide

## Quick Start

Follow these steps to complete the onboarding implementation setup:

## Step 1: Apply Database Migration

### Option A: Using Supabase CLI (Recommended)
```bash
cd pd-assess-plus
supabase db push
```

### Option B: Using Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to **Database** → **Migrations**
3. Create a new migration
4. Copy contents from `supabase/migrations/20251104_onboarding_progress.sql`
5. Run the migration

### Option C: Manual SQL Execution
1. Go to Supabase Dashboard → **SQL Editor**
2. Copy and paste the entire contents of `supabase/migrations/20251104_onboarding_progress.sql`
3. Click **Run**

## Step 2: Regenerate TypeScript Types

After applying the migration, regenerate TypeScript types to include the new `profile_progress` table:

```bash
# Using Supabase CLI
npx supabase gen types typescript --project-id YOUR_PROJECT_ID --schema public > src/integrations/supabase/types.ts

# Or if you have it configured
npm run generate:types
```

**Replace `YOUR_PROJECT_ID`** with your actual Supabase project ID (found in Project Settings → General).

This will resolve all TypeScript linting errors in `useProfileProgress.tsx`.

## Step 3: Verify Migration

Check that the table was created successfully:

```sql
-- Run this in Supabase SQL Editor
SELECT * FROM profile_progress LIMIT 1;
```

You should see the table structure with columns:
- id
- user_id
- onboarding_dismissed
- completed_tasks
- first_login_at
- onboarding_completed_at
- dismissed_empty_states
- created_at
- updated_at

## Step 4: Test the Implementation

### Run Unit Tests
```bash
npm run test
```

### Run E2E Tests
```bash
# Headless mode
npm run test:e2e

# With UI (recommended for first run)
npm run test:e2e:ui

# Headed mode (see browser)
npm run test:e2e:headed
```

### Manual Testing
1. **Create a new user account** (or use existing)
2. **Log in** to the application
3. **Navigate to dashboard** (student/supervisor/admin)
4. **Verify onboarding checklist appears** at the top
5. **Click a task** - it should mark as completed
6. **Reload the page** - task should still be marked complete
7. **Click dismiss** - checklist should hide
8. **Reload again** - checklist should stay hidden

## Step 5: Fix Any TypeScript Errors

If you still see TypeScript errors after regenerating types:

### Check Types File
Verify `src/integrations/supabase/types.ts` includes:

```typescript
export interface Database {
  public: {
    Tables: {
      // ... other tables ...
      profile_progress: {
        Row: {
          id: string;
          user_id: string;
          onboarding_dismissed: boolean;
          completed_tasks: Json;
          first_login_at: string | null;
          onboarding_completed_at: string | null;
          dismissed_empty_states: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          // ...
        };
        Update: {
          // ...
        };
      };
    };
  };
}
```

### Manual Type Addition (Temporary Workaround)
If you can't regenerate types immediately, add this to `useProfileProgress.tsx`:

```typescript
// At the top of the file
interface ProfileProgressRow {
  id: string;
  user_id: string;
  onboarding_dismissed: boolean;
  completed_tasks: string[];
  first_login_at: string | null;
  onboarding_completed_at: string | null;
  dismissed_empty_states: string[];
  created_at: string;
  updated_at: string;
}

// Then update supabase.from() calls:
const { data, error } = await supabase
  .from('profile_progress')
  .select('*') as unknown as { data: ProfileProgressRow; error: any };
```

## Troubleshooting

### Issue: "Table 'profile_progress' does not exist"
**Solution:** Run the migration (Step 1) again

### Issue: TypeScript errors persist after type generation
**Solution:** 
1. Restart your TypeScript server (VS Code: Cmd+Shift+P → "TypeScript: Restart TS Server")
2. Clear node_modules and reinstall: `rm -rf node_modules && npm install`

### Issue: Onboarding doesn't appear
**Possible causes:**
1. User already dismissed it (check database)
2. Progress record not created (check trigger is working)
3. Component not imported in dashboard

**Debug steps:**
```sql
-- Check if user has progress record
SELECT * FROM profile_progress WHERE user_id = 'YOUR_USER_ID';

-- Reset onboarding for testing
UPDATE profile_progress 
SET onboarding_dismissed = false, 
    completed_tasks = '[]'::jsonb
WHERE user_id = 'YOUR_USER_ID';
```

### Issue: Tasks don't persist
**Solution:** Check browser console for errors. Verify:
1. RLS policies are correctly applied
2. User is authenticated
3. Network tab shows successful PUT/PATCH requests

### Issue: Tests fail
**Common causes:**
1. Supabase mock not configured correctly
2. Test database not seeded
3. Environment variables missing

**Fix:**
```bash
# Update test environment
cp .env.example .env.test

# Run specific test
npm run test -- useProfileProgress.test
```

## Environment Variables

Ensure these are set (already configured in your project):

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## Performance Optimization

### Enable Query Caching
Consider adding React Query caching to `useProfileProgress`:

```typescript
import { useQuery, useMutation } from '@tanstack/react-query';

// In useProfileProgress hook
const { data: progress, isLoading } = useQuery({
  queryKey: ['profile-progress', user?.id],
  queryFn: fetchProgress,
  enabled: !!user,
  staleTime: 5 * 60 * 1000, // 5 minutes
});
```

### Add Indexes
Already included in migration, but verify:

```sql
-- Check indexes exist
SELECT indexname, tablename 
FROM pg_indexes 
WHERE tablename = 'profile_progress';
```

## Deployment Checklist

Before deploying to production:

- [ ] Migration applied successfully
- [ ] TypeScript types generated and no errors
- [ ] All unit tests passing
- [ ] All E2E tests passing
- [ ] Manual testing completed for all roles
- [ ] Dark mode tested
- [ ] Mobile responsive tested
- [ ] Accessibility tested (keyboard navigation, screen reader)
- [ ] Performance tested (load times < 3s)
- [ ] RLS policies verified
- [ ] Backup database before deploying

## Rollback Plan

If issues occur in production:

### Quick Rollback
```sql
-- Disable onboarding for all users
UPDATE profile_progress SET onboarding_dismissed = true;
```

### Full Rollback
```sql
-- Drop the table (will lose progress data)
DROP TABLE IF EXISTS profile_progress CASCADE;
```

### Partial Rollback
```typescript
// In code, add feature flag
const ENABLE_ONBOARDING = false;

// In dashboard components
{ENABLE_ONBOARDING && <OnboardingChecklist />}
```

## Support

If you encounter issues not covered here:

1. Check browser console for errors
2. Check Supabase logs in dashboard
3. Review migration SQL for syntax errors
4. Test with a fresh user account
5. Verify all files were saved and deployed

## Next Steps After Setup

1. **Monitor Analytics**
   - Track onboarding completion rates
   - Measure time to complete
   - Identify drop-off points

2. **Gather User Feedback**
   - Survey new users about onboarding experience
   - A/B test different task orders
   - Iterate on copy and CTAs

3. **Enhance Features**
   - Add video tutorials
   - Implement tooltips for first-time features
   - Create interactive product tours
   - Add achievement badges

4. **Performance Monitoring**
   - Track API response times
   - Monitor database query performance
   - Optimize slow queries

---

**Questions?** Review `ONBOARDING_IMPLEMENTATION.md` for detailed documentation.

**Ready to go?** Start with Step 1 above! 🚀



