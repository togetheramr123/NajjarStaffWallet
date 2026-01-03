import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Send, Users, Building, User, Loader2, CheckCircle } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface Branch {
  id: string;
  name: string;
  code: string;
}

interface Employee {
  id: string;
  name: string;
  employeeNumber: string;
  role: string;
}

interface Message {
  id: string;
  senderId: string;
  targetType: 'all' | 'branch' | 'individual';
  targetBranchId: string | null;
  targetUserId: string | null;
  title: string;
  content: string;
  createdAt: string;
  sender: {
    name: string;
  };
  isRead: boolean;
}

export default function MessagesPage() {
  const { toast } = useToast();
  const [targetType, setTargetType] = useState<'all' | 'branch' | 'individual'>('all');
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const { data: branches } = useQuery<Branch[]>({
    queryKey: ["/api/branches"],
  });

  const { data: employees } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: messages, isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: ["/api/messages"],
    refetchInterval: 30000,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { targetType: string; targetBranchId?: string; targetUserId?: string; title: string; content: string }) => {
      const res = await apiRequest("POST", "/api/messages", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      toast({
        title: "تم الإرسال",
        description: "تم إرسال الرسالة بنجاح",
      });
      setTitle("");
      setContent("");
      setSelectedBranch("");
      setSelectedEmployee("");
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSend = () => {
    if (!title.trim() || !content.trim()) {
      toast({
        title: "خطأ",
        description: "العنوان والمحتوى مطلوبان",
        variant: "destructive",
      });
      return;
    }

    if (targetType === 'branch' && !selectedBranch) {
      toast({
        title: "خطأ",
        description: "يجب تحديد الفرع",
        variant: "destructive",
      });
      return;
    }

    if (targetType === 'individual' && !selectedEmployee) {
      toast({
        title: "خطأ",
        description: "يجب تحديد الموظف",
        variant: "destructive",
      });
      return;
    }

    sendMessageMutation.mutate({
      targetType,
      targetBranchId: targetType === 'branch' ? selectedBranch : undefined,
      targetUserId: targetType === 'individual' ? selectedEmployee : undefined,
      title,
      content,
    });
  };

  const getTargetLabel = (message: Message) => {
    if (message.targetType === 'all') return 'الجميع';
    if (message.targetType === 'branch') {
      const branch = branches?.find(b => b.id === message.targetBranchId);
      return `فرع: ${branch?.name || 'غير معروف'}`;
    }
    if (message.targetType === 'individual') {
      const employee = employees?.find(e => e.id === message.targetUserId);
      return `موظف: ${employee?.name || 'غير معروف'}`;
    }
    return '';
  };

  return (
    <div className="p-4 md:p-6 space-y-6" dir="rtl">
      <div className="flex items-center gap-3">
        <MessageSquare className="h-6 w-6 text-muted-foreground" />
        <h1 className="text-2xl font-bold">الرسائل والإعلانات</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              إرسال رسالة جديدة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>المستلم</Label>
              <RadioGroup
                value={targetType}
                onValueChange={(value) => setTargetType(value as 'all' | 'branch' | 'individual')}
                className="flex flex-wrap gap-4"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="all" id="all" />
                  <Label htmlFor="all" className="flex items-center gap-1 cursor-pointer">
                    <Users className="h-4 w-4" />
                    الجميع
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="branch" id="branch" />
                  <Label htmlFor="branch" className="flex items-center gap-1 cursor-pointer">
                    <Building className="h-4 w-4" />
                    فرع معين
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="individual" id="individual" />
                  <Label htmlFor="individual" className="flex items-center gap-1 cursor-pointer">
                    <User className="h-4 w-4" />
                    موظف معين
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {targetType === 'branch' && (
              <div className="space-y-2">
                <Label>اختر الفرع</Label>
                <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                  <SelectTrigger data-testid="select-branch">
                    <SelectValue placeholder="اختر الفرع" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches?.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name} ({branch.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {targetType === 'individual' && (
              <div className="space-y-2">
                <Label>اختر الموظف</Label>
                <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                  <SelectTrigger data-testid="select-employee">
                    <SelectValue placeholder="اختر الموظف" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees?.filter(e => e.role !== 'manager').map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.name} ({employee.employeeNumber})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">العنوان</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="عنوان الرسالة"
                data-testid="input-message-title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">المحتوى</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="اكتب الرسالة هنا..."
                rows={4}
                data-testid="input-message-content"
              />
            </div>

            <Button
              onClick={handleSend}
              disabled={sendMessageMutation.isPending}
              className="w-full"
              data-testid="button-send-message"
            >
              {sendMessageMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
              ) : (
                <Send className="h-4 w-4 ml-2" />
              )}
              إرسال الرسالة
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>الرسائل المرسلة</CardTitle>
          </CardHeader>
          <CardContent>
            {messagesLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : messages && messages.length > 0 ? (
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className="p-3 border rounded-md space-y-2"
                      data-testid={`message-${message.id}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-medium">{message.title}</h4>
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {getTargetLabel(message)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {message.content}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{format(new Date(message.createdAt), "d MMMM yyyy - h:mm a", { locale: ar })}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>لا توجد رسائل مرسلة</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
