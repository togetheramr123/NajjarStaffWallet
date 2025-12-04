import Header from '../Header';
import { SidebarProvider } from "@/components/ui/sidebar";

export default function HeaderExample() {
  return (
    <SidebarProvider>
      <div className="w-full">
        <Header 
          title="لوحة التحكم"
          notificationCount={5}
          onNotificationClick={() => console.log('Notifications clicked')}
        />
      </div>
    </SidebarProvider>
  );
}
