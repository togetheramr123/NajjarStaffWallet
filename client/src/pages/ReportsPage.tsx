import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, TrendingUp, TrendingDown, Landmark, Receipt } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
import { useAuth } from "@/contexts/AuthContext";

interface Transaction {
  id: string;
  userId: string;
  type: "withdrawal" | "deposit" | "service_fee" | "adjustment";
  amount: number;
  createdAt: string;
}

export default function ReportsPage() {
  const { user: currentUser } = useAuth();

  const { data: transactions, isLoading: txLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions/all"],
    refetchInterval: 30000,
  });

  const { data: branches, isLoading: branchesLoading } = useQuery<any[]>({
    queryKey: ["/api/branches"],
  });

  const { data: employees } = useQuery<any[]>({
    queryKey: ["/api/employees"],
  });

  if (txLoading || branchesLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const txs = transactions || [];

  // Totals calculations
  const totalWithdrawal = txs.filter(t => t.type === "withdrawal").reduce((acc, t) => acc + t.amount, 0);
  const totalDeposit = txs.filter(t => t.type === "deposit").reduce((acc, t) => acc + t.amount, 0);
  const totalServiceFee = txs.filter(t => t.type === "service_fee").reduce((acc, t) => acc + t.amount, 0);
  const totalAdjustment = txs.filter(t => t.type === "adjustment").reduce((acc, t) => acc + t.amount, 0);

  // Group by type for Pie Chart
  const typeData = [
    { name: "السحوبات", value: totalWithdrawal, color: "#ef4444" },
    { name: "الإيداعات", value: totalDeposit, color: "#10b981" },
    { name: "رسوم الخدمة", value: totalServiceFee, color: "#6366f1" },
    { name: "تعديلات الأرصدة", value: totalAdjustment, color: "#f59e0b" },
  ].filter(d => d.value > 0);

  // Group by Branch
  const branchMap = new Map(branches?.map(b => [b.id, b.name]) || []);
  const employeeBranchMap = new Map(employees?.map(e => [e.id, e.branchId]) || []);
  
  const branchTotals: Record<string, { name: string; withdrawals: number; deposits: number }> = {};
  
  // Initialize branches
  branches?.forEach(b => {
    branchTotals[b.id] = { name: b.name, withdrawals: 0, deposits: 0 };
  });
  branchTotals["none"] = { name: "بدون فرع", withdrawals: 0, deposits: 0 };

  txs.forEach(t => {
    const branchId = employeeBranchMap.get(t.userId) || "none";
    if (!branchTotals[branchId]) {
      branchTotals[branchId] = { name: "أخرى", withdrawals: 0, deposits: 0 };
    }
    if (t.type === "withdrawal") {
      branchTotals[branchId].withdrawals += t.amount;
    } else if (t.type === "deposit") {
      branchTotals[branchId].deposits += t.amount;
    }
  });

  const branchChartData = Object.values(branchTotals).filter(b => b.withdrawals > 0 || b.deposits > 0);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold">التقارير والإحصائيات</h1>
        <p className="text-muted-foreground mt-1">نظرة عامة على الأداء المالي للنظام وتوزيع المعاملات</p>
      </div>

      {/* Grid of stats */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الإيداعات</CardTitle>
            <Landmark className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{totalDeposit.toLocaleString("ar-EG")} ج.م</div>
            <p className="text-xs text-muted-foreground mt-1">إجمالي الأموال التي شحنت للنظام</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">إجمالي السحوبات</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{totalWithdrawal.toLocaleString("ar-EG")} ج.م</div>
            <p className="text-xs text-muted-foreground mt-1">إجمالي العمليات النقدية المسحوبة</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">إجمالي رسوم الخدمة</CardTitle>
            <Receipt className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">{totalServiceFee.toLocaleString("ar-EG")} ج.م</div>
            <p className="text-xs text-muted-foreground mt-1">الإيرادات المجمعة من رسوم السحب</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">إجمالي التعديلات</CardTitle>
            <TrendingUp className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{totalAdjustment.toLocaleString("ar-EG")} ج.م</div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">التعديلات اليدوية والتسويات</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Branch breakdown */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>توزيع العمليات حسب الفروع</CardTitle>
            <CardDescription>مقارنة بين الإيداعات والسحوبات لكل فرع</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {branchChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                لا توجد بيانات فرعية كافية للعرض
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={branchChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip 
                    formatter={(value: any) => [`${value.toLocaleString("ar-EG")} ج.م`]}
                  />
                  <Bar dataKey="deposits" name="الإيداعات" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="withdrawals" name="السحوبات" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Breakdown by Type (Pie) */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>نسب توزيع المعاملات المالية</CardTitle>
            <CardDescription>النسبة المئوية لإجمالي حجم العمليات في النظام</CardDescription>
          </CardHeader>
          <CardContent className="h-80 flex flex-col sm:flex-row items-center justify-around">
            {typeData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                لا توجد بيانات كافية للعرض
              </div>
            ) : (
              <>
                <div className="w-full sm:w-1/2 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={typeData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={85}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {typeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip formatter={(value: any) => [`${value.toLocaleString("ar-EG")} ج.م`]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col gap-2">
                  {typeData.map((d, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: d.color }}></span>
                      <span className="text-sm font-semibold">{d.name}</span>
                      <span className="text-xs text-muted-foreground">({((d.value / typeData.reduce((acc, x) => acc + x.value, 0)) * 100).toFixed(1)}%)</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
