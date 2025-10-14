# Role Management System

## 🎯 Overview

This document explains the complete role management system for WBA Tracker, including role assignment, permissions, and administrative controls.

---

## 👥 User Roles

The system supports three distinct user roles:

### **1. Student / Resident** 🎓
**Purpose:** Medical students or residents being assessed

**Permissions:**
- ✅ View their own assessments
- ✅ View their progress and trends
- ✅ Export their own data
- ✅ Update their profile
- ❌ Cannot create assessments for others
- ❌ Cannot view other students' data
- ❌ Cannot access admin functions

**Default:** All new users are assigned this role by default

### **2. Supervisor / Faculty** 👨‍⚕️
**Purpose:** Healthcare educators who assess students

**Permissions:**
- ✅ Everything a Student can do, plus:
- ✅ Create EPA observations
- ✅ Create direct observations
- ✅ Write narrative assessments
- ✅ View all students and their assessments
- ✅ Provide feedback and ratings
- ❌ Cannot assign roles
- ❌ Cannot access admin-only functions

### **3. Program Administrator** 🛡️
**Purpose:** Program directors and administrators

**Permissions:**
- ✅ Everything a Supervisor can do, plus:
- ✅ View all users in the system
- ✅ Assign and remove user roles
- ✅ Approve/reject role requests
- ✅ Access system analytics
- ✅ Manage program settings
- ✅ Export all data
- ⚠️ Cannot remove the last admin (safety feature)

---

## 🔄 How Role Assignment Works

### **Method 1: During Sign-Up (Recommended)**

Users select their role when creating an account:

1. **User signs up** at `/auth`
2. **Selects role** from three options:
   - Student / Resident
   - Supervisor / Faculty
   - Program Administrator
3. **Role is assigned automatically** via database trigger
4. **User is directed** to appropriate dashboard

**Code:**
```typescript
// In Auth page signup
const { error } = await signUp(email, password, fullName, selectedRole);
```

**Database:**
```sql
-- Trigger automatically creates profile and assigns role
CREATE FUNCTION handle_new_user()
  -- Reads role from raw_user_meta_data->>'role'
  -- Defaults to 'student' if not specified
```

---

### **Method 2: Admin Assignment (Post-Registration)**

Admins can assign additional roles to existing users:

1. **Admin logs in** to `/admin`
2. **Navigates to "User Roles" tab**
3. **Selects user** from list
4. **Assigns role** via dropdown
5. **Role is immediately active**

**Code:**
```typescript
import { assignUserRole } from '@/lib/roleManagement';

await assignUserRole(userId, 'supervisor');
// User now has supervisor role
```

---

### **Method 3: Role Request System (Approval Workflow)**

Users can request additional roles that require admin approval:

1. **User submits request** for elevated role
2. **Provides justification** (optional)
3. **Admin reviews** in "Role Requests" tab
4. **Admin approves or rejects** request
5. **User is notified** of decision

**Code:**
```typescript
import { submitRoleRequest } from '@/lib/roleManagement';

await submitRoleRequest('supervisor', 'I am a faculty member at...');
```

---

## 🛠️ Implementation Details

### **Database Schema**

#### `user_roles` Table
```sql
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role)  -- Users can have multiple roles
);
```

#### `role_requests` Table
```sql
CREATE TABLE public.role_requests (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  requested_role app_role NOT NULL,
  justification TEXT,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

### **Database Functions**

#### 1. `handle_new_user()` - Auto-assign Role on Signup
```sql
CREATE FUNCTION handle_new_user()
RETURNS TRIGGER
AS $$
BEGIN
  -- Create profile
  INSERT INTO profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  
  -- Assign role from metadata or default to 'student'
  INSERT INTO user_roles (user_id, role)
  VALUES (NEW.id, COALESCE(
    (NEW.raw_user_meta_data->>'role')::app_role,
    'student'::app_role
  ));
  
  RETURN NEW;
END;
$$;
```

#### 2. `assign_user_role()` - Admin Function
```sql
CREATE FUNCTION assign_user_role(target_user_id UUID, new_role app_role)
RETURNS VOID
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;
  
  INSERT INTO user_roles (user_id, role)
  VALUES (target_user_id, new_role)
  ON CONFLICT DO NOTHING;
END;
$$;
```

#### 3. `remove_user_role()` - Admin Function
```sql
CREATE FUNCTION remove_user_role(target_user_id UUID, role_to_remove app_role)
RETURNS VOID
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;
  
  -- Prevent removing last admin
  IF role_to_remove = 'admin' THEN
    IF (SELECT COUNT(*) FROM user_roles WHERE role = 'admin') <= 1 THEN
      RAISE EXCEPTION 'Cannot remove the last admin';
    END IF;
  END IF;
  
  DELETE FROM user_roles
  WHERE user_id = target_user_id AND role = role_to_remove;
