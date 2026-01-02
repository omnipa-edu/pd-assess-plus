# Gamification Features - Complete Testing Guide

## 🎯 Overview

This guide provides step-by-step instructions for testing:
- **Notifications System** (in-app notifications, preferences)
- **Achievements & Badges** (unlocking, progress tracking)
- **Goals System** (creating, tracking, completing goals)
- **Streak Tracking** (daily activity streaks)

**Target Audience:** Novice testers with no prior testing experience

---

## 📋 Prerequisites

### Before You Start

1. **Database Setup**
   - ✅ Run migrations: `20251201_notifications_system.sql`
   - ✅ Run migrations: `20251201_achievements_system.sql`
   - ✅ Run migrations: `20251202_goals_and_gamification.sql`
   - ✅ Regenerate TypeScript types: `npm run generate:types`

2. **Test Accounts**
   - Create at least 2 test accounts:
     - **Student account**: `student@test.com`
     - **Supervisor account**: `supervisor@test.com`
   - Make sure both accounts are fully set up (profile completed)

3. **Development Server**
   ```bash
   cd pd-assess-plus
   npm run dev
   ```
   - Server should be running at: `http://localhost:5173`

4. **Browser Tools**
   - Chrome or Firefox (recommended)
   - Open Developer Tools (F12 or Right-click → Inspect)
   - Keep Console tab open to see any errors

---

## 🧪 Part 1: Notifications System Testing

### Test 1.1: Notification Center Display

**Goal:** Verify notification bell appears and shows unread count

**Steps:**
1. Log in as a student: `student@test.com`
2. Navigate to: `http://localhost:5173/student`
3. Look at the top-right corner of the page
4. **Expected:** You should see a bell icon (🔔)
5. **Expected:** If there are unread notifications, you should see a red badge with a number

**What to Check:**
- [ ] Bell icon is visible
- [ ] Bell icon is clickable
- [ ] Badge shows correct unread count (or no badge if 0)

**Screenshot Location:** Take a screenshot of the header showing the bell icon

---

### Test 1.2: Viewing Notifications

**Goal:** Verify notifications list displays correctly

**Steps:**
1. While logged in as student, click the bell icon
2. A dropdown/popover should open
3. **Expected:** You should see a list of notifications (or "No notifications" message)

**What to Check:**
- [ ] Dropdown opens when clicking bell
- [ ] Notifications are listed (if any exist)
- [ ] Each notification shows:
  - [ ] Title
  - [ ] Message/description
  - [ ] Time ago (e.g., "2 hours ago")
  - [ ] Priority indicator (colored dot)
- [ ] Unread notifications appear at top
- [ ] Read notifications appear below (grayed out)

**If No Notifications:**
- This is normal for a new account
- Continue to Test 1.3 to create a notification

---

### Test 1.3: Mark Notification as Read

**Goal:** Verify you can mark notifications as read

**Steps:**
1. If you have unread notifications, click the checkmark (✓) icon on one notification
2. **Expected:** The notification should move to the "read" section
3. **Expected:** The unread count badge should decrease by 1

**What to Check:**
- [ ] Clicking checkmark marks notification as read
- [ ] Notification moves to read section
- [ ] Badge count updates immediately
- [ ] Notification appears grayed out in read section

**If No Unread Notifications:**
- Skip this test and continue to Test 1.4

---

### Test 1.4: Mark All as Read

**Goal:** Verify "Mark all as read" functionality

**Steps:**
1. Click the bell icon to open notifications
2. Look for a button that says "Mark all read" or has a checkmark icon
3. Click that button
4. **Expected:** All notifications should be marked as read
5. **Expected:** Badge should disappear or show "0"

**What to Check:**
- [ ] "Mark all read" button is visible
- [ ] Clicking it marks all notifications as read
- [ ] Badge count goes to 0
- [ ] All notifications appear in read section

---

### Test 1.5: Notification Click Navigation

**Goal:** Verify clicking notifications navigates correctly

**Steps:**
1. Open notifications dropdown
2. Find a notification that has an action (usually has an external link icon →)
3. Click on the notification
4. **Expected:** You should be navigated to the relevant page

