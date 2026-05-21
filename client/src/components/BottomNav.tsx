import { Link, useLocation } from "wouter";
import { LayoutDashboard, Users, ClipboardCheck, Settings, Wallet, History } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";

export default function BottomNav({ notificationCount = 0 }: { notificationCount?: number }) {
  const [location] = useLocation();
  const { user } = useAuth();

  if (!user) return null;

  const getLinks = () => {
    if (user.role === 'manager') {
      return [
        { href: "/manager", icon: LayoutDashboard, label: "الرئيسية" },
        { href: "/employees", icon: Users, label: "الموظفين" },
        { href: "/approvals", icon: ClipboardCheck, label: "الطلبات", badge: notificationCount },
        { href: "/settings", icon: Settings, label: "الإعدادات" },
      ];
    }
    if (user.role === 'branch_manager') {
      return [
        { href: "/manager", icon: LayoutDashboard, label: "الرئيسية" },
        { href: "/employees", icon: Users, label: "الموظفين" },
        { href: "/approvals", icon: ClipboardCheck, label: "الطلبات", badge: notificationCount },
        { href: "/my-balance", icon: Wallet, label: "رصيدي" },
      ];
    }
    return [
      { href: "/dashboard", icon: LayoutDashboard, label: "الرئيسية" },
      { href: "/withdraw", icon: Wallet, label: "سحب" },
      { href: "/transactions", icon: History, label: "السجل" },
      { href: "/profile", icon: Settings, label: "حسابي" },
    ];
  };

  const links = getLinks();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border flex justify-around items-center pb-safe pt-2 px-2 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
      {links.map((link) => {
        const isActive = location === link.href;
        const Icon = link.icon;
        
        return (
          <Link key={link.href} href={link.href}>
            <a className={`flex flex-col items-center justify-center w-16 py-1 ${isActive ? 'text-primary' : 'text-muted-foreground'} transition-colors relative`}>
              <div className="relative">
                <Icon className={`h-6 w-6 ${isActive ? 'animate-in zoom-in-90 duration-200' : ''}`} />
                {link.badge && link.badge > 0 ? (
                  <span className="absolute -top-1 -right-2 bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 min-w-[18px] rounded-full flex items-center justify-center">
                    {link.badge > 99 ? '99+' : link.badge}
                  </span>
                ) : null}
              </div>
              <span className="text-[10px] mt-1 font-medium">{link.label}</span>
            </a>
          </Link>
        );
      })}
    </div>
  );
}
