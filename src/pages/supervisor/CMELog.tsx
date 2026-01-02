import { useState, useEffect, useMemo } from 'react';

import { type ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { 
  Plus, 
  Download, 
  FileText, 
  Calendar, 
  Filter,
  ExternalLink,
  Edit,
  Trash2,
  CheckCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { DataTable } from '@/components/admin/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import {
  getSupervisorCMESessions,
  createManualCMESession,
  updateCMESession,
  deleteCMESession,
  calculateCMESummary,
  getActivityTypeLabel,
  formatDateRange,
  exportSessionsToCSV,
  downloadCSV,
  exportSessionsToPDF,
  type ActivityType,
  type CMESession,
} from '@/lib/cme-tracking';

type Profile = Database['public']['Tables']['profiles']['Row'];

const CMELog = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<CMESession[]>([]);
  const [loading, setLoading] = useState(true);
  const [supervisorProfile, setSupervisorProfile] = useState<Profile | null>(null);
  
  // Filters
  const currentYear = new Date().getFullYear();
  const [dateRange, setDateRange] = useState<'this_month' | 'last_3_months' | 'this_year' | 'custom'>('this_year');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [activityTypeFilter, setActivityTypeFilter] = useState<ActivityType | 'all'>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'auto_wba' | 'manual'>('all');
  
  // Manual entry dialog
  const [manualEntryOpen, setManualEntryOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<CMESession | null>(null);
  const [manualEntryData, setManualEntryData] = useState({
    session_date: format(new Date(), 'yyyy-MM-dd'),
    activity_type: 'direct_observation' as ActivityType,
    minutes: 10,
    description: '',
  });
  
  // PDF attestation
  const [attestationChecked, setAttestationChecked] = useState(false);

  // Load supervisor profile
  useEffect(() => {
    if (user) {
      supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
        .then(({ data, error }) => {
          if (!error && data) {
            setSupervisorProfile(data);
          }
        });
    }
  }, [user]);

  // Load sessions
  useEffect(() => {
    if (!user) return;
    loadSessions();
  }, [user, dateRange, customStartDate, customEndDate, activityTypeFilter, sourceFilter]);

  const getDateRange = () => {
    const now = new Date();
    switch (dateRange) {
      case 'this_month':
        return {
          start: new Date(now.getFullYear(), now.getMonth(), 1),
          end: new Date(now.getFullYear(), now.getMonth() + 1, 0),
        };
      case 'last_3_months':
        return {
          start: new Date(now.getFullYear(), now.getMonth() - 2, 1),
          end: new Date(now.getFullYear(), now.getMonth() + 1, 0),
        };
      case 'this_year':
        return {
          start: new Date(currentYear, 0, 1),
          end: new Date(currentYear, 11, 31),
        };
      case 'custom':
        return {
          start: customStartDate ? new Date(customStartDate) : new Date(currentYear, 0, 1),
          end: customEndDate ? new Date(customEndDate) : new Date(),
        };
    }
  };

  const loadSessions = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { start, end } = getDateRange();
      const filteredSessions = await getSupervisorCMESessions(user.id, {
        startDate: start,
        endDate: end,
        activityType: activityTypeFilter === 'all' ? undefined : activityTypeFilter,
        source: sourceFilter === 'all' ? undefined : sourceFilter,
      });
      setSessions(filteredSessions);
    } catch (error) {
      console.error('Error loading CME sessions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load CME sessions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const summary = useMemo(() => calculateCMESummary(sessions), [sessions]);

  const handleManualEntry = async () => {
    if (!user || !supervisorProfile) return;
    
    try {
      if (editingSession) {
        // Update existing session
        await updateCMESession(editingSession.id, {
          activity_type: manualEntryData.activity_type,
          minutes: manualEntryData.minutes,
          description: manualEntryData.description,
          session_date: manualEntryData.session_date,
        });
        toast({
          title: 'Success',
          description: 'CME session updated successfully',
        });
      } else {
        // Create new manual entry
        await createManualCMESession(
          user.id,
          supervisorProfile.institution_id || null,
          manualEntryData
        );
        toast({
          title: 'Success',
          description: 'CME session logged successfully',
        });
      }
      
      setManualEntryOpen(false);
      setEditingSession(null);
      setManualEntryData({
        session_date: format(new Date(), 'yyyy-MM-dd'),
        activity_type: 'direct_observation',
        minutes: 10,
        description: '',
      });
      loadSessions();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save CME session',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (session: CMESession) => {
    setEditingSession(session);
    setManualEntryData({
      session_date: session.session_date,
      activity_type: session.activity_type,
      minutes: session.minutes,
      description: session.description || '',
    });
    setManualEntryOpen(true);
  };

  const handleDelete = async (session: CMESession) => {
    if (!confirm('Are you sure you want to delete this session?')) return;
    
    try {
      await deleteCMESession(session.id);
      toast({
        title: 'Success',
        description: 'CME session deleted successfully',
      });
      loadSessions();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete CME session',
        variant: 'destructive',
      });
    }
  };

  const handleExportCSV = () => {
    const csv = exportSessionsToCSV(sessions);
    const { start, end } = getDateRange();
    const filename = `cme-log-${format(start, 'yyyy-MM-dd')}-to-${format(end, 'yyyy-MM-dd')}.csv`;
    downloadCSV(csv, filename);
    toast({
      title: 'Success',
      description: 'CSV exported successfully',
    });
  };

  const handleExportPDF = async () => {
    if (!supervisorProfile) {
      toast({
        title: 'Error',
        description: 'Supervisor profile not loaded',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { start, end } = getDateRange();
      await exportSessionsToPDF(
        sessions,
        supervisorProfile.full_name || 'Supervisor',
        null, // credentials - can be added to profile later
        null, // institution name - can be fetched from institution_id
        start,
        end,
        summary
      );
      toast({
        title: 'Success',
        description: 'PDF exported successfully',
      });
    } catch (error: any) {
      console.error('Error exporting PDF:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to export PDF',
        variant: 'destructive',
      });
    }
  };

  const columns: ColumnDef<CMESession>[] = [
    {
      accessorKey: 'session_date',
      header: 'Date',
      cell: ({ row }) => format(new Date(row.original.session_date), 'MMM d, yyyy'),
    },
    {
      accessorKey: 'activity_type',
      header: 'Activity Type',
      cell: ({ row }) => getActivityTypeLabel(row.original.activity_type),
    },
    {
      accessorKey: 'minutes',
      header: 'Minutes',
      cell: ({ row }) => row.original.minutes,
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => (
        <div className="max-w-md truncate" title={row.original.description || ''}>
          {row.original.description || '-'}
        </div>
      ),
    },
    {
      accessorKey: 'source',
      header: 'Source',
      cell: ({ row }) => (
        <Badge variant={row.original.source === 'auto_wba' ? 'default' : 'secondary'}>
          {row.original.source === 'auto_wba' ? 'Auto' : 'Manual'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const session = row.original;
        return (
          <div className="flex items-center gap-2">
            {session.wba_id && session.wba_type && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  // Navigate to WBA - route depends on wba_type
                  const route = session.wba_type === 'epa' 
                    ? `/supervisor/epa/${session.wba_id}`
                    : session.wba_type === 'direct_observation'
                    ? `/supervisor/direct-observation/${session.wba_id}`
                    : `/supervisor/narrative/${session.wba_id}`;
                  navigate(route);
                }}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            )}
            {session.source === 'manual' && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(session)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(session)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </>
            )}
            {session.source === 'auto_wba' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEdit(session)}
                title="Edit minutes and description only"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <p>Please log in to view your CME log.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { start, end } = getDateRange();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">CME Log</h1>
            <p className="text-muted-foreground">
              Track your coaching and feedback time for CME documentation
            </p>
          </div>
          <Button
            onClick={() => navigate('/supervisor')}
            variant="outline"
          >
            Back to Dashboard
          </Button>
        </div>

        {/* Summary Card */}
        <Card className="mb-6 border-0 bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle>Summary</CardTitle>
            <CardDescription>
              {supervisorProfile?.full_name || 'Supervisor'} • {formatDateRange(start, end)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Minutes</p>
                <p className="text-2xl font-bold">{summary.totalMinutes}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Hours</p>
                <p className="text-2xl font-bold">{summary.totalHours.toFixed(1)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Sessions</p>
                <p className="text-2xl font-bold">{summary.totalSessions}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Hours/Week</p>
                <p className="text-2xl font-bold">{summary.averageHoursPerWeek.toFixed(1)}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {Object.entries(summary.breakdownByActivity)
                .filter(([_, data]) => data.count > 0)
                .map(([activity, data]) => (
                  <Badge key={activity} variant="outline">
                    {getActivityTypeLabel(activity as ActivityType)}: {data.hours.toFixed(1)}h
                  </Badge>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Filters and Actions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div>
                <Label>Date Range</Label>
                <Select value={dateRange} onValueChange={(value: any) => setDateRange(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="this_month">This Month</SelectItem>
                    <SelectItem value="last_3_months">Last 3 Months</SelectItem>
                    <SelectItem value="this_year">This Year</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {dateRange === 'custom' && (
                <>
                  <div>
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                    />
                  </div>
                </>
              )}
              <div>
                <Label>Activity Type</Label>
                <Select value={activityTypeFilter} onValueChange={(value: any) => setActivityTypeFilter(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="direct_observation">Direct Observation</SelectItem>
                    <SelectItem value="chart_review">Chart Review</SelectItem>
                    <SelectItem value="end_of_rotation">End-of-Rotation</SelectItem>
                    <SelectItem value="narrative_feedback">Narrative Feedback</SelectItem>
                    <SelectItem value="group_teaching">Group Teaching</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Source</Label>
                <Select value={sourceFilter} onValueChange={(value: any) => setSourceFilter(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="auto_wba">Auto</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button
                onClick={() => {
                  setEditingSession(null);
                  setManualEntryData({
                    session_date: format(new Date(), 'yyyy-MM-dd'),
                    activity_type: 'direct_observation',
                    minutes: 10,
                    description: '',
                  });
                  setManualEntryOpen(true);
                }}
                className="bg-gradient-primary hover:opacity-90"
              >
                <Plus className="mr-2 h-4 w-4" />
                Log Coaching Time
              </Button>
              <Button onClick={handleExportCSV} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
              <Button onClick={handleExportPDF} variant="outline">
                <FileText className="mr-2 h-4 w-4" />
                Export PDF
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Sessions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Sessions</CardTitle>
            <CardDescription>
              {sessions.length} session{sessions.length !== 1 ? 's' : ''} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-pulse text-muted-foreground">Loading...</div>
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={sessions}
                emptyMessage="No CME sessions found. Click 'Log Coaching Time' to add your first entry."
              />
            )}
          </CardContent>
        </Card>

        {/* Manual Entry Dialog */}
        <Dialog open={manualEntryOpen} onOpenChange={setManualEntryOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingSession ? 'Edit CME Session' : 'Log Coaching Time'}
              </DialogTitle>
              <DialogDescription>
                {editingSession?.source === 'auto_wba' 
                  ? 'You can edit minutes and description for auto-generated entries.'
                  : 'Add a manual entry for coaching activities not captured by WBAs.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Date</Label>
                <Input
                  type="date"
                  value={manualEntryData.session_date}
                  onChange={(e) => setManualEntryData({ ...manualEntryData, session_date: e.target.value })}
                  disabled={editingSession?.source === 'auto_wba'}
                />
              </div>
              <div>
                <Label>Activity Type</Label>
                <Select
                  value={manualEntryData.activity_type}
                  onValueChange={(value: ActivityType) =>
                    setManualEntryData({ ...manualEntryData, activity_type: value })
                  }
                  disabled={editingSession?.source === 'auto_wba'}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="direct_observation">Direct Observation</SelectItem>
                    <SelectItem value="chart_review">Chart Review</SelectItem>
                    <SelectItem value="end_of_rotation">End-of-Rotation</SelectItem>
                    <SelectItem value="narrative_feedback">Narrative Feedback</SelectItem>
                    <SelectItem value="group_teaching">Group Teaching</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Minutes</Label>
                <Input
                  type="number"
                  min="1"
                  max="1440"
                  value={manualEntryData.minutes}
                  onChange={(e) =>
                    setManualEntryData({ ...manualEntryData, minutes: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={manualEntryData.description}
                  onChange={(e) =>
                    setManualEntryData({ ...manualEntryData, description: e.target.value })
                  }
                  placeholder="e.g., Post-clinic debrief with two PA students"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setManualEntryOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleManualEntry} className="bg-gradient-primary hover:opacity-90">
                {editingSession ? 'Update' : 'Save'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default CMELog;

