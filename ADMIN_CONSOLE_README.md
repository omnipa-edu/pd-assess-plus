# Admin Console Documentation

## 📋 Overview

The Admin Console is a comprehensive management interface for WBA Tracker administrators. It provides full CRUD operations for all organizational entities, user management, EPA framework administration, and complete audit logging.

**Access:** `/admin` (requires admin role)

---

## 🚀 Getting Started

### Prerequisites

1. **Database Setup:** Run the migration:
   ```sql
   -- In Supabase SQL Editor, run:
   /supabase/migrations/20251102_admin_console_schema.sql
   ```

2. **Assign Admin Role:** Use the helper queries:
   ```sql
   -- See ADMIN_SETUP_QUERIES.sql for complete setup instructions
   
   -- Quick admin assignment (replace with your email):
   INSERT INTO public.user_roles (user_id, role)
   SELECT id, 'admin' FROM auth.users 
   WHERE email = 'your.email@example.com'
   ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
   ```

3. **Access:** Navigate to `http://localhost:8080/admin` (or your deployment URL)

---

## 📊 Features

### 1. **Dashboard** (`/admin`)
- Real-time stats for all entities
- Quick action cards
- At-a-glance metrics
- Navigation to all sections

**Stats Displayed:**
- Institutions, Departments, Users, Supervisors, Specialties, Active EPAs

### 2. **Institutions** (`/admin/institutions`)
Manage hospitals, clinics, and healthcare organizations.

**Features:**
- Create/Edit/Delete institutions
- Search and filter
- View department hierarchy
- Address management

**Fields:**
- Name (2-200 characters, required)
- Code (2-20 characters, unique, required)
- Address (optional)

### 3. **Departments** (`/admin/departments`)
Manage clinical departments and units within institutions.

**Features:**
- Institution filtering dropdown
- Badge display of parent institution
- Unique codes per institution
- Nested hierarchical views

**Fields:**
- Institution (select, required)
- Name (2-200 characters, required)
- Code (2-20 characters, unique within institution, required)

### 4. **Specialties** (`/admin/specialties`)
Manage medical specialties and their EPA frameworks.

