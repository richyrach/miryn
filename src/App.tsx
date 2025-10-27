import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { BanGuard } from "@/components/BanGuard";
import { WarningGuard } from "@/components/WarningGuard";
import { ConsentManager } from "@/components/ConsentManager";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import VerifyEmail from "./pages/VerifyEmail";
import VerifyMFA from "./pages/VerifyMFA";
import ResetPassword from "./pages/ResetPassword";
import Explore from "./pages/Explore";
import People from "./pages/People";
import AccountTypeSelection from "./pages/AccountTypeSelection";
import Onboarding from "./pages/Onboarding";
import Settings from "./pages/Settings";
import NewProject from "./pages/NewProject";
import EditProject from "./pages/EditProject";
import Profile from "./pages/Profile";
import Project from "./pages/Project";
import Admin from "./pages/Admin";
import Messages from "./pages/Messages";
import Services from "./pages/Services";
import ServiceDetail from "./pages/ServiceDetail";
import NewService from "./pages/NewService";
import EditService from "./pages/EditService";
import Bookmarks from "./pages/Bookmarks";
import NotFound from "./pages/NotFound";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Warning from "./pages/Warning";
import Banned from "./pages/Banned";
import Feedback from "./pages/Feedback";
import ServiceRequests from "./pages/ServiceRequests";
import RecoverAccount from "./pages/RecoverAccount";
import AuthCallback from "./pages/AuthCallback";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <BanGuard>
          <WarningGuard>
            <ConsentManager />
            <Routes>
              <Route path="/banned" element={<Banned />} />
              <Route path="/warning" element={<Warning />} />
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Auth />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/verify-mfa" element={<VerifyMFA />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/recover-account" element={<RecoverAccount />} />
              <Route path="/account-type" element={<AccountTypeSelection />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/people" element={<People />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/new" element={<NewProject />} />
              <Route path="/projects/:projectId/edit" element={<EditProject />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/services" element={<Services />} />
              <Route path="/services/new" element={<NewService />} />
              <Route path="/services/:serviceId" element={<ServiceDetail />} />
              <Route path="/services/:serviceId/edit" element={<EditService />} />
              <Route path="/service-requests" element={<ServiceRequests />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/feedback" element={<Feedback />} />
              <Route path="/:handle" element={<Profile />} />
              <Route path="/:handle/:projectSlug" element={<Project />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </WarningGuard>
        </BanGuard>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
