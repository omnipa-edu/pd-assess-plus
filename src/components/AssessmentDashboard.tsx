import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { ArrowLeft, User, FileText, ExternalLink } from "lucide-react";

import EPAObservationForm from "@/components/EPAObservationForm";
import QuickFeedbackForm from "@/components/QuickFeedbackForm";
import { LayoutModeToggle } from "@/components/layout/LayoutModeToggle";
import NarrativeAssessmentForm from "@/components/NarrativeAssessmentForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useLayoutDensity } from "@/contexts/LayoutDensityContext";
import { logger } from "@/lib/logger";

interface PhysicianAssociate {
  id: string;
  name: string;
  program: string;
  year: string;
  supervisor: string;
  cohort_id: string | null;
}

export type AssessmentDashboardTab =
  | "quick-feedback"
  | "epa-observation"
  | "direct-observation"
  | "narrative"
  | "procedure-competency";

interface AssessmentDashboardProps {
  onBack: () => void;
  defaultTab?: AssessmentDashboardTab;
}

// Constants
const DEFAULT_VALUES = {
  STUDENT: {
    NAME: 'Unknown Student',
    PROGRAM: 'Unknown Program',
    YEAR: 'Unknown Year',
    SUPERVISOR: 'Not Assigned',
  },
  SUPERVISOR: {
    YOU: 'You',
    UNKNOWN: 'Unknown',
  },
} as const;

const ERROR_CODES = {
  TABLE_NOT_FOUND: 'PGRST116',
  RELATION_NOT_EXIST: '42p01',
} as const;

/** Procedure from Procedure Library (id, code, title) for the competency tab */
interface ProcedureOption {
  id: string;
  code: string;
  title: string;
}

/**
 * Assessment Dashboard Component
 * 
 * Displays a list of physician associates (students) and allows supervisors
 * to select a student and create assessments (EPA, Quick observation, Narrative, or Procedure from library).
 * 
 * @param onBack - Callback function to navigate back to the previous screen
 * @param defaultTab - Default tab to show when a student is selected
 */