**What to Check:**
- [ ] Clicking notification navigates to correct page
- [ ] Notification is marked as read after clicking
- [ ] Page loads correctly after navigation

---

### Test 1.6: Create Test Notification (Manual)

**Goal:** Manually create a notification to test the system

**Steps:**
1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/sxaavsmcpnmztbrulfoy
2. Navigate to: **SQL Editor**
3. Get your user ID first:
   ```sql
   SELECT id, email FROM auth.users WHERE email = 'student@test.com';
   ```
4. Copy the user ID (UUID format)
5. Run this SQL (replace `YOUR_USER_ID` with the actual UUID):
   ```sql
   SELECT create_notification(
     'YOUR_USER_ID_HERE'::uuid,
     'milestone_achieved',
     'Test Notification',
     'This is a test notification to verify the system works!',
     'high',
     '/student',
     'View Dashboard'
   );
   ```
6. Refresh the student dashboard
7. **Expected:** You should see a new notification in the bell icon

**What to Check:**
- [ ] Notification appears after refresh
- [ ] Notification shows correct title and message
- [ ] Badge count increases
- [ ] Notification is clickable

---

## 🏆 Part 2: Achievements System Testing

### Test 2.1: Achievement Display

**Goal:** Verify achievements card appears on dashboard

**Steps:**
1. Log in as student: `student@test.com`
2. Navigate to: `http://localhost:5173/student`
3. Scroll down to find the "Achievements" card
4. **Expected:** You should see a card with:
   - Trophy icon (🏆)
   - Title: "Achievements"
   - Text showing: "X of Y unlocked" (e.g., "0 of 15 unlocked")

**What to Check:**
- [ ] Achievements card is visible
- [ ] Shows correct count (e.g., "0 of 15 unlocked")
- [ ] Card is not empty or broken

**Screenshot Location:** Take a screenshot of the Achievements card

---

### Test 2.2: View All Achievements

**Goal:** Verify you can view all available achievements

**Steps:**
1. On the Achievements card, click the "View All" button
2. **Expected:** A dialog/modal should open
3. **Expected:** You should see tabs: "All", "Unlocked", "Locked"

**What to Check:**
- [ ] Dialog opens when clicking "View All"
- [ ] Three tabs are visible: All, Unlocked, Locked
- [ ] Achievements are displayed in a grid
- [ ] Each achievement shows:
  - [ ] Icon/emoji
  - [ ] Name
  - [ ] Locked achievements appear grayed out
  - [ ] Unlocked achievements appear with full color

**If No Achievements Show:**
- Check browser console for errors
- Verify database migration ran successfully
- Check that `achievement_definitions` table has data

---

### Test 2.3: Achievement Categories

**Goal:** Verify achievements are organized by category

**Steps:**
1. Open "View All" achievements dialog
2. Look at the achievements displayed
3. **Expected:** You should see achievements with different:
   - Icons/colors (indicating rarity)
   - Categories (First Steps, Consistency, Milestones, etc.)

**What to Check:**
- [ ] Achievements have different visual styles (rarity)
- [ ] Common achievements (gray)
- [ ] Uncommon achievements (green)
- [ ] Rare achievements (blue)
- [ ] Epic achievements (purple)
- [ ] Legendary achievements (gold/yellow)

---

### Test 2.4: Unlock First Achievement

**Goal:** Manually unlock an achievement to test the system

**Steps:**
1. Open Supabase Dashboard SQL Editor
2. Get your user ID:
   ```sql
   SELECT id FROM auth.users WHERE email = 'student@test.com';
   ```
3. Copy the UUID
4. Run this SQL to unlock "First Assessment" achievement:
   ```sql
   SELECT unlock_achievement(
     'YOUR_USER_ID_HERE'::uuid,
     'first_assessment'
   );
   ```
5. Refresh the student dashboard
6. **Expected:** You should see an achievement unlock modal with confetti animation
7. **Expected:** The achievement should now appear in "Unlocked" tab

**What to Check:**
- [ ] Achievement unlock modal appears
- [ ] Modal shows confetti animation
- [ ] Achievement badge is displayed
- [ ] Achievement name and description are shown
- [ ] "Awesome!" button closes the modal
- [ ] Achievement appears in "Unlocked" tab
- [ ] Achievement count updates (e.g., "1 of 15 unlocked")

