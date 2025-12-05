import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Download, Printer, Calendar, TrendingDown, TrendingUp, Building2 } from "lucide-react";
import { useRef } from "react";

interface Transaction {
  id: string;
  date: string;
  type: "withdrawal" | "deposit" | "service_fee" | "adjustment";
  amount: number;
  beneficiary?: "self" | "family";
  status: "approved" | "pending" | "rejected";
  description?: string;
}

interface AccountStatementProps {
  transactions: Transaction[];
  currentBalance: number;
  employeeName: string;
  employeeNumber: string;
}

const typeLabels: Record<string, string> = {
  withdrawal: "سحب رصيد",
  deposit: "إيداع رصيد",
  service_fee: "رسوم خدمة شهرية",
  adjustment: "تعديل رصيد",
};

export default function AccountStatement({
  transactions,
  currentBalance,
  employeeName,
  employeeNumber,
}: AccountStatementProps) {
  const statementRef = useRef<HTMLDivElement>(null);

  const approvedTransactions = transactions
    .filter((t) => t.status === "approved")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const calculateRunningBalance = () => {
    const sortedByDateAsc = [...approvedTransactions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    let openingBalance = currentBalance;
    for (const t of sortedByDateAsc) {
      if (t.type === "withdrawal" || t.type === "service_fee") {
        openingBalance += t.amount;
      } else {
        openingBalance -= t.amount;
      }
    }

    let runningBalance = openingBalance;
    const withBalance = sortedByDateAsc.map((t) => {
      if (t.type === "withdrawal" || t.type === "service_fee") {
        runningBalance -= t.amount;
      } else {
        runningBalance += t.amount;
      }
      return { ...t, balanceAfter: runningBalance };
    });

    return withBalance.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const transactionsWithBalance = calculateRunningBalance();

  const totalWithdrawals = approvedTransactions
    .filter((t) => t.type === "withdrawal")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalDeposits = approvedTransactions
    .filter((t) => t.type === "deposit" || t.type === "adjustment")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalServiceFees = approvedTransactions
    .filter((t) => t.type === "service_fee")
    .reduce((sum, t) => sum + t.amount, 0);

  const handlePrint = () => {
    const printWindow = window.open("", "", "width=800,height=600");
    if (!printWindow) return;

    const rows = transactionsWithBalance
      .map(
        (t) => `
        <tr>
          <td>${new Date(t.date).toLocaleDateString("ar-EG")}</td>
          <td>${typeLabels[t.type]}</td>
          <td>${t.beneficiary === "self" ? "شخصي" : t.beneficiary === "family" ? "عائلي" : "-"}</td>
          <td style="color: ${t.type === "withdrawal" || t.type === "service_fee" ? "#dc2626" : "#16a34a"}">
            ${t.type === "withdrawal" || t.type === "service_fee" ? "-" : "+"}${t.amount.toLocaleString("ar-EG")} ج.م
          </td>
          <td>${t.balanceAfter.toLocaleString("ar-EG")} ج.م</td>
        </tr>
      `
      )
      .join("");

    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>كشف حساب - ${employeeName}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; direction: rtl; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #1e3a8a; padding-bottom: 20px; }
            .logo { font-size: 28px; font-weight: bold; color: #1e3a8a; }
            .info { display: flex; justify-content: space-between; margin: 20px 0; background: #f3f4f6; padding: 15px; border-radius: 8px; }
            .info-item { text-align: center; }
            .info-label { color: #666; font-size: 12px; }
            .info-value { font-size: 18px; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { padding: 12px; text-align: right; border-bottom: 1px solid #ddd; }
            th { background: #1e3a8a; color: white; }
            .summary { margin-top: 30px; padding: 20px; background: #f3f4f6; border-radius: 8px; }
            .summary-row { display: flex; justify-content: space-between; padding: 8px 0; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 15px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">HSN GROUP</div>
            <div>فريق النجار - نظام إدارة رصيد الموظفين</div>
            <h2>كشف حساب المسحوبات</h2>
          </div>
          <div class="info">
            <div class="info-item">
              <div class="info-label">اسم الموظف</div>
              <div class="info-value">${employeeName}</div>
            </div>
            <div class="info-item">
              <div class="info-label">رقم الموظف</div>
              <div class="info-value">${employeeNumber}</div>
            </div>
            <div class="info-item">
              <div class="info-label">الرصيد الحالي</div>
              <div class="info-value" style="color: #1e3a8a;">${currentBalance.toLocaleString("ar-EG")} ج.م</div>
            </div>
            <div class="info-item">
              <div class="info-label">تاريخ الكشف</div>
              <div class="info-value">${new Date().toLocaleDateString("ar-EG")}</div>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>التاريخ</th>
                <th>نوع العملية</th>
                <th>المستفيد</th>
                <th>المبلغ</th>
                <th>الرصيد</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
          <div class="summary">
            <h3 style="margin-bottom: 15px;">ملخص الحساب</h3>
            <div class="summary-row">
              <span>إجمالي المسحوبات:</span>
              <span style="color: #dc2626;">${totalWithdrawals.toLocaleString("ar-EG")} ج.م</span>
            </div>
            <div class="summary-row">
              <span>إجمالي الإيداعات:</span>
              <span style="color: #16a34a;">${totalDeposits.toLocaleString("ar-EG")} ج.م</span>
            </div>
            <div class="summary-row">
              <span>رسوم الخدمة:</span>
              <span style="color: #dc2626;">${totalServiceFees.toLocaleString("ar-EG")} ج.م</span>
            </div>
            <div class="summary-row" style="border-top: 2px solid #1e3a8a; padding-top: 10px; margin-top: 10px;">
              <span style="font-weight: bold;">الرصيد الحالي:</span>
              <span style="font-weight: bold; color: #1e3a8a;">${currentBalance.toLocaleString("ar-EG")} ج.م</span>
            </div>
          </div>
          <div class="footer">
            <p>هذا الكشف صادر من نظام HSN GROUP لإدارة رصيد الموظفين</p>
            <p>تاريخ الطباعة: ${new Date().toLocaleString("ar-EG")}</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <Card ref={statementRef}>
      <CardHeader>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              كشف حساب المسحوبات
            </CardTitle>
            <CardDescription>عرض تفصيلي لجميع العمليات على حسابك</CardDescription>
          </div>
          <Button onClick={handlePrint} variant="outline" data-testid="button-print-statement">
            <Printer className="h-4 w-4 ml-2" />
            طباعة الكشف
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-primary/10 text-center">
            <p className="text-sm text-muted-foreground mb-1">الرصيد الحالي</p>
            <p className="text-2xl font-bold text-primary" data-testid="text-statement-balance">
              {currentBalance.toLocaleString("ar-EG")} ج.م
            </p>
          </div>
          <div className="p-4 rounded-lg bg-destructive/10 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingDown className="h-4 w-4 text-destructive" />
              <p className="text-sm text-muted-foreground">إجمالي السحوبات</p>
            </div>
            <p className="text-xl font-bold text-destructive">{totalWithdrawals.toLocaleString("ar-EG")} ج.م</p>
          </div>
          <div className="p-4 rounded-lg bg-green-500/10 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <p className="text-sm text-muted-foreground">إجمالي الإيداعات</p>
            </div>
            <p className="text-xl font-bold text-green-600">{totalDeposits.toLocaleString("ar-EG")} ج.م</p>
          </div>
          <div className="p-4 rounded-lg bg-orange-500/10 text-center">
            <p className="text-sm text-muted-foreground mb-1">رسوم الخدمة</p>
            <p className="text-xl font-bold text-orange-600">{totalServiceFees.toLocaleString("ar-EG")} ج.م</p>
          </div>
        </div>

        <Separator />

        <ScrollArea className="h-[400px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">التاريخ</TableHead>
                <TableHead className="text-right">نوع العملية</TableHead>
                <TableHead className="text-right">المستفيد</TableHead>
                <TableHead className="text-right">المبلغ</TableHead>
                <TableHead className="text-right">الرصيد بعد العملية</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactionsWithBalance.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                    لا توجد عمليات مسجلة
                  </TableCell>
                </TableRow>
              ) : (
                transactionsWithBalance.map((t, index) => (
                  <TableRow key={t.id} data-testid={`row-statement-${t.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {new Date(t.date).toLocaleDateString("ar-EG")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={t.type === "withdrawal" || t.type === "service_fee" ? "destructive" : "default"}
                        className="text-xs"
                      >
                        {typeLabels[t.type]}
                      </Badge>
                    </TableCell>
                    <TableCell>{t.beneficiary === "self" ? "شخصي" : t.beneficiary === "family" ? "عائلي" : "-"}</TableCell>
                    <TableCell
                      className={`font-semibold ${
                        t.type === "withdrawal" || t.type === "service_fee" ? "text-destructive" : "text-green-600"
                      }`}
                    >
                      {t.type === "withdrawal" || t.type === "service_fee" ? "-" : "+"}
                      {t.amount.toLocaleString("ar-EG")} ج.م
                    </TableCell>
                    <TableCell className="font-bold text-primary">{t.balanceAfter.toLocaleString("ar-EG")} ج.م</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
