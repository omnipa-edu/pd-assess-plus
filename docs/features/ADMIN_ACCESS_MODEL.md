# Admin Access Model - Complete Guide

## Overview

Admins now have **full access to all supervisor-level content** across all institutions. This includes coaching corner content, user management, and all administrative functions.

---

## 🔐 Admin Capabilities

### Coaching Corner (Just Implemented)

Admins can:
- ✅ **View ALL coaching content** (admin-scoped AND supervisor-scoped)
- ✅ **Create content at ANY level:**
  - Organization-wide (admin scope)
  - Supervisor-level (supervisor scope)
- ✅ **Edit ALL coaching items** (even those created by supervisors)
- ✅ **Delete ALL coaching items** (regardless of creator)
- ✅ **Manage supervisor-specific scopes** (assign content to specific supervisors)
- ✅ **Override pinning** (can pin/unpin any item)
- ✅ **Schedule content** for any timeframe

### Institution & Department Management

Admins can:
- ✅ Create, edit, delete institutions
- ✅ Create, edit, delete departments
- ✅ Assign departments to any institution
- ✅ View all departments across all institutions

### User & Role Management

Admins can:
- ✅ View all users across all institutions
- ✅ Assign/remove any role (student, supervisor, admin)
- ✅ Manage supervisor assignments
- ✅ View all role requests
- ✅ Approve/deny role changes

### Content Management

Admins can:
- ✅ Import/edit/delete EPAs for any specialty
- ✅ Manage all specialties
- ✅ Create promo codes
- ✅ View audit logs for all actions

---

## 🎯 Content Level System

### Two-Tier Content Hierarchy

#### 1. **Admin-Scoped Content** (Organization-wide)
- Created by admins
- Visible to ALL users in the organization
- Appears across all institutions
- Example: "Welcome to WBA Tracker!" for all new users

#### 2. **Supervisor-Scoped Content** (Supervisor-level)
- Created by supervisors OR admins
- Scoped to supervisor's learners
- Can be limited to specific supervisors via `coaching_corner_scope`
- Example: "Tips for Cardiology Rotation" from Dr. Smith

### Admin Privileges

**Admins can create content at BOTH levels:**
```
Admin creates content:
  └─ Choose "Organization-wide (Admin)" → Visible to everyone
  └─ Choose "Supervisor-level" → Scoped to specific supervisors/learners
```

**Supervisors can only create supervisor-level content:**
```
Supervisor creates content:
  └─ Always "Supervisor-level"
  └─ Visible to their assigned learners
```

---

## 📋 Database Policies

### Coaching Corner Access

```sql
-- Admins can create content at ANY scope
CREATE POLICY "Admins can create any scoped coaching"
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Admins can update ALL items
CREATE POLICY "Admins can update all coaching"
  USING (has_role(auth.uid(), 'admin'));

-- Admins can delete ALL items
CREATE POLICY "Admins can delete all coaching"
  USING (has_role(auth.uid(), 'admin'));

-- Admins can view ALL items (including inactive/scheduled)
CREATE POLICY "Admins can view all coaching"
  USING (has_role(auth.uid(), 'admin'));
```

### Supervisor Policies (Restricted)

```sql
-- Supervisors can ONLY create supervisor-scoped content
CREATE POLICY "Supervisors can create supervisor-scoped coaching"
  WITH CHECK (
    has_role(auth.uid(), 'supervisor')
    AND role_scope = 'supervisor'
    AND created_by = auth.uid()
  );

-- Supervisors can ONLY update their own items
CREATE POLICY "Supervisors can update their own coaching"
  USING (created_by = auth.uid());

-- Supervisors can ONLY delete their own items
CREATE POLICY "Supervisors can delete their own coaching"
  USING (created_by = auth.uid());
```

---

## 🚀 How to Apply Changes

### Step 1: Apply the Admin Access Migration

In **Supabase Dashboard** → **SQL Editor**, run:

```sql
-- Copy entire contents from:
-- supabase/migrations/20251105_coaching_admin_access.sql
```

This migration:
- ✅ Removes restrictive policies
- ✅ Adds admin-level access to all content
- ✅ Maintains supervisor restrictions
- ✅ Allows admins to create at any scope

### Step 2: Verify Access

After applying, test:

```sql
-- As admin, you should be able to:
-- 1. View all coaching content
SELECT * FROM coaching_corner;

-- 2. Create admin-scoped content
INSERT INTO coaching_corner (created_by, role_scope, audience, title, content_type, body, pinned)
VALUES (auth.uid(), 'admin', 'all', 'Test Admin Content', 'text', 'This is org-wide', true);

-- 3. Create supervisor-scoped content (as admin!)
INSERT INTO coaching_corner (created_by, role_scope, audience, title, content_type, body)
VALUES (auth.uid(), 'supervisor', 'learners', 'Test Supervisor Content', 'text', 'This is supervisor-level');

-- 4. Update any item (even if created by supervisor)
UPDATE coaching_corner SET title = 'Updated Title' WHERE id = 'any-coaching-id';

-- 5. Delete any item
DELETE FROM coaching_corner WHERE id = 'any-coaching-id';
```

---

## 🎨 Admin UI Features

