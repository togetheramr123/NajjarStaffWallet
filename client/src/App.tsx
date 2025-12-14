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
import ProfilePage from "@/pages/ProfilePage";
import LoginPage from "@/pages/LoginPage";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { AuthProvider, useAuth, type User } from "@/contexts/AuthContext";
import BranchManagerPersonalPage from "@/pages/BranchManagerPersonalPage";

export { useAuth };

function Router({ userRole }: { userRole: "employee" | "branch_manager" | "manager" }) {
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
        <Route path="/profile" component={ProfilePage} />
        <Route component={NotFound} />
      </Switch>
    );
  }
  
  if (userRole === "branch_manager") {
    return (
      <Switch>
        <Route path="/" component={ManagerDashboard} />
        <Route path="/manager" component={ManagerDashboard} />
        <Route path="/employees" component={EmployeesPage} />
        <Route path="/approvals" component={ApprovalsPage} />
        {/* Branch manager personal account pages */}
        <Route path="/my-balance" component={BranchManagerPersonalPage} />
        <Route path="/my-withdraw" component={BranchManagerPersonalPage} />
        <Route path="/my-transactions" component={BranchManagerPersonalPage} />
        <Route path="/profile" component={ProfilePage} />
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
      <Route path="/profile" component={ProfilePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AuthenticatedLayout({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [location, setLocation] = useLocation();
  const [pendingCount, setPendingCount] = useState(0);

  const { data: pendingData } = useQuery({
    queryKey: ["/api/withdrawal-requests/pending"],
    enabled: user.role === "manager" || user.role === "branch_manager",
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (pendingData && Array.isArray(pendingData)) {
      setPendingCount(pendingData.length);
    }
  }, [pendingData]);

  useEffect(() => {
    const validManagerPaths = ["/", "/manager", "/employees", "/approvals", "/operations", "/reports", "/settings", "/profile", "/my-balance", "/my-withdraw", "/my-transactions"];
    const validEmployeePaths = ["/", "/dashboard", "/balance", "/withdraw", "/transactions", "/profile"];
    
    if (user.role === "manager" || user.role === "branch_manager") {
      if (!validManagerPaths.includes(location)) {
        setLocation("/manager");
      } else if (location === "/") {
        setLocation("/manager");
      }
    } else if (user.role === "employee") {
      if (!validEmployeePaths.includes(location)) {
        setLocation("/dashboard");
      } else if (location === "/") {
        setLocation("/dashboard");
      }
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
      "/profile": "الملف الشخصي",
      "/my-balance": "رصيدي",
      "/my-withdraw": "طلب سحب",
      "/my-transactions": "سجل معاملاتي",
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
            onLogout={onLogout}
          />
          <main className="flex-1 overflow-auto bg-background">
            <Router userRole={user.role} />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function PrayerSplash({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary">
      <div className="text-center text-primary-foreground">
        <p className="text-4xl md:text-5xl font-bold mb-4 animate-pulse">
          اللهم صلِّ وسلم على نبينا محمد
        </p>
        <p className="text-xl md:text-2xl opacity-80">
          صلى الله عليه وسلم
        </p>
      </div>
    </div>
  );
}

function AppContent() {
  const { user, isLoading, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [showLogin, setShowLogin] = useState(false);
  const [showSplash, setShowSplash] = useState(false);
  const [hasSeenSplash, setHasSeenSplash] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    }
  }, []);

  useEffect(() => {
    if (user && !hasSeenSplash) {
      setShowSplash(true);
    }
  }, [user, hasSeenSplash]);

  const handleSplashComplete = () => {
    setShowSplash(false);
    setHasSeenSplash(true);
  };

  const handleLogout = async () => {
    await logout();
    setShowLogin(false);
    setHasSeenSplash(false);
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
    if (showSplash) {
      return <PrayerSplash onComplete={handleSplashComplete} />;
    }
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