const AssessmentDashboard = ({ onBack, defaultTab = "quick-feedback" }: AssessmentDashboardProps) => {
  const navigate = useNavigate();
  const { density } = useLayoutDensity();
  const compactLayout = useMemo(() => density === "compact", [density]);
  const [selectedAssociate, setSelectedAssociate] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AssessmentDashboardTab>(defaultTab);
  const [associates, setAssociates] = useState<PhysicianAssociate[]>([]);
  const [loading, setLoading] = useState(true);
  const [procedureOptions, setProcedureOptions] = useState<ProcedureOption[]>([]);
  const [procedureOptionsLoading, setProcedureOptionsLoading] = useState(false);
  const [selectedProcedureId, setSelectedProcedureId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  // Load procedures for the procedure-competency tab: when an associate is selected and has cohort_id, use program_procedures for that cohort; else all active procedures with a form
  const selectedAssociateData = selectedAssociate ? associates.find((a) => a.id === selectedAssociate) : null;
  useEffect(() => {
    if (!selectedAssociateData) {
      setProcedureOptions([]);
      setSelectedProcedureId(null);
      return;
    }
    let cancelled = false;
    setProcedureOptionsLoading(true);
    setSelectedProcedureId(null);
    const cohortId = selectedAssociateData.cohort_id;
    const loadProcedures = async () => {
      if (cohortId) {
        const { data: ppData } = await supabase
          .from("program_procedures")
          .select("id, procedure_id")
          .eq("program_cohort_id", cohortId)
          .order("display_order");
        if (cancelled) return;
        const list = (ppData || []) as { id: string; procedure_id: string }[];
        if (list.length === 0) {
          setProcedureOptions([]);
          return;
        }
        const { data, error } = await supabase
          .from("procedures")
          .select("id, code, title")
          .in("id", list.map((p) => p.procedure_id))
          .eq("status", "active")
          .not("latest_version_id", "is", null)
          .order("title");
        if (cancelled) return;
        if (error) setProcedureOptions([]);
        else setProcedureOptions((data as ProcedureOption[]) || []);
      } else {
        const { data, error } = await supabase
          .from("procedures")
          .select("id, code, title")
          .eq("status", "active")
          .not("latest_version_id", "is", null)
          .order("title");
        if (cancelled) return;
        if (error) setProcedureOptions([]);
        else setProcedureOptions((data as ProcedureOption[]) || []);
      }
    };
    loadProcedures().finally(() => {
      if (!cancelled) setProcedureOptionsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [selectedAssociateData?.id, selectedAssociateData?.cohort_id]);

  /**
   * Loads students assigned to the current supervisor.
   * Uses a fallback strategy:
   * 1. First tries supervisor_student_assignments table
   * 2. Falls back to user_roles table
   * 3. Ultimate fallback: loads all profiles
   */
  const loadStudents = async () => {
    try {
      setLoading(true);
      
      // Get current user (supervisor)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Error',
          description: 'You must be logged in to view students.',
          variant: 'destructive',
        });
        return;
      }

      let students: PhysicianAssociate[] = [];
      let _useAssignments = false;

      // Try to load students assigned to this supervisor via assignments table
      try {
        const { data: assignments, error: assignmentsError } = await supabase
          .from('supervisor_student_assignments')
          .select(`
            student_id,
            supervisor_id,
            student:profiles!supervisor_student_assignments_student_id_fkey (
              id,
              full_name,
              program,
              year_of_training,
              cohort_id
            )
          `)
          .eq('supervisor_id', user.id);
        
        // Check if table exists and has data
        if (!assignmentsError && assignments && assignments.length > 0) {
          _useAssignments = true;
          
          // Use assigned students
          type AssignmentWithStudent = {
            student_id: string;
            supervisor_id: string;
            is_active?: boolean;
            student: {
              id: string;
              full_name?: string;
              program?: string;
              year_of_training?: string;
              cohort_id?: string | null;
            };
          };
          
          const activeAssignments = (assignments as AssignmentWithStudent[]).filter(
            (assignment) => assignment?.is_active !== false
          );

          students = activeAssignments
            .filter((a) => a.student)
            .map((assignment) => ({
              id: assignment.student.id,
              name: assignment.student.full_name || DEFAULT_VALUES.STUDENT.NAME,
              program: assignment.student.program || DEFAULT_VALUES.STUDENT.PROGRAM,
              year: assignment.student.year_of_training || DEFAULT_VALUES.STUDENT.YEAR,
              supervisor: DEFAULT_VALUES.SUPERVISOR.YOU, // Will be updated with actual supervisor name
              cohort_id: assignment.student.cohort_id ?? null,
            }));

          // Load supervisor names
          const supervisorIds = [...new Set(
            activeAssignments
              .map((a: any) => a.supervisor_id)
              .filter(Boolean)
          )];

          if (supervisorIds.length > 0) {
            const { data: supervisors } = await supabase
              .from('profiles')
              .select('id, full_name')
              .in('id', supervisorIds);

            const supervisorMap = new Map(
              (supervisors || []).map((s: { id: string; full_name?: string }) => [s.id, s.full_name || DEFAULT_VALUES.SUPERVISOR.UNKNOWN])
            );

            // Update students with supervisor names
            students = students.map((student, index) => {
              const assignment = activeAssignments[index];
              if (assignment) {
                const supervisorName = supervisorMap.get(assignment.supervisor_id) || DEFAULT_VALUES.SUPERVISOR.UNKNOWN;
                return { ...student, supervisor: supervisorName };
              }
              return student;
            });
          }
        } else if (assignmentsError) {
          // Check if it's a 404 (table doesn't exist) - this is OK, we'll use fallback
          // Supabase errors can have different structures, so check multiple properties
          const errorStr = JSON.stringify(assignmentsError).toLowerCase();
          const is404 = assignmentsError?.code === ERROR_CODES.TABLE_NOT_FOUND || 
                        assignmentsError?.message?.includes('404') ||
                        errorStr.includes('404') ||
                        errorStr.includes('not found');
          
          if (is404) {
            logger.warn('supervisor_student_assignments table not found. Using fallback method to load students.');
          } else {
            logger.debug('Assignments error object', { error: assignmentsError });
          }
          const errorMessage = (assignmentsError.message || '').toLowerCase();
          const errorCode = (assignmentsError.code || '').toLowerCase();
          // PostgrestError doesn't have status/statusCode/httpStatus, check message/code instead
          const statusCode = (assignmentsError as unknown as { status?: number; statusCode?: number; httpStatus?: number }).status 
            || (assignmentsError as unknown as { status?: number; statusCode?: number; httpStatus?: number }).statusCode
            || (assignmentsError as unknown as { status?: number; statusCode?: number; httpStatus?: number }).httpStatus;
          
        const isTableNotFound = 
          statusCode === 404 ||
          String(statusCode) === '404' ||
            errorCode === ERROR_CODES.TABLE_NOT_FOUND.toLowerCase() ||
            errorCode === ERROR_CODES.RELATION_NOT_EXIST.toLowerCase() ||
            errorMessage.includes('relation') || 
            errorMessage.includes('does not exist') ||
            errorMessage.includes('not found') ||
            errorMessage.includes('no such table') ||
            errorStr.includes('404') ||
            errorStr.includes('relation') ||
            errorStr.includes('does not exist') ||
            errorStr.includes('not found');
          
          if (!isTableNotFound) {
            // It's a real error, not just missing table - log it but still try fallback
            logger.warn('Error loading assignments (non-404)', {
              statusCode,
              errorCode,
              errorMessage,
              fullError: assignmentsError
            });
          } else {
            logger.warn('supervisor_student_assignments table not found. Using fallback method.');
          }
          // Always fall through to fallback method below
        }
      } catch (assignmentsErr: any) {
        // Catch any unexpected errors from the assignments query
        // Supabase errors can have different structures, so check multiple properties
        const errorStr = JSON.stringify(assignmentsErr || {}).toLowerCase();
        const errorMessage = assignmentsErr?.message?.toLowerCase() || '';
        const errorCode = assignmentsErr?.code?.toLowerCase() || '';
        const statusCode = assignmentsErr?.status || assignmentsErr?.statusCode;
        
        const isTableNotFound = 
          statusCode === 404 ||
          errorCode === ERROR_CODES.TABLE_NOT_FOUND.toLowerCase() ||
          errorCode === ERROR_CODES.RELATION_NOT_EXIST.toLowerCase() ||
          errorMessage.includes('relation') || 
          errorMessage.includes('does not exist') ||
          errorMessage.includes('not found') ||
          errorMessage.includes('no such table') ||
          errorStr.includes('404') ||
          errorStr.includes('relation') ||
          errorStr.includes('does not exist');
        
        if (!isTableNotFound) {
          logger.warn('Unexpected error loading assignments', { error: assignmentsErr });
        } else {
          logger.warn('supervisor_student_assignments table not found. Using fallback method.');
        }
        // Always fall through to fallback method below
      }

      // If we didn't get students from assignments, use fallback
      // Always use fallback if we don't have students (either table doesn't exist or no assignments)
      if (students.length === 0) {
        // Fallback: Load all students (for backwards compatibility)
        // First get student user IDs from user_roles
        const { data: studentRoles, error: rolesError } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', 'student');
        
        if (rolesError) {
          logger.error('Error loading student roles', rolesError);
          throw rolesError;
        }
        
        const studentIds = (studentRoles || []).map(r => r.user_id);
        
        logger.debug(`Fallback: Found ${studentIds.length} student IDs from user_roles`);
        
        if (studentIds.length === 0) {
          logger.warn('No students found in user_roles table. Trying to load all profiles as fallback...');
          
          // Ultimate fallback: Try to load all profiles (supervisors can see all profiles)
          // This is a last resort when user_roles doesn't have students
          const { data: allProfiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, full_name, program, year_of_training, cohort_id')
            .order('full_name');
          
          if (profilesError) {
            logger.error('Error loading all profiles', profilesError);
            // Don't throw - just show empty list
            setAssociates([]);
            setLoading(false);
            return;
          }
          
          logger.debug(`Ultimate fallback: Loaded ${(allProfiles || []).length} profiles`);
          
          students = (allProfiles || []).map((profile: { id: string; full_name?: string; program?: string; year_of_training?: string; cohort_id?: string | null }) => ({
            id: profile.id,
            name: profile.full_name || DEFAULT_VALUES.STUDENT.NAME,
            program: profile.program || DEFAULT_VALUES.STUDENT.PROGRAM,
            year: profile.year_of_training || DEFAULT_VALUES.STUDENT.YEAR,
            supervisor: DEFAULT_VALUES.STUDENT.SUPERVISOR,
            cohort_id: profile.cohort_id ?? null,
          }));
        } else {
          // Then fetch profiles for those students
          const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name, program, year_of_training, cohort_id')
            .in('id', studentIds)
            .order('full_name');

          if (error) {
            logger.error('Error loading student profiles', error);
            throw error;
          }

          logger.debug(`Fallback: Loaded ${(data || []).length} student profiles`);

          students = (data || []).map((profile: { id: string; full_name?: string; program?: string; year_of_training?: string; cohort_id?: string | null }) => ({
            id: profile.id,
            name: profile.full_name || DEFAULT_VALUES.STUDENT.NAME,
            program: profile.program || DEFAULT_VALUES.STUDENT.PROGRAM,
            year: profile.year_of_training || DEFAULT_VALUES.STUDENT.YEAR,
            supervisor: DEFAULT_VALUES.STUDENT.SUPERVISOR,
            cohort_id: profile.cohort_id ?? null,
          }));
        }
      }
      
      logger.debug(`Total students loaded: ${students.length}`);

      setAssociates(students);
    } catch (error: unknown) {
      logger.error('Error loading students', error);
      toast({
        title: 'Error',
        description: 'Failed to load students. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (selectedAssociate) {
    const associate = associates.find(r => r.id === selectedAssociate);
    if (!associate) {
      // If associate not found, go back
      setSelectedAssociate(null);
      return null;
    }

    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card shadow-card">
          <div className="container mx-auto px-6 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => setSelectedAssociate(null)}
                size="sm"
              >
                Back to Physician Associates
              </Button>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">{associate.name}</h1>
                  <p className="text-sm text-muted-foreground">
                    {associate.program} • {associate.year} • Supervisor: {associate.supervisor}
                  </p>
                </div>
              </div>
              <LayoutModeToggle />
            </div>
          </div>
        </header>

        <main className="container mx-auto px-6 py-8">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as AssessmentDashboardTab)} className="w-full">
            <TabsList className="flex h-auto min-h-11 w-full flex-wrap justify-start gap-1 bg-secondary p-1">
              <TabsTrigger
                value="quick-feedback"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Quick feedback
              </TabsTrigger>
              <TabsTrigger value="epa-observation" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Full EPA
              </TabsTrigger>
              <TabsTrigger value="direct-observation" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Direct observation
              </TabsTrigger>
              <TabsTrigger value="narrative" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Narrative
              </TabsTrigger>
              <TabsTrigger value="procedure-competency" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Procedure
              </TabsTrigger>
            </TabsList>

            <TabsContent value="quick-feedback" className="mt-6">
              <QuickFeedbackForm
                associate={associate!}
                compactLayout={compactLayout}
                onAnotherStudent={() => setSelectedAssociate(null)}
                onBackToDashboard={onBack}
              />
            </TabsContent>

            <TabsContent value="epa-observation" className="mt-6">
              <EPAObservationForm
                associate={associate!}
                onAnotherStudent={() => setSelectedAssociate(null)}
                onBackToDashboard={onBack}
              />
            </TabsContent>
            
            <TabsContent value="direct-observation" className="mt-6 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Procedure-based observation</CardTitle>
                  <CardDescription>
                    Complete a procedure-based observation for this learner using the Procedure Library. You will choose cohort, procedure, and then complete the form; the assessment is saved to Observations.
                  </CardDescription>
                  <div className="pt-2">
                    <Button
                      onClick={() => {
                        const params = new URLSearchParams({ learnerId: associate!.id });
                        if (associate!.cohort_id) params.set("cohortId", associate!.cohort_id);
                        navigate(`/supervisor/run-assessment?${params.toString()}`);
                      }}
                      className="gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Open Run Assessment for this learner
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            </TabsContent>
            
            <TabsContent value="narrative" className="space-y-4">
              <NarrativeAssessmentForm
                associate={associate!}
                onAnotherStudent={() => setSelectedAssociate(null)}
                onBackToDashboard={onBack}
              />
            </TabsContent>

            <TabsContent value="procedure-competency" className="mt-6 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Procedure from library</CardTitle>
                  <CardDescription>
                    {associate!.cohort_id
                      ? "Procedures assigned to this learner's cohort. Same procedure form and Observations as Run Assessment."
                      : "No cohort assigned; showing all procedures. Assign a cohort to see only this program's procedures. Same procedure form and Observations as Run Assessment."}
                  </CardDescription>
                  <div className="flex flex-wrap items-end gap-3 pt-2">
                    <Select
                      value={selectedProcedureId ?? ""}
                      onValueChange={(v) => setSelectedProcedureId(v || null)}
                      disabled={procedureOptionsLoading}
                    >
                      <SelectTrigger className="w-full max-w-md">
                        <SelectValue placeholder={procedureOptionsLoading ? "Loading procedures…" : "Select procedure"} />
                      </SelectTrigger>
                      <SelectContent>
                        {procedureOptions.map((proc) => (
                          <SelectItem key={proc.id} value={proc.id}>
                            {proc.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedProcedureId && (
                      <Button
                        onClick={() => {
                          const params = new URLSearchParams({
                            procedureId: selectedProcedureId,
                            learnerId: associate!.id,
                          });
                          if (associate!.cohort_id) params.set("cohortId", associate!.cohort_id);
                          navigate(`/supervisor/assessment/new?${params.toString()}`);
                        }}
                        className="gap-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Open procedure form
                      </Button>
                    )}
                  </div>
                </CardHeader>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={onBack}
                className="hover:bg-primary-light"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Assessment Center</h1>
                <p className="text-sm text-muted-foreground">Select a physician associate to begin assessment</p>
              </div>
            </div>
            <LayoutModeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-pulse text-muted-foreground">Loading students...</div>
          </div>
        ) : associates.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">No students found. Please add students to the system first.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {associates.map((associate) => (
              <Card 
                key={associate.id} 
                className="cursor-pointer border-0 bg-gradient-card shadow-card transition-all duration-300 hover:shadow-elevated"
                onClick={() => setSelectedAssociate(associate.id)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-primary">
                        <User className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{associate.name}</CardTitle>
                        <CardDescription>{associate.program}</CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Training Year:</span>
                      <span className="font-semibold text-foreground">{associate.year}</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Supervisor:</span>
                      <span className="font-semibold text-foreground">{associate.supervisor}</span>
                    </div>

                    <Button className="mt-4 w-full bg-gradient-primary hover:opacity-90">
                      <FileText className="mr-2 h-4 w-4" />
                      Start Assessment
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default AssessmentDashboard;