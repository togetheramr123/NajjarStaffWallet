import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Plus, Minus } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface AdjustBalanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeName: string;
  employeeId: string;
  currentBalance: number;
  onAdjust: (data: {
    employeeId: string;
    amount: number;
    type: 'add' | 'subtract';
    reason: string;
  }) => void;
}

export default function AdjustBalanceDialog({ 
  open, 
  onOpenChange, 
  employeeName, 
  employeeId,
  currentBalance,
  onAdjust 
}: AdjustBalanceDialogProps) {
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'add' | 'subtract'>('add');
  const [reason, setReason] = useState('');
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      toast({
        title: "خطأ",
        description: "الرجاء إدخال مبلغ صحيح",
        variant: "destructive",
      });
      return;
    }

    if (type === 'subtract' && numAmount > currentBalance) {
      toast({
        title: "خطأ",
        description: "المبلغ المراد خصمه يتجاوز الرصيد الحالي",
        variant: "destructive",
      });
      return;
    }

    if (!reason) {
      toast({
        title: "خطأ",
        description: "الرجاء إدخال سبب التعديل",
        variant: "destructive",
      });
      return;
    }

    onAdjust({
      employeeId,
      amount: numAmount,
      type,
      reason,
    });

    toast({
      title: "تم تعديل الرصيد",
      description: `تم ${type === 'add' ? 'إضافة' : 'خصم'} ${numAmount.toLocaleString('ar-SA')} ر.س`,
    });

    onOpenChange(false);
    setAmount('');
    setReason('');
  };

  const newBalance = type === 'add' 
    ? currentBalance + (parseFloat(amount) || 0)
    : currentBalance - (parseFloat(amount) || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>تعديل رصيد الموظف</DialogTitle>
          <DialogDescription>
            تعديل رصيد {employeeName}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="bg-muted/50 rounded-md p-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">الرصيد الحالي</span>
                <span className="font-medium">{currentBalance.toLocaleString('ar-SA')} ر.س</span>
              </div>
              {amount && (
                <div className="flex justify-between text-sm mt-2 pt-2 border-t">
                  <span className="text-muted-foreground">الرصيد الجديد</span>
                  <span className={`font-bold ${newBalance >= 0 ? 'text-chart-3' : 'text-destructive'}`}>
                    {newBalance.toLocaleString('ar-SA')} ر.س
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Label>نوع التعديل</Label>
              <RadioGroup 
                value={type} 
                onValueChange={(v) => setType(v as 'add' | 'subtract')}
                className="grid grid-cols-2 gap-4"
              >
                <div>
                  <RadioGroupItem value="add" id="add" className="peer sr-only" />
                  <Label
                    htmlFor="add"
                    className="flex items-center justify-center gap-2 rounded-md border-2 border-muted bg-popover p-3 hover-elevate cursor-pointer peer-data-[state=checked]:border-chart-3 [&:has([data-state=checked])]:border-chart-3"
                  >
                    <Plus className="h-4 w-4 text-chart-3" />
                    <span className="text-sm font-medium">إضافة</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="subtract" id="subtract" className="peer sr-only" />
                  <Label
                    htmlFor="subtract"
                    className="flex items-center justify-center gap-2 rounded-md border-2 border-muted bg-popover p-3 hover-elevate cursor-pointer peer-data-[state=checked]:border-destructive [&:has([data-state=checked])]:border-destructive"
                  >
                    <Minus className="h-4 w-4 text-destructive" />
                    <span className="text-sm font-medium">خصم</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">المبلغ</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                data-testid="input-adjust-amount"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">سبب التعديل</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="اذكر سبب تعديل الرصيد..."
                data-testid="input-adjust-reason"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" data-testid="button-confirm-adjust">
              تأكيد التعديل
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