END;
$$;
```

#### 4. `get_users_with_roles()` - List All Users
```sql
CREATE FUNCTION get_users_with_roles()
RETURNS TABLE (user_id UUID, email TEXT, full_name TEXT, roles TEXT[])
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;
  
  RETURN QUERY
  SELECT p.id, p.email, p.full_name,
         ARRAY_AGG(ur.role::TEXT) as roles
  FROM profiles p
  LEFT JOIN user_roles ur ON p.id = ur.user_id
  GROUP BY p.id
  ORDER BY p.created_at DESC;
END;
$$;
```

---

## 💻 Frontend Components

### **1. RoleSelector** (Signup Flow)
**File:** `src/components/auth/RoleSelector.tsx`

**Usage:**
```tsx
<RoleSelector
  value={selectedRole}
  onChange={(role) => setSelectedRole(role)}
  disabled={loading}
/>
```

**Features:**
- Radio group with visual role cards
- Icons and descriptions for each role
- Clear explanation of permissions
- Accessible with keyboard navigation

---

### **2. UserRoleManagement** (Admin Dashboard)
**File:** `src/components/admin/UserRoleManagement.tsx`

**Features:**
- View all users with current roles
- Assign new roles via dropdown
- Remove existing roles
- Real-time updates
- Loading states
- Error handling

**Usage:**
```tsx
// In AdminDashboard
<TabsContent value="users">
  <UserRoleManagement />
</TabsContent>
```

---

### **3. RoleRequestManagement** (Admin Dashboard)
**File:** `src/components/admin/RoleRequestManagement.tsx`

**Features:**
- View pending role requests
- See user justifications
- Approve or reject requests
- Automatic role assignment on approval
- Notification system

---

## 🔐 Security & Permissions

### **Row Level Security (RLS)**

All role operations are protected by RLS policies:

**Profiles:**
```sql
-- Users can view their own profile
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Supervisors/admins can view all profiles
CREATE POLICY "Supervisors and admins can view all profiles"
  ON profiles FOR SELECT
  USING (has_role(auth.uid(), 'supervisor') OR has_role(auth.uid(), 'admin'));
```

**User Roles:**
```sql
-- Users can view their own roles
CREATE POLICY "Users can view their own roles"
  ON user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Only admins can manage roles
CREATE POLICY "Admins can manage all roles"
  ON user_roles FOR ALL
  USING (has_role(auth.uid(), 'admin'));
```

---

## 📝 API Reference

### `roleManagement.ts` Functions

#### `assignUserRole(userId, role)`
**Purpose:** Assign a role to a user (admin only)

**Parameters:**
- `userId: string` - UUID of target user
- `role: 'student' | 'supervisor' | 'admin'` - Role to assign

**Returns:** `Promise<{ error: any }>`

**Example:**
```typescript
const { error } = await assignUserRole(
  '123e4567-e89b-12d3-a456-426614174000',
  'supervisor'
);

if (error) {
  console.error('Failed to assign role:', error.message);
}
```

---

#### `removeUserRole(userId, role)`
**Purpose:** Remove a role from a user (admin only)

**Parameters:**
- `userId: string` - UUID of target user
- `role: 'student' | 'supervisor' | 'admin'` - Role to remove

**Returns:** `Promise<{ error: any }>`

**Safety:** Cannot remove the last admin

---

#### `getUsersWithRoles()`
**Purpose:** Get all users with their assigned roles (admin only)

**Returns:** `Promise<{ data: UserWithRoles[], error: any }>`

**Example:**
```typescript
const { data, error } = await getUsersWithRoles();

