/**
 * Specialties Page
 * CRUD operations for medical specialties with EPA count badges
 */

import { useEffect, useState } from 'react';

import { type ColumnDef } from '@tanstack/react-table';
import { Edit, Trash2, Plus, FileText } from 'lucide-react';

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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { writeAudit } from '@/lib/admin/audit';

interface Specialty {
  id: string;
  name: string;
  code: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  epa_count?: number;
}

interface SpecialtyFormData {
  name: string;
  code: string;
  description: string;
  is_active: boolean;
}

const Specialties = () => {
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingSpecialty, setEditingSpecialty] = useState<Specialty | null>(null);
  const [deletingSpecialty, setDeletingSpecialty] = useState<Specialty | null>(null);
  const [formData, setFormData] = useState<SpecialtyFormData>({
    name: '',
    code: '',
    description: '',
    is_active: true,
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSpecialties();
  }, []);

  const loadSpecialties = async () => {
    try {
      // Get specialties
      const { data: specialtiesData, error: specialtiesError } = await supabase
        .from('specialties')
        .select('id, name, code, description, created_at, updated_at')
        .order('name');

      if (specialtiesError) throw specialtiesError;

      // Get EPA counts for each specialty
      const specialtiesWithCounts = await Promise.all(
        (specialtiesData || []).map(async (specialty) => {
          const { count } = await supabase
            .from('epas')
            .select('id', { count: 'exact', head: true })
            .eq('specialty_id', specialty.id)
            .eq('status', 'active');

          return {
            ...specialty,
            epa_count: count || 0,
          };
        })
      );

      setSpecialties(specialtiesWithCounts);
    } catch (error) {
      console.error('Error loading specialties:', error);
      toast({
        title: 'Error',
        description: 'Failed to load specialties',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingSpecialty(null);
    setFormData({
      name: '',
      code: '',
      description: '',
      is_active: true,
    });
    setDialogOpen(true);
  };

  const handleEdit = (specialty: Specialty) => {
    setEditingSpecialty(specialty);
    setFormData({
      name: specialty.name,
      code: specialty.code,
      description: specialty.description || '',
      is_active: specialty.is_active,
    });
    setDialogOpen(true);
  };

  const handleDelete = (specialty: Specialty) => {
    setDeletingSpecialty(specialty);
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
      if (editingSpecialty) {
        // Update
        const { error } = await supabase
          .from('specialties')
          .update({
            name: formData.name,
            code: formData.code,
            description: formData.description || null,
            is_active: formData.is_active,
          })
          .eq('id', editingSpecialty.id);

        if (error) throw error;

        // Audit log
        await writeAudit({
          action: 'update',
          entity: 'specialties',
          entityId: editingSpecialty.id,
          diff: {
            before: {
              name: editingSpecialty.name,
              code: editingSpecialty.code,
              description: editingSpecialty.description,
              is_active: editingSpecialty.is_active,
            },
            after: formData,
          },
        });

        toast({
          title: 'Success',
          description: 'Specialty updated successfully',
        });
      } else {
        // Create
        const { data, error } = await supabase
          .from('specialties')
          .insert({
            name: formData.name,
            code: formData.code,
            description: formData.description || null,
            is_active: formData.is_active,
          })
          .select()
          .single();

        if (error) throw error;

        // Audit log
        await writeAudit({
          action: 'create',
          entity: 'specialties',
          entityId: data.id,
          diff: { after: formData },
        });

        toast({
          title: 'Success',
          description: 'Specialty created successfully',
        });
      }

      setDialogOpen(false);
      loadSpecialties();
    } catch (error: any) {
      console.error('Error saving specialty:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save specialty',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingSpecialty) return;

    // Check if specialty has EPAs
    if (deletingSpecialty.epa_count && deletingSpecialty.epa_count > 0) {
      toast({
        title: 'Cannot Delete',
        description: `This specialty has ${deletingSpecialty.epa_count} EPA(s). Remove EPAs first.`,
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('specialties')
        .delete()
        .eq('id', deletingSpecialty.id);

      if (error) throw error;

      // Audit log
      await writeAudit({
        action: 'delete',
        entity: 'specialties',
        entityId: deletingSpecialty.id,
        diff: {
          before: {
            name: deletingSpecialty.name,
            code: deletingSpecialty.code,
            description: deletingSpecialty.description,
            is_active: deletingSpecialty.is_active,
          },
        },
      });

      toast({
        title: 'Success',
        description: 'Specialty deleted successfully',
      });

      setDeleteDialogOpen(false);
      loadSpecialties();
    } catch (error: any) {
      console.error('Error deleting specialty:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete specialty',
        variant: 'destructive',
      });
    }
  };

  const columns: ColumnDef<Specialty>[] = [
    {
      accessorKey: 'name',
      header: 'Specialty Name',
    },
    {
      accessorKey: 'code',
      header: 'Code',
      cell: ({ row }) => (
        <Badge variant="outline" className="font-mono">
          {row.original.code}
        </Badge>
      ),
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => {
        const desc = row.original.description;
        return desc ? (
          <span className="line-clamp-2 text-sm text-muted-foreground">{desc}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
    },
    {
      id: 'epa_count',
      header: 'EPAs',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <Badge
            variant={row.original.epa_count === 0 ? 'secondary' : 'default'}
            className="font-semibold"
          >
            {row.original.epa_count || 0}
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.original.is_active ? 'default' : 'secondary'}>
          {row.original.is_active ? 'Active' : 'Inactive'}
        </Badge>
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
            disabled={(row.original.epa_count || 0) > 0}
          >
            <Trash2
              className={`h-4 w-4 ${
                (row.original.epa_count || 0) > 0
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
              <h1 className="text-3xl font-bold text-foreground">Specialties</h1>
              <p className="mt-2 text-muted-foreground">
                Manage medical specialties and their associated EPAs
              </p>
            </div>
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Add Specialty
            </Button>
          </div>

          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border bg-card p-4">
              <div className="text-2xl font-bold text-foreground">
                {specialties.length}
              </div>
              <p className="text-sm text-muted-foreground">Total Specialties</p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {specialties.filter((s) => s.is_active).length}
              </div>
              <p className="text-sm text-muted-foreground">Active Specialties</p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="text-2xl font-bold text-primary">
                {specialties.reduce((sum, s) => sum + (s.epa_count || 0), 0)}
              </div>
              <p className="text-sm text-muted-foreground">Total EPAs</p>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={specialties}
              searchPlaceholder="Search specialties..."
            />
          )}
        </div>

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingSpecialty ? 'Edit Specialty' : 'Create Specialty'}
              </DialogTitle>
              <DialogDescription>
                {editingSpecialty
                  ? 'Update specialty details'
                  : 'Add a new medical specialty'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Specialty Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Internal Medicine"
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
                    placeholder="IM"
                    maxLength={50}
                  />
                  <p className="text-xs text-muted-foreground">
                    Unique identifier (2-50 characters)
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Brief description of the specialty..."
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_active: checked })
                  }
                />
                <Label htmlFor="is_active" className="cursor-pointer">
                  Active (visible to users)
                </Label>
              </div>

              {!formData.is_active && (
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-900/50 dark:bg-yellow-900/20">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    Inactive specialties and their EPAs won't be visible to non-admin users.
                  </p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : editingSpecialty ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Specialty</DialogTitle>
              <DialogDescription>
                {deletingSpecialty?.epa_count && deletingSpecialty.epa_count > 0 ? (
                  <>
                    Cannot delete "{deletingSpecialty.name}" because it has{' '}
                    <strong>{deletingSpecialty.epa_count} EPA(s)</strong>. Please remove or
                    reassign the EPAs first.
                  </>
                ) : (
                  <>
                    Are you sure you want to delete "{deletingSpecialty?.name}"? This action
                    cannot be undone.
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                {deletingSpecialty?.epa_count && deletingSpecialty.epa_count > 0
                  ? 'Close'
                  : 'Cancel'}
              </Button>
              {(!deletingSpecialty?.epa_count || deletingSpecialty.epa_count === 0) && (
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

export default Specialties;

