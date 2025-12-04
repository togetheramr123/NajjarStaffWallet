import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/components/ui/sidebar";
import NotFound from "@/pages/not-found";
import WelcomePage from "@/components/WelcomePage";
import AppSidebar from "@/components/AppSidebar";
import Header from "@/components/Header";
import EmployeeDashboard from "@/pages/EmployeeDashboard";
import ManagerDashboard from "@/pages/ManagerDashboard";
import EmployeesPage from "@/pages/EmployeesPage";
import ApprovalsPage from "@/pages/ApprovalsPage";
import LoginPage from "@/pages/LoginPage";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { AuthProvider, useAuth, type User } from "@/contexts/AuthContext";

export { useAuth };

function Router({ userRole }: { userRole: "employee" | "manager" }) {
  if (userRole === "manager") {
    return (
      <Switch>
        <Route path="/" component={ManagerDashboard} />
        <Route path="/manager" component={ManagerDashboard} />
        <Route path="/employees" component={EmployeesPage} />
        <Route path="/approvals" component={ApprovalsPage} />
        <Route path="/operations" component={ManagerDashboard} />
        <Route path="/reports" component={ManagerDashboard} />
        <Route path="/settings" component={ManagerDashboard} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  return (
    <Switch>
      <Route path="/" component={EmployeeDashboard} />
      <Route path="/dashboard" component={EmployeeDashboard} />
      <Route path="/balance" component={EmployeeDashboard} />
      <Route path="/withdraw" component={EmployeeDashboard} />
      <Route path="/transactions" component={EmployeeDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AuthenticatedLayout({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [location, setLocation] = useLocation();
  const [pendingCount, setPendingCount] = useState(0);

  const { data: pendingData } = useQuery({
    queryKey: ["/api/withdrawal-requests/pending"],
    enabled: user.role === "manager",
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (pendingData && Array.isArray(pendingData)) {
      setPendingCount(pendingData.length);
    }
  }, [pendingData]);

  useEffect(() => {
    if (location === "/" && user.role === "manager") {
      setLocation("/manager");
    } else if (location === "/" && user.role === "employee") {
      setLocation("/dashboard");
    }
  }, [location, user.role, setLocation]);

  const getPageTitle = () => {
    const titles: Record<string, string> = {
      "/": user.role === "manager" ? "لوحة التحكم" : "الرئيسية",
      "/dashboard": "الرئيسية",
      "/balance": "رصيدي",
      "/withdraw": "طلب سحب",
      "/transactions": "سجل المعاملات",
      "/manager": "لوحة التحكم",
      "/employees": "إدارة الموظفين",
      "/approvals": "طلبات السحب",
      "/operations": "العمليات المالية",
      "/reports": "التقارير",
      "/settings": "الإعدادات",
    };
    return titles[location] || "نظام الرصيد";
  };

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar userRole={user.role} userName={user.name} onLogout={onLogout} />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header
            title={getPageTitle()}
            notificationCount={pendingCount}
            onNotificationClick={() => setLocation("/approvals")}
          />
          <main className="flex-1 overflow-auto bg-background">
            <Router userRole={user.role} />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function AppContent() {
  const { user, isLoading, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    }
  }, []);

  const handleLogout = async () => {
    await logout();
    setShowLogin(false);
    setLocation("/");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    return <AuthenticatedLayout user={user} onLogout={handleLogout} />;
  }

  if (showLogin) {
    return <LoginPage onBack={() => setShowLogin(false)} />;
  }

  return <WelcomePage onLogin={() => setShowLogin(true)} />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
