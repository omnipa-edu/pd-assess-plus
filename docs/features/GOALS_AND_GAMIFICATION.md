# Goals and Gamification System

## Overview

This document describes the implementation of the goals and gamification system, including:
1. **Goal Setting & Tracking** - User-defined goals with progress tracking
2. **Streak Tracking** - Daily activity streaks with visualization
3. **Enhanced Gamification** - Integration with achievements and notifications

---

## 🎯 Goals System

### Database Schema

**Tables:**
- `goals` - User-defined goals with targets and progress
- `user_activity_log` - Daily activity log for streak calculation

**Goal Types:**
- `assessment_count` - Complete X assessments
- `oscore_target` - Reach target O-score
- `streak_days` - Maintain X-day streak
- `epa_readiness` - Achieve X% readiness for EPA
- `feedback_quality` - Improve feedback quality score
- `weekly_active` - Be active X weeks in a row
- `custom` - Custom goal type

**Goal Status:**
- `active` - Currently being tracked
- `completed` - Target reached
- `paused` - Temporarily paused
- `cancelled` - Goal cancelled

**Goal Periods:**
- `daily`, `weekly`, `monthly`, `quarterly`, `yearly`, `custom`

### Components

**`GoalCard`** (`src/components/goals/GoalCard.tsx`)
- Displays goal with progress bar
- Shows current/target values
- Days remaining indicator
- Edit/delete actions
- Status badges

**`GoalForm`** (`src/components/goals/GoalForm.tsx`)
- Create/edit goal dialog
- Form validation with Zod
- Type-specific defaults
- Date range selection

**`GoalsDisplay`** (`src/components/goals/GoalsDisplay.tsx`)
- Lists all goals
- Tabs for Active/Completed
- Empty states
- Create new goal button

### Hooks

**`useGoals()`** (`src/hooks/useGoals.tsx`)
- Fetch all goals
- Create/update/delete goals
- Update goal progress
- Filter by status

### Database Functions

- `update_goal_progress()` - Updates progress and marks as completed if target reached
- `get_goal_progress()` - Returns goal progress as percentage

---

## 🔥 Streak Tracking System

### Database Schema

**Tables:**
- `user_streaks` - Current and longest streaks per activity type
- `user_activity_log` - Daily activity log (shared with goals)

**Streak Types:**
- `assessment` - Assessment completion streak
- `login` - Daily login streak
- `feedback` - Feedback submission streak
- Custom types can be added

### Components

**`StreakDisplay`** (`src/components/gamification/StreakDisplay.tsx`)
- Shows current streak with flame icon
- Displays longest streak
- Motivational messages based on streak length
- Gradient background styling

### Hooks

**`useStreaks()`** (`src/hooks/useStreaks.tsx`)
- Fetch all streaks
- Get specific streak by type
- Log activity (updates streak automatically)

### Database Functions

- `log_user_activity()` - Logs activity and updates streak counters
- `get_user_streak()` - Returns current streak for activity type

### Streak Logic

1. **Activity Logged**: When user completes an activity (e.g., assessment)
2. **Check Yesterday**: If activity happened yesterday, continue streak
3. **Check Break**: If last activity was >1 day ago, reset streak
4. **Update Counters**: Increment current streak, update longest if needed

---

## 🎮 Gamification Dashboard

**`GamificationDashboard`** (`src/components/gamification/GamificationDashboard.tsx`)
- Combines streaks, achievements, and goals
- Single view for all gamification elements
- Can be used as standalone page or integrated into dashboards

---

## 🔗 Integration

### Dashboard Integration

**Student Dashboard:**
- Streak display (top row)
- Achievement display (top row)
- Goals display (full width below)

**Supervisor Dashboard:**
- Streak display (top row)
- Achievement display (top row)
- Goals display (full width below)

### Automatic Updates

**Assessment Completion:**
When an assessment is submitted:
1. Logs activity (updates streak)
2. Updates assessment count goals
3. Updates achievement progress
4. Creates notifications for milestones

**Functions Called:**
- `logActivityAndUpdateStreaks()` - Updates streak
- `updateAssessmentGoals()` - Updates all assessment_count goals
- `triggerAssessmentCompleted()` - Updates achievements

---

## 📋 Usage Examples

### Creating a Goal

```typescript
import { useGoals } from '@/hooks/useGoals';

const { createGoal } = useGoals();

await createGoal({
  title: 'Complete 10 assessments this month',
  type: 'assessment_count',
  target_value: 10,
  unit: 'assessments',
  period: 'monthly',
  end_date: '2025-12-31',
});
```

### Logging Activity (Updates Streak)

```typescript
import { logActivityAndUpdateStreaks } from '@/lib/achievement-triggers';

const newStreak = await logActivityAndUpdateStreaks(userId, 'assessment');
console.log(`New streak: ${newStreak} days`);
```

### Updating Goal Progress

```typescript
import { useGoals } from '@/hooks/useGoals';

const { updateProgress } = useGoals();

const completed = await updateProgress({ 
  goalId: goal.id, 
  increment: 1 
});

if (completed) {
  // Goal was completed - notification already sent
}
```

---

## 🎨 Customization

### Adding New Goal Types

1. Add to `goal_type` enum in migration:
```sql
ALTER TYPE goal_type ADD VALUE 'new_type';
```

2. Update `GoalForm` component to include new type in select

3. Add logic to update progress for new type in `achievement-triggers.ts`

### Adding New Streak Types

1. Log activity with new type:
```typescript
await logActivityAndUpdateStreaks(userId, 'new_activity_type');
```

2. The system automatically creates streak record if it doesn't exist

### Custom Goal Progress Updates

For custom goal types, manually update progress:
```typescript
const { updateProgress } = useGoals();
await updateProgress({ goalId: goal.id, increment: customValue });
```

---

## 🚀 Next Steps

### Recommended Enhancements

1. **Goal Templates**: Pre-defined goal templates for common scenarios
2. **Goal Sharing**: Share goals with supervisors/peers
3. **Goal Reminders**: Notifications when goals are at risk
4. **Streak Freeze**: Allow users to "freeze" streak for one day
5. **Leaderboards**: Optional leaderboards for streaks (anonymized)
6. **Goal Analytics**: Charts showing goal completion trends
7. **Smart Goals**: AI-suggested goals based on user activity

---

## ✅ Testing Checklist

- [ ] Create a new goal
- [ ] Edit an existing goal
- [ ] Delete a goal
- [ ] Goal progress updates correctly
- [ ] Goal completion triggers notification
- [ ] Streak displays correctly
- [ ] Streak updates on activity
- [ ] Streak resets after break
- [ ] Longest streak tracks correctly
- [ ] Activity log prevents duplicates
- [ ] Goals appear in dashboard
- [ ] Completed goals move to completed tab

---

## 🔧 Troubleshooting

### Goals not updating
- Check that `update_goal_progress()` is being called
- Verify goal status is 'active'
- Check RLS policies allow updates

### Streak not incrementing
- Verify `log_user_activity()` is being called
- Check activity_date is today
- Ensure no duplicate entries in activity_log

### Goal completion notification not sent
- Check notification preferences
- Verify goal was actually completed (status = 'completed')
- Check browser console for errors

---

## 📝 Notes

- All components are fully typed with TypeScript
- RLS policies ensure users can only see their own data
- Streak calculation happens server-side for accuracy
- Goals support flexible metadata for type-specific data
- Activity log uses unique constraint to prevent duplicates
- All gamification features work together seamlessly

