/**
 * Supervisors Page
 * Manage supervisor assignments and department relationships
 */

import { useEffect, useState } from 'react';

import { type ColumnDef } from '@tanstack/react-table';
import { GraduationCap, Mail, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { AdminLayout } from '@/components/admin/AdminLayout';
import { DataTable } from '@/components/admin/DataTable';
import { ProtectedAdminRoute } from '@/components/admin/ProtectedAdminRoute';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Institution {
  id: string;
  name: string;
}

interface Department {
  id: string;
  name: string;
}

interface Supervisor {
  id: string;
  email: string;
  full_name: string;
  institution_id: string | null;
  department_id: string | null;
  created_at: string;
  institutions?: Institution;
  departments?: Department;
}

const Supervisors = () => {
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadSupervisors();
  }, []);

  const loadSupervisors = async () => {
    try {
      // First get all supervisor user IDs
      const { data: supervisorRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'supervisor');

      if (rolesError) throw rolesError;

      const supervisorIds = (supervisorRoles || []).map(r => r.user_id);

      if (supervisorIds.length === 0) {
        setSupervisors([]);
        setLoading(false);
        return;
      }

      // Then fetch profiles for those supervisors
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          institutions(id, name),
          departments(id, name)
        `)
        .in('id', supervisorIds)
        .order('full_name');

      if (error) throw error;

      // Transform data
      const supervisorsData = (data || []).map((item: any) => ({
        id: item.id,
        email: item.email,
        full_name: item.full_name,
        institution_id: item.institution_id,
        department_id: item.department_id,
        created_at: item.created_at,
        institutions: item.institutions,
        departments: item.departments,
      }));

      setSupervisors(supervisorsData);
    } catch (error) {
      console.error('Error loading supervisors:', error);
      toast({
        title: 'Error',
        description: 'Failed to load supervisors',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnDef<Supervisor>[] = [
    {
      accessorKey: 'full_name',
      header: 'Name',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          <span className="font-medium">{row.original.full_name}</span>
        </div>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{row.original.email}</span>
        </div>
      ),
    },
    {
      id: 'institution',
      header: 'Institution',
      cell: ({ row }) => (
        row.original.institutions ? (
          <Badge variant="secondary" className="font-normal">
            {row.original.institutions.name}
          </Badge>
        ) : (
          <span className="text-sm text-muted-foreground">Not assigned</span>
        )
      ),
    },
    {
      id: 'department',
      header: 'Department',
      cell: ({ row }) => (
        row.original.departments ? (
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{row.original.departments.name}</span>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">Not assigned</span>
        )
      ),
    },
  ];

  const assignedCount = supervisors.filter(s => s.department_id).length;
  const unassignedCount = supervisors.filter(s => !s.department_id).length;

  return (
    <ProtectedAdminRoute>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Supervisors</h1>
              <p className="mt-2 text-muted-foreground">
                View and manage supervisor assignments to departments
              </p>
            </div>
          </div>

          {/* Info Banner */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/50 dark:bg-blue-900/20">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>Manage Assignments:</strong> To assign supervisors to departments, go to the{' '}
              <button
                onClick={() => navigate('/admin/users')}
                className="font-semibold underline hover:no-underline"
              >
                Users page
              </button>{' '}
              and edit each user's institution and department settings.
            </p>
          </div>

          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border bg-card p-4">
              <div className="text-2xl font-bold text-foreground">{supervisors.length}</div>
              <p className="text-sm text-muted-foreground">Total Supervisors</p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {assignedCount}
              </div>
              <p className="text-sm text-muted-foreground">Assigned to Department</p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {unassignedCount}
              </div>
              <p className="text-sm text-muted-foreground">Unassigned</p>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          ) : supervisors.length === 0 ? (
            <div className="rounded-lg border border-dashed p-12 text-center">
              <GraduationCap className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No Supervisors Yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Supervisors will appear here once users are assigned the supervisor role.
              </p>
              <button
                onClick={() => navigate('/admin/users')}
                className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Manage Users
              </button>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={supervisors}
              searchPlaceholder="Search supervisors..."
            />
          )}
        </div>
      </AdminLayout>
    </ProtectedAdminRoute>
  );
};

export default Supervisors;


