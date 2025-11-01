import { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { UserProvider } from "./contexts/UserContext";
import { ThemeProvider } from "./components/theme/ThemeProvider";
import ErrorBoundary from "./components/ErrorBoundary";
import { useSocket } from "./hooks/useSocket";
import Layout from "./components/layout/Layout";
import LoginPage from "./pages/LoginPage";
import Index from "./pages/Index";
import DataPage from "./pages/DataPage";
import TasksPage from "./pages/TasksPage";
import TicketsPage from "./pages/TicketsPage";
import UsersPage from "./pages/UsersPage";
import AdminPanel from "./pages/AdminPanel";
import FinalizedDataPage from "./pages/FinalizedDataPage";
import CompanyDetailPage from "./pages/CompanyDetailPage";
import SettingsPage from "./pages/SettingsPage";
import ReportsPage from "./pages/ReportsPage";
import NotificationsPage from "./pages/NotificationsPage";
import HealthMonitoringPage from "./pages/HealthMonitoringPage";
import AuditLogsPage from "./pages/AuditLogsPage";
import CacheManagementPage from "./pages/CacheManagementPage";
import SessionManagementPage from "./pages/SessionManagementPage";
import { FollowUpDeletionRequestsPage } from "./pages/FollowUpDeletionRequestsPage";

import { SearchCommand } from "./components/search/SearchCommand";

const AppContent = () => {
  const [openSearch, setOpenSearch] = useState(false);
  useSocket(); // Initialize socket connection

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpenSearch((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const renderWithLayout = (element: React.ReactElement) => (
    <Layout onSearchClick={() => setOpenSearch(true)}>{element}</Layout>
  );

  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route path="/" element={renderWithLayout(<Index />)} />
        <Route path="/data" element={renderWithLayout(<DataPage />)} />
        <Route path="/company/:id" element={renderWithLayout(<CompanyDetailPage />)} />
        <Route path="/tasks" element={renderWithLayout(<TasksPage />)} />
        <Route path="/tickets" element={renderWithLayout(<TicketsPage />)} />
        <Route path="/users" element={renderWithLayout(<UsersPage />)} />
        <Route path="/admin" element={renderWithLayout(<AdminPanel />)} />
        <Route path="/finalized-data" element={renderWithLayout(<FinalizedDataPage />)} />
        <Route path="/settings" element={renderWithLayout(<SettingsPage />)} />
        <Route path="/reports" element={renderWithLayout(<ReportsPage />)} />
        <Route path="/notifications" element={renderWithLayout(<NotificationsPage />)} />
        <Route path="/health" element={renderWithLayout(<HealthMonitoringPage />)} />
        <Route path="/audit-logs" element={renderWithLayout(<AuditLogsPage />)} />
        <Route path="/cache" element={renderWithLayout(<CacheManagementPage />)} />
        <Route path="/sessions" element={renderWithLayout(<SessionManagementPage />)} />
        <Route path="/followup-deletion-requests" element={renderWithLayout(<FollowUpDeletionRequestsPage />)} />
      </Routes>
      <SearchCommand open={openSearch} onOpenChange={setOpenSearch} />
    </>
  );
};

const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex h-screen items-center justify-center text-white">Loading...</div>;
  }

  return user ? (
    <AppContent />
  ) : (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0, // Always consider data stale to ensure fresh data
      gcTime: 10 * 60 * 1000, // 10 minutes - keep data in cache longer (replaces cacheTime)
      refetchOnWindowFocus: true, // Refetch when window regains focus
      retry: 2, // Retry failed requests up to 2 times
      retryDelay: 1000, // 1 second delay between retries
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="system" storageKey="crm-ui-theme">
        <QueryClientProvider client={queryClient}>
          <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <AuthProvider>
              <UserProvider>
                <AppRoutes />
                <Toaster />
              </UserProvider>
            </AuthProvider>
          </Router>
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
