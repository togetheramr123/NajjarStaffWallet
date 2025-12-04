import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, TrendingDown, Clock } from "lucide-react";

interface BalanceCardProps {
  currentBalance: number;
  pendingAmount: number;
  monthlyFee: number;
  currency?: string;
}

export default function BalanceCard({ 
  currentBalance, 
  pendingAmount, 
  monthlyFee,
  currency = "ر.س"
}: BalanceCardProps) {
  const availableBalance = currentBalance - pendingAmount;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0">
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
          <CardTitle className="text-sm font-medium opacity-90">الرصيد الحالي</CardTitle>
          <Wallet className="h-5 w-5 opacity-80" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold" data-testid="text-current-balance">
            {currentBalance.toLocaleString('ar-SA')} {currency}
          </div>
          <p className="text-xs opacity-75 mt-1">إجمالي الرصيد المتاح</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">الرصيد المتاح</CardTitle>
          <Clock className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-chart-3" data-testid="text-available-balance">
            {availableBalance.toLocaleString('ar-SA')} {currency}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            بعد خصم الطلبات المعلقة ({pendingAmount.toLocaleString('ar-SA')})
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">رسوم الخدمة الشهرية</CardTitle>
          <TrendingDown className="h-5 w-5 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-destructive" data-testid="text-monthly-fee">
            {monthlyFee} {currency}
          </div>
          <p className="text-xs text-muted-foreground mt-1">يتم خصمها شهرياً</p>
        </CardContent>
      </Card>
    </div>
  );
}
