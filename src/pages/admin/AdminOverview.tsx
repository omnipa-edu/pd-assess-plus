/**
 * AdminOverview Page
 * Main dashboard for administrators with key metrics and quick actions
 */

import { useEffect, useState } from 'react';

import {
  Building2,
  Users,
  GraduationCap,
  FileText,
  Upload,
  TrendingUp,
  Activity
} from 'lucide-react';
import { Link , useNavigate } from 'react-router-dom';

import { AdminLayout } from '@/components/admin/AdminLayout';
import { ProtectedAdminRoute } from '@/components/admin/ProtectedAdminRoute';
import { OnboardingChecklist } from '@/components/onboarding/OnboardingChecklist';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardGridSkeleton } from '@/components/ui/skeleton-loaders';
import { supabase } from '@/integrations/supabase/client';


interface Stats {
  institutions: number;
  departments: number;
  users: number;
  supervisors: number;
  specialties: number;
  epas: number;
}

const AdminOverview = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    institutions: 0,
    departments: 0,
    users: 0,
    supervisors: 0,
    specialties: 0,
    epas: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [
        institutions,
        departments,
        users,
        supervisors,
        specialties,
        epas
      ] = await Promise.all([
        supabase.from('institutions').select('*', { count: 'exact', head: true }),
        supabase.from('departments').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('user_roles').select('*', { count: 'exact', head: true }).eq('role', 'supervisor'),
        supabase.from('specialties').select('*', { count: 'exact', head: true }),
        supabase.from('epas').select('*', { count: 'exact', head: true }).eq('status', 'active')
      ]);

      setStats({
        institutions: institutions.count || 0,
        departments: departments.count || 0,
        users: users.count || 0,
        supervisors: supervisors.count || 0,
        specialties: specialties.count || 0,
        epas: epas.count || 0
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Institutions',
      value: stats.institutions,
      icon: Building2,
      href: '/admin/institutions',
      color: 'text-blue-600 dark:text-blue-400'
    },
    {
      title: 'Departments',
      value: stats.departments,
      icon: Building2,
      href: '/admin/departments',
      color: 'text-purple-600 dark:text-purple-400'
    },
    {
      title: 'Users',
      value: stats.users,
      icon: Users,
      href: '/admin/users',
      color: 'text-green-600 dark:text-green-400'
    },
    {
      title: 'Supervisors',
      value: stats.supervisors,
      icon: GraduationCap,
      href: '/admin/supervisors',
      color: 'text-orange-600 dark:text-orange-400'
    },
    {
      title: 'Specialties',
      value: stats.specialties,
      icon: FileText,
      href: '/admin/specialties',
      color: 'text-pink-600 dark:text-pink-400'
    },
    {
      title: 'Active EPAs',
      value: stats.epas,
      icon: FileText,
      href: '/admin/epas',
      color: 'text-cyan-600 dark:text-cyan-400'
    }
  ];

  const quickActions = [
    {
      title: 'Import EPAs',
      description: 'Bulk import EPAs from Excel, Word, or CSV files',
      icon: Upload,
      href: '/admin/epas/import',
      color: 'bg-primary text-primary-foreground'
    },
    {
      title: 'Coaching Corner',
      description: 'Create and manage coaching content for dashboards',
      icon: Upload,
      href: '/admin/coaching',
      color: 'bg-amber-600 text-white dark:bg-amber-700'
    },
    {
      title: 'Add Specialty',
      description: 'Create a new medical specialty',
      icon: FileText,
      href: '/admin/specialties',
      color: 'bg-green-600 text-white dark:bg-green-700'
    },
    {
      title: 'Add User',
      description: 'Create a new user account',
      icon: Users,
      href: '/admin/users',
      color: 'bg-blue-600 text-white dark:bg-blue-700'
    }
  ];

  return (
    <ProtectedAdminRoute>
      <AdminLayout>
        <div className="space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Console</h1>
            <p className="mt-2 text-muted-foreground">
              Manage users, organizations, and assessment frameworks
            </p>
          </div>

          {/* Onboarding Checklist */}
          <OnboardingChecklist 
            onTaskClick={(taskId) => {
              if (taskId === 'configure_institution') {
                navigate('/admin/institutions');
              } else if (taskId === 'import_epas') {
                navigate('/admin/epas/import');
              } else if (taskId === 'manage_users') {
                navigate('/admin/users');
              } else if (taskId === 'setup_promo_codes') {
                navigate('/admin/promo-codes');
              }
            }}
          />

          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {statCards.map((stat) => {
              const Icon = stat.icon;
              return (
                <Link key={stat.title} to={stat.href}>
                  <Card className="transition-all hover:shadow-lg dark:hover:shadow-primary/10">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        {stat.title}
                      </CardTitle>
                      <Icon className={`h-4 w-4 ${stat.color}`} />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {loading ? '...' : stat.value}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Click to manage
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div>
            <h2 className="mb-4 text-xl font-semibold text-foreground">Quick Actions</h2>
            <div className="grid gap-4 md:grid-cols-3">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link key={action.title} to={action.href}>
                    <Card className="transition-all hover:shadow-lg dark:hover:shadow-primary/10">
                      <CardHeader>
                        <div className={`mb-3 inline-flex h-12 w-12 items-center justify-center rounded-lg ${action.color}`}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <CardTitle className="text-lg">{action.title}</CardTitle>
                        <CardDescription>{action.description}</CardDescription>
                      </CardHeader>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Recent Activity Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>Latest changes to the system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <p className="text-sm">Activity log will appear here</p>
              </div>
              <div className="flex justify-end">
                <Link to="/admin/activity">
                  <Button variant="outline" size="sm">
                    View All Activity
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </ProtectedAdminRoute>
  );
};

export default AdminOverview;

