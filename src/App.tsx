import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";


import { ThemeProvider } from "./components/theme/ThemeProvider";
import { AuthProvider } from "./hooks/useAuth";
import AdminDashboard from "./pages/AdminDashboard";
import Auth from "./pages/Auth";
import Index from "./pages/Index";
import Landing from "./pages/Landing";
import NotFound from "./pages/NotFound";
import StudentDashboard from "./pages/StudentDashboard";
import SupervisorDashboard from "./pages/SupervisorDashboard";

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
              <Route path="/dashboard" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/student" element={<StudentDashboard />} />
              <Route path="/supervisor" element={<SupervisorDashboard />} />
              <Route path="/supervisor/students" element={<SupervisorLanding />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/overview" element={<AdminLanding />} />
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
