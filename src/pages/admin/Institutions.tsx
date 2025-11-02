/**
 * Institutions Page
 * CRUD operations for institutions
 */

import { useEffect, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Edit, Trash2, Plus } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { writeAudit } from '@/lib/admin/audit';

interface Institution {
  id: string;
  name: string;
  code: string;
  address: string | null;
  created_at: string;
  updated_at: string;
}

interface InstitutionFormData {
  name: string;
  code: string;
  address: string;
}

const Institutions = () => {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingInstitution, setEditingInstitution] = useState<Institution | null>(null);
  const [deletingInstitution, setDeletingInstitution] = useState<Institution | null>(null);
  const [formData, setFormData] = useState<InstitutionFormData>({
    name: '',
    code: '',
    address: '',
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadInstitutions();
  }, []);

  const loadInstitutions = async () => {
    try {
      const { data, error } = await supabase
        .from('institutions')
        .select('*')
        .order('name');

      if (error) throw error;
      setInstitutions(data || []);
    } catch (error) {
      console.error('Error loading institutions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load institutions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingInstitution(null);
    setFormData({ name: '', code: '', address: '' });
    setDialogOpen(true);
  };

  const handleEdit = (institution: Institution) => {
    setEditingInstitution(institution);
    setFormData({
      name: institution.name,
      code: institution.code,
      address: institution.address || '',
    });
    setDialogOpen(true);
  };

  const handleDelete = (institution: Institution) => {
    setDeletingInstitution(institution);
    setDeleteDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.code) {
      toast({
        title: 'Validation Error',
        description: 'Name and code are required',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      if (editingInstitution) {
        // Update
        const { error } = await supabase
          .from('institutions')
          .update({
            name: formData.name,
            code: formData.code,
            address: formData.address || null,
          })
          .eq('id', editingInstitution.id);

        if (error) throw error;

        // Audit log
        await writeAudit({
          action: 'update',
          entity: 'institutions',
          entityId: editingInstitution.id,
          diff: {
            before: {
              name: editingInstitution.name,
              code: editingInstitution.code,
              address: editingInstitution.address,
            },
            after: {
              name: formData.name,
              code: formData.code,
              address: formData.address,
            },
          },
        });

        toast({
          title: 'Success',
          description: 'Institution updated successfully',
        });
      } else {
        // Create
        const { data, error } = await supabase
          .from('institutions')
          .insert({
            name: formData.name,
            code: formData.code,
            address: formData.address || null,
          })
          .select()
          .single();

        if (error) throw error;

        // Audit log
        await writeAudit({
          action: 'create',
          entity: 'institutions',
          entityId: data.id,
          diff: {
            after: {
              name: formData.name,
              code: formData.code,
              address: formData.address,
            },
          },
        });

        toast({
          title: 'Success',
          description: 'Institution created successfully',
        });
      }

      setDialogOpen(false);
      loadInstitutions();
    } catch (error: any) {
      console.error('Error saving institution:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save institution',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingInstitution) return;

    try {
      const { error } = await supabase
        .from('institutions')
        .delete()
        .eq('id', deletingInstitution.id);

      if (error) throw error;

      // Audit log
      await writeAudit({
        action: 'delete',
        entity: 'institutions',
        entityId: deletingInstitution.id,
        diff: {
          before: {
            name: deletingInstitution.name,
            code: deletingInstitution.code,
            address: deletingInstitution.address,
          },
        },
      });

      toast({
        title: 'Success',
        description: 'Institution deleted successfully',
      });

      setDeleteDialogOpen(false);
      loadInstitutions();
    } catch (error: any) {
      console.error('Error deleting institution:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete institution',
        variant: 'destructive',
      });
    }
  };

  const columns: ColumnDef<Institution>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
    },
    {
      accessorKey: 'code',
      header: 'Code',
    },
    {
      accessorKey: 'address',
      header: 'Address',
      cell: ({ row }) => row.original.address || '—',
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
              <h1 className="text-3xl font-bold text-foreground">Institutions</h1>
              <p className="mt-2 text-muted-foreground">
                Manage hospitals, clinics, and other healthcare institutions
              </p>
            </div>
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Add Institution
            </Button>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={institutions}
              searchPlaceholder="Search institutions..."
            />
          )}
        </div>

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingInstitution ? 'Edit Institution' : 'Create Institution'}
              </DialogTitle>
              <DialogDescription>
                {editingInstitution
                  ? 'Update institution details'
                  : 'Add a new healthcare institution'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Royal College of Physicians"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="code">Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="RCPS"
                  maxLength={20}
                />
                <p className="text-xs text-muted-foreground">
                  Short unique identifier (2-20 characters)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="123 Medical Drive, City, Province"
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : editingInstitution ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Institution</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{deletingInstitution?.name}"?
                This will also delete all associated departments.
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

export default Institutions;