### In the Coaching Editor (Admin Only)

When creating/editing content, admins see:

```
┌─────────────────────────────────────┐
│ Content Level                       │
│ ┌─────────────────────────────────┐ │
│ │ Organization-wide (Admin)     ▼ │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Options:                            │
│ • Organization-wide (Admin)         │
│ • Supervisor-level                  │
└─────────────────────────────────────┘
```

**Organization-wide:**
- Visible to all users
- Shows on all dashboards
- One pinned item across entire org

**Supervisor-level:**
- Admin can create on behalf of supervisors
- Can assign to specific supervisors
- Appears to supervisor's learners

### Management Dashboard Features

At `/admin/coaching`, admins can:
- 📊 View ALL coaching items (admin + supervisor created)
- ✏️ Edit ANY item (change scope, content, audience)
- 🗑️ Delete ANY item
- 📌 Pin/unpin ANY item (system-wide pinning)
- 📅 Schedule/reschedule ANY item
- 🎯 Change audience targeting on any item

---

## 🏢 Multi-Institution Support (Optional)

Currently coaching content is **system-wide** (not institution-specific).

### To Add Institution-Level Scoping:

If you want coaching content to be institution-specific, uncomment this section in the migration:

```sql
ALTER TABLE public.coaching_corner 
ADD COLUMN IF NOT EXISTS institution_id UUID REFERENCES public.institutions(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_coaching_institution 
ON public.coaching_corner(institution_id);
```

Then update the UI to add institution selector in the editor form.

**Benefits:**
- Each institution can have its own coaching content
- Admins can still see/manage all institutions' content
- Content doesn't leak across institutions

**Trade-offs:**
- More complex filtering
- Need to select institution when creating content
- Less content reuse across institutions

---

## 📊 Access Matrix

| Action | Admin | Supervisor | Student |
|--------|-------|------------|---------|
| View all coaching items | ✅ All | ❌ Own only | ❌ Active only |
| Create admin-scoped | ✅ Yes | ❌ No | ❌ No |
| Create supervisor-scoped | ✅ Yes | ✅ Yes | ❌ No |
| Edit any item | ✅ Yes | ❌ Own only | ❌ No |
| Delete any item | ✅ Yes | ❌ Own only | ❌ No |
| Pin any item | ✅ Yes | ✅ Own only | ❌ No |
| View inactive/scheduled | ✅ Yes | ✅ Own only | ❌ No |
| Manage scopes | ✅ All scopes | ✅ Own scopes | ❌ No |
| Assign to supervisors | ✅ Yes | ❌ No | ❌ No |

---

## 🔄 Workflow Examples

### Example 1: Admin Creates Organization-wide Motivation

```
1. Admin logs in → Goes to /admin/coaching
2. Clicks "Create New"
3. Fills form:
   - Title: "Welcome to WBA Tracker!"
   - Content Type: Text
   - Content: "You're part of an amazing community..."
   - Content Level: Organization-wide (Admin)
   - Audience: All users
   - Pin as primary: ✓
4. Clicks "Publish"
5. ALL users see this on their dashboard
```

### Example 2: Admin Creates Supervisor-Level Content

```
1. Admin goes to /admin/coaching
2. Creates new coaching item:
   - Title: "Feedback Best Practices"
   - Content Type: YouTube
   - Video URL: https://youtube.com/watch?v=...
   - Content Level: Supervisor-level
   - Audience: Supervisors only
3. Publishes
4. Only supervisors see this content
5. Can optionally limit to specific supervisors
```

### Example 3: Admin Edits Supervisor's Content

```
1. Supervisor creates coaching item
2. Admin sees it in /admin/coaching list
3. Admin clicks "Edit"
4. Admin can:
   - Change the title/content
   - Change audience
   - Change from supervisor-scoped to admin-scoped
   - Pin it
   - Reschedule it
5. Saves changes
6. Changes apply immediately
```

---

## 🛡️ Security Notes

### What's Protected

- ✅ Admins can't be locked out (super user)
- ✅ Supervisors can't edit other supervisors' content
- ✅ Students can't create/edit content
- ✅ RLS enforced at database level
- ✅ Frontend guards prevent unauthorized access

### Audit Trail

All admin actions on coaching content are visible in:
- Database `audit_logs` table (if enabled)
- `coaching_corner.updated_at` timestamp
- `created_by` field shows original creator

---

## ✅ Summary

### What Changed

**Before:**
- Admins could only create admin-scoped content
- Admins couldn't edit supervisor-created content easily
- Supervisor content was isolated

**After:**
- ✅ Admins have **full access to ALL content** at all levels
- ✅ Admins can **create content at any scope** (admin OR supervisor)
- ✅ Admins can **edit/delete ANY coaching item** (regardless of creator)
- ✅ Admins can **manage supervisor-specific targeting**
- ✅ Supervisors maintain control of their own content
- ✅ Clear UI showing content level when creating

### Apply the Changes

Run this migration in Supabase:
```
supabase/migrations/20251105_coaching_admin_access.sql
```

Then refresh your app at `http://localhost:8080/admin/coaching` and test creating content at both levels!

---

**Result:** Admins now have **complete oversight and management** of coaching content at all supervisor levels across all institutions! 🎉