**Features:**
- EPA count badges (real-time)
- Active/inactive toggle
- Delete protection (can't delete if EPAs exist)
- Stats dashboard

**Fields:**
- Name (2-200 characters, required)
- Code (2-50 characters, unique, required)
- Description (optional)
- Active status (toggle)

**Business Rules:**
- Cannot delete specialties with active EPAs
- Inactive specialties hidden from non-admins

### 5. **EPAs** (`/admin/epas`)
Manage Entrustable Professional Activities.

**Features:**
- **Bulk Actions:** Select multiple → Activate or Retire
- Filter by specialty AND status
- KSA metadata editor (JSON)
- Version tracking
- Status workflow: Draft → Active → Retired

**Fields:**
- Specialty (select, required)
- Code (2-32 characters, unique within specialty, required)
- Title (3-200 characters, required)
- Description (10-5000 characters, required)
- KSA (JSON, optional) - Knowledge, Skills, Attitudes
- Version (text, default: "v1")
- Status (draft/active/retired)

**Bulk Actions:**
- Select multiple EPAs via checkboxes
- Activate selected (sets status to "active")
- Retire selected (sets status to "retired")

**Business Rules:**
- Only draft EPAs can be hard deleted
- Active/retired EPAs must be soft-deleted (set to retired)
- KSA must be valid JSON if provided

### 6. **Users** (`/admin/users`)
Manage user accounts, roles, and organizational assignments.

**Features:**
- Edit user roles (student/supervisor/admin)
- Assign to institutions and departments
- Filter by role and institution
- Last admin protection
- Stats by role

**Fields (Editable):**
- Role (student/supervisor/admin)
- Institution (select, optional)
- Department (select, filtered by institution, optional)

**Business Rules:**
- Cannot delete the last admin user
- Department dropdown only enabled after selecting institution
- Role changes audited

### 7. **Supervisors** (`/admin/supervisors`)
View supervisor assignments and department relationships.

**Features:**
- Read-only view of all supervisors
- Institution and department display
- Assignment statistics
- Link to Users page for editing

**Note:** To assign supervisors to departments, edit them via the Users page.

### 8. **Activity Log** (`/admin/activity`)
Complete audit trail of all admin actions.

**Features:**
- Filter by entity type (institutions, departments, EPAs, etc.)
- Filter by action (create/update/delete/import/bulk_update)
- Before/after diffs (JSON)
- User attribution
- Timestamp display
- Last 100 entries

**Action Types:**
- **Create:** New entity created
- **Update:** Existing entity modified
- **Delete:** Entity removed
- **Import:** Bulk import operation
- **Bulk Update:** Bulk status change

---

## 🔐 Security

### Role-Based Access Control (RBAC)

**Admin Role:**
- Full CRUD access to all entities
- User and role management
- Audit log access
- Bulk operations

**Non-Admin Roles:**
- Read-only access to active records
- No admin console access (redirected to dashboard)
- Cannot see drafts or retired records

### Row Level Security (RLS)

All admin tables have RLS policies:
- **Admins:** Full access within organization
- **Others:** Read-only, active records only
- **Audit log:** Admin read, system write

### Audit Logging

**All actions logged:**
- Actor (user who performed action)
- Action type (create/update/delete/etc.)
- Entity type and ID
- Before/after values (diffs)
- Metadata (bulk operation details)
- Timestamp

**Audit entries cannot be deleted or modified** (write-once, append-only).

---

## 🎨 UI/UX Features

### Design Principles
- **Mobile-first:** Responsive on all devices
- **Dark mode:** Full support with smooth transitions
- **Accessible:** WCAG AA compliant, keyboard navigation
- **Plain language:** Clear labels and helpers
- **Visual feedback:** Toasts, loading states, color-coding

### Component Library
- **shadcn/ui:** All UI components
- **@tanstack/react-table:** DataTable implementation
- **Framer Motion:** (optional) micro-animations
- **Tailwind CSS:** Utility-first styling

### Color Coding

**Status Badges:**
- Draft: Gray
- Active: Green
- Retired: Orange

**Roles:**
- Admin: Red
- Supervisor: Purple
- Student: Blue

**Actions:**
- Create: Green
- Update: Blue
- Delete: Red
- Import/Bulk: Purple/Orange

---

## 📁 File Structure

```
src/
├── pages/admin/
│   ├── AdminOverview.tsx        # Dashboard
│   ├── Institutions.tsx         # Institutions CRUD
│   ├── Departments.tsx          # Departments CRUD
│   ├── Specialties.tsx          # Specialties CRUD
│   ├── EPAs.tsx                 # EPAs CRUD with bulk actions
│   ├── Users.tsx                # User management
│   ├── Supervisors.tsx          # Supervisor view
│   └── ActivityLog.tsx          # Audit log viewer
│
├── components/admin/
│   ├── AdminLayout.tsx          # Sidebar navigation
│   ├── ProtectedAdminRoute.tsx # Role guard
│   └── DataTable.tsx            # Reusable table component
│
├── lib/admin/
│   ├── guard.ts                 # isAdmin(), requireAdmin()
│   └── audit.ts                 # writeAudit(), getAuditLog()
│
supabase/migrations/
└── 20251102_admin_console_schema.sql  # Database schema

Documentation:
├── ADMIN_CONSOLE_README.md (this file)
├── ADMIN_SETUP_QUERIES.sql
├── ADMIN_CONSOLE_STATUS.md
└── ADMIN_PROGRESS_SUMMARY.md
```

---

##  API / Database Functions

### Admin Guard Functions

```typescript
// Check if current user is admin
const result = await isAdmin();
// Returns: { isAdmin: boolean, userId: string | null, error: string | null }

// Require admin role (throws if not admin)
const userId = await requireAdmin();

// Check for any role
const hasRole = await hasAnyRole(['admin', 'supervisor']);
```

### Audit Logging Functions

```typescript
// Write audit entry
await writeAudit({
  action: 'update',
  entity: 'institutions',
  entityId: '...',
  diff: {
    before: { name: 'Old Name' },
    after: { name: 'New Name' }
  },
  metadata: { custom: 'data' } // optional
});

// Get audit log for entity
const entries = await getAuditLog('institutions', entityId, 50);

// Get recent activity (all entities)
const recent = await getRecentActivity(100);
```

### Supabase RPC Functions

```sql
-- Write audit log (called from frontend)
SELECT public.write_audit_log(
  'update'::audit_action,
  'institutions',
  'entity-id-here',
  '{"before": {...}, "after": {...}}'::jsonb,
  '{"custom": "metadata"}'::jsonb
);

-- Get EPA count for specialty
SELECT public.get_specialty_epa_count('specialty-id-here');
```

---

## 🧪 Testing

### Manual Testing Checklist

**Admin Guard:**
- [ ] Non-admin users redirected from `/admin/*`
- [ ] Admin users can access all admin pages
- [ ] "Access Denied" toast shown on redirect

**Institutions:**
- [ ] Create new institution
- [ ] Edit institution details
- [ ] Delete institution (with cascade warning)
- [ ] Search institutions

**Departments:**
- [ ] Create department with institution
- [ ] Filter by institution
- [ ] Edit department
- [ ] Delete department

**Specialties:**
- [ ] Create specialty
- [ ] See EPA count badges
- [ ] Toggle active/inactive
- [ ] Cannot delete if EPAs exist

**EPAs:**
- [ ] Create EPA with specialty
- [ ] Add KSA JSON metadata
- [ ] Select multiple EPAs (checkboxes)
- [ ] Bulk activate selected
- [ ] Bulk retire selected
- [ ] Filter by specialty + status
- [ ] Only drafts can be deleted

**Users:**
- [ ] Edit user role
- [ ] Assign institution
- [ ] Assign department (filtered by institution)
- [ ] Cannot delete last admin
- [ ] Filter by role + institution

**Activity Log:**
- [ ] View recent actions
- [ ] Filter by entity
- [ ] Filter by action
- [ ] See before/after diffs
- [ ] User attribution shown

### Automated Testing (Future)

**Playwright E2E Tests:**
- Admin guard redirect flow
- Complete CRUD operations
- Bulk actions workflow
- Filtering and search

**Vitest Unit Tests:**
- Validation functions
- Guard utilities
- Audit log formatting
- Business logic

---

## 🐛 Troubleshooting

### "Access Denied" when visiting `/admin`

**Cause:** User doesn't have admin role.

**Solution:**
```sql
-- In Supabase SQL Editor:
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users 
WHERE email = 'your.email@example.com'
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
```

### Database Migration Errors

**Issue:** "type already exists" or "relation already exists"

**Solution:** Migration is idempotent - safe to run multiple times. Re-run the migration:
```sql
-- Copy entire contents of:
/supabase/migrations/20251102_admin_console_schema.sql
-- Paste in Supabase SQL Editor and run
```

### Cannot Delete Entity

**Common Causes:**
1. **Specialty with EPAs:** Remove EPAs first
2. **Last Admin User:** Cannot delete last admin
3. **Active EPA:** Set to retired instead

**Solution:** Check relationships and business rules before deleting.

### Audit Log Not Showing Actions

**Causes:**
1. RLS policies blocking access
2. User not logged in
3. Function permissions

**Solution:**
```sql
-- Grant permissions:
GRANT EXECUTE ON FUNCTION public.write_audit_log TO authenticated;
GRANT SELECT ON public.audit_log TO authenticated;

-- Check RLS policies:
SELECT * FROM pg_policies WHERE tablename = 'audit_log';
```

---

## 🚀 Deployment

### Environment Variables

```env
# Supabase (already configured)
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key

# Optional: Google OAuth (for future import features)
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_SERVICE_ACCOUNT_KEY=
```

### Build for Production

```bash
# Install dependencies
npm install

# Build
npm run build

# Preview build
npm run preview

# Deploy (example: Vercel)
vercel --prod
```

### Post-Deployment Checklist

- [ ] Run database migration in production Supabase
- [ ] Assign admin role to initial admin user
- [ ] Test admin console access
- [ ] Verify RLS policies active
- [ ] Check audit logging working
- [ ] Test mobile responsiveness
- [ ] Verify dark mode in production

---

## 📈 Future Enhancements

### Planned Features

1. **EPA Import Wizard** (7 tasks remaining):
   - Multi-format file upload (DOCX, XLSX, CSV)
   - Google Docs/Sheets integration
   - Field mapping with presets
   - Validation and de-duplication
   - Transactional bulk import
   - Downloadable templates
   - Import history tracking

2. **Enhanced Analytics:**
   - Usage statistics dashboard
   - Assessment completion rates
   - User activity heatmaps
   - EPA usage analytics

3. **Advanced Filtering:**
   - Date range filters
   - Multi-select filters
   - Saved filter presets
   - Export filtered results

4. **Batch Operations:**
   - Bulk user role changes
   - Bulk department reassignments
   - Bulk EPA status updates
   - Bulk data exports

5. **Audit Log Enhancements:**
   - Export audit log to CSV
   - Advanced search/filtering
   - Diff visualization
   - Compliance reports

---

## 💬 Support

### Getting Help

1. **Check documentation:** This README, setup queries, status docs
2. **Review audit log:** See what actions have been taken
3. **Check browser console:** Look for JavaScript errors
4. **Verify permissions:** Ensure admin role assigned
5. **Test in incognito:** Rule out cache/cookie issues

### Common Questions

**Q: How do I make someone an admin?**  
A: Use the Users page → Edit user → Change role to "admin"

**Q: Can I undo a delete?**  
A: No, but the audit log preserves the data. Set EPAs to "retired" instead of deleting.

**Q: How do I assign supervisors to departments?**  
A: Users page → Edit user → Select institution → Select department

**Q: Why can't I see the admin menu?**  
A: You need the admin role. Check with your system administrator.

**Q: How do bulk actions work?**  
A: Check checkboxes next to items → Click bulk action button (Activate/Retire)

---

## 📝 Changelog

### Version 1.0 (November 2, 2025)

**Completed (11/20 tasks - 55%):**
- ✅ Database schema with 6 tables, RLS, indexes, triggers
- ✅ Admin guard and protected routes
- ✅ Admin layout with sidebar navigation
- ✅ Admin overview dashboard
- ✅ Institutions CRUD
- ✅ Departments CRUD with institution filtering
- ✅ Specialties CRUD with EPA counts
- ✅ EPAs CRUD with bulk actions and KSA editor
- ✅ Users management with role and assignment editing
- ✅ Supervisors overview
- ✅ Activity log with filtering and diffs

**In Progress (7 tasks - EPA Import Wizard):**
- ⏳ Import wizard UI (5-step stepper)
- ⏳ File parsers (DOCX, XLSX, CSV/TSV)
- ⏳ Google Docs/Sheets integration
- ⏳ Field mapping component
- ⏳ Validation and de-duplication
- ⏳ Transactional commit
- ⏳ Template downloads

**Future:**
- ⏳ Automated tests (Playwright + Vitest)

---

## 🤝 Contributing

When adding new features to the admin console:

1. **Follow existing patterns:** Use DataTable, AdminLayout, audit logging
2. **Add RLS policies:** Secure new tables with admin-only access
3. **Write audit logs:** Log all mutations with before/after diffs
4. **Mobile-first design:** Test on small screens
5. **Dark mode:** Use Tailwind dark: variants
6. **Accessibility:** Add ARIA labels, keyboard navigation
7. **Update docs:** Add to this README
8. **Commit with details:** Descriptive commit messages

---

*Last Updated: November 2, 2025*
*Version: 1.0*
*Status: 55% Complete (11/20 tasks)*

