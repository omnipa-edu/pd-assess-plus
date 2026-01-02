/**
 * Departments Page
 * CRUD operations for departments with institution filtering
 */

import { useEffect, useState } from 'react';

import { type ColumnDef } from '@tanstack/react-table';
import { Edit, Trash2, Plus, Building2 } from 'lucide-react';

import { AdminLayout } from '@/components/admin/AdminLayout';
import { DataTable } from '@/components/admin/DataTable';
import { ProtectedAdminRoute } from '@/components/admin/ProtectedAdminRoute';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { writeAudit } from '@/lib/admin/audit';

interface Institution {
  id: string;
  name: string;
  code: string;
}

interface Department {
  id: string;
  institution_id: string;
  name: string;
  code: string;
  created_at: string;
  updated_at: string;
  institutions: Institution;
}

interface DepartmentFormData {
  institution_id: string;
  name: string;
  code: string;
}

const Departments = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [deletingDepartment, setDeletingDepartment] = useState<Department | null>(null);
  const [filterInstitution, setFilterInstitution] = useState<string>('all');
  const [formData, setFormData] = useState<DepartmentFormData>({
    institution_id: '',
    name: '',
    code: '',
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [deptResponse, instResponse] = await Promise.all([
        supabase
          .from('departments')
          .select('*, institutions(id, name, code)')
          .order('name'),
        supabase
          .from('institutions')
          .select('id, name, code')
          .order('name'),
      ]);

      if (deptResponse.error) throw deptResponse.error;
      if (instResponse.error) throw instResponse.error;

      setDepartments(deptResponse.data || []);
      setInstitutions(instResponse.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load departments',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingDepartment(null);
    setFormData({
      institution_id: institutions[0]?.id || '',
      name: '',
      code: '',
    });
    setDialogOpen(true);
  };

  const handleEdit = (department: Department) => {
    setEditingDepartment(department);
    setFormData({
      institution_id: department.institution_id,
      name: department.name,
      code: department.code,
    });
    setDialogOpen(true);
  };

  const handleDelete = (department: Department) => {
    setDeletingDepartment(department);
    setDeleteDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.code || !formData.institution_id) {
      toast({
        title: 'Validation Error',
        description: 'All fields are required',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      if (editingDepartment) {
        // Update
        const { error } = await supabase
          .from('departments')
          .update({
            institution_id: formData.institution_id,
            name: formData.name,
            code: formData.code,
          })
          .eq('id', editingDepartment.id);

        if (error) throw error;

        // Audit log
        await writeAudit({
          action: 'update',
          entity: 'departments',
          entityId: editingDepartment.id,
          diff: {
            before: {
              institution_id: editingDepartment.institution_id,
              name: editingDepartment.name,
              code: editingDepartment.code,
            },
            after: formData,
          },
        });

        toast({
          title: 'Success',
          description: 'Department updated successfully',
        });
      } else {
        // Create
        const { data, error } = await supabase
          .from('departments')
          .insert({
            institution_id: formData.institution_id,
            name: formData.name,
            code: formData.code,
          })
          .select()
          .single();

        if (error) throw error;

        // Audit log
        await writeAudit({
          action: 'create',
          entity: 'departments',
          entityId: data.id,
          diff: { after: formData },
        });

        toast({
          title: 'Success',
          description: 'Department created successfully',
        });
      }

      setDialogOpen(false);
      loadData();
    } catch (error: any) {
      console.error('Error saving department:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save department',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingDepartment) return;

    try {
      const { error } = await supabase
        .from('departments')
        .delete()
        .eq('id', deletingDepartment.id);

      if (error) throw error;

      // Audit log
      await writeAudit({
        action: 'delete',
        entity: 'departments',
        entityId: deletingDepartment.id,
        diff: {
          before: {
            institution_id: deletingDepartment.institution_id,
            name: deletingDepartment.name,
            code: deletingDepartment.code,
          },
        },
      });

      toast({
        title: 'Success',
        description: 'Department deleted successfully',
      });

      setDeleteDialogOpen(false);
      loadData();
    } catch (error: any) {
      console.error('Error deleting department:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete department',
        variant: 'destructive',
      });
    }
  };

  const filteredDepartments = filterInstitution === 'all'
    ? departments
    : departments.filter(d => d.institution_id === filterInstitution);

  const columns: ColumnDef<Department>[] = [
    {
      accessorKey: 'name',
      header: 'Department Name',
    },
    {
      accessorKey: 'code',
      header: 'Code',
    },
    {
      id: 'institution',
      header: 'Institution',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <span>{row.original.institutions.name}</span>
          <Badge variant="outline" className="text-xs">
            {row.original.institutions.code}
          </Badge>
        </div>
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
          >
            <Trash2 className="h-4 w-4 text-destructive" />
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
              <h1 className="text-3xl font-bold text-foreground">Departments</h1>
              <p className="mt-2 text-muted-foreground">
                Manage hospital departments and clinical units
              </p>
            </div>
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Add Department
            </Button>
          </div>

          {/* Institution Filter */}
          <div className="flex items-center gap-4">
            <Label htmlFor="institution-filter" className="whitespace-nowrap">
              Filter by Institution:
            </Label>
            <Select value={filterInstitution} onValueChange={setFilterInstitution}>
              <SelectTrigger id="institution-filter" className="w-[300px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Institutions</SelectItem>
                {institutions.map((inst) => (
                  <SelectItem key={inst.id} value={inst.id}>
                    {inst.name} ({inst.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {filterInstitution !== 'all' && (
              <Badge variant="secondary">
                {filteredDepartments.length} of {departments.length} departments
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
              data={filteredDepartments}
              searchPlaceholder="Search departments..."
            />
          )}
        </div>

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingDepartment ? 'Edit Department' : 'Create Department'}
              </DialogTitle>
              <DialogDescription>
                {editingDepartment
                  ? 'Update department details'
                  : 'Add a new department to an institution'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="institution">Institution *</Label>
                <Select
                  value={formData.institution_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, institution_id: value })
                  }
                >
                  <SelectTrigger id="institution">
                    <SelectValue placeholder="Select institution" />
                  </SelectTrigger>
                  <SelectContent>
                    {institutions.map((inst) => (
                      <SelectItem key={inst.id} value={inst.id}>
                        {inst.name} ({inst.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Department Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Emergency Medicine"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="code">Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value.toUpperCase() })
                  }
                  placeholder="EMERG"
                  maxLength={20}
                />
                <p className="text-xs text-muted-foreground">
                  Unique within institution (2-20 characters)
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : editingDepartment ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Department</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{deletingDepartment?.name}"?
                This may affect users assigned to this department.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AdminLayout>
    </ProtectedAdminRoute>
  );
};

export default Departments;

