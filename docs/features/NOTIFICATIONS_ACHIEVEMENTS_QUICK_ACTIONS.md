# Notifications, Achievements, and Quick Actions Implementation

## Overview

This document describes the implementation of three major engagement features:
1. **Notifications System** - In-app and email notifications
2. **Achievements & Badges** - Gamification system with unlockable achievements
3. **Quick Actions** - Floating Action Button, keyboard shortcuts, and command palette

---

## 🎯 Notifications System

### Database Schema

**Tables:**
- `notifications` - Stores in-app notifications
- `notification_preferences` - User preferences for email and in-app notifications

**Key Features:**
- Support for 8 notification types (assessment_received, milestone_achieved, etc.)
- Priority levels (low, medium, high, urgent)
- Action URLs and labels for clickable notifications
- Read/unread status tracking
- Metadata field for flexible data storage

### Components

**`NotificationCenter`** (`src/components/notifications/NotificationCenter.tsx`)
- Bell icon in header with unread count badge
- Popover dropdown with notification list
- Grouped by read/unread status
- Click to mark as read and navigate
- "Mark all as read" functionality

### Hooks

**`useNotifications()`** (`src/hooks/useNotifications.tsx`)
- Fetches user notifications
- Tracks unread count
- Mark as read / mark all as read
- Manage notification preferences

**`useCreateNotification()`**
- Create notifications programmatically
- Used by other parts of the app to trigger notifications

### Integration

The `NotificationCenter` component is integrated into:
- Supervisor Dashboard header
- Student Dashboard header

---

## 🏆 Achievements & Badges System

### Database Schema

**Tables:**
- `achievement_definitions` - All available achievements (seeded with 15+ achievements)
- `user_achievements` - Unlocked achievements per user
- `achievement_progress` - Progress tracking toward achievements

**Achievement Categories:**
- First Steps (first_assessment, profile_complete)
- Consistency (streak_3_days, streak_7_days, streak_30_days)
- Milestones (assessments_10, assessments_25, assessments_50, assessments_100)
- Quality (smart_feedback_10, high_quality_feedback)
- Engagement (weekly_active, coaching_viewer)
- Excellence (oscore_improvement, top_performer)

**Rarity Levels:**
- Common, Uncommon, Rare, Epic, Legendary

### Components

**`AchievementBadge`** (`src/components/achievements/AchievementBadge.tsx`)
- Displays achievement badge with icon/emoji
- Shows rarity-based colors and gradients
- Locked/unlocked states
- Multiple sizes (sm, md, lg)

**`AchievementUnlockModal`** (`src/components/achievements/AchievementUnlockModal.tsx`)
- Celebration modal when achievement is unlocked
- Confetti animation (using framer-motion)
- Shows achievement details

**`AchievementDisplay`** (`src/components/achievements/AchievementDisplay.tsx`)
- Card showing recent achievements
- "View All" dialog with tabs (All/Unlocked/Locked)
- Progress tracking display

### Hooks

**`useAchievements()`** (`src/hooks/useAchievements.tsx`)
- Fetches user achievements
- Separates unlocked/locked achievements
- Get achievement by code
- Check unlock status
- Get progress for achievements

**`useUpdateAchievementProgress()`**
- Update progress toward an achievement
- Automatically unlocks when target is reached
- Returns true if achievement was unlocked

**`useUnlockAchievement()`**
- Directly unlock an achievement
- Used for one-time achievements

### Integration

The `AchievementDisplay` component is integrated into:
- Supervisor Dashboard
- Student Dashboard

### Achievement Triggers

**`achievement-triggers.ts`** (`src/lib/achievement-triggers.ts`)
Utility functions to trigger achievements and notifications:
- `triggerAssessmentCompleted()` - Called after assessment submission
- `triggerProfileCompleted()` - Called when profile is completed
- `updateAchievementProgress()` - Update progress for any achievement
- `createNotification()` - Create notifications programmatically

---

## ⚡ Quick Actions

### Components

**`FloatingActionButton`** (`src/components/quick-actions/FloatingActionButton.tsx`)
- Floating button in bottom-right corner (supervisors only)
- Expands to show quick action buttons:
  - EPA Observation
  - Direct Observation
  - Narrative Assessment
- Smooth animations and transitions

**`CommandPalette`** (`src/components/quick-actions/CommandPalette.tsx`)
- Command palette accessible via `Cmd/Ctrl + K`
- Searchable list of commands
- Grouped by category (Navigation, Quick Actions, Settings)
- Keyboard shortcuts displayed
- Role-aware (shows different commands for students/supervisors/admins)

