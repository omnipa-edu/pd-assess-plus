# Verify Gamification Migrations

## Quick Verification Queries

Run these queries in Supabase SQL Editor to verify all migrations were applied successfully:

### 1. Verify Notifications System

```sql
-- Check notifications table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'notifications';

-- Check notification_preferences table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'notification_preferences';

-- Check notification types enum exists
SELECT typname 
FROM pg_type 
WHERE typname = 'notification_type';

-- Check notification functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('create_notification', 'mark_notification_read', 'mark_all_notifications_read', 'get_unread_notification_count');

-- Check RLS policies exist
SELECT policyname 
FROM pg_policies 
WHERE tablename = 'notifications';
```

**Expected Results:**
- `notifications` table should exist
- `notification_preferences` table should exist
- `notification_type` enum should exist
- All 4 functions should exist
- 3 policies should be listed

---

### 2. Verify Achievements System

```sql
-- Check achievement tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('achievement_definitions', 'user_achievements', 'achievement_progress');

-- Check achievement enums exist
SELECT typname 
FROM pg_type 
WHERE typname IN ('achievement_category', 'achievement_rarity');

-- Check achievement functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('unlock_achievement', 'update_achievement_progress');

-- Check achievement definitions were seeded
SELECT COUNT(*) as achievement_count 
FROM achievement_definitions;
```

**Expected Results:**
- All 3 tables should exist
- Both enums should exist
- Both functions should exist
- `achievement_count` should be > 0 (achievements were pre-seeded)

---

### 3. Verify Goals & Gamification System

```sql
-- Check goals table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('goals', 'user_streaks', 'user_activity_log');

-- Check goal enums exist
SELECT typname 
FROM pg_type 
WHERE typname IN ('goal_type', 'goal_status', 'goal_period');

-- Check gamification functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('update_goal_progress', 'log_user_activity', 'get_user_streak');

-- Check RLS policies for goals
SELECT policyname 
FROM pg_policies 
WHERE tablename = 'goals';
```

**Expected Results:**
- All 3 tables should exist
- All 3 enums should exist
- All 3 functions should exist
- 4 policies should be listed for goals

---

## Comprehensive Verification Query

Run this single query to check everything at once:

```sql
-- Comprehensive Migration Verification
SELECT 
  'Tables' as category,
  COUNT(*) as count,
  string_agg(table_name, ', ' ORDER BY table_name) as items
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'notifications', 'notification_preferences',
    'achievement_definitions', 'user_achievements', 'achievement_progress',
    'goals', 'user_streaks', 'user_activity_log'
  )

UNION ALL

SELECT 
  'Enums' as category,
  COUNT(*) as count,
  string_agg(typname, ', ' ORDER BY typname) as items
FROM pg_type 
WHERE typname IN (
  'notification_type', 'notification_priority',
  'achievement_category', 'achievement_rarity',
  'goal_type', 'goal_status', 'goal_period'
)

UNION ALL

SELECT 
  'Functions' as category,
  COUNT(*) as count,
  string_agg(routine_name, ', ' ORDER BY routine_name) as items
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN (
    'create_notification', 'mark_notification_read', 'mark_all_notifications_read', 'get_unread_notification_count',
    'unlock_achievement', 'update_achievement_progress',
    'update_goal_progress', 'log_user_activity', 'get_user_streak'
  )

UNION ALL

SELECT 
  'Achievement Definitions' as category,
  COUNT(*) as count,
  'Pre-seeded achievements' as items
FROM achievement_definitions;
```

**Expected Results:**
- **Tables**: 8 tables
- **Enums**: 7 enums
- **Functions**: 9 functions
- **Achievement Definitions**: Should be > 0 (typically 15-20)

---

## Test Creating a Notification

If everything looks good, test creating a notification:

```sql
-- Get your user ID first
SELECT id, email FROM auth.users LIMIT 1;

-- Then create a test notification (replace USER_ID with actual UUID)
SELECT create_notification(
  'YOUR_USER_ID_HERE'::uuid,
  'milestone_achieved',
  'Test Notification',
  'This is a test to verify the notifications system works!',
  'high',
  '/student',
  'View Dashboard'
);
```

**Expected Result:** Should return a UUID (the notification ID)

---

## Test Unlocking an Achievement

```sql
-- Get your user ID
SELECT id, email FROM auth.users LIMIT 1;

-- Unlock an achievement (replace USER_ID with actual UUID)
SELECT unlock_achievement(
  'YOUR_USER_ID_HERE'::uuid,
  'first_assessment'
);
```

**Expected Result:** Should return `true` if successful

---

## Test Creating a Goal

```sql
-- Get your user ID
SELECT id, email FROM auth.users LIMIT 1;

-- Create a test goal (replace USER_ID with actual UUID)
INSERT INTO goals (user_id, title, type, target_value, unit, period, start_date)
VALUES (
  'YOUR_USER_ID_HERE'::uuid,
  'Test Goal',
  'assessment_count',
  5,
  'assessments',
  'monthly',
  CURRENT_DATE
)
RETURNING id, title, status;
```

**Expected Result:** Should return the new goal with `status = 'active'`

---

## Test Logging Activity (Streak)

```sql
-- Get your user ID
SELECT id, email FROM auth.users LIMIT 1;

-- Log activity (replace USER_ID with actual UUID)
SELECT log_user_activity(
  'YOUR_USER_ID_HERE'::uuid,
  'assessment'
);
```

**Expected Result:** Should return the new streak count (typically 1 for first activity)

---

## If Something is Missing

If any of the above queries return 0 or NULL:

1. **Check for errors in migration execution:**
   - Look for any error messages in Supabase dashboard
   - Check the migration history

2. **Re-run the specific migration:**
   - The migrations are now idempotent, so you can safely re-run them
   - They will drop and recreate policies/triggers if they exist

3. **Check RLS is enabled:**
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public' 
     AND tablename IN ('notifications', 'goals', 'user_streaks');
   ```
   - `rowsecurity` should be `true` for all tables

4. **Verify permissions:**
   ```sql
   SELECT grantee, privilege_type 
   FROM information_schema.role_table_grants 
   WHERE table_schema = 'public' 
     AND table_name = 'notifications';
   ```
   - Should show grants to `authenticated` role

---

## Next Steps

Once verified:
1. ✅ Regenerate TypeScript types: `npm run generate:types`
2. ✅ Test the frontend components
3. ✅ Run the automated tests: `npm run test:e2e`

