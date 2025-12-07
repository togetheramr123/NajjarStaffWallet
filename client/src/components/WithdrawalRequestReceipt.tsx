import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Printer, X, Building2, Clock } from "lucide-react";

interface WithdrawalRequestReceiptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: {
    id: string;
    employeeName: string;
    employeeNumber: string;
    amount: number;
    beneficiary: string;
    notes?: string;
    createdAt: string;
  } | null;
}

export default function WithdrawalRequestReceipt({ open, onOpenChange, request }: WithdrawalRequestReceiptProps) {
  if (!request) return null;

  const handlePrint = () => {
    const printWindow = window.open("", "", "width=400,height=600");
    if (!printWindow) return;

    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>طلب سحب - ${request.id}</title>
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
            .amount { font-size: 24px; color: #1e3a8a; font-weight: bold; text-align: center; margin: 20px 0; }
            .status { background: #fef3c7; padding: 10px; border-radius: 4px; text-align: center; margin-top: 10px; color: #92400e; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
            .pending-icon { text-align: center; color: #f59e0b; font-size: 48px; margin-bottom: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">HSN GROUP</div>
            <div class="subtitle">فريق النجار</div>
            <div class="subtitle">نظام إدارة رصيد الموظفين</div>
          </div>
          <div style="text-align: center; font-size: 48px; color: #f59e0b;">⏳</div>
          <h2 style="text-align: center; color: #1e3a8a;">طلب سحب جديد</h2>
          <div class="receipt-box">
            <div class="row">
              <span class="label">رقم الطلب:</span>
              <span class="value">${request.id.slice(0, 8).toUpperCase()}</span>
            </div>
            <div class="row">
              <span class="label">اسم الموظف:</span>
              <span class="value">${request.employeeName}</span>
            </div>
            <div class="row">
              <span class="label">رقم الموظف:</span>
              <span class="value">${request.employeeNumber}</span>
            </div>
            <div class="row">
              <span class="label">المستفيد:</span>
              <span class="value">${request.beneficiary === "self" ? "شخصي" : "عائلي"}</span>
            </div>
            <div class="row">
              <span class="label">تاريخ الطلب:</span>
              <span class="value">${new Date(request.createdAt).toLocaleDateString("ar-EG")}</span>
            </div>
            <div class="row">
              <span class="label">وقت الطلب:</span>
              <span class="value">${new Date(request.createdAt).toLocaleTimeString("ar-EG")}</span>
            </div>
          </div>
          <div class="amount">${request.amount.toLocaleString("ar-EG")} ج.م</div>
          <div class="status">
            <strong>حالة الطلب: في انتظار الموافقة</strong>
          </div>
          ${request.notes ? `<div style="margin-top: 15px; padding: 10px; background: #f3f4f6; border-radius: 4px;"><strong>ملاحظات:</strong> ${request.notes}</div>` : ""}
          <div class="footer">
            <p>هذا الإيصال تأكيد لاستلام طلب السحب</p>
            <p>سيتم مراجعة الطلب والرد عليه في أقرب وقت</p>
            <p>تاريخ الطباعة: ${new Date().toLocaleString("ar-EG")}</p>
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
            <Clock className="h-6 w-6 text-yellow-600" />
            تم تقديم طلب السحب
          </DialogTitle>
        </DialogHeader>

        <Card className="border-2 border-primary">
          <CardContent className="pt-6">
            <div className="text-center mb-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Building2 className="h-8 w-8 text-primary" />
                <span className="text-xl font-bold text-primary">HSN GROUP</span>
              </div>
              <p className="text-sm text-muted-foreground">فريق النجار</p>
            </div>

            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                <Clock className="h-10 w-10 text-yellow-600" />
              </div>
            </div>

            <p className="text-center text-yellow-600 font-semibold mb-4">في انتظار الموافقة</p>

            <Separator className="my-4" />

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">رقم الطلب</span>
                <span className="font-mono font-semibold" data-testid="text-request-id">{request.id.slice(0, 8).toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">اسم الموظف</span>
                <span className="font-semibold" data-testid="text-employee-name">{request.employeeName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">رقم الموظف</span>
                <span data-testid="text-employee-number">{request.employeeNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">المستفيد</span>
                <span data-testid="text-beneficiary">{request.beneficiary === "self" ? "شخصي" : "عائلي"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">تاريخ الطلب</span>
                <span data-testid="text-date">{new Date(request.createdAt).toLocaleDateString("ar-EG")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">وقت الطلب</span>
                <span data-testid="text-time">{new Date(request.createdAt).toLocaleTimeString("ar-EG")}</span>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">المبلغ المطلوب</p>
              <p className="text-3xl font-bold text-primary" data-testid="text-amount">{request.amount.toLocaleString("ar-EG")} ج.م</p>
            </div>

            {request.notes && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <p className="text-sm font-semibold mb-1">ملاحظات:</p>
                <p className="text-sm" data-testid="text-notes">{request.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3 mt-4">
          <Button onClick={handlePrint} className="w-full" data-testid="button-print-request">
            <Printer className="h-4 w-4 ml-2" />
            طباعة / حفظ PDF
          </Button>
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={() => onOpenChange(false)} 
            data-testid="button-close-request-receipt"
          >
            <X className="h-4 w-4 ml-2" />
            إغلاق
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
