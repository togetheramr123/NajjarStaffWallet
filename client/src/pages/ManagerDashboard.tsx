import StatCard from "@/components/StatCard";
import ApprovalCard from "@/components/ApprovalCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Wallet, Clock, CheckCircle, TrendingUp, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// todo: remove mock functionality
const mockPendingRequests = [
  { id: '1', employeeName: 'أحمد محمد', employeeId: 'EMP001', amount: 1500, beneficiary: 'self' as const, requestDate: '2024-12-20', hasAttachment: true },
  { id: '2', employeeName: 'سارة أحمد', employeeId: 'EMP002', amount: 800, beneficiary: 'family' as const, requestDate: '2024-12-19', hasAttachment: true },
  { id: '3', employeeName: 'محمد علي', employeeId: 'EMP003', amount: 2000, beneficiary: 'self' as const, requestDate: '2024-12-18', hasAttachment: false },
];

// todo: remove mock functionality
const chartData = [
  { month: 'يناير', deposits: 15000, withdrawals: 8000 },
  { month: 'فبراير', deposits: 18000, withdrawals: 10000 },
  { month: 'مارس', deposits: 16000, withdrawals: 12000 },
  { month: 'أبريل', deposits: 20000, withdrawals: 9000 },
  { month: 'مايو', deposits: 22000, withdrawals: 11000 },
  { month: 'يونيو', deposits: 19000, withdrawals: 13000 },
];

// todo: remove mock functionality
const recentActivities = [
  { id: '1', action: 'موافقة على سحب', employee: 'أحمد محمد', amount: 500, time: 'منذ 5 دقائق' },
  { id: '2', action: 'إضافة رصيد', employee: 'سارة أحمد', amount: 2000, time: 'منذ ساعة' },
  { id: '3', action: 'رفض طلب', employee: 'محمد علي', amount: 3000, time: 'منذ ساعتين' },
  { id: '4', action: 'موظف جديد', employee: 'فاطمة حسن', amount: 0, time: 'منذ 3 ساعات' },
];

export default function ManagerDashboard() {
  const handleApprove = (id: string, notes: string) => {
    console.log('Approved:', id, notes);
  };

  const handleReject = (id: string, reason: string) => {
    console.log('Rejected:', id, reason);
  };

  const handleModify = (id: string, amount: number, notes: string) => {
    console.log('Modified:', id, amount, notes);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <div>
          <h2 className="text-2xl font-bold mb-1">لوحة تحكم المدير</h2>
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
              <Badge variant="secondary" className="mr-2">{mockPendingRequests.length}</Badge>
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="إجمالي الموظفين"
          value={125}
          icon={Users}
          description="موظف نشط"
          variant="primary"
        />
        <StatCard 
          title="إجمالي الأرصدة"
          value="150,000 ر.س"
          icon={Wallet}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard 
          title="طلبات معلقة"
          value={mockPendingRequests.length}
          icon={Clock}
          variant="warning"
        />
        <StatCard 
          title="طلبات هذا الشهر"
          value={45}
          icon={CheckCircle}
          variant="success"
        />
      </div>

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
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
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
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 pb-3 border-b last:border-0">
                    <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{activity.action}</p>
                      <p className="text-xs text-muted-foreground">{activity.employee}</p>
                      {activity.amount > 0 && (
                        <p className="text-xs text-primary font-medium">
                          {activity.amount.toLocaleString('ar-SA')} ر.س
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{activity.time}</span>
                  </div>
                ))}
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {mockPendingRequests.slice(0, 3).map((request) => (
              <ApprovalCard
                key={request.id}
                request={request}
                onApprove={handleApprove}
                onReject={handleReject}
                onModify={handleModify}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
