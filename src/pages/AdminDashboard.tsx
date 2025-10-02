import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
        <Card className="max-w-md w-full mx-4">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-destructive/10 rounded-full">
                <AlertTriangle className="w-12 h-12 text-destructive" />
              </div>
            </div>
            <CardTitle className="text-2xl">Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to access this page. This area is restricted to administrators only.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <Button onClick={() => navigate('/')} className="w-full">
              Return to Dashboard
            </Button>
            <Button variant="outline" onClick={handleSignOut} className="w-full">
              <LogOut className="h-4 w-4 mr-2" />
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
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
        <div className="container mx-auto px-4 md:px-6 py-3 md:py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-gradient-primary rounded-lg shrink-0">
                <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">WBA Tracker</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">Administrator Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
              <div className="text-left sm:text-right flex-1 sm:flex-initial min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{profile?.full_name}</p>
                <p className="text-xs text-muted-foreground hidden sm:block truncate">{profile?.email}</p>
              </div>
              <Badge variant="secondary" className="bg-destructive text-destructive-foreground hidden sm:inline-flex shrink-0">
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

      <main className="container mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="bg-gradient-card shadow-card border-0 hover:shadow-elevated transition-all duration-300">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">{stat.title}</p>
                    <p className="text-2xl sm:text-3xl font-bold text-foreground mt-1">{stat.value}</p>
                    <p className="text-xs text-success mt-1 truncate">{stat.change}</p>
                  </div>
                  <div className={`p-2 sm:p-3 rounded-lg bg-primary-light ${stat.color} shrink-0 ml-2`}>
                    <stat.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Management Cards */}
        <div className="mb-6 md:mb-8">
          <h2 className="text-xl md:text-2xl font-bold text-foreground mb-3 md:mb-4">System Management</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {managementCards.map((card, index) => (
              <Card key={index} className="bg-gradient-card shadow-card border-0 hover:shadow-elevated transition-all duration-300">
                <CardHeader className="pb-3 md:pb-6">
                  <div className="flex items-center space-x-2 sm:space-x-3 mb-2">
                    <div className={`p-2 sm:p-3 rounded-lg ${card.color} shrink-0`}>
                      <card.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <CardTitle className="text-base sm:text-lg">{card.title}</CardTitle>
                  </div>
                  <CardDescription className="text-xs sm:text-sm">{card.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button className="w-full min-h-[44px]" variant="outline" size="sm">
                    {card.action}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <Card className="bg-gradient-card shadow-card border-0">
          <CardHeader className="pb-3 md:pb-6">
            <CardTitle className="text-foreground text-lg md:text-xl">Recent System Activity</CardTitle>
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
                <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 md:p-4 bg-background rounded-lg border border-border">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-foreground text-sm md:text-base">{activity.action}</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">{activity.user} • {activity.time}</p>
                  </div>
                  <Badge variant={activity.type === 'success' ? 'default' : 'secondary'} className="self-start sm:self-center shrink-0">
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