if (data) {
  data.forEach(user => {
    console.log(`${user.full_name}: ${user.roles.join(', ')}`);
  });
}
```

---

#### `submitRoleRequest(requestedRole, justification)`
**Purpose:** Request an additional role (any authenticated user)

**Parameters:**
- `requestedRole: 'student' | 'supervisor' | 'admin'`
- `justification?: string` - Optional explanation

**Returns:** `Promise<{ error: any }>`

---

#### `approveRoleRequest(requestId, userId, role)`
**Purpose:** Approve a role request and assign the role (admin only)

---

#### `rejectRoleRequest(requestId)`
**Purpose:** Reject a role request (admin only)

---

## 🚀 Usage Scenarios

### **Scenario 1: New Medical Student**
1. Student visits `/auth`
2. Clicks "Create Account"
3. Fills in name, email, password
4. Selects "Student / Resident"
5. Signs up
6. ✅ Automatically assigned 'student' role
7. Redirected to Student Dashboard

---

### **Scenario 2: Faculty Member Needs Supervisor Access**
1. User signs up as Student (initial account)
2. Logs in, navigates to profile/settings
3. Clicks "Request Role" button
4. Selects "Supervisor" and provides justification:
   *"I am a faculty member who will be supervising residents in the ENT department."*
5. Admin reviews request in Admin Dashboard → Role Requests tab
6. Admin clicks "Approve"
7. ✅ User now has both 'student' and 'supervisor' roles
8. User can access Supervisor Dashboard

---

### **Scenario 3: Program Director Setup**
1. First user creates account with "Program Administrator"
2. ✅ Assigned 'admin' role automatically
3. Logs into Admin Dashboard
4. Navigates to "User Roles" tab
5. Assigns 'supervisor' role to faculty members
6. Assigns 'admin' role to co-directors

---

## ⚙️ Configuration

### **Default Role**

To change the default role from 'student':

**Option 1: Database (recommended)**
```sql
-- In handle_new_user() function
INSERT INTO user_roles (user_id, role)
VALUES (NEW.id, 'supervisor'::app_role);  -- Change default
```

**Option 2: Application**
```tsx
// In Auth.tsx
const [signupData, setSignupData] = useState({ 
  // ...
  role: 'supervisor' as const  // Change default
});
```

---

### **Hide Role Selector**

If you want all users to be 'student' by default without selection:

```tsx
// In Auth.tsx, remove:
<RoleSelector ... />

// Keep default role:
role: 'student'
```

Then use admin dashboard or role request system for elevating permissions.

---

## 🧪 Testing

### **Manual Testing**

**Test 1: Sign Up with Different Roles**
```bash
1. Go to /auth
2. Create account as Student
3. Verify redirected to /student
4. Sign out
5. Create another account as Supervisor
6. Verify has supervisor dashboard access
```

**Test 2: Admin Role Management**
```bash
1. Sign in as admin
2. Go to /admin
3. Click "User Roles" tab
4. Assign 'supervisor' to a student
5. That user should now see supervisor features
```

**Test 3: Role Request Workflow**
```bash
1. Sign in as student
2. Submit role request for 'supervisor'
3. Sign in as admin
4. Go to "Role Requests" tab
5. Approve the request
6. Student should now have supervisor access
```

---

### **Automated Tests**

**Unit Tests:**
```typescript
// src/lib/__tests__/roleManagement.test.ts
describe('Role Management', () => {
  it('should assign role to user', async () => {
    const { error } = await assignUserRole(userId, 'supervisor');
    expect(error).toBeNull();
  });
  
  it('should prevent non-admins from assigning roles', async () => {
    // Mock non-admin user
    const { error } = await assignUserRole(userId, 'admin');
    expect(error).toBeTruthy();
    expect(error.message).toContain('Permission denied');
  });
});
```

**E2E Tests:**
```typescript
// tests/e2e/role-management.spec.ts
test('admin can assign roles', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/admin');
  await page.click('text=User Roles');
  
  // Assign role
  await page.selectOption('[data-testid="role-select"]', 'supervisor');
  await expect(page.getByText('Role assigned')).toBeVisible();
});
```

---

## 🔒 Security Considerations

### **1. Role Validation**

All role operations go through database functions with security checks:

```sql
-- Every function checks caller permissions
IF NOT has_role(auth.uid(), 'admin') THEN
  RAISE EXCEPTION 'Permission denied';
END IF;
```

### **2. Last Admin Protection**

Cannot remove the last admin to prevent lockout:

```sql
IF (SELECT COUNT(*) FROM user_roles WHERE role = 'admin') <= 1 THEN
  RAISE EXCEPTION 'Cannot remove the last admin user';
