import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";


import { ThemeProvider } from "./components/theme/ThemeProvider";
import { AuthProvider } from "./hooks/useAuth";
import AdminDashboard from "./pages/AdminDashboard";
import AdminLanding from "./pages/AdminLanding";
import AdminOverview from "./pages/admin/AdminOverview";
import Institutions from "./pages/admin/Institutions";
import Departments from "./pages/admin/Departments";
import Specialties from "./pages/admin/Specialties";
import EPAs from "./pages/admin/EPAs";
import Users from "./pages/admin/Users";
import Supervisors from "./pages/admin/Supervisors";
import ActivityLog from "./pages/admin/ActivityLog";
import ImportEPAs from "./pages/admin/ImportEPAs";
import PromoCodes from "./pages/admin/PromoCodes";
import CoachingManagement from "./pages/admin/CoachingManagement";
import Calibration from "./pages/admin/Calibration";
import Accreditation from "./pages/admin/Accreditation";
import ReadinessAdmin from "./pages/admin/Readiness";
import Auth from "./pages/Auth";
import Index from "./pages/Index";
import Landing from "./pages/Landing";
import Pricing from "./pages/Pricing";
import Subscribe from "./pages/Subscribe";
import Billing from "./pages/Billing";
import NotFound from "./pages/NotFound";
import StudentDashboard from "./pages/StudentDashboard";
import SupervisorDashboard from "./pages/SupervisorDashboard";
import SupervisorLanding from "./pages/SupervisorLanding";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/subscribe" element={<Subscribe />} />
              <Route path="/billing" element={<Billing />} />
              <Route path="/dashboard" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/student" element={<StudentDashboard />} />
              <Route path="/supervisor" element={<SupervisorDashboard />} />
              <Route path="/supervisor/students" element={<SupervisorLanding />} />
              
              {/* NEW Admin Console Routes */}
              <Route path="/admin" element={<AdminOverview />} />
              <Route path="/admin/institutions" element={<Institutions />} />
              <Route path="/admin/departments" element={<Departments />} />
              <Route path="/admin/specialties" element={<Specialties />} />
              <Route path="/admin/epas" element={<EPAs />} />
              <Route path="/admin/users" element={<Users />} />
              <Route path="/admin/supervisors" element={<Supervisors />} />
              <Route path="/admin/activity" element={<ActivityLog />} />
              <Route path="/admin/epas/import" element={<ImportEPAs />} />
              <Route path="/admin/promo-codes" element={<PromoCodes />} />
              <Route path="/admin/coaching" element={<CoachingManagement />} />
              <Route path="/admin/readiness" element={<ReadinessAdmin />} />
              <Route path="/admin/calibration" element={<Calibration />} />
              <Route path="/admin/accreditation" element={<Accreditation />} />
              
              {/* Legacy Admin Routes (to be migrated) */}
              <Route path="/admin/legacy" element={<AdminDashboard />} />
              <Route path="/admin/departments-old" element={<AdminLanding />} />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
