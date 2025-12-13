import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Minus, Users, Loader2 } from "lucide-react";
import { useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface Employee {
  id: string;
  name: string;
  employeeNumber: string;
  balance: number;
  branchName?: string;
}

interface BulkBalanceDialogProps {
  employees: Employee[];
  onSubmit: (data: {
    employeeIds: string[];
    amount: number;
    type: 'add' | 'subtract';
    reason: string;
  }) => void;
  isLoading?: boolean;
}

export default function BulkBalanceDialog({ 
  employees,
  onSubmit,
  isLoading
}: BulkBalanceDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'add' | 'subtract'>('add');
  const [reason, setReason] = useState('');
  const { toast } = useToast();

  const employeeIds = useMemo(() => employees.map(e => e.id), [employees]);

  const isAllSelected = selectedIds.length === employees.length && employees.length > 0;

  const handleToggleEmployee = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(x => x !== id));
    }
  };

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds([...employeeIds]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedIds.length === 0) {
      toast({
        title: "خطأ",
        description: "الرجاء اختيار موظف واحد على الأقل",
        variant: "destructive",
      });
      return;
    }

    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      toast({
        title: "خطأ",
        description: "الرجاء إدخال مبلغ صحيح",
        variant: "destructive",
      });
      return;
    }

    if (!reason.trim()) {
      toast({
        title: "خطأ",
        description: "الرجاء إدخال سبب التعديل",
        variant: "destructive",
      });
      return;
    }

    if (type === 'subtract') {
      const insufficientEmployees = employees
        .filter(e => selectedIds.includes(e.id) && e.balance < numAmount);
      
      if (insufficientEmployees.length > 0) {
        toast({
          title: "خطأ",
          description: `${insufficientEmployees.length} موظف لا يملك رصيد كافٍ للخصم`,
          variant: "destructive",
        });
        return;
      }
    }

    onSubmit({
      employeeIds: selectedIds,
      amount: numAmount,
      type,
      reason,
    });

    setOpen(false);
    setSelectedIds([]);
    setAmount('');
    setReason('');
    setType('add');
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setSelectedIds([]);
      setAmount('');
      setReason('');
      setType('add');
    }
  };

  const totalChange = (parseFloat(amount) || 0) * selectedIds.length;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2" data-testid="button-bulk-balance">
          <Users className="h-4 w-4" />
          تعديل رصيد جماعي
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>تعديل الرصيد الجماعي</DialogTitle>
          <DialogDescription>
            اختر الموظفين وحدد المبلغ لإضافته أو خصمه من رصيدهم
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <Label>اختر الموظفين</Label>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm"
                  onClick={handleSelectAll}
                  data-testid="button-select-all"
                >
                  {isAllSelected ? 'إلغاء تحديد الكل' : 'تحديد الكل'}
                </Button>
              </div>
              <ScrollArea className="h-48 rounded-md border p-2">
                <div className="space-y-2">
                  {employees.map((employee) => {
                    const isChecked = selectedIds.includes(employee.id);
                    return (
                      <div
                        key={employee.id}
                        className="flex items-center gap-3 p-2 rounded-md hover-elevate"
                        data-testid={`employee-row-${employee.id}`}
                      >
                        <Checkbox
                          id={`bulk-emp-${employee.id}`}
                          checked={isChecked}
                          onCheckedChange={(checked) => handleToggleEmployee(employee.id, !!checked)}
                          data-testid={`checkbox-employee-${employee.id}`}
                        />
                        <label 
                          htmlFor={`bulk-emp-${employee.id}`}
                          className="flex-1 min-w-0 cursor-pointer"
                        >
                          <p className="text-sm font-medium truncate">{employee.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {employee.employeeNumber}
                            {employee.branchName && ` - ${employee.branchName}`}
                          </p>
                        </label>
                        <Badge variant="secondary" className="shrink-0">
                          {employee.balance.toLocaleString('ar-EG')} ج.م
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
              {selectedIds.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  تم اختيار {selectedIds.length} موظف
                </p>
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
                  <RadioGroupItem value="add" id="bulk-add" className="peer sr-only" />
                  <Label
                    htmlFor="bulk-add"
                    className="flex items-center justify-center gap-2 rounded-md border-2 border-muted bg-popover p-3 hover-elevate cursor-pointer peer-data-[state=checked]:border-chart-3 [&:has([data-state=checked])]:border-chart-3"
                  >
                    <Plus className="h-4 w-4 text-chart-3" />
                    <span className="text-sm font-medium">إضافة</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="subtract" id="bulk-subtract" className="peer sr-only" />
                  <Label
                    htmlFor="bulk-subtract"
                    className="flex items-center justify-center gap-2 rounded-md border-2 border-muted bg-popover p-3 hover-elevate cursor-pointer peer-data-[state=checked]:border-destructive [&:has([data-state=checked])]:border-destructive"
                  >
                    <Minus className="h-4 w-4 text-destructive" />
                    <span className="text-sm font-medium">خصم</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bulk-amount">المبلغ لكل موظف</Label>
              <Input
                id="bulk-amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                data-testid="input-bulk-amount"
              />
            </div>

            {selectedIds.length > 0 && amount && (
              <div className="bg-muted/50 rounded-md p-3">
                <div className="flex justify-between gap-2 text-sm">
                  <span className="text-muted-foreground">إجمالي التعديل</span>
                  <span className={`font-bold ${type === 'add' ? 'text-chart-3' : 'text-destructive'}`}>
                    {type === 'add' ? '+' : '-'}{totalChange.toLocaleString('ar-EG')} ج.م
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  ({parseFloat(amount).toLocaleString('ar-EG')} ج.م × {selectedIds.length} موظف)
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="bulk-reason">سبب التعديل</Label>
              <Textarea
                id="bulk-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="اذكر سبب تعديل الرصيد..."
                data-testid="input-bulk-reason"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              إلغاء
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || selectedIds.length === 0}
              data-testid="button-confirm-bulk"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  جاري التعديل...
                </>
              ) : (
                'تأكيد التعديل'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
