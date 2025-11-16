/**
 * Promo Codes Page
 * Admin interface for creating and managing promo codes
 */

import { useEffect, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Edit, Trash2, Plus, Tag, Copy, Sparkles } from 'lucide-react';
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
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { writeAudit } from '@/lib/admin/audit';
import { format } from 'date-fns';

interface PromoCode {
  id: string;
  code: string;
  description: string | null;
  discount_percent: number;
  free_access: boolean;
  free_duration_days: number | null;
  max_uses: number;
  used_count: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

interface PromoFormData {
  code: string;
  description: string;
  discount_percent: number;
  free_access: boolean;
  free_duration_days: number | null;
  max_uses: number;
  expires_at: string;
  is_active: boolean;
}

const PromoCodes = () => {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null);
  const [deletingPromo, setDeletingPromo] = useState<PromoCode | null>(null);
  const [formData, setFormData] = useState<PromoFormData>({
    code: '',
    description: '',
    discount_percent: 0,
    free_access: false,
    free_duration_days: null,
    max_uses: 100,
    expires_at: '',
    is_active: true,
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadPromoCodes();
  }, []);

  const loadPromoCodes = async () => {
    try {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPromoCodes(data || []);
    } catch (error) {
      console.error('Error loading promo codes:', error);
      toast({
        title: 'Error',
        description: 'Failed to load promo codes',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing chars
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, code });
  };

  const handleCreate = () => {
    setEditingPromo(null);
    setFormData({
      code: '',
      description: '',
      discount_percent: 0,
      free_access: false,
      free_duration_days: null,
      max_uses: 100,
      expires_at: '',
      is_active: true,
    });
    setDialogOpen(true);
  };

  const handleEdit = (promo: PromoCode) => {
    setEditingPromo(promo);
    setFormData({
      code: promo.code,
      description: promo.description || '',
      discount_percent: promo.discount_percent,
      free_access: promo.free_access,
      free_duration_days: promo.free_duration_days,
      max_uses: promo.max_uses,
      expires_at: promo.expires_at ? promo.expires_at.split('T')[0] : '',
      is_active: promo.is_active,
    });
    setDialogOpen(true);
  };

  const handleDelete = (promo: PromoCode) => {
    setDeletingPromo(promo);
    setDeleteDialogOpen(true);
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: 'Copied!',
      description: `Promo code "${code}" copied to clipboard`,
    });
  };

  const handleSave = async () => {
    if (!formData.code) {
      toast({
        title: 'Validation Error',
        description: 'Code is required',
        variant: 'destructive',
      });
      return;
    }

    // Validation
    if (!formData.free_access && formData.discount_percent === 0) {
      toast({
        title: 'Validation Error',
        description: 'Either set discount percentage or enable free access',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      if (editingPromo) {
        // Update
        const { error } = await supabase
          .from('promo_codes')
          .update({
            code: formData.code.toUpperCase(),
            description: formData.description || null,
            discount_percent: formData.discount_percent,
            free_access: formData.free_access,
            free_duration_days: formData.free_access ? formData.free_duration_days : null,
            max_uses: formData.max_uses,
            expires_at: formData.expires_at || null,
            is_active: formData.is_active,
          })
          .eq('id', editingPromo.id);

        if (error) throw error;

        // Audit log
        await writeAudit({
          action: 'update',
          entity: 'promo_codes',
          entityId: editingPromo.id,
          diff: {
            before: {
              code: editingPromo.code,
              discount_percent: editingPromo.discount_percent,
              free_access: editingPromo.free_access,
              is_active: editingPromo.is_active,
            },
            after: {
              code: formData.code,
              discount_percent: formData.discount_percent,
              free_access: formData.free_access,
              is_active: formData.is_active,
            },
          },
        });

        toast({
          title: 'Success',
          description: 'Promo code updated successfully',
        });
      } else {
        // Create
        const { data, error } = await supabase
          .from('promo_codes')
          .insert({
            code: formData.code.toUpperCase(),
            description: formData.description || null,
            discount_percent: formData.discount_percent,
            free_access: formData.free_access,
            free_duration_days: formData.free_access ? formData.free_duration_days : null,
            max_uses: formData.max_uses,
            expires_at: formData.expires_at || null,
            is_active: formData.is_active,
          })
          .select()
          .single();

        if (error) throw error;

        // Audit log
        await writeAudit({
          action: 'create',
          entity: 'promo_codes',
          entityId: data.id,
          diff: {
            after: {
              code: formData.code,
              discount_percent: formData.discount_percent,
              free_access: formData.free_access,
            },
          },
        });

        toast({
          title: 'Success',
          description: 'Promo code created successfully',
        });
      }

      setDialogOpen(false);
      loadPromoCodes();
    } catch (error: any) {
      console.error('Error saving promo code:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save promo code',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingPromo) return;

    try {
      const { error } = await supabase
        .from('promo_codes')
        .delete()
        .eq('id', deletingPromo.id);

      if (error) throw error;

      // Audit log
      await writeAudit({
        action: 'delete',
        entity: 'promo_codes',
        entityId: deletingPromo.id,
        diff: {
          before: {
            code: deletingPromo.code,
            discount_percent: deletingPromo.discount_percent,
            free_access: deletingPromo.free_access,
          },
        },
      });

      toast({
        title: 'Success',
        description: 'Promo code deleted successfully',
      });

      setDeleteDialogOpen(false);
      loadPromoCodes();
    } catch (error: any) {
      console.error('Error deleting promo code:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete promo code',
        variant: 'destructive',
      });
    }
  };

  const columns: ColumnDef<PromoCode>[] = [
    {
      accessorKey: 'code',
      header: 'Code',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-base">
            {row.original.code}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => copyToClipboard(row.original.code)}
          >
            <Copy className="h-3 w-3" />
          </Button>
        </div>
      ),
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => row.original.description || '—',
    },
    {
      id: 'benefit',
      header: 'Benefit',
      cell: ({ row }) => {
        if (row.original.free_access) {
          return (
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
              <Sparkles className="mr-1 h-3 w-3" />
              Free Access
              {row.original.free_duration_days && ` (${row.original.free_duration_days}d)`}
            </Badge>
          );
        }
        return (
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
            {row.original.discount_percent}% Off
          </Badge>
        );
      },
    },
    {
      id: 'usage',
      header: 'Usage',
      cell: ({ row }) => (
        <div className="text-sm">
          <span className="font-medium">{row.original.used_count}</span>
          <span className="text-muted-foreground"> / {row.original.max_uses}</span>
          {row.original.used_count >= row.original.max_uses && (
            <Badge variant="secondary" className="ml-2 text-xs">
              Full
            </Badge>
          )}
        </div>
      ),
    },
    {
      id: 'expires',
      header: 'Expires',
      cell: ({ row }) => {
        if (!row.original.expires_at) return <span className="text-muted-foreground">Never</span>;
        const isExpired = new Date(row.original.expires_at) < new Date();
        return (
          <div className={isExpired ? 'text-red-600 dark:text-red-400' : ''}>
            {format(new Date(row.original.expires_at), 'MMM d, yyyy')}
            {isExpired && <Badge variant="destructive" className="ml-2 text-xs">Expired</Badge>}
          </div>
        );
      },
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
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  const activeCount = promoCodes.filter(p => p.is_active).length;
  const totalRedemptions = promoCodes.reduce((sum, p) => sum + p.used_count, 0);

  return (
    <ProtectedAdminRoute>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Promo Codes</h1>
              <p className="mt-2 text-muted-foreground">
                Create and manage promotional codes for discounts and free access
              </p>
            </div>
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Create Promo Code
            </Button>
          </div>

          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-lg border bg-card p-4">
              <div className="text-2xl font-bold text-foreground">{promoCodes.length}</div>
              <p className="text-sm text-muted-foreground">Total Codes</p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {activeCount}
              </div>
              <p className="text-sm text-muted-foreground">Active</p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="text-2xl font-bold text-primary">{totalRedemptions}</div>
              <p className="text-sm text-muted-foreground">Total Uses</p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {promoCodes.filter(p => p.free_access).length}
              </div>
              <p className="text-sm text-muted-foreground">Free Access Codes</p>
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
              data={promoCodes}
              searchPlaceholder="Search promo codes..."
            />
          )}
        </div>

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPromo ? 'Edit Promo Code' : 'Create Promo Code'}
              </DialogTitle>
              <DialogDescription>
                {editingPromo
                  ? 'Update promo code details'
                  : 'Create a new promotional code'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="code">Code *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) =>
                        setFormData({ ...formData, code: e.target.value.toUpperCase() })
                      }
                      placeholder="WELCOME10"
                      className="font-mono uppercase"
                      maxLength={50}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={generateRandomCode}
                    >
                      <Sparkles className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    3-50 characters, will be uppercase
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_uses">Max Uses</Label>
                  <Input
                    id="max_uses"
                    type="number"
                    value={formData.max_uses}
                    onChange={(e) =>
                      setFormData({ ...formData, max_uses: parseInt(e.target.value) || 1 })
                    }
                    min={1}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g., 10% off for new users"
                  rows={2}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="free_access"
                      checked={formData.free_access}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          free_access: checked,
                          discount_percent: checked ? 0 : formData.discount_percent,
                        })
                      }
                    />
                    <Label htmlFor="free_access" className="cursor-pointer">
                      Grant Free Access
                    </Label>
                  </div>
                  {formData.free_access && (
                    <div className="pl-8 space-y-2">
                      <Label htmlFor="free_duration_days" className="text-xs">
                        Duration (days)
                      </Label>
                      <Input
                        id="free_duration_days"
                        type="number"
                        value={formData.free_duration_days || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            free_duration_days: e.target.value ? parseInt(e.target.value) : null,
                          })
                        }
                        placeholder="Leave empty for lifetime"
                        min={1}
                      />
                      <p className="text-xs text-muted-foreground">
                        Empty = lifetime access
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discount_percent">Discount %</Label>
                  <Input
                    id="discount_percent"
                    type="number"
                    value={formData.discount_percent}
                    onChange={(e) =>
                      setFormData({ ...formData, discount_percent: parseFloat(e.target.value) || 0 })
                    }
                    min={0}
                    max={100}
                    disabled={formData.free_access}
                  />
                  <p className="text-xs text-muted-foreground">
                    0-100% (disabled if free access enabled)
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="expires_at">Expiration Date</Label>
                  <Input
                    id="expires_at"
                    type="date"
                    value={formData.expires_at}
                    onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty for no expiration
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="mb-2 block">Status</Label>
                  <div className="flex items-center space-x-2 pt-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, is_active: checked })
                      }
                    />
                    <Label htmlFor="is_active" className="cursor-pointer">
                      Active
                    </Label>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : editingPromo ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Promo Code</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{deletingPromo?.code}"? This will not affect users who have already redeemed it.
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

export default PromoCodes;


