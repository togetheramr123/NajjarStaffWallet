import { useState } from "react";
import StatCard from "@/components/StatCard";
import ApprovalCard from "@/components/ApprovalCard";
import AdjustBalanceDialog from "@/components/AdjustBalanceDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import AbuOmarBanner from "@/components/AbuOmarBanner";
import { Button } from "@/components/ui/button";
import { Users, Wallet, Clock, CheckCircle, TrendingUp, ArrowLeft, Loader2, UserCircle, Plus, Minus } from "lucide-react";
import { Link } from "wouter";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface Stats {
  totalEmployees: number;
  totalBalance: number;
  pendingRequests: number;
  approvedThisMonth: number;
}

interface PendingRequest {
  id: string;
  employeeName: string;
  employeeId: string;
  amount: number;
  beneficiary: "self" | "family";
  requestDate: string;
  hasAttachment: boolean;
  notes?: string;
  userId: string;
  attachmentPath?: string;
}

interface Transaction {
  id: string;
  userId: string;
  type: string;
  amount: number;
  createdAt: string;
  description?: string;
}

export default function ManagerDashboard() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [adjustBalanceOpen, setAdjustBalanceOpen] = useState(false);

  const { data: stats, isLoading: statsLoading } = useQuery<Stats>({
    queryKey: ["/api/stats"],
    refetchInterval: 30000,
  });

  const { data: balanceData, isLoading: balanceLoading } = useQuery<{ currentBalance: number }>({
    queryKey: ["/api/balance"],
    refetchInterval: 30000,
  });

  const adjustBalanceMutation = useMutation({
    mutationFn: async (data: { employeeId: string; amount: number; type: 'add' | 'subtract'; reason: string }) => {
      const res = await apiRequest("POST", `/api/employees/${data.employeeId}/balance`, {
        amount: data.amount,
        type: data.type,
        reason: data.reason,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/balance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const { data: pendingRequests, isLoading: pendingLoading } = useQuery<PendingRequest[]>({
    queryKey: ["/api/withdrawal-requests/pending"],
    refetchInterval: 30000,
  });

  const { data: allTransactions } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions/all"],
    refetchInterval: 60000,
  });

  const processRequestMutation = useMutation({
    mutationFn: async ({ id, action, notes, modifiedAmount }: { id: string; action: string; notes?: string; modifiedAmount?: number }) => {
      const res = await apiRequest("POST", `/api/withdrawal-requests/${id}/process`, { action, notes, modifiedAmount });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/withdrawal-requests/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions/all"] });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleApprove = (id: string, notes: string) => {
    processRequestMutation.mutate(
      { id, action: "approve", notes },
      {
        onSuccess: () => {
          toast({
            title: "تمت الموافقة",
            description: "تمت الموافقة على الطلب بنجاح",
          });
        },
      }
    );
  };

  const handleReject = (id: string, reason: string) => {
    processRequestMutation.mutate(
      { id, action: "reject", notes: reason },
      {
        onSuccess: () => {
          toast({
            title: "تم الرفض",
            description: "تم رفض الطلب",
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleModify = (id: string, amount: number, notes: string) => {
    processRequestMutation.mutate(
      { id, action: "modify", notes, modifiedAmount: amount },
      {
        onSuccess: () => {
          toast({
            title: "تم التعديل",
            description: "تم تعديل المبلغ والموافقة على الطلب",
          });
        },
      }
    );
  };

  const chartData = [
    { month: "يناير", deposits: 15000, withdrawals: 8000 },
    { month: "فبراير", deposits: 18000, withdrawals: 10000 },
    { month: "مارس", deposits: 16000, withdrawals: 12000 },
    { month: "أبريل", deposits: 20000, withdrawals: 9000 },
    { month: "مايو", deposits: 22000, withdrawals: 11000 },
    { month: "يونيو", deposits: 19000, withdrawals: 13000 },
  ];

  const recentActivities = allTransactions?.slice(0, 5).map((t) => ({
    id: t.id,
    action: t.type === "withdrawal" ? "سحب رصيد" : t.type === "adjustment" ? "تعديل رصيد" : t.type === "service_fee" ? "رسوم خدمة" : "إيداع",
    employee: t.description || "موظف",
    amount: t.amount,
    time: new Date(t.createdAt).toLocaleString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
  })) || [];

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <div>
          <h2 className="text-2xl font-bold mb-1" data-testid="text-dashboard-title">مرحباً {user?.name}</h2>
          <p className="text-muted-foreground">نظرة عامة على النظام</p>
        </div>
        <div className="flex gap-2">
          <Link href="/employees">
            <Button variant="outline" data-testid="link-employees">
              إدارة الموظفين
              <ArrowLeft className="h-4 w-4 mr-2" />
            </Button>
          </Link>
          <Link href="/approvals">
            <Button data-testid="link-approvals">
              الطلبات المعلقة
              <Badge variant="secondary" className="mr-2">{pendingRequests?.length || 0}</Badge>
            </Button>
          </Link>
        </div>
      </div>

      <AbuOmarBanner />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="إجمالي الموظفين"
          value={stats?.totalEmployees || 0}
          icon={Users}
          description="موظف نشط"
          variant="primary"
        />
        <StatCard
          title="إجمالي الأرصدة"
          value={`${(stats?.totalBalance || 0).toLocaleString("ar-EG")} ج.م`}
          icon={Wallet}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="طلبات معلقة"
          value={stats?.pendingRequests || 0}
          icon={Clock}
          variant="warning"
        />
        <StatCard
          title="طلبات هذا الشهر"
          value={stats?.approvedThisMonth || 0}
          icon={CheckCircle}
          variant="success"
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <UserCircle className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">رصيدي الشخصي</CardTitle>
          </div>
          {user?.role === "manager" && (
            <Button 
              onClick={() => setAdjustBalanceOpen(true)}
              data-testid="button-adjust-my-balance"
            >
              <Wallet className="h-4 w-4 ml-2" />
              تعديل رصيدي
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-muted-foreground text-sm mb-1">الرصيد الحالي</p>
              {balanceLoading ? (
                <Loader2 className="h-5 w-5 animate-spin mx-auto" />
              ) : (
                <p className="text-2xl font-bold text-primary" data-testid="text-manager-balance">
                  {(balanceData?.currentBalance || user?.balance || 0).toLocaleString("ar-EG")} ج.م
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <AdjustBalanceDialog
        open={adjustBalanceOpen}
        onOpenChange={setAdjustBalanceOpen}
        employeeName={user?.name || "المدير"}
        employeeId={user?.id || ""}
        currentBalance={balanceData?.currentBalance || user?.balance || 0}
        onAdjust={(data) => adjustBalanceMutation.mutate(data)}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-lg">الإيداعات والسحوبات</CardTitle>
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                  }}
                />
                <Bar dataKey="deposits" name="إيداعات" fill="hsl(221 83% 53%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="withdrawals" name="سحوبات" fill="hsl(0 84% 60%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">آخر النشاطات</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[280px]">
              <div className="space-y-4">
                {recentActivities.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">لا توجد نشاطات</p>
                ) : (
                  recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 pb-3 border-b last:border-0">
                      <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{activity.action}</p>
                        <p className="text-xs text-muted-foreground">{activity.employee}</p>
                        {activity.amount > 0 && (
                          <p className="text-xs text-primary font-medium">{activity.amount.toLocaleString("ar-EG")} ج.م</p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{activity.time}</span>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-lg">طلبات السحب المعلقة</CardTitle>
          <Link href="/approvals">
            <Button variant="ghost" className="p-0" data-testid="link-view-all-approvals">
              عرض الكل
              <ArrowLeft className="h-4 w-4 mr-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {pendingLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : pendingRequests?.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">لا توجد طلبات معلقة</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pendingRequests?.slice(0, 3).map((request) => (
                <ApprovalCard
                  key={request.id}
                  request={{
                    id: request.id,
                    employeeName: request.employeeName,
                    employeeId: request.employeeId,
                    amount: request.amount,
                    beneficiary: request.beneficiary,
                    requestDate: new Date(request.requestDate).toISOString().split("T")[0],
                    hasAttachment: request.hasAttachment,
                    notes: request.notes,
                  }}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onModify={handleModify}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
