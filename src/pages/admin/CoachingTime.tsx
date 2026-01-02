import { useState, useEffect } from 'react';

import { type ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { Calendar, TrendingUp, Users, Clock } from 'lucide-react';

import { DataTable } from '@/components/admin/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type CMESession = Database['public']['Tables']['supervisor_cme_sessions']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];
type Institution = Database['public']['Tables']['institutions']['Row'];
type Department = Database['public']['Tables']['departments']['Row'];

interface SupervisorCMEStats {
  supervisor_id: string;
  supervisor_name: string;
  supervisor_email: string;
  institution_id: string | null;
  institution_name: string | null;
  department_id: string | null;
  department_name: string | null;
  total_minutes: number;
  total_hours: number;
  total_sessions: number;
}

const CoachingTime = () => {
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SupervisorCMEStats[]>([]);
  const [filteredStats, setFilteredStats] = useState<SupervisorCMEStats[]>([]);
  
  // Filters
  const currentYear = new Date().getFullYear();
  const [dateRange, setDateRange] = useState<'this_month' | 'last_3_months' | 'this_year' | 'custom'>('this_year');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [filterInstitution, setFilterInstitution] = useState<string>('all');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [filterSupervisor, setFilterSupervisor] = useState<string>('all');
  
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  // Check admin access
  useEffect(() => {
    if (user && !hasRole('admin')) {
      toast({
        title: 'Access Denied',
        description: 'This page is restricted to administrators only.',
        variant: 'destructive',
      });
    }
  }, [user, hasRole, toast]);

  // Load institutions and departments
  useEffect(() => {
    loadInstitutions();
    loadDepartments();
  }, []);

  // Load stats when filters change
  useEffect(() => {
    if (user && hasRole('admin')) {
      loadStats();
    }
  }, [user, dateRange, customStartDate, customEndDate, filterInstitution, filterDepartment, filterSupervisor]);

  const loadInstitutions = async () => {
    try {
      const { data, error } = await supabase
        .from('institutions')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      setInstitutions(data || []);
    } catch (error: any) {
      console.error('Error loading institutions:', error);
    }
  };

  const loadDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('id, name, institution_id')
        .order('name');
      
      if (error) throw error;
      setDepartments(data || []);
    } catch (error: any) {
      console.error('Error loading departments:', error);
    }
  };

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

  const loadStats = async () => {
    if (!user || !hasRole('admin')) return;
    
    try {
      setLoading(true);
      const { start, end } = getDateRange();
      const startDateStr = format(start, 'yyyy-MM-dd');
      const endDateStr = format(end, 'yyyy-MM-dd');

      // Get all CME sessions in date range (only select needed columns)
      const { data: sessions, error: sessionsError } = await supabase
        .from('supervisor_cme_sessions')
        .select('id, supervisor_id, activity_type, minutes, session_date, description')
        .gte('session_date', startDateStr)
        .lte('session_date', endDateStr)
        .order('session_date', { ascending: false });

      if (sessionsError) throw sessionsError;

      // Get all supervisor profiles
      const { data: supervisors, error: supervisorsError } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          email,
          institution_id,
          department_id,
          institutions(id, name),
          departments(id, name)
        `)
        .in('id', [...new Set((sessions || []).map(s => s.supervisor_id))]);

      if (supervisorsError) throw supervisorsError;

      // Calculate stats per supervisor
      const statsMap = new Map<string, SupervisorCMEStats>();

      (sessions || []).forEach(session => {
        const supervisor = supervisors?.find(s => s.id === session.supervisor_id);
        if (!supervisor) return;

        const existing = statsMap.get(session.supervisor_id);
        if (existing) {
          existing.total_minutes += session.minutes;
          existing.total_hours += session.minutes / 60;
          existing.total_sessions += 1;
        } else {
          statsMap.set(session.supervisor_id, {
            supervisor_id: session.supervisor_id,
            supervisor_name: supervisor.full_name || 'Unknown',
            supervisor_email: supervisor.email,
            institution_id: supervisor.institution_id,
            institution_name: (supervisor.institutions as any)?.name || null,
            department_id: supervisor.department_id,
            department_name: (supervisor.departments as any)?.name || null,
            total_minutes: session.minutes,
            total_hours: session.minutes / 60,
            total_sessions: 1,
          });
        }
      });

      let statsArray = Array.from(statsMap.values());

      // Apply filters
      if (filterInstitution !== 'all') {
        statsArray = statsArray.filter(s => s.institution_id === filterInstitution);
      }
      if (filterDepartment !== 'all') {
        statsArray = statsArray.filter(s => s.department_id === filterDepartment);
      }
      if (filterSupervisor !== 'all') {
        statsArray = statsArray.filter(s => s.supervisor_id === filterSupervisor);
      }

      // Sort by total hours descending
      statsArray.sort((a, b) => b.total_hours - a.total_hours);

      setStats(statsArray);
      setFilteredStats(statsArray);
    } catch (error: any) {
      console.error('Error loading coaching time stats:', error);
      toast({
        title: 'Error',
        description: 'Failed to load coaching time statistics',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate aggregate metrics
  const aggregateMetrics = {
    totalHours: filteredStats.reduce((sum, s) => sum + s.total_hours, 0),
    totalSessions: filteredStats.reduce((sum, s) => sum + s.total_sessions, 0),
    averageHoursPerSupervisor: filteredStats.length > 0
      ? filteredStats.reduce((sum, s) => sum + s.total_hours, 0) / filteredStats.length
      : 0,
  };

  const columns: ColumnDef<SupervisorCMEStats>[] = [
    {
      accessorKey: 'supervisor_name',
      header: 'Supervisor',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.supervisor_name}</div>
          <div className="text-sm text-muted-foreground">{row.original.supervisor_email}</div>
        </div>
      ),
    },
    {
      accessorKey: 'institution_name',
      header: 'Institution',
      cell: ({ row }) => row.original.institution_name || '-',
    },
    {
      accessorKey: 'department_name',
      header: 'Department',
      cell: ({ row }) => row.original.department_name || '-',
    },
    {
      accessorKey: 'total_hours',
      header: 'Total Hours',
      cell: ({ row }) => row.original.total_hours.toFixed(1),
    },
    {
      accessorKey: 'total_sessions',
      header: 'Sessions',
      cell: ({ row }) => row.original.total_sessions,
    },
    {
      accessorKey: 'total_minutes',
      header: 'Total Minutes',
      cell: ({ row }) => row.original.total_minutes,
    },
  ];

  if (!user || !hasRole('admin')) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <p>Access denied. Admin privileges required.</p>
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
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Coaching Time Overview</h1>
          <p className="text-muted-foreground">
            Program-level insight into supervisor coaching and feedback time
          </p>
        </div>

        {/* Aggregate Metrics */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{aggregateMetrics.totalHours.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">
                Across {filteredStats.length} supervisor{filteredStats.length !== 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{aggregateMetrics.totalSessions}</div>
              <p className="text-xs text-muted-foreground">All coaching activities</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Hours/Supervisor</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{aggregateMetrics.averageHoursPerSupervisor.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">Average per supervisor</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>
              {format(start, 'MMM d, yyyy')} - {format(end, 'MMM d, yyyy')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
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
                <Label>Institution</Label>
                <Select value={filterInstitution} onValueChange={setFilterInstitution}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {institutions.map(inst => (
                      <SelectItem key={inst.id} value={inst.id}>
                        {inst.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Department</Label>
                <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {departments
                      .filter(dept => 
                        filterInstitution === 'all' || dept.institution_id === filterInstitution
                      )
                      .map(dept => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Supervisors Table */}
        <Card>
          <CardHeader>
            <CardTitle>Supervisor Statistics</CardTitle>
            <CardDescription>
              {filteredStats.length} supervisor{filteredStats.length !== 1 ? 's' : ''} found
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
                data={filteredStats}
                emptyMessage="No coaching time data found for the selected filters."
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CoachingTime;


