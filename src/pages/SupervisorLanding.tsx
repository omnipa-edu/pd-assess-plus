import { useState } from 'react';

import { 
  Stethoscope, 
  LogOut, 
  Plus, 
  Search, 
  Filter, 
  GraduationCap, 
  TrendingUp, 
  Activity 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';


import { StudentCard } from '@/components/dashboard/StudentCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';

const SupervisorLanding = () => {
  const navigate = useNavigate();
  const { signOut, profile } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProgram, setFilterProgram] = useState('all');

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  // Mock data - replace with real data from Supabase
  const students = [
    {
      id: '1',
      name: 'Dr. Sarah Chen',
      email: 'sarah.chen@hospital.edu',
      program: 'ENT-HNS',
      yearOfTraining: '2',
      averageOScore: 4.2,
      assessmentCount: 24,
      lastAssessment: '2 days ago',
      trend: 'up' as const,
    },
    {
      id: '2',
      name: 'Dr. Michael Rodriguez',
      email: 'michael.r@hospital.edu',
      program: 'ENT-HNS',
      yearOfTraining: '3',
      averageOScore: 3.8,
      assessmentCount: 31,
      lastAssessment: '1 week ago',
      trend: 'up' as const,
    },
    {
      id: '3',
      name: 'Dr. Emily Watson',
      email: 'emily.watson@hospital.edu',
      program: 'ENT-HNS',
      yearOfTraining: '1',
      averageOScore: 3.2,
      assessmentCount: 18,
      lastAssessment: '3 days ago',
      trend: 'stable' as const,
    },
    {
      id: '4',
      name: 'Dr. James Park',
      email: 'james.park@hospital.edu',
      program: 'ENT-HNS',
      yearOfTraining: '4',
      averageOScore: 4.6,
      assessmentCount: 45,
      lastAssessment: '1 day ago',
      trend: 'up' as const,
    },
    {
      id: '5',
      name: 'Dr. Maria Garcia',
      email: 'maria.garcia@hospital.edu',
      program: 'Surgery',
      yearOfTraining: '2',
      averageOScore: 3.9,
      assessmentCount: 22,
      lastAssessment: '4 days ago',
      trend: 'up' as const,
    },
  ];

  const filteredStudents = students.filter((student) => {
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProgram = filterProgram === 'all' || student.program === filterProgram;
    return matchesSearch && matchesProgram;
  });

  const avgOScore = students.reduce((sum, s) => sum + s.averageOScore, 0) / students.length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-sm transition-colors duration-200">
        <div className="container mx-auto px-4 py-4 md:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/70">
                <Stethoscope className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground md:text-2xl">WBA Tracker</h1>
                <p className="text-sm text-muted-foreground">Supervisor Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden text-right md:block">
                <p className="text-sm font-medium text-foreground">{profile?.full_name}</p>
                <p className="text-xs text-muted-foreground">{profile?.email}</p>
              </div>
              <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                Supervisor
              </Badge>
              <Button
                onClick={() => navigate('/supervisor')}
                className="bg-primary text-primary-foreground shadow hover:opacity-90"
              >
                <Plus className="mr-2 h-4 w-4" />
                New Assessment
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
        {/* Stats Overview */}
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card className="border-0 bg-gradient-card shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">My Students</p>
                  <p className="mt-1 text-3xl font-bold text-foreground">{students.length}</p>
                  <p className="mt-1 text-xs text-success">Active learners</p>
                </div>
                <div className="rounded-lg bg-primary/10 p-3 dark:bg-primary/20">
                  <GraduationCap className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-card shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Average O-Score</p>
                  <p className="mt-1 text-3xl font-bold text-foreground">{avgOScore.toFixed(1)}</p>
                  <p className="mt-1 text-xs text-success">↗ +0.3 this month</p>
                </div>
                <div className="rounded-lg bg-green-500/10 p-3 dark:bg-green-500/20">
                  <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-card shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Assessments</p>
                  <p className="mt-1 text-3xl font-bold text-foreground">
                    {students.reduce((sum, s) => sum + s.assessmentCount, 0)}
                  </p>
                  <p className="mt-1 text-xs text-success">This academic year</p>
                </div>
                <div className="rounded-lg bg-accent/10 p-3 dark:bg-accent/20">
                  <Activity className="h-6 w-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Students Section */}
        <Card className="border-0 bg-gradient-card shadow-card">
          <CardHeader>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="text-xl">My Students</CardTitle>
                <CardDescription>Monitor progress and O-Scores for your learners</CardDescription>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search students..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={filterProgram} onValueChange={setFilterProgram}>
                  <SelectTrigger className="w-full sm:w-40">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Program" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Programs</SelectItem>
                    <SelectItem value="ENT-HNS">ENT-HNS</SelectItem>
                    <SelectItem value="Surgery">Surgery</SelectItem>
                    <SelectItem value="Medicine">Medicine</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredStudents.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <p>No students found matching your criteria</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredStudents.map((student, index) => (
                  <motion.div
                    key={student.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <StudentCard
                      {...student}
                      onClick={() => navigate(`/student/${student.id}`)}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default SupervisorLanding;

