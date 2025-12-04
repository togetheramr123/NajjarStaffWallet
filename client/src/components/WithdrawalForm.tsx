import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Send, User, Users } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface WithdrawalFormProps {
  maxAmount: number;
  onSubmit: (data: { amount: number; beneficiary: 'self' | 'family'; notes: string; attachment?: File }) => void;
  isLoading?: boolean;
}

export default function WithdrawalForm({ maxAmount, onSubmit, isLoading }: WithdrawalFormProps) {
  const [amount, setAmount] = useState('');
  const [beneficiary, setBeneficiary] = useState<'self' | 'family'>('self');
  const [notes, setNotes] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
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
    
    if (numAmount > maxAmount) {
      toast({
        title: "خطأ",
        description: `المبلغ المطلوب يتجاوز الرصيد المتاح (${maxAmount.toLocaleString('ar-SA')} ر.س)`,
        variant: "destructive",
      });
      return;
    }

    if (!attachment) {
      toast({
        title: "خطأ",
        description: "الرجاء إرفاق المستند المطلوب",
        variant: "destructive",
      });
      return;
    }

    onSubmit({
      amount: numAmount,
      beneficiary,
      notes,
      attachment: attachment || undefined,
    });

    toast({
      title: "تم إرسال الطلب",
      description: "سيتم مراجعة طلبك من قبل الإدارة",
    });

    setAmount('');
    setNotes('');
    setAttachment(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachment(file);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">طلب سحب رصيد</CardTitle>
        <CardDescription>
          الرصيد المتاح للسحب: {maxAmount.toLocaleString('ar-SA')} ر.س
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="amount">المبلغ المطلوب (ر.س)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-lg"
              data-testid="input-amount"
            />
            <p className="text-xs text-muted-foreground">
              الحد الأقصى: {maxAmount.toLocaleString('ar-SA')} ر.س
            </p>
          </div>

          <div className="space-y-3">
            <Label>المستفيد من السحب</Label>
            <RadioGroup 
              value={beneficiary} 
              onValueChange={(v) => setBeneficiary(v as 'self' | 'family')}
              className="grid grid-cols-2 gap-4"
            >
              <div>
                <RadioGroupItem 
                  value="self" 
                  id="self" 
                  className="peer sr-only" 
                  data-testid="radio-self"
                />
                <Label
                  htmlFor="self"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover-elevate cursor-pointer peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <User className="mb-3 h-6 w-6" />
                  <span className="text-sm font-medium">لي شخصياً</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem 
                  value="family" 
                  id="family" 
                  className="peer sr-only"
                  data-testid="radio-family"
                />
                <Label
                  htmlFor="family"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover-elevate cursor-pointer peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <Users className="mb-3 h-6 w-6" />
                  <span className="text-sm font-medium">لأسرتي</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="attachment">إرفاق المستند</Label>
            <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center hover-elevate cursor-pointer transition-colors">
              <input
                type="file"
                id="attachment"
                className="hidden"
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png"
                data-testid="input-attachment"
              />
              <label htmlFor="attachment" className="cursor-pointer">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                {attachment ? (
                  <p className="text-sm font-medium">{attachment.name}</p>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">اضغط لرفع الملف</p>
                    <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG</p>
                  </>
                )}
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">ملاحظات (اختياري)</Label>
            <Textarea
              id="notes"
              placeholder="أي ملاحظات إضافية..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              data-testid="input-notes"
            />
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
            data-testid="button-submit-withdrawal"
          >
            <Send className="h-4 w-4 ml-2" />
            {isLoading ? 'جاري الإرسال...' : 'إرسال الطلب'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
