import { 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  LayoutDashboard, 
  Wallet, 
  History, 
  Users, 
  ClipboardCheck, 
  Settings,
  LogOut,
  CreditCard,
  Bell,
  User
} from "lucide-react";
import { Link, useLocation } from "wouter";
import logoImage from "@assets/Screenshot_2025-08-19_143408_1764855126982.png";
import NotificationsPanel from "./NotificationsPanel";

interface AppSidebarProps {
  userRole: 'employee' | 'branch_manager' | 'manager';
  userName: string;
  onLogout: () => void;
}

const employeeMenuItems = [
  { title: "الرئيسية", url: "/dashboard", icon: LayoutDashboard },
  { title: "رصيدي", url: "/balance", icon: Wallet },
  { title: "طلب سحب", url: "/withdraw", icon: CreditCard },
  { title: "سجل المعاملات", url: "/transactions", icon: History },
  { title: "الملف الشخصي", url: "/profile", icon: User },
];

const managerMenuItems = [
  { title: "لوحة التحكم", url: "/manager", icon: LayoutDashboard },
  { title: "إدارة الموظفين", url: "/employees", icon: Users },
  { title: "الطلبات المعلقة", url: "/approvals", icon: ClipboardCheck },
  { title: "العمليات المالية", url: "/operations", icon: Wallet },
  { title: "التقارير", url: "/reports", icon: History },
  { title: "الإعدادات", url: "/settings", icon: Settings },
];

// Branch manager has both management features AND personal account features
const branchManagerMenuItems = [
  { title: "لوحة التحكم", url: "/manager", icon: LayoutDashboard },
  { title: "إدارة الموظفين", url: "/employees", icon: Users },
  { title: "الطلبات المعلقة", url: "/approvals", icon: ClipboardCheck },
];

const branchManagerPersonalItems = [
  { title: "رصيدي", url: "/my-balance", icon: Wallet },
  { title: "طلب سحب", url: "/my-withdraw", icon: CreditCard },
  { title: "سجل معاملاتي", url: "/my-transactions", icon: History },
  { title: "الملف الشخصي", url: "/profile", icon: User },
];

export default function AppSidebar({ userRole, userName, onLogout }: AppSidebarProps) {
  const [location] = useLocation();
  const { setOpenMobile, isMobile } = useSidebar();
  
  // Determine which menu items to show based on role
  const getMenuItems = () => {
    if (userRole === 'manager') return managerMenuItems;
    if (userRole === 'branch_manager') return branchManagerMenuItems;
    return employeeMenuItems;
  };
  
  const menuItems = getMenuItems();
  const initials = userName.split(' ').map(n => n[0]).join('').slice(0, 2);

  const handleMenuClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <img src={logoImage} alt="HSN GROUP" className="h-10 w-auto" />
          <div className="flex flex-col">
            <span className="font-bold text-sm text-sidebar-foreground">HSN GROUP</span>
            <span className="text-xs text-sidebar-foreground/60">نظام الرصيد</span>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/60">
            {userRole === 'manager' ? 'قائمة المدير' : userRole === 'branch_manager' ? 'إدارة الفرع' : 'القائمة الرئيسية'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location === item.url}
                    data-testid={`nav-${item.url.slice(1)}`}
                    onClick={handleMenuClick}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        {/* Personal account section for branch managers */}
        {userRole === 'branch_manager' && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-foreground/60">
              حسابي الشخصي
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {branchManagerPersonalItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={location === item.url}
                      data-testid={`nav-${item.url.slice(1)}`}
                      onClick={handleMenuClick}
                    >
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 mb-3">
          <Avatar>
            <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-sm font-medium text-sidebar-foreground truncate" data-testid="text-user-name">
              {userName}
            </span>
            <span className="text-xs text-sidebar-foreground/60">
              {userRole === 'manager' ? 'المدير العام' : userRole === 'branch_manager' ? 'مدير فرع' : 'موظف'}
            </span>
          </div>
          {(userRole === 'employee' || userRole === 'branch_manager') && (
            <NotificationsPanel />
          )}
        </div>
        <Button 
          variant="ghost" 
          className="w-full justify-start text-sidebar-foreground/80 hover:text-sidebar-foreground"
          onClick={onLogout}
          data-testid="button-logout"
        >
          <LogOut className="h-4 w-4 ml-2" />
          تسجيل الخروج
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