**`KeyboardShortcuts`** (`src/components/quick-actions/KeyboardShortcuts.tsx`)
- Global keyboard shortcuts handler
- Shortcuts:
  - `Cmd/Ctrl + K` - Open command palette
  - `Cmd/Ctrl + N` - New Assessment (supervisors)
  - `Cmd/Ctrl + D` - Dashboard
  - `Cmd/Ctrl + S` - Student Dashboard (students)
  - `Cmd/Ctrl + V` - Supervisor Dashboard (supervisors)
  - `Cmd/Ctrl + A` - Admin Dashboard (admins)
  - `Escape` - Close modals

### Integration

- `CommandPalette` and `KeyboardShortcuts` are added to `App.tsx` (global)
- `FloatingActionButton` is added to Supervisor Dashboard

---

## 📋 Usage Examples

### Creating a Notification

```typescript
import { useCreateNotification } from '@/hooks/useNotifications';

const createNotification = useCreateNotification();

await createNotification.mutateAsync({
  userId: user.id,
  type: 'milestone_achieved',
  title: 'Achievement Unlocked!',
  message: 'You\'ve reached a new milestone!',
  priority: 'high',
  actionUrl: '/student',
  actionLabel: 'View Achievements',
});
```

### Updating Achievement Progress

```typescript
import { useUpdateAchievementProgress } from '@/hooks/useAchievements';

const updateProgress = useUpdateAchievementProgress();

const unlocked = await updateProgress.mutateAsync({
  achievementCode: 'assessments_10',
  increment: 1,
});

if (unlocked) {
  // Achievement was unlocked - show celebration modal
}
```

### Triggering Assessment Completion

```typescript
import { triggerAssessmentCompleted } from '@/lib/achievement-triggers';

// After successful assessment submission
await triggerAssessmentCompleted(userId, 'epa');
```

---

## 🚀 Next Steps

### Recommended Integrations

1. **Add triggers to assessment forms:**
   - In `EPAObservationForm.tsx`, after successful submission, call `triggerAssessmentCompleted()`
   - Also trigger `triggerNewAssessmentReceived()` for the student

2. **Add triggers to profile completion:**
   - In profile update handlers, check if profile is complete and call `triggerProfileCompleted()`

3. **Add streak tracking:**
   - Create a daily job/function to check for assessment streaks
   - Update streak achievements accordingly

4. **Add email notifications:**
   - Set up Supabase Edge Function or external service to send emails
   - Check `notification_preferences` table for user preferences

5. **Add weekly summaries:**
   - Create a scheduled function to generate weekly summary notifications
   - Include progress highlights and achievements unlocked

---

## 🎨 Customization

### Adding New Achievements

1. Insert into `achievement_definitions` table:
```sql
INSERT INTO public.achievement_definitions (code, name, description, category, rarity, icon, color, criteria) 
VALUES (
  'new_achievement',
  'New Achievement',
  'Description here',
  'milestone',
  'common',
  '🎯',
  '#3B82F6',
  '{"type": "count", "target": 5, "entity": "assessments"}'
);
```

2. Update progress in your code:
```typescript
await updateAchievementProgress(userId, 'new_achievement', 1);
```

### Adding New Notification Types

1. Add to `notification_type` enum in migration (if needed)
2. Use the new type when creating notifications:
```typescript
await createNotification({
  userId: user.id,
  type: 'new_notification_type',
  // ...
});
```

---

## 📊 Database Functions

### Notifications
- `create_notification()` - Create a notification
- `mark_notification_read()` - Mark single notification as read
- `mark_all_notifications_read()` - Mark all as read
- `get_unread_notification_count()` - Get unread count

### Achievements
- `unlock_achievement()` - Unlock an achievement
- `update_achievement_progress()` - Update progress and auto-unlock
- `get_user_achievements()` - Get all achievements with unlock status

---

## ✅ Testing Checklist

- [ ] Notifications appear in notification center
- [ ] Unread count badge updates correctly
- [ ] Mark as read functionality works
- [ ] Achievement badges display correctly
- [ ] Achievement unlock modal shows with animation
- [ ] Command palette opens with Cmd/Ctrl + K
- [ ] Keyboard shortcuts work correctly
- [ ] Floating action button appears for supervisors
- [ ] Quick actions navigate correctly
- [ ] Achievement progress updates correctly
- [ ] Notifications are created on key events

---

## 🔧 Troubleshooting

### Notifications not appearing
- Check that `notification_preferences` record exists for user
- Verify RLS policies allow user to read their notifications
- Check browser console for errors

### Achievements not unlocking
- Verify achievement definition exists and is active
- Check that progress is being updated correctly
- Verify target value in criteria matches progress updates

### Command palette not opening
- Check that `KeyboardShortcuts` component is in App.tsx
- Verify no other components are capturing Cmd/Ctrl + K
- Check browser console for errors

---

## 📝 Notes

- All components are fully typed with TypeScript
- RLS policies ensure users can only see their own data
- Achievements are automatically seeded in the migration
- Notification preferences are auto-created on first access
- All animations use framer-motion (already in dependencies)

