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
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-primary rounded-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">WBA Tracker</h1>
                <p className="text-sm text-muted-foreground">Administrator Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">{profile?.full_name}</p>
                <p className="text-xs text-muted-foreground">{profile?.email}</p>
              </div>
              <Badge variant="secondary" className="bg-destructive text-destructive-foreground">
                Administrator
              </Badge>
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="bg-gradient-card shadow-card border-0 hover:shadow-elevated transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className="text-3xl font-bold text-foreground mt-1">{stat.value}</p>
                    <p className="text-xs text-success mt-1">{stat.change}</p>
                  </div>
                  <div className={`p-3 rounded-lg bg-primary-light ${stat.color}`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Management Cards */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">System Management</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {managementCards.map((card, index) => (
              <Card key={index} className="bg-gradient-card shadow-card border-0 hover:shadow-elevated transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center space-x-3 mb-2">
                    <div className={`p-3 rounded-lg ${card.color}`}>
                      <card.icon className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-lg">{card.title}</CardTitle>
                  </div>
                  <CardDescription>{card.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant="outline">
                    {card.action}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <Card className="bg-gradient-card shadow-card border-0">
          <CardHeader>
            <CardTitle className="text-foreground">Recent System Activity</CardTitle>
            <CardDescription>Latest actions across the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { action: "New user registered", user: "Dr. Sarah Chen", time: "2 hours ago", type: "success" },
                { action: "Role updated", user: "Dr. Michael Rodriguez", time: "4 hours ago", type: "info" },
                { action: "Assessment submitted", user: "Dr. Emily Watson", time: "6 hours ago", type: "success" },
                { action: "System backup completed", user: "System", time: "12 hours ago", type: "info" }
              ].map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-background rounded-lg border border-border">
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground">{activity.action}</h4>
                    <p className="text-sm text-muted-foreground">{activity.user} • {activity.time}</p>
                  </div>
                  <Badge variant={activity.type === 'success' ? 'default' : 'secondary'}>
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
