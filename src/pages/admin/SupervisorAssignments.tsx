import { useState, useEffect } from 'react';

import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Trash2 } from 'lucide-react';

import { DataTable } from '@/components/admin/DataTable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface Assignment {
  id: string;
  supervisor_id: string;
  student_id: string;
  supervisor_name: string;
  student_name: string;
  is_active: boolean;
  assigned_at: string;
}

const SupervisorAssignments = () => {
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [supervisors, setSupervisors] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedSupervisor, setSelectedSupervisor] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<string>('');

  useEffect(() => {
    if (user && hasRole('admin')) {
      loadData();
      loadSupervisors();
      loadStudents();
    }
  }, [user, hasRole]);

  const loadData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('supervisor_student_assignments')
        .select(`
          *,
          supervisor:profiles!supervisor_student_assignments_supervisor_id_fkey(id, full_name),
          student:profiles!supervisor_student_assignments_student_id_fkey(id, full_name)
        `)
        .order('assigned_at', { ascending: false });

      if (error) throw error;

      const transformed = (data || []).map((item: any) => ({
        id: item.id,
        supervisor_id: item.supervisor_id,
        student_id: item.student_id,
        supervisor_name: item.supervisor?.full_name || 'Unknown',
        student_name: item.student?.full_name || 'Unknown',
        is_active: item.is_active,
        assigned_at: item.assigned_at,
      }));

      setAssignments(transformed);
    } catch (error: any) {
      console.error('Error loading assignments:', error);
      toast({
        title: 'Error',
        description: 'Failed to load assignments',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSupervisors = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          email,
          user_roles!inner(role)
        `)
        .eq('user_roles.role', 'supervisor')
        .order('full_name');
      
      if (error) throw error;
      setSupervisors(data || []);
    } catch (error: any) {
      console.error('Error loading supervisors:', error);
    }
  };

  const loadStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          email,
          user_roles!inner(role)
        `)
        .eq('user_roles.role', 'student')
        .order('full_name');
      
      if (error) throw error;
      setStudents(data || []);
    } catch (error: any) {
      console.error('Error loading students:', error);
    }
  };

  const handleCreate = async () => {
    if (!selectedSupervisor || !selectedStudent) {
      toast({
        title: 'Validation Error',
        description: 'Please select both supervisor and student',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('supervisor_student_assignments')
        .insert({
          supervisor_id: selectedSupervisor,
          student_id: selectedStudent,
          assigned_by: user?.id,
          is_active: true,
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Assignment created successfully',
      });

      setDialogOpen(false);
      setSelectedSupervisor('');
      setSelectedStudent('');
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create assignment',
        variant: 'destructive',
      });
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate this assignment?')) return;

    try {
      const { error } = await supabase
        .from('supervisor_student_assignments')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Assignment deactivated',
      });

      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to deactivate assignment',
        variant: 'destructive',
      });
    }
  };

  const columns: ColumnDef<Assignment>[] = [
    {
      accessorKey: 'supervisor_name',
      header: 'Supervisor',
    },
    {
      accessorKey: 'student_name',
      header: 'Student',
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: ({ row }) => (
        <span className={row.original.is_active ? 'text-green-600' : 'text-gray-400'}>
          {row.original.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      accessorKey: 'assigned_at',
      header: 'Assigned',
      cell: ({ row }) => new Date(row.original.assigned_at).toLocaleDateString(),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleDeactivate(row.original.id)}
          disabled={!row.original.is_active}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  if (!user || !hasRole('admin')) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <p>Access denied. Admin privileges required.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Supervisor-Student Assignments</h1>
            <p className="text-muted-foreground">Manage which supervisors are assigned to which students</p>
          </div>
          <Button onClick={() => setDialogOpen(true)} className="bg-gradient-primary hover:opacity-90">
            <Plus className="mr-2 h-4 w-4" />
            New Assignment
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Assignments</CardTitle>
            <CardDescription>{assignments.length} assignment(s) found</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-pulse text-muted-foreground">Loading...</div>
              </div>
            ) : (
              <DataTable 
                columns={columns} 
                data={assignments}
                emptyMessage="No assignments found. Click 'New Assignment' to create one."
              />
            )}
          </CardContent>
        </Card>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Assignment</DialogTitle>
              <DialogDescription>Assign a supervisor to a student</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Supervisor</Label>
                <Select value={selectedSupervisor} onValueChange={setSelectedSupervisor}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select supervisor" />
                  </SelectTrigger>
                  <SelectContent>
                    {supervisors.map(s => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.full_name || s.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Student</Label>
                <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map(s => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.full_name || s.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} className="bg-gradient-primary hover:opacity-90">
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default SupervisorAssignments;

