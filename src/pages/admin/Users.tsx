/**
 * Users Page
 * Enhanced user management for admin console
 */

import { useEffect, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Edit, Trash2, Plus, Shield, User } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ProtectedAdminRoute } from '@/components/admin/ProtectedAdminRoute';
import { DataTable } from '@/components/admin/DataTable';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { writeAudit } from '@/lib/admin/audit';

interface Institution {
  id: string;
  name: string;
}

interface Department {
  id: string;
  name: string;
  institution_id: string;
}

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'student' | 'supervisor' | 'admin';
  institution_id: string | null;
  department_id: string | null;
  created_at: string;
  institutions?: Institution;
  departments?: Department;
}

const Users = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserProfile | null>(null);
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterInstitution, setFilterInstitution] = useState<string>('all');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [usersResponse, rolesResponse, institutionsResponse, departmentsResponse] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('user_roles')
          .select('user_id, role'),
        supabase
          .from('institutions')
          .select('id, name')
          .order('name'),
        supabase
          .from('departments')
          .select('id, name, institution_id')
          .order('name'),
      ]);

      if (usersResponse.error) {
        console.error('Users query error:', usersResponse.error);
        throw usersResponse.error;
      }
      if (rolesResponse.error) {
        console.error('Roles query error:', rolesResponse.error);
        throw rolesResponse.error;
      }
      if (institutionsResponse.error) {
        console.error('Institutions query error:', institutionsResponse.error);
        throw institutionsResponse.error;
      }
      if (departmentsResponse.error) {
        console.error('Departments query error:', departmentsResponse.error);
        throw departmentsResponse.error;
      }

      // Create a map of user roles for quick lookup
      const rolesMap = new Map<string, string>();
      (rolesResponse.data || []).forEach((roleRecord: any) => {
        rolesMap.set(roleRecord.user_id, roleRecord.role);
      });

      // Transform user data
      const transformedUsers = (usersResponse.data || []).map((user: any) => {
        // Handle institution and department lookups
        const institution = user.institution_id 
          ? institutionsResponse.data?.find(i => i.id === user.institution_id)
          : null;
        
        const department = user.department_id
          ? departmentsResponse.data?.find(d => d.id === user.department_id)
          : null;

        return {
          id: user.id,
          email: user.email,
          full_name: user.full_name || 'Unknown',
          role: rolesMap.get(user.id) || 'student',
          institution_id: user.institution_id || null,
          department_id: user.department_id || null,
          created_at: user.created_at,
          institutions: institution || null,
          departments: department || null,
        };
      });

      setUsers(transformedUsers);
      setInstitutions(institutionsResponse.data || []);
      setDepartments(departmentsResponse.data || []);
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load users',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: UserProfile) => {
    setEditingUser(user);
    setDialogOpen(true);
  };

  const handleDelete = (user: UserProfile) => {
    setDeletingUser(user);
    setDeleteDialogOpen(true);
  };

  const handleSaveRole = async (userId: string, newRole: 'student' | 'supervisor' | 'admin') => {
    setSaving(true);
    try {
      // Update role
      const { error: roleError } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (roleError) throw roleError;

      // Find old role for audit
      const oldUser = users.find(u => u.id === userId);

      // Audit log
      await writeAudit({
        action: 'update',
        entity: 'user_roles',
        entityId: userId,
        diff: {
          before: { role: oldUser?.role },
          after: { role: newRole },
        },
      });

      toast({
        title: 'Success',
        description: 'User role updated successfully',
      });

      setDialogOpen(false);
      loadData();
    } catch (error: any) {
      console.error('Error updating role:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update user role',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAssignments = async (
    userId: string,
    institutionId: string | null,
    departmentId: string | null
  ) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          institution_id: institutionId || null,
          department_id: departmentId || null,
        })
        .eq('id', userId);

      if (error) throw error;

      const oldUser = users.find(u => u.id === userId);

      // Audit log
      await writeAudit({
        action: 'update',
        entity: 'profiles',
        entityId: userId,
        diff: {
          before: {
            institution_id: oldUser?.institution_id,
            department_id: oldUser?.department_id,
          },
          after: {
            institution_id: institutionId,
            department_id: departmentId,
          },
        },
      });

      toast({
        title: 'Success',
        description: 'User assignments updated successfully',
      });

      setDialogOpen(false);
      loadData();
    } catch (error: any) {
      console.error('Error updating assignments:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update user assignments',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingUser) return;

    // Prevent deleting the last admin
    if (deletingUser.role === 'admin') {
      const adminCount = users.filter(u => u.role === 'admin').length;
      if (adminCount <= 1) {
        toast({
          title: 'Cannot Delete',
          description: 'Cannot delete the last admin user',
          variant: 'destructive',
        });
        return;
      }
    }

    try {
      // Delete user role first
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', deletingUser.id);

      // Delete profile
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', deletingUser.id);

      if (error) throw error;

      // Audit log
      await writeAudit({
        action: 'delete',
        entity: 'profiles',
        entityId: deletingUser.id,
        diff: {
          before: {
            email: deletingUser.email,
            role: deletingUser.role,
          },
        },
      });

      toast({
        title: 'Success',
        description: 'User deleted successfully',
      });

      setDeleteDialogOpen(false);
      loadData();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete user',
        variant: 'destructive',
      });
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-4 w-4" />;
      case 'supervisor':
        return <User className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'supervisor':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesInstitution =
      filterInstitution === 'all' || user.institution_id === filterInstitution;
    return matchesRole && matchesInstitution;
  });

  const filteredDepartments = editingUser?.institution_id
    ? departments.filter(d => d.institution_id === editingUser.institution_id)
    : [];

  const columns: ColumnDef<UserProfile>[] = [
    {
      accessorKey: 'email',
      header: 'Email',
    },
    {
      accessorKey: 'full_name',
      header: 'Full Name',
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {getRoleIcon(row.original.role)}
          <Badge className={getRoleBadgeColor(row.original.role)}>
            {row.original.role}
          </Badge>
        </div>
      ),
    },
    {
      id: 'institution',
      header: 'Institution',
      cell: ({ row }) => (
        row.original.institutions ? (
          <span className="text-sm">{row.original.institutions.name}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )
      ),
    },
    {
      id: 'department',
      header: 'Department',
      cell: ({ row }) => (
        row.original.departments ? (
          <span className="text-sm">{row.original.departments.name}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(row.original)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(row.original)}
            disabled={row.original.role === 'admin' && users.filter(u => u.role === 'admin').length <= 1}
          >
            <Trash2
              className={`h-4 w-4 ${
                row.original.role === 'admin' && users.filter(u => u.role === 'admin').length <= 1
                  ? 'text-muted-foreground'
                  : 'text-destructive'
              }`}
            />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <ProtectedAdminRoute>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Users</h1>
              <p className="mt-2 text-muted-foreground">
                Manage user accounts, roles, and organizational assignments
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-lg border bg-card p-4">
              <div className="text-2xl font-bold text-foreground">{users.length}</div>
              <p className="text-sm text-muted-foreground">Total Users</p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {users.filter(u => u.role === 'admin').length}
              </div>
              <p className="text-sm text-muted-foreground">Admins</p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {users.filter(u => u.role === 'supervisor').length}
              </div>
              <p className="text-sm text-muted-foreground">Supervisors</p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {users.filter(u => u.role === 'student').length}
              </div>
              <p className="text-sm text-muted-foreground">Students</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Label className="whitespace-nowrap">Role:</Label>
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="supervisor">Supervisor</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Label className="whitespace-nowrap">Institution:</Label>
              <Select value={filterInstitution} onValueChange={setFilterInstitution}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Institutions</SelectItem>
                  {institutions.map(inst => (
                    <SelectItem key={inst.id} value={inst.id}>
                      {inst.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(filterRole !== 'all' || filterInstitution !== 'all') && (
              <Badge variant="secondary">
                {filteredUsers.length} of {users.length} users
              </Badge>
            )}
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={filteredUsers}
              searchPlaceholder="Search users..."
            />
          )}
        </div>

        {/* Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update user role and organizational assignments
              </DialogDescription>
            </DialogHeader>

            {editingUser && (
              <div className="space-y-6 py-4">
                <div className="rounded-lg bg-muted p-4">
                  <p className="text-sm font-medium">{editingUser.full_name}</p>
                  <p className="text-sm text-muted-foreground">{editingUser.email}</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select
                      value={editingUser.role}
                      onValueChange={(value: 'student' | 'supervisor' | 'admin') => {
                        setEditingUser({ ...editingUser, role: value });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="supervisor">Supervisor</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Institution</Label>
                    <Select
                      value={editingUser.institution_id || 'none'}
                      onValueChange={(value) => {
                        setEditingUser({
                          ...editingUser,
                          institution_id: value === 'none' ? null : value,
                          department_id: null, // Reset department
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select institution" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {institutions.map(inst => (
                          <SelectItem key={inst.id} value={inst.id}>
                            {inst.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Department</Label>
                    <Select
                      value={editingUser.department_id || 'none'}
                      onValueChange={(value) => {
                        setEditingUser({
                          ...editingUser,
                          department_id: value === 'none' ? null : value,
                        });
                      }}
                      disabled={!editingUser.institution_id}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {filteredDepartments.map(dept => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {!editingUser.institution_id && (
                      <p className="text-xs text-muted-foreground">
                        Select an institution first
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (!editingUser) return;
                  await handleSaveRole(editingUser.id, editingUser.role);
                  await handleSaveAssignments(
                    editingUser.id,
                    editingUser.institution_id,
                    editingUser.department_id
                  );
                }}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete User</DialogTitle>
              <DialogDescription>
                {deletingUser?.role === 'admin' && users.filter(u => u.role === 'admin').length <= 1 ? (
                  <>
                    Cannot delete "{deletingUser?.email}" because they are the last admin user.
                  </>
                ) : (
                  <>
                    Are you sure you want to delete "{deletingUser?.email}"? This will remove their profile and all associated data.
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                {deletingUser?.role === 'admin' && users.filter(u => u.role === 'admin').length <= 1
                  ? 'Close'
                  : 'Cancel'}
              </Button>
              {!(deletingUser?.role === 'admin' && users.filter(u => u.role === 'admin').length <= 1) && (
                <Button variant="destructive" onClick={confirmDelete}>
                  Delete
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AdminLayout>
    </ProtectedAdminRoute>
  );
};

export default Users;


