import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MessageSquare, X, Check, Loader2 } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface Message {
  id: string;
  senderId: string;
  targetType: 'all' | 'branch' | 'individual';
  title: string;
  content: string;
  createdAt: string;
  sender: {
    name: string;
  };
  isRead: boolean;
}

export default function MessagesPanel() {
  const [open, setOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  const { data: messages, isLoading } = useQuery<Message[]>({
    queryKey: ["/api/messages"],
    refetchInterval: 30000,
  });

  const { data: unreadCount } = useQuery<{ count: number }>({
    queryKey: ["/api/messages/unread-count"],
    refetchInterval: 30000,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const res = await apiRequest("POST", `/api/messages/${messageId}/read`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/unread-count"] });
    },
  });

  const handleOpenMessage = (message: Message) => {
    setSelectedMessage(message);
    if (!message.isRead) {
      markAsReadMutation.mutate(message.id);
    }
  };

  const unreadMessages = messages?.filter(m => !m.isRead).length || 0;

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className="relative"
        data-testid="button-open-messages"
      >
        <MessageSquare className="h-5 w-5" />
        {unreadMessages > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 min-w-[20px] p-0 flex items-center justify-center text-xs"
          >
            {unreadMessages}
          </Badge>
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              الرسائل
              {unreadMessages > 0 && (
                <Badge variant="secondary">{unreadMessages} جديدة</Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedMessage ? (
            <div className="space-y-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedMessage(null)}
                className="mb-2"
              >
                <X className="h-4 w-4 ml-1" />
                رجوع
              </Button>
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">{selectedMessage.title}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>من: {selectedMessage.sender.name}</span>
                  <span>-</span>
                  <span>{format(new Date(selectedMessage.createdAt), "d MMMM yyyy", { locale: ar })}</span>
                </div>
                <p className="text-sm whitespace-pre-wrap pt-2 border-t">
                  {selectedMessage.content}
                </p>
              </div>
            </div>
          ) : (
            <>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : messages && messages.length > 0 ? (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        onClick={() => handleOpenMessage(message)}
                        className={`p-3 border rounded-md cursor-pointer transition-colors hover-elevate ${
                          !message.isRead ? 'bg-muted/50 border-primary/30' : ''
                        }`}
                        data-testid={`message-item-${message.id}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              {!message.isRead && (
                                <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                              )}
                              <h4 className={`font-medium truncate ${!message.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                                {message.title}
                              </h4>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                              {message.content}
                            </p>
                          </div>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {format(new Date(message.createdAt), "d/M", { locale: ar })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>لا توجد رسائل</p>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
