/**
 * EPAs Page
 * CRUD operations for Entrustable Professional Activities with bulk actions
 */

import { useEffect, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Edit, Trash2, Plus, Archive, CheckCircle2 } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { writeAudit } from '@/lib/admin/audit';

interface Specialty {
  id: string;
  name: string;
  code: string;
}

interface EPA {
  id: string;
  specialty_id: string;
  code: string;
  title: string;
  description: string;
  ksa: any;
  version: string;
  status: 'draft' | 'active' | 'retired';
  created_at: string;
  updated_at: string;
  specialties: Specialty;
}

interface EPAFormData {
  specialty_id: string;
  code: string;
  title: string;
  description: string;
  ksa: string; // JSON string
  version: string;
  status: 'draft' | 'active' | 'retired';
}

const EPAs = () => {
  const [epas, setEpas] = useState<EPA[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingEPA, setEditingEPA] = useState<EPA | null>(null);
  const [deletingEPA, setDeletingEPA] = useState<EPA | null>(null);
  const [filterSpecialty, setFilterSpecialty] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedEPAs, setSelectedEPAs] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState<EPAFormData>({
    specialty_id: '',
    code: '',
    title: '',
    description: '',
    ksa: '',
    version: 'v1',
    status: 'draft',
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [epasResponse, specialtiesResponse] = await Promise.all([
        supabase
          .from('epas')
          .select('*, specialties(id, name, code)')
          .order('code'),
        supabase
          .from('specialties')
          .select('id, name, code')
          .eq('is_active', true)
          .order('name'),
      ]);

      if (epasResponse.error) throw epasResponse.error;
      if (specialtiesResponse.error) throw specialtiesResponse.error;

      setEpas(epasResponse.data || []);
      setSpecialties(specialtiesResponse.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load EPAs',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingEPA(null);
    setFormData({
      specialty_id: specialties[0]?.id || '',
      code: '',
      title: '',
      description: '',
      ksa: '',
      version: 'v1',
      status: 'draft',
    });
    setDialogOpen(true);
  };

  const handleEdit = (epa: EPA) => {
    setEditingEPA(epa);
    setFormData({
      specialty_id: epa.specialty_id,
      code: epa.code,
      title: epa.title,
      description: epa.description,
      ksa: epa.ksa ? JSON.stringify(epa.ksa, null, 2) : '',
      version: epa.version,
      status: epa.status,
    });
    setDialogOpen(true);
  };

  const handleDelete = (epa: EPA) => {
    setDeletingEPA(epa);
    setDeleteDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.code || !formData.title || !formData.description || !formData.specialty_id) {
      toast({
        title: 'Validation Error',
        description: 'Code, title, description, and specialty are required',
        variant: 'destructive',
      });
      return;
    }

    // Validate KSA JSON if provided
    let ksaObject = null;
    if (formData.ksa.trim()) {
      try {
        ksaObject = JSON.parse(formData.ksa);
      } catch (error) {
        toast({
          title: 'Validation Error',
          description: 'KSA must be valid JSON',
          variant: 'destructive',
        });
        return;
      }
    }

    setSaving(true);
    try {
      if (editingEPA) {
        // Update
        const { error } = await supabase
          .from('epas')
          .update({
            specialty_id: formData.specialty_id,
            code: formData.code,
            title: formData.title,
            description: formData.description,
            ksa: ksaObject,
            version: formData.version,
            status: formData.status,
          })
          .eq('id', editingEPA.id);

        if (error) throw error;

        // Audit log
        await writeAudit({
          action: 'update',
          entity: 'epas',
          entityId: editingEPA.id,
          diff: {
            before: {
              specialty_id: editingEPA.specialty_id,
              code: editingEPA.code,
              title: editingEPA.title,
              status: editingEPA.status,
            },
            after: {
              specialty_id: formData.specialty_id,
              code: formData.code,
              title: formData.title,
              status: formData.status,
            },
          },
        });

        toast({
          title: 'Success',
          description: 'EPA updated successfully',
        });
      } else {
        // Create
        const { data, error } = await supabase
          .from('epas')
          .insert({
            specialty_id: formData.specialty_id,
            code: formData.code,
            title: formData.title,
            description: formData.description,
            ksa: ksaObject,
            version: formData.version,
            status: formData.status,
          })
          .select()
          .single();

        if (error) throw error;

        // Audit log
        await writeAudit({
          action: 'create',
          entity: 'epas',
          entityId: data.id,
          diff: {
            after: {
              specialty_id: formData.specialty_id,
              code: formData.code,
              title: formData.title,
              status: formData.status,
            },
          },
        });

        toast({
          title: 'Success',
          description: 'EPA created successfully',
        });
      }

      setDialogOpen(false);
      loadData();
    } catch (error: any) {
      console.error('Error saving EPA:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save EPA',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingEPA) return;

    // Only allow hard delete for drafts
    if (deletingEPA.status !== 'draft') {
      toast({
        title: 'Cannot Delete',
        description: 'Only draft EPAs can be deleted. Set status to retired instead.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('epas')
        .delete()
        .eq('id', deletingEPA.id);

      if (error) throw error;

      // Audit log
      await writeAudit({
        action: 'delete',
        entity: 'epas',
        entityId: deletingEPA.id,
        diff: {
          before: {
            code: deletingEPA.code,
            title: deletingEPA.title,
            status: deletingEPA.status,
          },
        },
      });

      toast({
        title: 'Success',
        description: 'EPA deleted successfully',
      });

      setDeleteDialogOpen(false);
      loadData();
    } catch (error: any) {
      console.error('Error deleting EPA:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete EPA',
        variant: 'destructive',
      });
    }
  };

  const handleBulkAction = async (action: 'activate' | 'retire') => {
    if (selectedEPAs.size === 0) {
      toast({
        title: 'No Selection',
        description: 'Please select EPAs to perform bulk actions',
        variant: 'destructive',
      });
      return;
    }

    const newStatus = action === 'activate' ? 'active' : 'retired';

    try {
      const ids = Array.from(selectedEPAs);
      const { error } = await supabase
        .from('epas')
        .update({ status: newStatus })
        .in('id', ids);

      if (error) throw error;

      // Audit log for bulk action
      await writeAudit({
        action: 'bulk_update',
        entity: 'epas',
        entityId: ids[0],
        metadata: {
          affected_count: ids.length,
          action: action,
          epa_ids: ids,
        },
      });

      toast({
        title: 'Success',
        description: `${ids.length} EPA(s) ${action === 'activate' ? 'activated' : 'retired'}`,
      });

      setSelectedEPAs(new Set());
      loadData();
    } catch (error: any) {
      console.error('Error performing bulk action:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to perform bulk action',
        variant: 'destructive',
      });
    }
  };

  const toggleSelectEPA = (id: string) => {
    const newSelected = new Set(selectedEPAs);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedEPAs(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedEPAs.size === filteredEPAs.length) {
      setSelectedEPAs(new Set());
    } else {
      setSelectedEPAs(new Set(filteredEPAs.map((e) => e.id)));
    }
  };

  const filteredEPAs = epas.filter((epa) => {
    const matchesSpecialty = filterSpecialty === 'all' || epa.specialty_id === filterSpecialty;
    const matchesStatus = filterStatus === 'all' || epa.status === filterStatus;
    return matchesSpecialty && matchesStatus;
  });

  const columns: ColumnDef<EPA>[] = [
    {
      id: 'select',
      header: () => (
        <Checkbox
          checked={selectedEPAs.size === filteredEPAs.length && filteredEPAs.length > 0}
          onCheckedChange={toggleSelectAll}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={selectedEPAs.has(row.original.id)}
          onCheckedChange={() => toggleSelectEPA(row.original.id)}
        />
      ),
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
      accessorKey: 'title',
      header: 'Title',
      cell: ({ row }) => (
        <div className="max-w-md">
          <p className="font-medium">{row.original.title}</p>
          <p className="line-clamp-1 text-xs text-muted-foreground">
            {row.original.description}
          </p>
        </div>
      ),
    },
    {
      id: 'specialty',
      header: 'Specialty',
      cell: ({ row }) => (
        <Badge variant="secondary">
          {row.original.specialties.name}
        </Badge>
      ),
    },
    {
      accessorKey: 'version',
      header: 'Version',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.version}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const statusColors = {
          draft: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
          active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
          retired: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
        };
        return (
          <Badge className={statusColors[row.original.status]}>
            {row.original.status}
          </Badge>
        );
      },
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
            disabled={row.original.status !== 'draft'}
          >
            <Trash2
              className={`h-4 w-4 ${
                row.original.status !== 'draft'
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
              <h1 className="text-3xl font-bold text-foreground">EPAs</h1>
              <p className="mt-2 text-muted-foreground">
                Manage Entrustable Professional Activities
              </p>
            </div>
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Add EPA
            </Button>
          </div>

          {/* Stats & Filters */}
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-lg border bg-card p-4">
              <div className="text-2xl font-bold text-foreground">{epas.length}</div>
              <p className="text-sm text-muted-foreground">Total EPAs</p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {epas.filter((e) => e.status === 'active').length}
              </div>
              <p className="text-sm text-muted-foreground">Active</p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                {epas.filter((e) => e.status === 'draft').length}
              </div>
              <p className="text-sm text-muted-foreground">Drafts</p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {epas.filter((e) => e.status === 'retired').length}
              </div>
              <p className="text-sm text-muted-foreground">Retired</p>
            </div>
          </div>

          {/* Filters & Bulk Actions */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Label className="whitespace-nowrap">Specialty:</Label>
              <Select value={filterSpecialty} onValueChange={setFilterSpecialty}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Specialties</SelectItem>
                  {specialties.map((spec) => (
                    <SelectItem key={spec.id} value={spec.id}>
                      {spec.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Label className="whitespace-nowrap">Status:</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="retired">Retired</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedEPAs.size > 0 && (
              <div className="ml-auto flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {selectedEPAs.size} selected
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction('activate')}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Activate
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction('retire')}
                >
                  <Archive className="mr-2 h-4 w-4" />
                  Retire
                </Button>
              </div>
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
              data={filteredEPAs}
              searchPlaceholder="Search EPAs..."
            />
          )}
        </div>

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingEPA ? 'Edit EPA' : 'Create EPA'}</DialogTitle>
              <DialogDescription>
                {editingEPA ? 'Update EPA details' : 'Add a new Entrustable Professional Activity'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="specialty">Specialty *</Label>
                  <Select
                    value={formData.specialty_id}
                    onValueChange={(value) => setFormData({ ...formData, specialty_id: value })}
                  >
                    <SelectTrigger id="specialty">
                      <SelectValue placeholder="Select specialty" />
                    </SelectTrigger>
                    <SelectContent>
                      {specialties.map((spec) => (
                        <SelectItem key={spec.id} value={spec.id}>
                          {spec.name} ({spec.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="code">EPA Code *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="EPA-1.1"
                    maxLength={32}
                  />
                  <p className="text-xs text-muted-foreground">
                    Unique within specialty (2-32 characters)
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Taking a clinical history"
                  maxLength={200}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed description of the EPA..."
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">10-5000 characters</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ksa">KSA (Knowledge, Skills, Attitudes) - JSON</Label>
                <Textarea
                  id="ksa"
                  value={formData.ksa}
                  onChange={(e) => setFormData({ ...formData, ksa: e.target.value })}
                  placeholder='{"knowledge": ["..."], "skills": ["..."], "attitudes": ["..."]}'
                  rows={6}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">Optional. Must be valid JSON if provided.</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="version">Version</Label>
                  <Input
                    id="version"
                    value={formData.version}
                    onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                    placeholder="v1"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: 'draft' | 'active' | 'retired') =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="retired">Retired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : editingEPA ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete EPA</DialogTitle>
              <DialogDescription>
                {deletingEPA?.status !== 'draft' ? (
                  <>
                    Cannot delete "{deletingEPA?.code}" because it's {deletingEPA?.status}. Only draft EPAs can be deleted. Set status to retired instead.
                  </>
                ) : (
                  <>
                    Are you sure you want to delete "{deletingEPA?.code}"? This action cannot be undone.
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                {deletingEPA?.status !== 'draft' ? 'Close' : 'Cancel'}
              </Button>
              {deletingEPA?.status === 'draft' && (
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

export default EPAs;

