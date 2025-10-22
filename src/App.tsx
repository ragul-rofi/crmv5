import { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { UserProvider } from "./contexts/UserContext";
import { ThemeProvider } from "./components/ThemeProvider";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import Index from "./pages/Index";
import DataPage from "./pages/DataPage";
import ContactsPage from "./pages/ContactsPage";
import TasksPage from "./pages/TasksPage";
import TicketsPage from "./pages/TicketsPage";
import UsersPage from "./pages/UsersPage";
import AdminPanel from "./pages/AdminPanel";
import CompanyDetailPage from "./pages/CompanyDetailPage";
import ApiTestPage from "./pages/ApiTestPage";
import { SearchCommand } from "./components/SearchCommand";

const AppContent = () => {
  const [openSearch, setOpenSearch] = useState(false);

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
        <Route path="/api-test" element={renderWithLayout(<ApiTestPage />)} />
        <Route path="/" element={renderWithLayout(<Index />)} />
        <Route path="/data" element={renderWithLayout(<DataPage />)} />
        <Route path="/company/:id" element={renderWithLayout(<CompanyDetailPage />)} />
        <Route path="/contacts" element={renderWithLayout(<ContactsPage />)} />
        <Route path="/tasks" element={renderWithLayout(<TasksPage />)} />
        <Route path="/tickets" element={renderWithLayout(<TicketsPage />)} />
        <Route path="/users" element={renderWithLayout(<UsersPage />)} />
        <Route path="/admin" element={renderWithLayout(<AdminPanel />)} />
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
      staleTime: 60 * 1000, // 1 minute
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
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
  );
}

export default App;