import { useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { Shield, LogOut, Search, Filter, Settings, BarChart3 } from 'lucide-react';

import { DepartmentCard } from '@/components/dashboard/DepartmentCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';

const AdminLanding = () => {
  const navigate = useNavigate();
  const { signOut, profile } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  // Mock data - replace with real data from Supabase
  const departments = [
    {
      id: '1',
      name: 'ENT-Head & Neck Surgery',
      studentCount: 12,
      averageOScore: 4.1,
      assessmentCount: 89,
      trend: 'up' as const,
    },
    {
      id: '2',
      name: 'General Surgery',
      studentCount: 18,
      averageOScore: 3.8,
      assessmentCount: 124,
      trend: 'up' as const,
    },
    {
      id: '3',
      name: 'Internal Medicine',
      studentCount: 24,
      averageOScore: 3.9,
      assessmentCount: 156,
      trend: 'stable' as const,
    },
    {
      id: '4',
      name: 'Emergency Medicine',
      studentCount: 15,
      averageOScore: 4.3,
      assessmentCount: 98,
      trend: 'up' as const,
    },
    {
      id: '5',
      name: 'Pediatrics',
      studentCount: 20,
      averageOScore: 4.0,
      assessmentCount: 134,
      trend: 'up' as const,
    },
    {
      id: '6',
      name: 'Orthopedic Surgery',
      studentCount: 10,
      averageOScore: 3.7,
      assessmentCount: 67,
      trend: 'stable' as const,
    },
  ];

  const filteredDepartments = departments.filter((dept) => {
    const matchesSearch = dept.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const totalStudents = departments.reduce((sum, d) => sum + d.studentCount, 0);
  const totalAssessments = departments.reduce((sum, d) => sum + d.assessmentCount, 0);
  const avgOScore = departments.reduce((sum, d) => sum + d.averageOScore, 0) / departments.length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-sm transition-colors duration-200">
        <div className="container mx-auto px-4 py-4 md:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-red-600 to-red-500">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground md:text-2xl">WBA Tracker</h1>
                <p className="text-sm text-muted-foreground">Administrator Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden text-right md:block">
                <p className="text-sm font-medium text-foreground">{profile?.full_name}</p>
                <p className="text-xs text-muted-foreground">{profile?.email}</p>
              </div>
              <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                Administrator
              </Badge>
              <Button variant="outline" onClick={() => navigate('/admin')}>
                <Settings className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Settings</span>
              </Button>
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 md:px-6 md:py-8">
        <Tabs defaultValue="departments" className="space-y-6">
          <TabsList>
            <TabsTrigger value="departments">Departments</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="departments" className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Card className="border-0 bg-gradient-card shadow-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Students</p>
                      <p className="mt-1 text-3xl font-bold text-foreground">{totalStudents}</p>
                      <p className="mt-1 text-xs text-muted-foreground">Across all departments</p>
                    </div>
                    <div className="rounded-lg bg-blue-500/10 p-3 dark:bg-blue-500/20">
                      <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 bg-gradient-card shadow-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Overall Avg O-Score</p>
                      <p className="mt-1 text-3xl font-bold text-foreground">{avgOScore.toFixed(1)}</p>
                      <p className="mt-1 text-xs text-success">↗ Trending up</p>
                    </div>
                    <div className={`rounded-lg p-3 ${avgOScore >= 4.0 ? 'bg-green-500/10 dark:bg-green-500/20' : 'bg-yellow-500/10 dark:bg-yellow-500/20'}`}>
                      <div className="text-2xl font-bold" style={{ color: avgOScore >= 4.0 ? '#22c55e' : '#eab308' }}>
                        {avgOScore.toFixed(1)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 bg-gradient-card shadow-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Departments</p>
                      <p className="mt-1 text-3xl font-bold text-foreground">{departments.length}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{totalAssessments} assessments</p>
                    </div>
                    <div className="rounded-lg bg-purple-500/10 p-3 dark:bg-purple-500/20">
                      <Settings className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Departments List */}
            <Card className="border-0 bg-gradient-card shadow-card">
              <CardHeader>
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle className="text-xl">Departments & Programs</CardTitle>
                    <CardDescription>
                      Monitor O-Score performance across all departments
                    </CardDescription>
                  </div>
                  <div className="relative flex-1 md:w-64">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search departments..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredDepartments.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground">
                    <p>No departments found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredDepartments.map((department, index) => (
                      <div key={department.id}>
                        <DepartmentCard
                          {...department}
                          onClick={() => navigate(`/admin/department/${department.id}`)}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Program Analytics</CardTitle>
                <CardDescription>
                  Comprehensive O-Score analytics across all departments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="py-12 text-center text-muted-foreground">
                  <BarChart3 className="mx-auto mb-4 h-16 w-16 opacity-50" />
                  <p>Analytics dashboard coming soon</p>
                  <p className="mt-2 text-sm">
                    View trends, comparisons, and detailed reports
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminLanding;

