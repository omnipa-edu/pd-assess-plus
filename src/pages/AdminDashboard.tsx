import { 
  Users, 
  Shield, 
  Settings,
  Database,
  Activity,
  LogOut,
  UserPlus,
  BarChart3,
  FileCheck,
  AlertTriangle
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { signOut, profile, hasRole, loading } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  // Check if user has admin role
  if (!loading && !hasRole('admin')) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="mx-4 w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mb-4 flex justify-center">
              <div className="rounded-full bg-destructive/10 p-4">
                <AlertTriangle className="h-12 w-12 text-destructive" />
              </div>
            </div>
            <CardTitle className="text-2xl">Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to access this page. This area is restricted to administrators only.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <Button onClick={() => navigate('/')} className="w-full">
              Return to Dashboard
            </Button>
            <Button variant="outline" onClick={handleSignOut} className="w-full">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: "Total Users",
      value: "127",
      change: "+12 this month",
      icon: Users,
      color: "text-primary"
    },
    {
      title: "Active Supervisors",
      value: "24",
      change: "+3 this month",
      icon: Shield,
      color: "text-accent"
    },
    {
      title: "Total Learners",
      value: "98",
      change: "+9 this month",
      icon: UserPlus,
      color: "text-success"
    },
    {
      title: "System Health",
      value: "98%",
      change: "All systems operational",
      icon: Activity,
      color: "text-assessment-good"
    }
  ];

  const managementCards = [
    {
      title: "User Management",
      description: "Manage users, roles, and permissions",
      icon: Users,
      action: "Manage Users",
      color: "bg-primary"
    },
    {
      title: "Role Assignment",
      description: "Assign and modify user roles",
      icon: Shield,
      action: "Manage Roles",
      color: "bg-accent"
    },
    {
      title: "System Settings",
      description: "Configure system preferences",
      icon: Settings,
      action: "Settings",
      color: "bg-secondary"
    },
    {
      title: "Database Management",
      description: "View and manage database",
      icon: Database,
      action: "View Database",
      color: "bg-muted"
    },
    {
      title: "Analytics & Reports",
      description: "View system analytics and generate reports",
      icon: BarChart3,
      action: "View Analytics",
      color: "bg-assessment-good"
    },
    {
      title: "Assessment Review",
      description: "Review all assessments across the platform",
      icon: FileCheck,
      action: "Review Assessments",
      color: "bg-warning"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-card">
        <div className="container mx-auto px-4 py-3 md:px-6 md:py-4">
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center sm:gap-0">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-primary sm:h-10 sm:w-10">
                <Shield className="h-5 w-5 text-white sm:h-6 sm:w-6" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground sm:text-xl md:text-2xl">WBA Tracker</h1>
                <p className="text-xs text-muted-foreground sm:text-sm">Administrator Dashboard</p>
              </div>
            </div>
            <div className="flex w-full items-center gap-2 sm:w-auto sm:gap-4">
              <div className="min-w-0 flex-1 text-left sm:flex-initial sm:text-right">
                <p className="truncate text-sm font-medium text-foreground">{profile?.full_name}</p>
                <p className="hidden truncate text-xs text-muted-foreground sm:block">{profile?.email}</p>
              </div>
              <Badge variant="secondary" className="hidden shrink-0 bg-destructive text-destructive-foreground sm:inline-flex">
                Administrator
              </Badge>
              <Button 
                variant="outline" 
                onClick={handleSignOut}
                className="shrink-0"
                size="sm"
              >
                <LogOut className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 md:px-6 md:py-8">
        {/* Statistics Grid */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:mb-8 md:grid-cols-2 md:gap-6 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <Card key={index} className="border-0 bg-gradient-card shadow-card transition-all duration-300 hover:shadow-elevated">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-muted-foreground sm:text-sm">{stat.title}</p>
                    <p className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">{stat.value}</p>
                    <p className="mt-1 truncate text-xs text-success">{stat.change}</p>
                  </div>
                  <div className={`rounded-lg bg-primary-light p-2 sm:p-3 ${stat.color} ml-2 shrink-0`}>
                    <stat.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Management Cards */}
        <div className="mb-6 md:mb-8">
          <h2 className="mb-3 text-xl font-bold text-foreground md:mb-4 md:text-2xl">System Management</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
            {managementCards.map((card, index) => (
              <Card key={index} className="border-0 bg-gradient-card shadow-card transition-all duration-300 hover:shadow-elevated">
                <CardHeader className="pb-3 md:pb-6">
                  <div className="mb-2 flex items-center space-x-2 sm:space-x-3">
                    <div className={`rounded-lg p-2 sm:p-3 ${card.color} shrink-0`}>
                      <card.icon className="h-5 w-5 text-white sm:h-6 sm:w-6" />
                    </div>
                    <CardTitle className="text-base sm:text-lg">{card.title}</CardTitle>
                  </div>
                  <CardDescription className="text-xs sm:text-sm">{card.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button className="min-h-[44px] w-full" variant="outline" size="sm">
                    {card.action}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <Card className="border-0 bg-gradient-card shadow-card">
          <CardHeader className="pb-3 md:pb-6">
            <CardTitle className="text-lg text-foreground md:text-xl">Recent System Activity</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Latest actions across the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 md:space-y-4">
              {[
                { action: "New user registered", user: "Dr. Sarah Chen", time: "2 hours ago", type: "success" },
                { action: "Role updated", user: "Dr. Michael Rodriguez", time: "4 hours ago", type: "info" },
                { action: "Assessment submitted", user: "Dr. Emily Watson", time: "6 hours ago", type: "success" },
                { action: "System backup completed", user: "System", time: "12 hours ago", type: "info" }
              ].map((activity, index) => (
                <div key={index} className="flex flex-col justify-between gap-2 rounded-lg border border-border bg-background p-3 sm:flex-row sm:items-center md:p-4">
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-semibold text-foreground md:text-base">{activity.action}</h4>
                    <p className="truncate text-xs text-muted-foreground sm:text-sm">{activity.user} • {activity.time}</p>
                  </div>
                  <Badge variant={activity.type === 'success' ? 'default' : 'secondary'} className="shrink-0 self-start sm:self-center">
                    {activity.type}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminDashboard;
