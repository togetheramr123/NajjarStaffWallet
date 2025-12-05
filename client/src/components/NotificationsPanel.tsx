import { useState } from "react";
import { Bell, Check, CheckCheck, X, CircleCheck, CircleX, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

interface Notification {
  id: string;
  userId: string;
  type: "approved" | "rejected" | "modified";
  title: string;
  message: string;
  isRead: boolean;
  amount: number | null;
  remainingBalance: number | null;
  createdAt: string;
}

interface NotificationsPanelProps {
  onOpenChange?: (open: boolean) => void;
}

export default function NotificationsPanel({ onOpenChange }: NotificationsPanelProps) {
  const [open, setOpen] = useState(false);

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    refetchInterval: 30000,
  });

  const { data: unreadCountData } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/unread-count"],
    refetchInterval: 15000,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("POST", `/api/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/notifications/read-all");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });

  const unreadCount = unreadCountData?.count || 0;

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    onOpenChange?.(isOpen);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "approved":
        return <CircleCheck className="h-5 w-5 text-green-600" />;
      case "rejected":
        return <CircleX className="h-5 w-5 text-red-600" />;
      case "modified":
        return <Pencil className="h-5 w-5 text-orange-600" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const getNotificationBgColor = (type: string, isRead: boolean) => {
    if (isRead) return "bg-background";
    switch (type) {
      case "approved":
        return "bg-green-50 dark:bg-green-950/20";
      case "rejected":
        return "bg-red-50 dark:bg-red-950/20";
      case "modified":
        return "bg-orange-50 dark:bg-orange-950/20";
      default:
        return "bg-muted/50";
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          data-testid="button-notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader className="flex flex-row items-center justify-between gap-2 pb-4 border-b">
          <SheetTitle className="text-right">الإشعارات</SheetTitle>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
              className="text-xs"
              data-testid="button-mark-all-read"
            >
              <CheckCheck className="h-4 w-4 ml-1" />
              تحديد الكل كمقروء
            </Button>
          )}
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-120px)] mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Bell className="h-12 w-12 mb-4 opacity-50" />
              <p>لا توجد إشعارات</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-md transition-colors ${getNotificationBgColor(
                    notification.type,
                    notification.isRead
                  )}`}
                  data-testid={`notification-${notification.id}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className={`text-sm font-medium ${!notification.isRead ? "font-bold" : ""}`}>
                          {notification.title}
                        </h4>
                        {!notification.isRead && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0"
                            onClick={() => markAsReadMutation.mutate(notification.id)}
                            disabled={markAsReadMutation.isPending}
                            data-testid={`button-mark-read-${notification.id}`}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                      {notification.amount && (
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>المبلغ: {notification.amount.toLocaleString("ar-EG")} ج.م</span>
                          {notification.remainingBalance !== null && (
                            <span>الرصيد المتبقي: {notification.remainingBalance.toLocaleString("ar-EG")} ج.م</span>
                          )}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                          locale: ar,
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
