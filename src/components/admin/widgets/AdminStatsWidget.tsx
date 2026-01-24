import { useEffect, useState } from 'react';

import { Building2, FileText, GraduationCap, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

interface Stats {
  institutions: number;
  departments: number;
  users: number;
  supervisors: number;
  specialties: number;
  epas: number;
}

export function AdminStatsWidget() {
  const [stats, setStats] = useState<Stats>({
    institutions: 0,
    departments: 0,
    users: 0,
    supervisors: 0,
    specialties: 0,
    epas: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [
          institutions,
          departments,
          users,
          supervisors,
          specialties,
          epas,
        ] = await Promise.all([
          supabase.from('institutions').select('*', { count: 'exact', head: true }),
          supabase.from('departments').select('*', { count: 'exact', head: true }),
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('user_roles').select('*', { count: 'exact', head: true }).eq('role', 'supervisor'),
          supabase.from('specialties').select('*', { count: 'exact', head: true }),
          supabase.from('epas').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        ]);

        setStats({
          institutions: institutions.count || 0,
          departments: departments.count || 0,
          users: users.count || 0,
          supervisors: supervisors.count || 0,
          specialties: specialties.count || 0,
          epas: epas.count || 0,
        });
      } catch (error) {
        console.error('Error loading admin stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  const statCards = [
    {
      title: 'Institutions',
      value: stats.institutions,
      icon: Building2,
      href: '/admin/institutions',
      color: 'text-blue-600 dark:text-blue-400',
    },
    {
      title: 'Departments',
      value: stats.departments,
      icon: Building2,
      href: '/admin/departments',
      color: 'text-purple-600 dark:text-purple-400',
    },
    {
      title: 'Users',
      value: stats.users,
      icon: Users,
      href: '/admin/users',
      color: 'text-green-600 dark:text-green-400',
    },
    {
      title: 'Supervisors',
      value: stats.supervisors,
      icon: GraduationCap,
      href: '/admin/supervisors',
      color: 'text-orange-600 dark:text-orange-400',
    },
    {
      title: 'Specialties',
      value: stats.specialties,
      icon: FileText,
      href: '/admin/specialties',
      color: 'text-pink-600 dark:text-pink-400',
    },
    {
      title: 'Active EPAs',
      value: stats.epas,
      icon: FileText,
      href: '/admin/epas',
      color: 'text-cyan-600 dark:text-cyan-400',
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Admin Overview</h2>
        <p className="text-sm text-muted-foreground">Key metrics across the platform.</p>
      </div>
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
    </div>
  );
}
