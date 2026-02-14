/**
 * Procedures Page
 * CRUD for procedure types used in direct observation assessments
 */

import { useEffect, useState } from 'react';

import { type ColumnDef } from '@tanstack/react-table';
import { Edit, Trash2, Plus, Archive, CheckCircle2 } from 'lucide-react';

import { AdminLayout } from '@/components/admin/AdminLayout';
import { DataTable } from '@/components/admin/DataTable';
import { ProtectedAdminRoute } from '@/components/admin/ProtectedAdminRoute';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { writeAudit } from '@/lib/admin/audit';

interface Procedure {
  id: string;
  code: string;
  title: string;
  description: string | null;
  status: 'draft' | 'active' | 'retired';
  created_at: string;
  updated_at: string;
}

interface ProcedureFormData {
  code: string;
  title: string;
  description: string;
  status: 'draft' | 'active' | 'retired';
}

const Procedures = () => {
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingProcedure, setEditingProcedure] = useState<Procedure | null>(null);
  const [deletingProcedure, setDeletingProcedure] = useState<Procedure | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState<ProcedureFormData>({
    code: '',
    title: '',
    description: '',
    status: 'draft',
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data, error } = await supabase
        .from('procedures')
        .select('*')
        .order('title');

      if (error) throw error;
      setProcedures((data || []) as Procedure[]);
    } catch (error) {
      console.error('Error loading procedures:', error);
      toast({
        title: 'Error',
        description: 'Failed to load procedures',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingProcedure(null);
    setFormData({
      code: '',
      title: '',
      description: '',
      status: 'draft',
    });
    setDialogOpen(true);
  };

  const handleEdit = (proc: Procedure) => {
    setEditingProcedure(proc);
    setFormData({
      code: proc.code,
      title: proc.title,
      description: proc.description || '',
      status: proc.status,
    });
    setDialogOpen(true);
  };

  const handleDelete = (proc: Procedure) => {
    setDeletingProcedure(proc);
    setDeleteDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.code?.trim() || !formData.title?.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Code and title are required',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        code: formData.code.trim(),
        title: formData.title.trim(),
        description: formData.description?.trim() || null,
        status: formData.status,
      };

      if (editingProcedure) {
        const { error } = await supabase
          .from('procedures')
          .update(payload)
          .eq('id', editingProcedure.id);

        if (error) throw error;

        await writeAudit({
          action: 'update',
          entity: 'procedures',
          entityId: editingProcedure.id,
          diff: {
            before: {
              code: editingProcedure.code,
              title: editingProcedure.title,
              status: editingProcedure.status,
            },
            after: payload,
          },
        });

        toast({ title: 'Success', description: 'Procedure updated successfully' });
      } else {
        const { data, error } = await supabase
          .from('procedures')
          .insert(payload)
          .select()
          .single();

        if (error) throw error;

        await writeAudit({
          action: 'create',
          entity: 'procedures',
          entityId: data.id,
          diff: { after: payload },
        });

        toast({ title: 'Success', description: 'Procedure created successfully' });
      }

      setDialogOpen(false);
      loadData();
    } catch (error: any) {
      console.error('Error saving procedure:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save procedure',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingProcedure) return;

    if (deletingProcedure.status !== 'draft') {
      toast({
        title: 'Cannot Delete',
        description: 'Only draft procedures can be deleted. Set status to retired instead.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('procedures')
        .delete()
        .eq('id', deletingProcedure.id);

      if (error) throw error;

      await writeAudit({
        action: 'delete',
        entity: 'procedures',
        entityId: deletingProcedure.id,
        diff: {
          before: {
            code: deletingProcedure.code,
            title: deletingProcedure.title,
            status: deletingProcedure.status,
          },
        },
      });

      toast({ title: 'Success', description: 'Procedure deleted successfully' });
      setDeleteDialogOpen(false);
      loadData();
    } catch (error: any) {
      console.error('Error deleting procedure:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete procedure',
        variant: 'destructive',
      });
    }
  };

  const handleBulkAction = async (action: 'activate' | 'retire') => {
    if (selectedIds.size === 0) {
      toast({
        title: 'No Selection',
        description: 'Please select procedures to perform bulk actions',
        variant: 'destructive',
      });
      return;
    }

    const newStatus = action === 'activate' ? 'active' : 'retired';

    try {
      const ids = Array.from(selectedIds);
      const { error } = await supabase
        .from('procedures')
        .update({ status: newStatus })
        .in('id', ids);

      if (error) throw error;

      await writeAudit({
        action: 'bulk_update',
        entity: 'procedures',
        entityId: ids[0],
        metadata: { affected_count: ids.length, action, procedure_ids: ids },
      });

      toast({
        title: 'Success',
        description: `${ids.length} procedure(s) ${action === 'activate' ? 'activated' : 'retired'}`,
      });

      setSelectedIds(new Set());
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to perform bulk action',
        variant: 'destructive',
      });
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredProcedures.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredProcedures.map((p) => p.id)));
    }
  };

  const filteredProcedures = procedures.filter(
    (p) => filterStatus === 'all' || p.status === filterStatus
  );

  const statusColors = {
    draft: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    retired: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  };

  const columns: ColumnDef<Procedure>[] = [
    {
      id: 'select',
      header: () => (
        <Checkbox
          checked={selectedIds.size === filteredProcedures.length && filteredProcedures.length > 0}
          onCheckedChange={toggleSelectAll}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={selectedIds.has(row.original.id)}
          onCheckedChange={() => toggleSelect(row.original.id)}
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
          {row.original.description && (
            <p className="line-clamp-1 text-xs text-muted-foreground">
              {row.original.description}
            </p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge className={statusColors[row.original.status]}>{row.original.status}</Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => handleEdit(row.original)}>
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
                row.original.status !== 'draft' ? 'text-muted-foreground' : 'text-destructive'
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Procedures</h1>
              <p className="mt-2 text-muted-foreground">
                Manage procedure types for direct observation assessments
              </p>
            </div>
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Add procedure
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-lg border bg-card p-4">
              <div className="text-2xl font-bold text-foreground">{procedures.length}</div>
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {procedures.filter((p) => p.status === 'active').length}
              </div>
              <p className="text-sm text-muted-foreground">Active</p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                {procedures.filter((p) => p.status === 'draft').length}
              </div>
              <p className="text-sm text-muted-foreground">Drafts</p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {procedures.filter((p) => p.status === 'retired').length}
              </div>
              <p className="text-sm text-muted-foreground">Retired</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
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

            {selectedIds.size > 0 && (
              <div className="ml-auto flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{selectedIds.size} selected</span>
                <Button size="sm" variant="outline" onClick={() => handleBulkAction('activate')}>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Activate
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkAction('retire')}>
                  <Archive className="mr-2 h-4 w-4" />
                  Retire
                </Button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={filteredProcedures}
              searchPlaceholder="Search procedures..."
            />
          )}
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProcedure ? 'Edit procedure' : 'Create procedure'}</DialogTitle>
              <DialogDescription>
                {editingProcedure
                  ? 'Update procedure details'
                  : 'Add a procedure type for direct observation assessments'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="code">Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g. patient-history"
                  maxLength={64}
                />
                <p className="text-xs text-muted-foreground">Unique code (1–64 characters)</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Patient History Taking"
                  maxLength={200}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description..."
                  rows={3}
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

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : editingProcedure ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete procedure</DialogTitle>
              <DialogDescription>
                {deletingProcedure?.status !== 'draft' ? (
                  <>
                    Cannot delete &quot;{deletingProcedure?.code}&quot; because it is{' '}
                    {deletingProcedure?.status}. Only draft procedures can be deleted. Set status to
                    retired instead.
                  </>
                ) : (
                  <>
                    Are you sure you want to delete &quot;{deletingProcedure?.code}&quot;? This
                    action cannot be undone.
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                {deletingProcedure?.status !== 'draft' ? 'Close' : 'Cancel'}
              </Button>
              {deletingProcedure?.status === 'draft' && (
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

export default Procedures;
