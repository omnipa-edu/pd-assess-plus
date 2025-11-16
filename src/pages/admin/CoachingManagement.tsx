/**
 * Coaching Corner Admin Dashboard
 * Simplified interface for managing coaching content
 */
import { useState, useMemo } from 'react';
import { Plus, Edit, Trash2, Eye, Power, PowerOff, Search } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ProtectedAdminRoute } from '@/components/admin/ProtectedAdminRoute';
import { CoachingEditor } from '@/components/coaching/CoachingEditor';
import { CoachingCornerCard } from '@/components/coaching/CoachingCornerCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import {
  useCoachingCornerList,
  useUpsertCoaching,
  useDeleteCoaching,
  type CoachingItem,
} from '@/hooks/useCoachingCorner';
import { cn } from '@/lib/utils';

const CoachingManagement = () => {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<CoachingItem | null>(null);
  const [editingItem, setEditingItem] = useState<CoachingItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // Filters
  const [audienceFilter, setAudienceFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const { data: items, isLoading } = useCoachingCornerList();
  const upsertMutation = useUpsertCoaching();
  const deleteMutation = useDeleteCoaching();
  const { toast } = useToast();

  // Filter and search items
  const filteredItems = useMemo(() => {
    if (!items) return [];
    
    return items.filter((item) => {
      // Audience filter
      if (audienceFilter !== 'all' && item.audience !== audienceFilter) {
        return false;
      }
      
      // Type filter
      if (typeFilter !== 'all' && item.content_type !== typeFilter) {
        return false;
      }
      
      // Status filter
      if (statusFilter === 'active' && !item.is_active) {
        return false;
      }
      if (statusFilter === 'inactive' && item.is_active) {
        return false;
      }
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = item.title?.toLowerCase().includes(query);
        const matchesBody = item.body?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesBody) {
          return false;
        }
      }
      
      return true;
    });
  }, [items, audienceFilter, typeFilter, statusFilter, searchQuery]);

  const handleCreate = () => {
    setEditingItem(null);
    setIsEditorOpen(true);
  };

  const handleEdit = (item: CoachingItem) => {
    setEditingItem(item);
    setIsEditorOpen(true);
  };

  const handlePreview = (item: CoachingItem) => {
    setPreviewItem(item);
  };

  const handleToggleActive = async (item: CoachingItem) => {
    try {
      await upsertMutation.mutateAsync({
        ...item,
        is_active: !item.is_active,
      });
      toast({
        title: 'Success',
        description: item.is_active ? 'Item deactivated' : 'Item activated',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update status',
        variant: 'destructive',
      });
    }
  };

  const handleSave = async (data: Partial<CoachingItem>) => {
    try {
      await upsertMutation.mutateAsync(data);
      toast({
        title: 'Success',
        description: editingItem ? 'Coaching content updated' : 'Coaching content created',
      });
      setIsEditorOpen(false);
      setEditingItem(null);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save coaching content',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast({
        title: 'Deleted',
        description: 'Coaching content removed successfully',
      });
      setDeletingId(null);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete coaching content',
        variant: 'destructive',
      });
    }
  };

  return (
    <ProtectedAdminRoute>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Coaching Corner Content</h1>
              <p className="mt-2 text-muted-foreground">
                Manage coaching content for learners and supervisors
              </p>
            </div>
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              New Coaching Item
            </Button>
          </div>

          {/* Filters Toolbar */}
          <div className="flex flex-col gap-4 rounded-lg border bg-card p-4 md:flex-row md:items-center">
            <div className="flex flex-1 flex-wrap gap-3">
              {/* Audience Filter */}
              <Select value={audienceFilter} onValueChange={setAudienceFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Audience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Audiences</SelectItem>
                  <SelectItem value="learners">Learners</SelectItem>
                  <SelectItem value="supervisors">Supervisors</SelectItem>
                </SelectContent>
              </Select>

              {/* Type Filter */}
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="youtube">Video</SelectItem>
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>

              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by title or content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="rounded-md border p-8 text-center text-muted-foreground">
              Loading...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="rounded-md border p-8 text-center text-muted-foreground">
              {items?.length === 0
                ? 'No coaching content yet. Create your first item to get started!'
                : 'No items match your filters.'}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Audience</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Start/End Dates</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {item.audience}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">
                          {item.content_type === 'youtube' ? 'Video' : 'Text'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={item.is_active ? 'default' : 'secondary'}
                          className={cn(
                            item.is_active && 'bg-green-600 dark:bg-green-500'
                          )}
                        >
                          {item.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {item.start_at
                          ? new Date(item.start_at).toLocaleDateString()
                          : 'Now'}
                        {item.end_at && ` - ${new Date(item.end_at).toLocaleDateString()}`}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handlePreview(item)}
                            aria-label="Preview"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(item)}
                            aria-label="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleActive(item)}
                            aria-label={item.is_active ? 'Deactivate' : 'Activate'}
                          >
                            {item.is_active ? (
                              <PowerOff className="h-4 w-4" />
                            ) : (
                              <Power className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingId(item.id)}
                            aria-label="Delete"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Editor Dialog */}
          <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? 'Edit Coaching Content' : 'New Coaching Item'}
                </DialogTitle>
                <DialogDescription>
                  Create or edit coaching content for learners and supervisors
                </DialogDescription>
              </DialogHeader>
              <CoachingEditor
                initialData={editingItem || undefined}
                onSave={handleSave}
                onCancel={() => {
                  setIsEditorOpen(false);
                  setEditingItem(null);
                }}
                loading={upsertMutation.isPending}
              />
            </DialogContent>
          </Dialog>

          {/* Preview Dialog */}
          <Dialog open={!!previewItem} onOpenChange={() => setPreviewItem(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Preview</DialogTitle>
                <DialogDescription>
                  How this content will appear to users
                </DialogDescription>
              </DialogHeader>
              {previewItem && (
                <div className="max-h-[70vh] overflow-y-auto">
                  <CoachingCornerCard item={previewItem} />
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation */}
          <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete this coaching item. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deletingId && handleDelete(deletingId)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </AdminLayout>
    </ProtectedAdminRoute>
  );
};

export default CoachingManagement;
