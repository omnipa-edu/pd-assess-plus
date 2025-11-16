/**
 * Activity Log Page
 * View audit trail of admin actions
 */

import { useEffect, useState } from 'react';
import { Activity, Filter } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ProtectedAdminRoute } from '@/components/admin/ProtectedAdminRoute';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';

interface AuditEntry {
  id: string;
  action: 'create' | 'update' | 'delete' | 'import' | 'bulk_update';
  entity: string;
  entity_id: string;
  diff: any;
  metadata: any;
  created_at: string;
  profiles?: {
    full_name: string;
    email: string;
  };
}

const ActivityLog = () => {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterEntity, setFilterEntity] = useState<string>('all');
  const [filterAction, setFilterAction] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    loadActivityLog();
  }, []);

  const loadActivityLog = async () => {
    try {
      const { data, error } = await supabase
        .from('audit_log')
        .select(`
          *,
          profiles:actor_user_id(full_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error('Error loading activity log:', error);
      toast({
        title: 'Error',
        description: 'Failed to load activity log',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'update':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'delete':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'import':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case 'bulk_update':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const formatEntityName = (entity: string) => {
    return entity
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const filteredEntries = entries.filter((entry) => {
    const matchesEntity = filterEntity === 'all' || entry.entity === filterEntity;
    const matchesAction = filterAction === 'all' || entry.action === filterAction;
    return matchesEntity && matchesAction;
  });

  const entities = Array.from(new Set(entries.map(e => e.entity)));

  return (
    <ProtectedAdminRoute>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Activity Log</h1>
              <p className="mt-2 text-muted-foreground">
                Audit trail of all admin actions and changes
              </p>
            </div>
            <Activity className="h-8 w-8 text-muted-foreground" />
          </div>

          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-5">
            <div className="rounded-lg border bg-card p-4">
              <div className="text-2xl font-bold text-foreground">{entries.length}</div>
              <p className="text-sm text-muted-foreground">Total Actions</p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {entries.filter(e => e.action === 'create').length}
              </div>
              <p className="text-sm text-muted-foreground">Created</p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {entries.filter(e => e.action === 'update').length}
              </div>
              <p className="text-sm text-muted-foreground">Updated</p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {entries.filter(e => e.action === 'delete').length}
              </div>
              <p className="text-sm text-muted-foreground">Deleted</p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {entries.filter(e => e.action === 'import' || e.action === 'bulk_update').length}
              </div>
              <p className="text-sm text-muted-foreground">Bulk</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4 rounded-lg border bg-card p-4">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-2">
              <Label className="whitespace-nowrap">Entity:</Label>
              <Select value={filterEntity} onValueChange={setFilterEntity}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Entities</SelectItem>
                  {entities.map(entity => (
                    <SelectItem key={entity} value={entity}>
                      {formatEntityName(entity)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Label className="whitespace-nowrap">Action:</Label>
              <Select value={filterAction} onValueChange={setFilterAction}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="create">Create</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                  <SelectItem value="import">Import</SelectItem>
                  <SelectItem value="bulk_update">Bulk Update</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(filterEntity !== 'all' || filterAction !== 'all') && (
              <Badge variant="secondary">
                {filteredEntries.length} of {entries.length} entries
              </Badge>
            )}
          </div>

          {/* Activity Timeline */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="rounded-lg border border-dashed p-12 text-center">
              <Activity className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No Activity Yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Admin actions will appear here as they occur
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-lg border bg-card p-4 transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge className={getActionColor(entry.action)}>
                          {entry.action}
                        </Badge>
                        <Badge variant="outline">
                          {formatEntityName(entry.entity)}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(entry.created_at), 'PPpp')}
                        </span>
                      </div>

                      <div className="text-sm">
                        <span className="font-medium">
                          {entry.profiles?.full_name || 'Unknown User'}
                        </span>
                        <span className="text-muted-foreground">
                          {' '}({entry.profiles?.email || 'unknown@example.com'})
                        </span>
                      </div>

                      {entry.diff && (
                        <div className="mt-2 rounded bg-muted p-3 text-xs font-mono">
                          {entry.diff.before && (
                            <div className="mb-2">
                              <span className="font-semibold">Before:</span>
                              <pre className="mt-1 overflow-x-auto">
                                {JSON.stringify(entry.diff.before, null, 2)}
                              </pre>
                            </div>
                          )}
                          {entry.diff.after && (
                            <div>
                              <span className="font-semibold">After:</span>
                              <pre className="mt-1 overflow-x-auto">
                                {JSON.stringify(entry.diff.after, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}

                      {entry.metadata && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          <span className="font-semibold">Metadata:</span>
                          <span className="ml-2">
                            {JSON.stringify(entry.metadata)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {filteredEntries.length >= 100 && (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-center dark:border-yellow-900/50 dark:bg-yellow-900/20">
              <p className="text-sm text-yellow-900 dark:text-yellow-100">
                Showing the 100 most recent entries. Older entries are archived.
              </p>
            </div>
          )}
        </div>
      </AdminLayout>
    </ProtectedAdminRoute>
  );
};

export default ActivityLog;


