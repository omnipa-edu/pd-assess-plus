/**
 * AdminLayout Component
 * Main layout for admin console with sidebar navigation
 */

import { useState } from 'react';

import {
  Building2,
  Users,
  GraduationCap,
  FileText,
  Upload,
  History,
  Menu,
  X,
  LogOut,
  Home,
  Settings,
  Lightbulb
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navigationSections = [
  {
    title: 'Dashboard',
    items: [
      { label: 'Overview', href: '/admin', icon: Home },
      { label: 'Activity Log', href: '/admin/activity', icon: History },
    ]
  },
  {
    title: 'Organization',
    items: [
      { label: 'Institutions', href: '/admin/institutions', icon: Building2 },
      { label: 'Departments', href: '/admin/departments', icon: Building2 },
    ]
  },
  {
    title: 'People',
    items: [
      { label: 'Users', href: '/admin/users', icon: Users },
      { label: 'Supervisors', href: '/admin/supervisors', icon: GraduationCap },
    ]
  },
  {
    title: 'Assessment Framework',
    items: [
      { label: 'Specialties', href: '/admin/specialties', icon: FileText },
      { label: 'EPAs', href: '/admin/epas', icon: FileText },
      { label: 'Procedures', href: '/admin/procedures', icon: FileText },
      { label: 'Procedure Library', href: '/admin/procedure-library', icon: FileText },
      { label: 'Program Assessments', href: '/admin/program-assessments', icon: FileText },
      { label: 'Button definitions', href: '/admin/button-definitions', icon: FileText },
      { label: 'Button sets', href: '/admin/button-sets', icon: FileText },
    ]
  },
  {
    title: 'Data Management',
    items: [
      { label: 'Import EPAs', href: '/admin/epas/import', icon: Upload },
    ]
  },
  {
    title: 'Content',
    items: [
      { label: 'Coaching Corner', href: '/admin/coaching', icon: Lightbulb },
      { label: 'Resources', href: '/admin/resources', icon: FileText },
    ]
  },
  {
    title: 'Billing',
    items: [
      { label: 'Promo Codes', href: '/admin/promo-codes', icon: Settings },
    ]
  },
];

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const isActive = (href: string) => {
    if (href === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform border-r bg-card transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-16 items-center justify-between border-b px-6">
            <Link to="/admin" className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/70">
                <Settings className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold text-foreground">Admin Console</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <div className="space-y-6">
              {navigationSections.map((section) => (
                <div key={section.title}>
                  <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {section.title}
                  </h3>
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.href);
                      
                      return (
                        <Link
                          key={item.href}
                          to={item.href}
                          onClick={() => setSidebarOpen(false)}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                            active
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          <span>{item.label}</span>
                          {item.badge && (
                            <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </nav>

          {/* Footer */}
          <div className="border-t p-4">
            <div className="flex items-center justify-between">
              <ThemeToggle />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-16 items-center justify-between border-b bg-card px-6 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-muted-foreground hover:text-foreground"
          >
            <Menu className="h-6 w-6" />
          </button>
          <span className="text-lg font-bold">Admin</span>
          <div className="w-6" /> {/* Spacer for flex alignment */}
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