**Screenshot Location:** Take a screenshot of the unlock modal

---

### Test 2.5: Achievement Progress Tracking

**Goal:** Verify achievement progress updates correctly

**Steps:**
1. Open Supabase SQL Editor
2. Update progress for "assessments_10" achievement:
   ```sql
   SELECT update_achievement_progress(
     'YOUR_USER_ID_HERE'::uuid,
     'assessments_10',
     1  -- increment by 1
   );
   ```
3. Run this multiple times (5-10 times) to build progress
4. **Expected:** When you reach 10, the achievement should unlock automatically
5. **Expected:** You should receive a notification

**What to Check:**
- [ ] Progress updates correctly
- [ ] Achievement unlocks when target reached
- [ ] Notification is created when unlocked
- [ ] Achievement appears in unlocked list

---

## 🎯 Part 3: Goals System Testing

### Test 3.1: Goals Display

**Goal:** Verify goals card appears on dashboard

**Steps:**
1. Log in as student: `student@test.com`
2. Navigate to: `http://localhost:5173/student`
3. Scroll down to find the "Goals" card
4. **Expected:** You should see a card with:
   - Target icon (🎯)
   - Title: "Goals"
   - Text showing: "X active, Y completed"

**What to Check:**
- [ ] Goals card is visible
- [ ] Shows correct counts (e.g., "0 active, 0 completed")
- [ ] "New Goal" button is visible

---

### Test 3.2: Create a New Goal

**Goal:** Verify you can create a new goal

**Steps:**
1. On the Goals card, click "New Goal" button
2. **Expected:** A dialog/form should open
3. Fill out the form:
   - **Title:** "Complete 5 assessments this month"
   - **Description:** "I want to complete 5 assessments to track my progress"
   - **Type:** Select "Assessment Count"
   - **Target:** Enter `5`
   - **Unit:** Should auto-fill as "assessments"
   - **Period:** Select "Monthly"
   - **Start Date:** Today's date (should be pre-filled)
   - **End Date:** Last day of current month (optional)
4. Click "Create Goal" button
5. **Expected:** Dialog should close
6. **Expected:** New goal should appear in the Goals card

**What to Check:**
- [ ] Form opens when clicking "New Goal"
- [ ] All form fields are visible and editable
- [ ] Type dropdown shows all options
- [ ] Unit auto-fills based on type
- [ ] Form validation works (try submitting empty form)
- [ ] Goal is created successfully
- [ ] Goal appears in the list
- [ ] Success toast/notification appears

**Screenshot Location:** Take a screenshot of the goal form

---

### Test 3.3: View Goal Details

**Goal:** Verify goal card displays all information

**Steps:**
1. Find the goal you just created
2. **Expected:** Goal card should show:
   - Title
   - Description (if provided)
   - Progress bar
   - Current value / Target value
   - Percentage complete
   - Days remaining (if end date set)
   - Status badge
   - Type badge
   - Period badge

**What to Check:**
- [ ] All goal information is displayed
- [ ] Progress bar shows 0% (since no progress yet)
- [ ] Current value is 0
- [ ] Target value is correct (5)
- [ ] Days remaining is calculated correctly
- [ ] Status shows "active"
- [ ] Badges are visible and correct

---

### Test 3.4: Edit a Goal

**Goal:** Verify you can edit an existing goal

**Steps:**
1. Find a goal you created
2. Look for a menu icon (three dots) or "Edit" button
3. Click it
4. **Expected:** Goal form should open with pre-filled values
5. Change the target from 5 to 10
6. Click "Update Goal"
7. **Expected:** Goal should update with new target

**What to Check:**
- [ ] Edit button/menu is visible
- [ ] Form opens with existing values
- [ ] Can modify any field
- [ ] Changes save correctly
- [ ] Goal card updates with new values
- [ ] Progress bar recalculates

---

### Test 3.5: Delete a Goal

**Goal:** Verify you can delete a goal