END IF;
```

### **3. Role Persistence**

Roles are stored in the database, not in JWT tokens:
- ✅ Can be revoked immediately
- ✅ Changes take effect on next request
- ✅ More secure than client-side storage

### **4. Audit Trail**

Role changes are tracked in `role_requests` table:
- Who requested
- When requested
- Who approved/rejected
- When reviewed

---

## 🎨 UI Components

### **RoleSelector** (Auth Page)

**Visual Design:**
- Card-based selection
- Color-coded roles (blue/purple/red)
- Icons for each role
- Descriptions explaining permissions
- Accessible radio buttons

**States:**
- Default: Student selected
- Hover: Border highlights
- Selected: Radio checked
- Disabled: Grayed out during submission

---

### **UserRoleManagement** (Admin Dashboard)

**Layout:**
- Table view with columns:
  - Name
  - Email
  - Current Roles (badges)
  - Assign Role (dropdown)
  - Actions (remove buttons)

**Features:**
- Search/filter users (future enhancement)
- Bulk role assignment (future enhancement)
- Export user list (future enhancement)

---

### **RoleRequestManagement** (Admin Dashboard)

**Layout:**
- Table view with columns:
  - User
  - Requested Role
  - Justification
  - Date
  - Actions (Approve/Reject)

**Features:**
- Auto-refresh on approval/rejection
- Shows empty state when no requests
- Loading states for each action

---

## 📊 Common Workflows

### **Onboarding New Faculty**

1. Admin creates list of faculty emails
2. Sends them sign-up link
3. Faculty sign up and select "Supervisor"
4. ✅ Immediately have supervisor access
5. Admin verifies in User Roles tab

**Alternative:**
1. Faculty sign up as "Student" (default)
2. Submit role request for "Supervisor"
3. Admin approves request
4. ✅ Faculty upgraded to supervisor

---

### **Student Graduates and Becomes Faculty**

1. Student (existing account) needs supervisor access
2. Student requests 'supervisor' role
3. Provides justification: "I've graduated and am now teaching"
4. Program director approves
5. ✅ User keeps both roles (student data preserved, supervisor access granted)

---

### **Bulk Role Assignment**

**Current:** Assign one user at a time via UI

**Future Enhancement:**
```typescript
// Import CSV with users and roles
// Batch assign via admin interface
// Or use SQL:
INSERT INTO user_roles (user_id, role)
SELECT id, 'supervisor'::app_role
FROM profiles
WHERE email LIKE '%@hospital.edu';
```

---

## ⚡ Performance

**Role Checks:**
- Cached in React context
- Fetched once on login
- Updates on role change
- No DB query per page

**Admin Operations:**
- RPC functions for security
- Optimized queries with indexes
- Batch operations supported

---

## 🐛 Troubleshooting

### **Issue: User has no roles after signup**

**Check:**
1. Verify migration applied: `20251014_add_default_role_assignment.sql`
2. Check trigger is active:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
   ```
3. Verify function exists:
   ```sql
   SELECT * FROM pg_proc WHERE proname = 'handle_new_user';
   ```

---

### **Issue: Admin cannot assign roles**

**Check:**
1. User actually has admin role:
   ```sql
   SELECT * FROM user_roles WHERE user_id = 'xxx' AND role = 'admin';
   ```
2. RPC function exists and has correct permissions
3. Browser console for error messages

---

### **Issue: Role changes don't take effect**

**Solution:**
- Have user sign out and sign in again
- Role data is fetched on authentication
- Or refresh the page

---

## 🔄 Migration Guide

### **Apply Role Assignment Migration**

```bash
# If using Supabase CLI
supabase db push

# Or manually in Supabase dashboard
# SQL Editor → paste migration file → run
```

### **Update Existing Users**

All existing users without roles will need assignment:

```sql
-- Assign 'student' role to all users without any role
INSERT INTO user_roles (user_id, role)
SELECT p.id, 'student'::app_role
FROM profiles p
LEFT JOIN user_roles ur ON p.id = ur.user_id
WHERE ur.id IS NULL;
```

---

## 📈 Future Enhancements

### **Potential Improvements:**

1. **Role Templates**
   - Pre-configured role sets
   - Department-specific roles
   - Time-limited roles

2. **Permission Granularity**
   - Custom permissions per role
   - Feature flags
   - Department-level access

3. **Bulk Operations**
   - CSV import for role assignment
   - Bulk approve/reject
   - Department-wide changes

4. **Role Hierarchy**
   - Automatic role inheritance
   - Role dependencies
   - Cascading permissions

5. **Audit Logging**
   - Track all role changes
   - Export audit logs
   - Compliance reporting

---

## 📚 Quick Reference

### **Check User Roles**
```typescript
const { roles, hasRole } = useAuth();

if (hasRole('admin')) {
  // Show admin features
}
```

### **Assign Role (Admin Only)**
```typescript
import { assignUserRole } from '@/lib/roleManagement';

await assignUserRole(userId, 'supervisor');
```

### **Get All Users (Admin Only)**
```typescript
import { getUsersWithRoles } from '@/lib/roleManagement';

const { data: users } = await getUsersWithRoles();
```

### **Submit Role Request**
```typescript
import { submitRoleRequest } from '@/lib/roleManagement';

await submitRoleRequest('supervisor', 'I am a faculty member...');
```

---

## 🎓 Best Practices

1. **Default to Least Privilege** - Start users as 'student'
2. **Use Justification** - Require explanation for role requests
3. **Audit Regularly** - Review role assignments periodically
4. **Protect Admin** - Never remove the last admin
5. **Document Changes** - Keep notes on why roles were assigned

---

## 📞 Support

**Questions about roles?**
- Check this documentation
- Contact your program administrator
- Submit a help request

**Technical issues?**
- Check browser console for errors
- Verify you're signed in
- Try signing out and back in

---

**Last Updated:** October 14, 2025  
**Version:** 1.0.0  
**Migration:** 20251014_add_default_role_assignment.sql

