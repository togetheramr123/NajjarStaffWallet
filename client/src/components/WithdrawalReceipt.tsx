import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Printer, Download, X, Building2, CheckCircle } from "lucide-react";
import { useRef } from "react";

interface WithdrawalReceiptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receipt: {
    id: string;
    employeeName: string;
    employeeNumber: string;
    amount: number;
    remainingBalance: number;
    beneficiary: string;
    approvedBy: string;
    approvedAt: string;
    notes?: string;
  } | null;
}

export default function WithdrawalReceipt({ open, onOpenChange, receipt }: WithdrawalReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!receipt) return null;

  const handlePrint = () => {
    const printContent = receiptRef.current;
    if (!printContent) return;

    const printWindow = window.open("", "", "width=400,height=600");
    if (!printWindow) return;

    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>إيصال سحب - ${receipt.id}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; direction: rtl; }
            .header { text-align: center; margin-bottom: 20px; }
            .logo { font-size: 24px; font-weight: bold; color: #1e3a8a; }
            .subtitle { color: #666; font-size: 14px; }
            .receipt-box { border: 2px solid #1e3a8a; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #ddd; }
            .row:last-child { border-bottom: none; }
            .label { color: #666; }
            .value { font-weight: bold; }
            .amount { font-size: 24px; color: #16a34a; font-weight: bold; text-align: center; margin: 20px 0; }
            .remaining { background: #f3f4f6; padding: 10px; border-radius: 4px; text-align: center; margin-top: 10px; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
            .success-icon { text-align: center; color: #16a34a; font-size: 48px; margin-bottom: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">HON GROUP</div>
            <div class="subtitle">فريق النجار</div>
            <div class="subtitle">نظام إدارة رصيد الموظفين</div>
          </div>
          <div style="text-align: center; font-size: 48px; color: #16a34a;">✓</div>
          <h2 style="text-align: center; color: #16a34a;">تمت الموافقة على طلب السحب</h2>
          <div class="receipt-box">
            <div class="row">
              <span class="label">رقم الإيصال:</span>
              <span class="value">${receipt.id.slice(0, 8).toUpperCase()}</span>
            </div>
            <div class="row">
              <span class="label">اسم الموظف:</span>
              <span class="value">${receipt.employeeName}</span>
            </div>
            <div class="row">
              <span class="label">رقم الموظف:</span>
              <span class="value">${receipt.employeeNumber}</span>
            </div>
            <div class="row">
              <span class="label">المستفيد:</span>
              <span class="value">${receipt.beneficiary === "self" ? "شخصي" : "عائلي"}</span>
            </div>
            <div class="row">
              <span class="label">تاريخ الموافقة:</span>
              <span class="value">${new Date(receipt.approvedAt).toLocaleDateString("ar-SA")}</span>
            </div>
            <div class="row">
              <span class="label">تمت الموافقة بواسطة:</span>
              <span class="value">${receipt.approvedBy}</span>
            </div>
          </div>
          <div class="amount">${receipt.amount.toLocaleString("ar-SA")} ر.س</div>
          <div class="remaining">
            <div style="color: #666; font-size: 14px;">الرصيد المتبقي بعد السحب</div>
            <div style="font-size: 20px; font-weight: bold; color: #1e3a8a;">${receipt.remainingBalance.toLocaleString("ar-SA")} ر.س</div>
          </div>
          ${receipt.notes ? `<div style="margin-top: 15px; padding: 10px; background: #fef3c7; border-radius: 4px;"><strong>ملاحظات:</strong> ${receipt.notes}</div>` : ""}
          <div class="footer">
            <p>هذا الإيصال صادر من نظام HON GROUP</p>
            <p>تاريخ الطباعة: ${new Date().toLocaleString("ar-SA")}</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-center flex items-center justify-center gap-2">
            <CheckCircle className="h-6 w-6 text-green-600" />
            إيصال السحب
          </DialogTitle>
        </DialogHeader>

        <div ref={receiptRef}>
          <Card className="border-2 border-primary">
            <CardContent className="pt-6">
              <div className="text-center mb-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Building2 className="h-8 w-8 text-primary" />
                  <span className="text-xl font-bold text-primary">HON GROUP</span>
                </div>
                <p className="text-sm text-muted-foreground">فريق النجار</p>
              </div>

              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
              </div>

              <p className="text-center text-green-600 font-semibold mb-4">تمت الموافقة على طلب السحب</p>

              <Separator className="my-4" />

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">رقم الإيصال</span>
                  <span className="font-mono font-semibold">{receipt.id.slice(0, 8).toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">اسم الموظف</span>
                  <span className="font-semibold">{receipt.employeeName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">رقم الموظف</span>
                  <span>{receipt.employeeNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">المستفيد</span>
                  <span>{receipt.beneficiary === "self" ? "شخصي" : "عائلي"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">تاريخ الموافقة</span>
                  <span>{new Date(receipt.approvedAt).toLocaleDateString("ar-SA")}</span>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">مبلغ السحب</p>
                <p className="text-3xl font-bold text-green-600">{receipt.amount.toLocaleString("ar-SA")} ر.س</p>
              </div>

              <div className="mt-4 p-3 bg-muted rounded-lg text-center">
                <p className="text-sm text-muted-foreground">الرصيد المتبقي بعد السحب</p>
                <p className="text-xl font-bold text-primary">{receipt.remainingBalance.toLocaleString("ar-SA")} ر.س</p>
              </div>

              {receipt.notes && (
                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <p className="text-sm font-semibold mb-1">ملاحظات:</p>
                  <p className="text-sm">{receipt.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-2 mt-4">
          <Button onClick={handlePrint} className="flex-1" data-testid="button-print-receipt">
            <Printer className="h-4 w-4 ml-2" />
            طباعة الإيصال
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-close-receipt">
            <X className="h-4 w-4 ml-2" />
            إغلاق
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
