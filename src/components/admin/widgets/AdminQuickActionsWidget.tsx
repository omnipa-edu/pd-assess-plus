import { BookOpen, FileText, Upload, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function AdminQuickActionsWidget() {
  const quickActions = [
    {
      title: 'Import EPAs',
      description: 'Bulk import EPAs from Excel, Word, or CSV files',
      icon: Upload,
      href: '/admin/epas/import',
      color: 'bg-primary text-primary-foreground',
    },
    {
      title: 'Coaching Corner',
      description: 'Create and manage coaching content for dashboards',
      icon: Upload,
      href: '/admin/coaching',
      color: 'bg-amber-600 text-white dark:bg-amber-700',
    },
    {
      title: 'Resource Library',
      description: 'View and manage curated resources for learners',
      icon: BookOpen,
      href: '/admin/resources',
      color: 'bg-violet-600 text-white dark:bg-violet-700',
    },
    {
      title: 'Add Specialty',
      description: 'Create a new medical specialty',
      icon: FileText,
      href: '/admin/specialties',
      color: 'bg-green-600 text-white dark:bg-green-700',
    },
    {
      title: 'Add User',
      description: 'Create a new user account',
      icon: Users,
      href: '/admin/users',
      color: 'bg-blue-600 text-white dark:bg-blue-700',
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Quick Actions</h2>
        <p className="text-sm text-muted-foreground">Jump into common admin tasks.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
  );
}
