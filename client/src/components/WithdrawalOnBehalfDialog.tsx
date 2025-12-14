import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface WithdrawalOnBehalfDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeName: string;
  employeeId: string;
  availableBalance: number;
  onSubmit: (data: { employeeId: string; amount: number; beneficiary: "self" | "family"; notes?: string }) => void;
  isLoading?: boolean;
}

export default function WithdrawalOnBehalfDialog({
  open,
  onOpenChange,
  employeeName,
  employeeId,
  availableBalance,
  onSubmit,
  isLoading = false,
}: WithdrawalOnBehalfDialogProps) {
  const [amount, setAmount] = useState("");
  const [beneficiary, setBeneficiary] = useState<"self" | "family">("self");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("يرجى إدخال مبلغ صحيح");
      return;
    }

    if (numAmount > availableBalance) {
      setError("المبلغ يتجاوز الرصيد المتاح");
      return;
    }

    onSubmit({
      employeeId,
      amount: numAmount,
      beneficiary,
      notes: notes || undefined,
    });
    
    setAmount("");
    setBeneficiary("self");
    setNotes("");
    setError("");
  };

  const handleClose = () => {
    setAmount("");
    setBeneficiary("self");
    setNotes("");
    setError("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>طلب سحب بالنيابة عن الموظف</DialogTitle>
          <DialogDescription>
            إنشاء طلب سحب للموظف: {employeeName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="available-balance">الرصيد المتاح</Label>
            <div className="p-3 bg-muted rounded-md text-lg font-bold" data-testid="text-available-balance">
              {availableBalance.toLocaleString("ar-EG")} ج.م
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">المبلغ المطلوب</Label>
            <Input
              id="amount"
              type="number"
              placeholder="أدخل المبلغ"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min={1}
              max={availableBalance}
              data-testid="input-withdrawal-amount"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="beneficiary">المستفيد</Label>
            <Select value={beneficiary} onValueChange={(v) => setBeneficiary(v as "self" | "family")}>
              <SelectTrigger data-testid="select-beneficiary">
                <SelectValue placeholder="اختر المستفيد" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="self">شخصي</SelectItem>
                <SelectItem value="family">عائلي</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">ملاحظات (اختياري)</Label>
            <Textarea
              id="notes"
              placeholder="أدخل أي ملاحظات إضافية"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              data-testid="input-notes"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive" data-testid="text-error">{error}</p>
          )}

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              إلغاء
            </Button>
            <Button type="submit" disabled={isLoading} data-testid="button-submit-withdrawal">
              {isLoading && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
              إرسال الطلب
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
