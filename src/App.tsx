import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import HRDashboard from "./pages/hr/HRDashboard";
import HRJobs from "./pages/hr/HRJobs";
import HRCandidates from "./pages/hr/HRCandidates";
import HRCompare from "./pages/hr/HRCompare";
import HRCandidateHistory from "./pages/hr/HRCandidateHistory";
import HRSettings from "./pages/hr/HRSettings";
import CandidateDashboard from "./pages/candidate/CandidateDashboard";
import CandidateJobs from "./pages/candidate/CandidateJobs";
import CandidateApplications from "./pages/candidate/CandidateApplications";
import CandidateProfile from "./pages/candidate/CandidateProfile";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            {/* HR Routes */}
            <Route path="/hr" element={<HRDashboard />} />
            <Route path="/hr/jobs" element={<HRJobs />} />
            <Route path="/hr/candidates" element={<HRCandidates />} />
            <Route path="/hr/compare" element={<HRCompare />} />
            <Route path="/hr/candidate-history" element={<HRCandidateHistory />} />
            <Route path="/hr/settings" element={<HRSettings />} />
            {/* Candidate Routes */}
            <Route path="/candidate" element={<CandidateDashboard />} />
            <Route path="/candidate/jobs" element={<CandidateJobs />} />
            <Route path="/candidate/applications" element={<CandidateApplications />} />
            <Route path="/candidate/profile" element={<CandidateProfile />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
