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
  CreditCard
} from "lucide-react";
import { Link, useLocation } from "wouter";
import logoImage from "@assets/Screenshot_2025-08-19_143408_1764855126982.png";

interface AppSidebarProps {
  userRole: 'employee' | 'manager';
  userName: string;
  onLogout: () => void;
}

const employeeMenuItems = [
  { title: "الرئيسية", url: "/dashboard", icon: LayoutDashboard },
  { title: "رصيدي", url: "/balance", icon: Wallet },
  { title: "طلب سحب", url: "/withdraw", icon: CreditCard },
  { title: "سجل المعاملات", url: "/transactions", icon: History },
];

const managerMenuItems = [
  { title: "لوحة التحكم", url: "/manager", icon: LayoutDashboard },
  { title: "إدارة الموظفين", url: "/employees", icon: Users },
  { title: "الطلبات المعلقة", url: "/approvals", icon: ClipboardCheck },
  { title: "العمليات المالية", url: "/operations", icon: Wallet },
  { title: "التقارير", url: "/reports", icon: History },
  { title: "الإعدادات", url: "/settings", icon: Settings },
];

export default function AppSidebar({ userRole, userName, onLogout }: AppSidebarProps) {
  const [location] = useLocation();
  const menuItems = userRole === 'manager' ? managerMenuItems : employeeMenuItems;
  const initials = userName.split(' ').map(n => n[0]).join('').slice(0, 2);

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
            {userRole === 'manager' ? 'قائمة المدير' : 'القائمة الرئيسية'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location === item.url}
                    data-testid={`nav-${item.url.slice(1)}`}
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
              {userRole === 'manager' ? 'مدير' : 'موظف'}
            </span>
          </div>
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