**Steps:**
1. Find a goal you created
2. Click the menu icon (three dots)
3. Click "Delete"
4. **Expected:** Confirmation dialog might appear (if implemented)
5. Confirm deletion
6. **Expected:** Goal should disappear from the list

**What to Check:**
- [ ] Delete option is available
- [ ] Goal is removed from list
- [ ] Count updates (e.g., "0 active" instead of "1 active")
- [ ] Success message appears

---

### Test 3.6: Goal Progress Updates

**Goal:** Verify goal progress updates when activities occur

**Steps:**
1. Create a goal: "Complete 3 assessments" (type: assessment_count, target: 3)
2. Get the goal ID from Supabase:
   ```sql
   SELECT id, title FROM goals 
   WHERE user_id = (SELECT id FROM auth.users WHERE email = 'student@test.com')
   ORDER BY created_at DESC LIMIT 1;
   ```
3. Update progress manually:
   ```sql
   SELECT update_goal_progress(
     'YOUR_GOAL_ID_HERE'::uuid,
     1  -- increment by 1
   );
   ```
4. Refresh the dashboard
5. **Expected:** Goal progress should increase
6. **Expected:** Progress bar should show updated percentage

**What to Check:**
- [ ] Progress updates correctly
- [ ] Progress bar fills up
- [ ] Current value increases
- [ ] Percentage updates
- [ ] Visual feedback is clear

---

### Test 3.7: Goal Completion

**Goal:** Verify goal completion works correctly

**Steps:**
1. Create a goal with target of 2 (for quick testing)
2. Get the goal ID:
   ```sql
   SELECT id FROM goals 
   WHERE user_id = (SELECT id FROM auth.users WHERE email = 'student@test.com')
   ORDER BY created_at DESC LIMIT 1;
   ```
3. Update progress twice to reach target:
   ```sql
   SELECT update_goal_progress('GOAL_ID', 1);
   SELECT update_goal_progress('GOAL_ID', 1);
   ```
4. Refresh dashboard
5. **Expected:** Goal should show as "completed"
6. **Expected:** Goal should move to "Completed" tab
7. **Expected:** You should receive a notification

**What to Check:**
- [ ] Goal status changes to "completed"
- [ ] Progress bar shows 100%
- [ ] Goal appears in "Completed" tab
- [ ] Notification is created
- [ ] Completed goals show checkmark icon
- [ ] Completed goals are grayed out

---

### Test 3.8: Goal Tabs (Active/Completed)

**Goal:** Verify goal filtering by status

**Steps:**
1. Create at least 2 goals
2. Complete one goal (using SQL or by reaching target)
3. On the Goals card, you should see tabs: "Active" and "Completed"
4. Click "Active" tab
5. **Expected:** Only active goals should show
6. Click "Completed" tab
7. **Expected:** Only completed goals should show

**What to Check:**
- [ ] Tabs are visible
- [ ] Active tab shows only active goals
- [ ] Completed tab shows only completed goals
- [ ] Counts in tabs are correct
- [ ] Switching tabs works smoothly

---

## 🔥 Part 4: Streak Tracking Testing

### Test 4.1: Streak Display

**Goal:** Verify streak card appears on dashboard

**Steps:**
1. Log in as student: `student@test.com`
2. Navigate to: `http://localhost:5173/student`
3. Look for the "Assessment Streak" card (should be near top)
4. **Expected:** You should see:
   - Flame icon (🔥)
   - Title: "Assessment Streak"
   - Large number showing current streak (e.g., "0")
   - Text: "Start your streak today!" (if streak is 0)

**What to Check:**
- [ ] Streak card is visible
- [ ] Flame icon is displayed
- [ ] Current streak number is shown
- [ ] Motivational message is appropriate for streak level
- [ ] Card has orange/red gradient background

**Screenshot Location:** Take a screenshot of the Streak card

---

### Test 4.2: Initial Streak State

**Goal:** Verify streak starts at 0 for new users

**Steps:**
1. Check the streak display
2. **Expected:** Current streak should be 0
3. **Expected:** Longest streak should be 0 (or not shown)
4. **Expected:** Message should say "Start your streak today!"

