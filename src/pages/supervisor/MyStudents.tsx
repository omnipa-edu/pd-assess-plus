import { useState, useEffect } from 'react';

import { type ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { ArrowLeft, Plus, Search, Edit, Calendar, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { DataTable } from '@/components/admin/DataTable';
import AddAssignStudentDialog from '@/components/supervisor/AddAssignStudentDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import {
  getSupervisorStudentAssignments,
  getSupervisorInstitutions,
  getProgramsForInstitution,
  updateStudentAssignment,
  endStudentAssignment,
  type StudentAssignmentWithDetails,
} from '@/lib/student-assignments';

const MyStudents = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<StudentAssignmentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<StudentAssignmentWithDetails | null>(null);

  // Filters
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [filterInstitution, setFilterInstitution] = useState<string>('all');
  const [filterProgram, setFilterProgram] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'active' | 'inactive' | 'all'>('active');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!authLoading && user) {
      loadInstitutions();
      loadAssignments();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (user) {
      loadAssignments();
    }
  }, [user, filterInstitution, filterProgram, filterStatus, searchQuery]);

  useEffect(() => {
    if (filterInstitution && filterInstitution !== 'all') {
      loadPrograms(filterInstitution);
    } else {
      setPrograms([]);
    }
  }, [filterInstitution]);

  const loadInstitutions = async () => {
    if (!user) return;
    try {
      const { getSupervisorInstitutions } = await import('@/lib/student-assignments');
      const insts = await getSupervisorInstitutions(user.id);
      setInstitutions(insts);
    } catch (error) {
      console.error('Error loading institutions:', error);
    }
  };

  const loadPrograms = async (institutionId: string) => {
    try {
      const { getProgramsForInstitution } = await import('@/lib/student-assignments');
      const progs = await getProgramsForInstitution(institutionId);
      setPrograms(progs);
    } catch (error) {
      console.error('Error loading programs:', error);
    }
  };

  const loadAssignments = async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      const data = await getSupervisorStudentAssignments(user.id, {
        institutionId: filterInstitution === 'all' ? null : filterInstitution,
        programId: filterProgram === 'all' ? null : filterProgram,
        status: filterStatus,
        searchQuery: searchQuery || undefined,
      });
      setAssignments(data || []);
    } catch (error: any) {
      console.error('Error loading assignments:', error);
      // Set empty array to prevent blank page
      setAssignments([]);
      const errorMessage = error.message || 'Failed to load students';
      setError(errorMessage);
      
      // Check if it's a table not found error (404 from REST API or SQL error)
      if (
        errorMessage.includes('does not exist') || 
        error.code === '42P01' ||
        error.status === 404 ||
        error.statusCode === 404 ||
        (errorMessage && errorMessage.includes('404'))
      ) {
        setError('Database table not found. Please run the migration: supabase/migrations/20251117_student_supervisor_assignments.sql');
      }
      
      toast({
        title: 'Error',
        description: errorMessage.includes('does not exist') 
          ? 'Database table not found. Please contact your administrator to run the migration.'
          : errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (assignment: StudentAssignmentWithDetails) => {
    setEditingAssignment(assignment);
    setEditDialogOpen(true);
  };

  const handleEndAssignment = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to end this assignment? This will set the end date to today.')) {
      return;
    }

    try {
      await endStudentAssignment(assignmentId);
      toast({
        title: 'Success',
        description: 'Assignment ended successfully',
      });
      loadAssignments();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to end assignment',
        variant: 'destructive',
      });
    }
  };

  const isAssignmentActive = (assignment: StudentAssignmentWithDetails): boolean => {
    try {
      if (!assignment.end_date) return true;
      const endDate = new Date(assignment.end_date);
      return endDate >= new Date();
    } catch (error) {
      // If date parsing fails, assume active
      return true;
    }
  };

  const columns: ColumnDef<StudentAssignmentWithDetails>[] = [
    {
      accessorKey: 'student_name',
      header: 'Student',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.student_name || 'Unknown'}</div>
          <div className="text-sm text-muted-foreground">{row.original.student_email}</div>
        </div>
      ),
    },
    {
      accessorKey: 'program_name',
      header: 'Program',
      cell: ({ row }) => row.original.program_name || '-',
    },
    {
      accessorKey: 'institution_name',
      header: 'Institution',
      cell: ({ row }) => row.original.institution_name || '-',
    },
    {
      accessorKey: 'primary_supervisor_name',
      header: 'Primary Supervisor',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {row.original.primary_supervisor_name || 'Unknown'}
          {row.original.is_primary && (
            <Badge variant="outline" className="text-xs">Primary</Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'dates',
      header: 'Dates',
      cell: ({ row }) => {
        try {
          const start = row.original.start_date
            ? format(new Date(row.original.start_date), 'MMM d, yyyy')
            : '-';
          const end = row.original.end_date
            ? format(new Date(row.original.end_date), 'MMM d, yyyy')
            : 'Ongoing';
          return (
            <div className="text-sm">
              {start} - {end}
            </div>
          );
        } catch (error) {
          return <div className="text-sm text-muted-foreground">—</div>;
        }
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const active = isAssignmentActive(row.original);
        return (
          <Badge variant={active ? 'default' : 'secondary'}>
            {active ? 'Active' : 'Inactive'}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const assignment = row.original;
        const active = isAssignmentActive(assignment);
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit(assignment)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            {active && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEndAssignment(assignment.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  // Show loading state while auth is loading
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <p>Please log in to view your students.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/supervisor')}
              size="sm"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">My Students</h1>
              <p className="text-muted-foreground">
                View and manage learners you are supervising or associated with
              </p>
            </div>
          </div>
          <Button
            onClick={() => setAddDialogOpen(true)}
            className="bg-gradient-primary hover:opacity-90"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add / Assign Student
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div>
                <Label>Institution</Label>
                <Select value={filterInstitution} onValueChange={setFilterInstitution}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Institutions" />
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
              <div>
                <Label>Program</Label>
                <Select
                  value={filterProgram}
                  onValueChange={setFilterProgram}
                  disabled={filterInstitution === 'all' || programs.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Programs" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Programs</SelectItem>
                    {programs.map(prog => (
                      <SelectItem key={prog.id} value={prog.id}>
                        {prog.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Students Table */}
        <Card>
          <CardHeader>
            <CardTitle>Students</CardTitle>
            <CardDescription>
              {error ? (
                <span className="text-destructive">Error loading students</span>
              ) : (
                `${assignments.length} student${assignments.length !== 1 ? 's' : ''} found`
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-pulse text-muted-foreground">Loading...</div>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center space-y-4 py-12">
                <p className="text-center text-destructive">{error}</p>
                <Button
                  onClick={loadAssignments}
                  variant="outline"
                >
                  Retry
                </Button>
              </div>
            ) : assignments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <p className="mb-4 text-muted-foreground">No students found.</p>
                <Button
                  onClick={() => setAddDialogOpen(true)}
                  className="bg-gradient-primary hover:opacity-90"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add / Assign Student
                </Button>
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={assignments}
                emptyMessage="No students found. Click 'Add / Assign Student' to get started."
              />
            )}
          </CardContent>
        </Card>

        {/* Add/Assign Student Dialog */}
        <AddAssignStudentDialog
          open={addDialogOpen}
          onOpenChange={setAddDialogOpen}
          onSuccess={() => {
            setAddDialogOpen(false);
            loadAssignments();
          }}
        />

        {/* Edit Assignment Dialog */}
        {editingAssignment && (
          <AddAssignStudentDialog
            open={editDialogOpen}
            onOpenChange={(open) => {
              setEditDialogOpen(open);
              if (!open) setEditingAssignment(null);
            }}
            assignment={editingAssignment}
            onSuccess={() => {
              setEditDialogOpen(false);
              setEditingAssignment(null);
              loadAssignments();
            }}
          />
        )}
      </div>
    </div>
  );
};

export default MyStudents;

