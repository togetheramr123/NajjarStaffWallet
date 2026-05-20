import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, Moon, Sun, User, LogOut, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";

interface HeaderProps {
  title: string;
  notificationCount?: number;
  onNotificationClick?: () => void;
  onLogout?: () => void;
}

export default function Header({ title, notificationCount = 0, onNotificationClick, onLogout }: HeaderProps) {
  const [isDark, setIsDark] = useState(false);
  const { user } = useAuth();
  const [location, setLocation] = useLocation();

  const mainPages = ["/", "/manager", "/dashboard"];
  const showBackButton = !mainPages.includes(location);

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      setLocation(user?.role === "manager" ? "/manager" : "/dashboard");
    }
  };

  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains('dark');
    setIsDark(isDarkMode);
  }, []);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    document.documentElement.classList.toggle('dark', newIsDark);
    localStorage.setItem('theme', newIsDark ? 'dark' : 'light');
  };

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 py-3">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="hidden md:flex" data-testid="button-sidebar-toggle" />
        {showBackButton && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            data-testid="button-back"
          >
            <ArrowRight className="h-5 w-5" />
          </Button>
        )}
        <h1 className="text-lg font-semibold" data-testid="text-page-title">{title}</h1>
      </div>
      
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="icon"
          className="relative"
          onClick={onNotificationClick}
          data-testid="button-notifications"
        >
          <Bell className="h-5 w-5" />
          {notificationCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {notificationCount > 9 ? '9+' : notificationCount}
            </Badge>
          )}
        </Button>
        
        <Button 
          variant="ghost" 
          size="icon"
          onClick={toggleTheme}
          data-testid="button-theme-toggle"
        >
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full p-0" data-testid="button-user-menu">
              <Avatar className="h-8 w-8">
                <AvatarImage 
                  src={user?.profilePicture || undefined} 
                  alt={user?.name} 
                />
                <AvatarFallback className="bg-primary/10 text-primary text-sm">
                  {user?.name ? user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : <User className="h-4 w-4" />}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5 text-sm font-medium">
              {user?.name}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => setLocation("/profile")}
              data-testid="menu-item-profile"
            >
              <User className="h-4 w-4 ml-2" />
              الملف الشخصي
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={onLogout}
              className="text-destructive focus:text-destructive"
              data-testid="menu-item-logout"
            >
              <LogOut className="h-4 w-4 ml-2" />
              تسجيل الخروج
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