**What to Check:**
- [ ] Streak shows 0 for new account
- [ ] No errors in console
- [ ] Card displays correctly even with 0 streak

---

### Test 4.3: Log Activity and Update Streak

**Goal:** Verify streak updates when activity is logged

**Steps:**
1. Get your user ID:
   ```sql
   SELECT id FROM auth.users WHERE email = 'student@test.com';
   ```
2. Log an activity via SQL:
   ```sql
   SELECT log_user_activity(
     'YOUR_USER_ID_HERE'::uuid,
     'assessment'
   );
   ```
3. Refresh the dashboard
4. **Expected:** Streak should increase to 1
5. **Expected:** Message should change to "Day in a row"

**What to Check:**
- [ ] Streak updates to 1
- [ ] Message updates appropriately
- [ ] No errors occur
- [ ] Streak persists after refresh

---

### Test 4.4: Build a Streak

**Goal:** Verify streak builds over multiple days

**Steps:**
1. Log activity for yesterday (simulate):
   ```sql
   INSERT INTO user_activity_log (user_id, activity_type, activity_date)
   VALUES (
     (SELECT id FROM auth.users WHERE email = 'student@test.com'),
     'assessment',
     CURRENT_DATE - INTERVAL '1 day'
   )
   ON CONFLICT DO NOTHING;
   ```
2. Log activity for today:
   ```sql
   SELECT log_user_activity(
     (SELECT id FROM auth.users WHERE email = 'student@test.com'),
     'assessment'
   );
   ```
3. **Expected:** Streak should be 2
4. **Expected:** Message should say "Days in a row"

**What to Check:**
- [ ] Streak increments correctly
- [ ] Multiple days build the streak
- [ ] Longest streak tracks correctly
- [ ] Message updates for plural ("days" vs "day")

---

### Test 4.5: Streak Reset (Break)

**Goal:** Verify streak resets when activity is missed

