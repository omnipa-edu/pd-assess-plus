import { lazy, Suspense } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { DashboardGridSkeleton } from "@/components/ui/skeleton-loaders";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { CommandPalette } from "./components/quick-actions/CommandPalette";
import { KeyboardShortcuts } from "./components/quick-actions/KeyboardShortcuts";
import { ThemeProvider } from "./components/theme/ThemeProvider";
import { AuthProvider } from "./hooks/useAuth";

// Lazy load routes for code splitting
const LandingAccess = lazy(() => import("./pages/LandingAccess"));
const Auth = lazy(() => import("./pages/Auth"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const UpdatePassword = lazy(() => import("./pages/UpdatePassword"));
const Index = lazy(() => import("./pages/Index"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Subscribe = lazy(() => import("./pages/Subscribe"));
const Billing = lazy(() => import("./pages/Billing"));
const NotFound = lazy(() => import("./pages/NotFound"));
const PaletteSwatch = lazy(() => import("./pages/PaletteSwatch"));
const ContrastCheck = lazy(() => import("./pages/dev/ContrastCheck"));
const StudentDashboard = lazy(() => import("./pages/StudentDashboard"));
const SupervisorDashboard = lazy(() => import("./pages/SupervisorDashboard"));
const CMELog = lazy(() => import("./pages/supervisor/CMELog"));
const MyStudents = lazy(() => import("./pages/supervisor/MyStudents"));
const SupervisorResources = lazy(() => import("./pages/supervisor/Resources"));
const CMETeachingReport = lazy(() => import("./pages/CMETeachingReport"));
const RunAssessment = lazy(() => import("./pages/supervisor/RunAssessment"));
const SupervisorAssessmentForm = lazy(() => import("./pages/supervisor/SupervisorAssessmentForm"));
const ObservationsList = lazy(() => import("./pages/supervisor/ObservationsList"));
const ObservationDetail = lazy(() => import("./pages/supervisor/ObservationDetail"));

// Admin routes - lazy loaded
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminLanding = lazy(() => import("./pages/AdminLanding"));
const AdminOverview = lazy(() => import("./pages/admin/AdminOverview"));
const Institutions = lazy(() => import("./pages/admin/Institutions"));
const Departments = lazy(() => import("./pages/admin/Departments"));
const Specialties = lazy(() => import("./pages/admin/Specialties"));
const EPAs = lazy(() => import("./pages/admin/EPAs"));
const Users = lazy(() => import("./pages/admin/Users"));
const Supervisors = lazy(() => import("./pages/admin/Supervisors"));
const ActivityLog = lazy(() => import("./pages/admin/ActivityLog"));
const ImportEPAs = lazy(() => import("./pages/admin/ImportEPAs"));
const PromoCodes = lazy(() => import("./pages/admin/PromoCodes"));
const CoachingManagement = lazy(() => import("./pages/admin/CoachingManagement"));
const Calibration = lazy(() => import("./pages/admin/Calibration"));
const Accreditation = lazy(() => import("./pages/admin/Accreditation"));
const ReadinessAdmin = lazy(() => import("./pages/admin/Readiness"));
const CoachingTime = lazy(() => import("./pages/admin/CoachingTime"));
const SupervisorAssignments = lazy(() => import("./pages/admin/SupervisorAssignments"));
const ResourcesAdmin = lazy(() => import("./pages/admin/Resources"));
const Procedures = lazy(() => import("./pages/admin/Procedures"));
const ProcedureLibrary = lazy(() => import("./pages/admin/ProcedureLibrary"));
const ProcedureLibraryDetail = lazy(() => import("./pages/admin/ProcedureLibraryDetail"));
const ProcedureLibraryNew = lazy(() => import("./pages/admin/ProcedureLibraryNew"));
const ProcedureLibraryEdit = lazy(() => import("./pages/admin/ProcedureLibraryEdit"));
const ProcedureLibraryImport = lazy(() => import("./pages/admin/ProcedureLibraryImport"));
const ProgramAssessments = lazy(() => import("./pages/admin/ProgramAssessments"));
const ProgramCohortAssessments = lazy(() => import("./pages/admin/ProgramCohortAssessments"));
const ButtonDefinitions = lazy(() => import("./pages/admin/ButtonDefinitions"));
const ButtonSets = lazy(() => import("./pages/admin/ButtonSets"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes - data is fresh for 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes - cache garbage collection (formerly cacheTime)
      retry: 1, // Retry failed requests once
      refetchOnWindowFocus: false, // Don't refetch on window focus
      refetchOnReconnect: true, // Refetch when network reconnects
    },
  },
});

// Loading fallback component
const RouteLoadingFallback = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <DashboardGridSkeleton cards={1} />
  </div>
);

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true,
              }}
            >
              <KeyboardShortcuts />
              <CommandPalette />
              <Suspense fallback={<RouteLoadingFallback />}>
                <Routes>
                  <Route path="/" element={<LandingAccess />} />
                  <Route path="/palette-swatch" element={<PaletteSwatch />} />
                  <Route path="/dev/contrast" element={<ContrastCheck />} />
                  <Route path="/pricing" element={<Pricing />} />
                  <Route path="/subscribe" element={<Subscribe />} />
                  <Route path="/billing" element={<Billing />} />
                  <Route path="/dashboard" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/auth/reset-password" element={<ResetPassword />} />
                  <Route path="/auth/update-password" element={<UpdatePassword />} />
                  <Route path="/student" element={<StudentDashboard />} />
                  <Route path="/supervisor" element={<SupervisorDashboard />} />
                  <Route path="/supervisor/students" element={<MyStudents />} />
                  <Route path="/supervisor/resources" element={<SupervisorResources />} />
                  <Route path="/supervisor/cme-log" element={<CMELog />} />
                  <Route path="/supervisor/cme-teaching-report" element={<CMETeachingReport />} />
                  <Route path="/supervisor/run-assessment" element={<RunAssessment />} />
                  <Route path="/supervisor/assessment/new" element={<SupervisorAssessmentForm />} />
                  <Route path="/supervisor/observations" element={<ObservationsList />} />
                  <Route path="/supervisor/observations/:id" element={<ObservationDetail />} />
                  
                  {/* NEW Admin Console Routes */}
                  <Route path="/admin" element={<AdminOverview />} />
                  <Route path="/admin/institutions" element={<Institutions />} />
                  <Route path="/admin/departments" element={<Departments />} />
                  <Route path="/admin/specialties" element={<Specialties />} />
                  <Route path="/admin/epas" element={<EPAs />} />
                  <Route path="/admin/procedures" element={<Procedures />} />
                  <Route path="/admin/procedure-library" element={<ProcedureLibrary />} />
                  <Route path="/admin/procedure-library/import" element={<ProcedureLibraryImport />} />
                  <Route path="/admin/procedure-library/new" element={<ProcedureLibraryNew />} />
                  <Route path="/admin/procedure-library/:id" element={<ProcedureLibraryDetail />} />
                  <Route path="/admin/procedure-library/:id/edit" element={<ProcedureLibraryEdit />} />
                  <Route path="/admin/program-assessments" element={<ProgramAssessments />} />
                  <Route path="/admin/program-assessments/:cohortId" element={<ProgramCohortAssessments />} />
                  <Route path="/admin/button-definitions" element={<ButtonDefinitions />} />
                  <Route path="/admin/button-sets" element={<ButtonSets />} />
                  <Route path="/admin/users" element={<Users />} />
                  <Route path="/admin/supervisors" element={<Supervisors />} />
                  <Route path="/admin/activity" element={<ActivityLog />} />
                  <Route path="/admin/epas/import" element={<ImportEPAs />} />
                  <Route path="/admin/promo-codes" element={<PromoCodes />} />
                  <Route path="/admin/coaching" element={<CoachingManagement />} />
                  <Route path="/admin/readiness" element={<ReadinessAdmin />} />
                  <Route path="/admin/calibration" element={<Calibration />} />
                  <Route path="/admin/accreditation" element={<Accreditation />} />
                  <Route path="/admin/coaching-time" element={<CoachingTime />} />
                  <Route path="/admin/supervisor-assignments" element={<SupervisorAssignments />} />
                  <Route path="/admin/resources" element={<ResourcesAdmin />} />
                  
                  {/* Legacy Admin Routes (to be migrated) */}
                  <Route path="/admin/legacy" element={<AdminDashboard />} />
                  <Route path="/admin/departments-old" element={<AdminLanding />} />
                  
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
