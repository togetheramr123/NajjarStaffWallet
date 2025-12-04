import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
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
import { useState, useEffect } from "react";

// todo: remove mock functionality - replace with actual auth
type UserRole = 'employee' | 'manager' | null;

function Router() {
  return (
    <Switch>
      <Route path="/dashboard" component={EmployeeDashboard} />
      <Route path="/balance" component={EmployeeDashboard} />
      <Route path="/withdraw" component={EmployeeDashboard} />
      <Route path="/transactions" component={EmployeeDashboard} />
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

function AuthenticatedLayout({ 
  userRole, 
  userName, 
  onLogout 
}: { 
  userRole: 'employee' | 'manager';
  userName: string;
  onLogout: () => void;
}) {
  const [location] = useLocation();
  
  const getPageTitle = () => {
    const titles: Record<string, string> = {
      '/dashboard': 'الرئيسية',
      '/balance': 'رصيدي',
      '/withdraw': 'طلب سحب',
      '/transactions': 'سجل المعاملات',
      '/manager': 'لوحة التحكم',
      '/employees': 'إدارة الموظفين',
      '/approvals': 'طلبات السحب',
      '/operations': 'العمليات المالية',
      '/reports': 'التقارير',
      '/settings': 'الإعدادات',
    };
    return titles[location] || 'نظام الرصيد';
  };

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  // todo: remove mock functionality
  const pendingCount = userRole === 'manager' ? 4 : 0;

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar 
          userRole={userRole}
          userName={userName}
          onLogout={onLogout}
        />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header 
            title={getPageTitle()}
            notificationCount={pendingCount}
            onNotificationClick={() => console.log('Notifications clicked')}
          />
          <main className="flex-1 overflow-auto bg-background">
            <Router />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function App() {
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const handleLogin = () => {
    // todo: remove mock functionality - implement actual login
    // For demo, we'll show a simple role selector
    const role = window.confirm('تسجيل الدخول كمدير؟\n\nاضغط "موافق" للدخول كمدير\nاضغط "إلغاء" للدخول كموظف') 
      ? 'manager' 
      : 'employee';
    setUserRole(role);
    setLocation(role === 'manager' ? '/manager' : '/dashboard');
  };

  const handleLogout = () => {
    setUserRole(null);
    setLocation('/');
  };

  // todo: remove mock functionality
  const userName = userRole === 'manager' ? 'محمد العلي' : 'أحمد الخالد';

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {userRole ? (
          <AuthenticatedLayout 
            userRole={userRole}
            userName={userName}
            onLogout={handleLogout}
          />
        ) : (
          <WelcomePage onLogin={handleLogin} />
        )}
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