**Steps:**
1. Build a streak of 3 days (using SQL to simulate multiple days)
2. Skip a day (don't log activity for 2 days)
3. Log activity again
4. **Expected:** Streak should reset to 1
5. **Expected:** Longest streak should still show 3

**What to Check:**
- [ ] Streak resets when broken
- [ ] Longest streak is preserved
- [ ] New streak starts correctly
- [ ] No errors occur

---

### Test 4.6: Streak Milestone Notifications

**Goal:** Verify notifications for streak milestones

**Steps:**
1. Build streak to 3 days
2. **Expected:** You should receive a notification: "🔥 3-Day Streak!"
3. Build streak to 7 days
4. **Expected:** You should receive a notification: "🔥 7-Day Streak!"
5. Build streak to 30 days (if possible)
6. **Expected:** You should receive a notification: "🔥 30-Day Streak!"

**What to Check:**
- [ ] Notification appears at milestone (3, 7, 30 days)
- [ ] Notification has correct message
- [ ] Notification is clickable
- [ ] Notification appears in notification center

---

## 🔗 Part 5: Integration Testing

### Test 5.1: Complete Assessment Flow

**Goal:** Verify all systems work together when completing an assessment

**Steps:**
1. Log in as supervisor: `supervisor@test.com`
2. Create a goal: "Complete 2 assessments" (target: 2)
3. Create an EPA assessment:
   - Click "New Assessment"
   - Select "EPA Observation"
   - Fill out the form
   - Submit
4. **Expected:** Multiple things should happen:
   - Assessment is saved
   - Streak is updated (if applicable)
   - Goal progress increases
   - Achievement progress updates
   - Notifications may be created

**What to Check:**
- [ ] Assessment submits successfully
- [ ] Streak updates (check supervisor dashboard)
- [ ] Goal progress increases
- [ ] Achievement progress updates
- [ ] Any relevant notifications appear
- [ ] No errors in console

---

### Test 5.2: Cross-User Notifications

**Goal:** Verify student receives notification when supervisor creates assessment

**Steps:**
1. Log in as supervisor
2. Create an assessment for a student
3. Log out
4. Log in as that student
5. **Expected:** Student should see notification about new assessment

**What to Check:**
- [ ] Notification appears for student
- [ ] Notification has correct information
- [ ] Notification links to correct page
- [ ] Notification is clickable

---

## 🤖 Part 6: Automated Testing Opportunities

### What Can Be Automated

The following tests can be automated using Playwright:

#### 6.1: Notification Center Automation

**Test File:** `tests/e2e/notifications.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Notifications System', () => {
  test.beforeEach(async ({ page }) => {
    // Login as student
    await page.goto('/auth');
    await page.fill('input[name="email"]', 'student@test.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button:has-text("Sign In")');
    await page.waitForURL('/student');
  });

  test('notification center displays and functions', async ({ page }) => {
    // Check notification bell exists
    const bellIcon = page.locator('button:has([data-lucide="bell"])').or(
      page.locator('[aria-label*="notification"]')
    );
    await expect(bellIcon).toBeVisible();
    
    // Click bell icon
    await bellIcon.click();
    
    // Verify dropdown opens
    await expect(page.locator('text=Notifications')).toBeVisible();
    
    // Check for notifications or empty state
    const hasNotifications = await page.locator('text=No notifications').isVisible().catch(() => false);
    
    if (!hasNotifications) {
      // If notifications exist, test marking as read
      const markReadButton = page.locator('button[aria-label*="mark"]').first();
      if (await markReadButton.isVisible()) {
        await markReadButton.click();
      }
    }
  });
});
```

#### 6.2: Goals CRUD Automation

**Test File:** `tests/e2e/goals.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Goals System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/student');
  });

  test('create and manage goals', async ({ page }) => {
    // Click "New Goal"
    await page.click('button:has-text("New Goal")');
    
    // Fill form
    await page.fill('input[name="title"]', 'Test Goal');
    await page.selectOption('select[name="type"]', 'assessment_count');
    await page.fill('input[name="target_value"]', '5');
    await page.click('button:has-text("Create Goal")');
    
    // Verify goal appears
    await expect(page.locator('text=Test Goal')).toBeVisible();
    
    // Verify progress bar shows 0%
    await expect(page.locator('text=0 / 5')).toBeVisible();
  });
});
```

#### 6.3: Streak Display Automation

**Test File:** `tests/e2e/streaks.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Streak Tracking', () => {
  test('streak displays correctly', async ({ page }) => {
    await page.goto('/student');
    
    // Check streak card exists
    await expect(page.locator('text=Assessment Streak')).toBeVisible();
    
    // Verify initial streak is 0 or shows number
    const streakCard = page.locator('[class*="StreakDisplay"]');
    await expect(streakCard).toBeVisible();
  });
});
```

#### 6.4: Achievement Display Automation

**Test File:** `tests/e2e/achievements.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Achievements System', () => {
  test('achievements card displays', async ({ page }) => {
    await page.goto('/student');
    
    // Check achievements card exists
    await expect(page.locator('text=Achievements')).toBeVisible();
    
    // Click "View All"
    await page.click('button:has-text("View All")');
    
    // Verify dialog opens
    await expect(page.locator('text=All Achievements')).toBeVisible();
    
    // Check tabs exist
    await expect(page.locator('text=All')).toBeVisible();
    await expect(page.locator('text=Unlocked')).toBeVisible();
    await expect(page.locator('text=Locked')).toBeVisible();
  });
});
```

### Running Automated Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI (interactive)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Run specific test file
npx playwright test tests/e2e/notifications.spec.ts

# Run specific test
npx playwright test tests/e2e/notifications.spec.ts -g "notification center"
```

---

## 📊 Test Data Setup

### Creating Test Data via SQL

**For Notifications:**
```sql
-- Create test notification
SELECT create_notification(
  (SELECT id FROM auth.users WHERE email = 'student@test.com'),
  'milestone_achieved',
  'Test Achievement',
  'You unlocked a test achievement!',
  'high',
  '/student',
  'View Dashboard'
);
```

**For Achievements:**
```sql
-- Unlock achievement
SELECT unlock_achievement(
  (SELECT id FROM auth.users WHERE email = 'student@test.com'),
  'first_assessment'
);
```

**For Goals:**
```sql
-- Create test goal
INSERT INTO goals (user_id, title, type, target_value, unit, period, start_date)
SELECT 
  id,
  'Test Goal',
  'assessment_count',
  5,
  'assessments',
  'monthly',
  CURRENT_DATE
FROM auth.users
WHERE email = 'student@test.com';
```

**For Streaks:**
```sql
-- Log activity
SELECT log_user_activity(
  (SELECT id FROM auth.users WHERE email = 'student@test.com'),
  'assessment'
);
```

---

## ✅ Testing Checklist

### Pre-Testing
- [ ] All migrations run successfully
- [ ] TypeScript types regenerated
- [ ] Development server running
- [ ] Test accounts created
- [ ] Browser developer tools open

### Notifications
- [ ] Notification bell appears
- [ ] Unread count badge works
- [ ] Notifications list displays
- [ ] Mark as read works
- [ ] Mark all as read works
- [ ] Click navigation works
- [ ] Notifications persist after refresh

### Achievements
- [ ] Achievements card displays
- [ ] View all dialog opens
- [ ] Tabs work (All/Unlocked/Locked)
- [ ] Achievement unlock modal appears
- [ ] Confetti animation works
- [ ] Progress tracking works
- [ ] Achievement counts update

### Goals
- [ ] Goals card displays
- [ ] Create goal form works
- [ ] Form validation works
- [ ] Goal appears after creation
- [ ] Edit goal works
- [ ] Delete goal works
- [ ] Progress updates correctly
- [ ] Goal completion works
- [ ] Tabs filter correctly
- [ ] Notifications on completion

### Streaks
- [ ] Streak card displays
- [ ] Initial state is 0
- [ ] Streak updates on activity
- [ ] Multiple days build streak
- [ ] Streak resets when broken
- [ ] Longest streak tracks
- [ ] Milestone notifications work

### Integration
- [ ] Assessment completion triggers all systems
- [ ] Cross-user notifications work
- [ ] No console errors
- [ ] Performance is acceptable

---

## 🐛 Common Issues & Solutions

### Issue: "Notification bell not appearing"
**Solution:**
- Check that you're logged in
- Verify component is imported in dashboard
- Check browser console for errors
- Verify notification_preferences table exists

### Issue: "Achievements not showing"
**Solution:**
- Verify achievement_definitions table has data
- Check migration ran successfully
- Check browser console for errors
- Verify RLS policies allow read access

### Issue: "Goals not saving"
**Solution:**
- Check form validation errors
- Verify goals table exists
- Check RLS policies
- Look for errors in browser console

### Issue: "Streak not updating"
**Solution:**
- Verify user_streaks table exists
- Check log_user_activity function exists
- Verify activity is being logged
- Check date calculations

### Issue: "TypeScript errors"
**Solution:**
- Run: `npm run generate:types`
- Restart TypeScript server in IDE
- Verify migrations ran
- Check types file is updated

---

## 📝 Reporting Issues

When reporting issues, include:

1. **What you were testing:** (e.g., "Creating a goal")
2. **Steps to reproduce:** (exact steps you took)
3. **Expected behavior:** (what should have happened)
4. **Actual behavior:** (what actually happened)
5. **Screenshots:** (if applicable)
6. **Browser console errors:** (copy/paste any red errors)
7. **Browser/OS:** (e.g., "Chrome 120 on macOS")

---

## 🎓 Tips for Novice Testers

1. **Take your time:** Don't rush through tests
2. **Take screenshots:** Visual evidence is helpful
3. **Read error messages:** They often tell you what's wrong
4. **Test one thing at a time:** Don't try to test everything at once
5. **Ask questions:** If something is unclear, ask
6. **Document everything:** Write down what you see
7. **Test in different browsers:** Chrome, Firefox, Safari
8. **Test on mobile:** If possible, test on phone/tablet
9. **Check both roles:** Test as both student and supervisor
10. **Have fun:** Testing can be like solving puzzles!

---

## 📚 Additional Resources

- **Playwright Documentation:** https://playwright.dev
- **Supabase SQL Editor:** https://supabase.com/dashboard
- **Browser DevTools Guide:** https://developer.chrome.com/docs/devtools

---

**Last Updated:** 2025-12-29
**Version:** 1.0

