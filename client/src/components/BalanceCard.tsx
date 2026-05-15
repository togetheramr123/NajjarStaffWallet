import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, TrendingDown, Clock, Eye, EyeOff, Shield } from "lucide-react";

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
  currency = "ج.م"
}: BalanceCardProps) {
  const [isBalanceVisible, setIsBalanceVisible] = useState(false);
  const availableBalance = currentBalance - pendingAmount;

  const formatBalance = (amount: number) => {
    if (!isBalanceVisible) return "••••••";
    return amount.toLocaleString('ar-EG');
  };

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Main Balance Card - Premium Gradient */}
      <Card className="premium-gradient text-white border-0 overflow-hidden relative animate-fade-in-up">
        {/* Decorative circles */}
        <div className="absolute -top-6 -left-6 w-24 h-24 bg-white/10 rounded-full blur-xl" />
        <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/5 rounded-full blur-xl" />
        
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2 relative z-10">
          <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-2">
            <Shield className="h-4 w-4" />
            الرصيد الحالي
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200"
              onClick={() => setIsBalanceVisible(!isBalanceVisible)}
              data-testid="button-toggle-balance"
            >
              {isBalanceVisible ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
            </Button>
            <Wallet className="h-5 w-5 opacity-80 animate-float" />
          </div>
        </CardHeader>
        <CardContent className="relative z-10">
          <div 
            className="text-3xl font-bold tracking-tight transition-all duration-300" 
            data-testid="text-current-balance"
            style={{ filter: isBalanceVisible ? 'none' : 'blur(0px)' }}
          >
            {formatBalance(currentBalance)} {isBalanceVisible ? currency : ''}
          </div>
          <p className="text-xs opacity-75 mt-2 flex items-center gap-1">
            {isBalanceVisible ? 'اضغط العين لإخفاء الرصيد' : 'اضغط العين لإظهار الرصيد'}
          </p>
        </CardContent>
      </Card>

      {/* Available Balance Card */}
      <Card className="animate-fade-in-up stagger-2 opacity-0 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">الرصيد المتاح</CardTitle>
          <div className="p-2 rounded-full bg-green-100 dark:bg-green-950/40">
            <Clock className="h-4 w-4 text-green-600 dark:text-green-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-chart-3 transition-all duration-300" data-testid="text-available-balance">
            {formatBalance(availableBalance)} {isBalanceVisible ? currency : ''}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {isBalanceVisible 
              ? `بعد خصم الطلبات المعلقة (${pendingAmount.toLocaleString('ar-EG')})` 
              : 'اضغط العين لإظهار التفاصيل'}
          </p>
        </CardContent>
      </Card>

      {/* Monthly Fee Card */}
      <Card className="animate-fade-in-up stagger-3 opacity-0 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">رسوم الخدمة الشهرية</CardTitle>
          <div className="p-2 rounded-full bg-red-100 dark:bg-red-950/40">
            <TrendingDown className="h-4 w-4 text-destructive" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-destructive" data-testid="text-monthly-fee">
            {monthlyFee} {currency}
          </div>
          <p className="text-xs text-muted-foreground mt-2">يتم خصمها شهرياً</p>
        </CardContent>
      </Card>
    </div>
  );
}
