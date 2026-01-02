# Coaching Corner Feeds Implementation

## Overview

The Coaching Corner now includes two separate feeds with pre-seeded content:
- **Learner Feed**: 8 text items + 4 video items (12 total)
- **Supervisor Feed**: 7 text items + 4 video items (11 total)

All videos are embedded using YouTube's privacy-enhanced embed (`youtube-nocookie.com`) in responsive 16:9 containers.

## Features

### Time-Based Rotation
- **Strategy**: Deterministic selection based on current date + user role
- **Behavior**: One item per day per role (same item shown all day for all users of that role)
- **Priority**: Pinned items always appear first, then rotated items
- **Implementation**: Uses hash(date + role) mod feed.length

### Video Embeds
- YouTube videos are embedded using `youtube-nocookie.com` for privacy
- Responsive 16:9 aspect ratio container
- Fallback to "Watch on YouTube" link if embed fails
- Body text (caption) shown above video for context

### Content Display
- Body text is shown for both text and video items
- Long text items (>300 chars) have "Read more" expand/collapse
- Video items show caption above the embedded player
- Dismissed items are filtered out per user

## Database

### Migration
Run the migration to seed the database:
```sql
-- File: supabase/migrations/20251115_coaching_corner_seed.sql
```

This migration:
- Finds an admin user (or first user as fallback)
- Inserts all learner items with `audience='learners'`
- Inserts all supervisor items with `audience='supervisors'`
- Sets `role_scope='admin'` for all seed items

### Seed Data
- **TypeScript**: `src/lib/coaching/seed-data.ts` (reference data)
- **SQL**: Migration file contains JSONB seed data

## Usage

### For Learners
- Navigate to `/student` dashboard
- Coaching Corner card appears with learner-appropriate content
- Content rotates daily (same item for all learners on same day)

### For Supervisors
- Navigate to `/supervisor` dashboard
- Coaching Corner card appears with supervisor-appropriate content
- Content rotates daily (same item for all supervisors on same day)

### Dismissing Items
- Users can dismiss items via the X button
- Dismissed items are filtered out from future loads
- Dismissals are stored per-user in `coaching_corner_dismissals`

## Content List

### Learner Feed
**Text Items:**
1. Getting the Most From Feedback
2. Asking for Better Feedback
3. Turn Feedback Into Action
4. Understanding Your O-SCORE
5. Communicating Your Clinical Reasoning
6. Managing Uncertainty Safely
7. Self-Assessment That Helps You Grow
8. Building Clinical Confidence

**Video Items:**
1. Reflective Practice for Medical Students
2. Introduction to Clinical Reasoning
3. Clinical Decision Making – Webinar
4. Reflective Practice – General Overview

### Supervisor Feed
**Text Items:**
1. High-Impact Feedback in Under 60 Seconds
2. The Power of One Specific Suggestion
3. Creating Psychological Safety for Feedback
4. Calibrating Entrustment
5. Coaching Clinical Reasoning
6. Supporting a Struggling Learner
7. Closing the Feedback Loop

**Video Items:**
1. How to Give Effective Feedback in Academic Medicine
2. Strategies for Providing Effective Feedback in Medical Education
3. Creating a Culture of Feedback: Medical Educators as Coaches
4. Towards a Coaching Culture in Medical Education

## Technical Details

### Components
- `CoachingCornerCard`: Main display component
- `CoachingEmbed`: Video embed with YouTube/Instagram support
- `useCoachingCorner`: Hook for fetching items
- `usePrimaryCoachingItem`: Hook with rotation logic

### Rotation Algorithm
```typescript
const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
const role = roles.includes('supervisor') ? 'supervisor' : 'learner';
const seed = `${today}-${role}`;
const index = simpleHash(seed) % items.length;
```

### Video Embed
- Uses `AspectBox` component for 16:9 responsive container
- YouTube URLs parsed to extract video ID
- Embedded via `https://www.youtube-nocookie.com/embed/{id}`
- Includes proper iframe attributes for privacy and accessibility

## Future Enhancements

- Admin UI to manage seed content
- Custom rotation strategies (random, sequential, etc.)
- Analytics on which items are most viewed/dismissed
- Scheduled content (start_at/end_at already supported)

