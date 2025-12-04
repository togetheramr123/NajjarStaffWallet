import AppSidebar from '../AppSidebar';
import { SidebarProvider } from "@/components/ui/sidebar";

export default function AppSidebarExample() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-[500px] w-full">
        <AppSidebar 
          userRole="manager"
          userName="أحمد محمد"
          onLogout={() => console.log('Logout clicked')}
        />
        <div className="flex-1 bg-background p-4">
          <p className="text-muted-foreground">المحتوى الرئيسي</p>
        </div>
      </div>
    </SidebarProvider>
  );
}
