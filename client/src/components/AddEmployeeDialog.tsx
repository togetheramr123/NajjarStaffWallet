import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface Branch {
  id: string;
  name: string;
  code: string;
}

interface AddEmployeeDialogProps {
  onAdd: (employee: {
    name: string;
    employeeNumber: string;
    username: string;
    password: string;
    initialBalance: number;
    role: 'employee' | 'branch_manager' | 'manager';
    branchId?: string;
  }) => void;
  isLoading?: boolean;
  branches?: Branch[];
  employeeCount?: number;
}

function generateEmployeeNumber(count: number): string {
  const nextNumber = count + 1;
  return `EMP${nextNumber.toString().padStart(4, '0')}`;
}

export default function AddEmployeeDialog({ onAdd, isLoading, branches = [], employeeCount = 0 }: AddEmployeeDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [employeeNumber, setEmployeeNumber] = useState('');
  const [initialBalance, setInitialBalance] = useState('');
  const [role, setRole] = useState<'employee' | 'branch_manager' | 'manager'>('employee');
  const [branchId, setBranchId] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    if (open && !employeeNumber) {
      setEmployeeNumber(generateEmployeeNumber(employeeCount));
    }
  }, [open, employeeCount, employeeNumber]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !employeeNumber) {
      toast({
        title: "خطأ",
        description: "الرجاء إدخال اسم الموظف",
        variant: "destructive",
      });
      return;
    }

    if (name.length < 3) {
      toast({
        title: "خطأ",
        description: "الاسم يجب أن يكون 3 أحرف على الأقل",
        variant: "destructive",
      });
      return;
    }

    if (role === 'branch_manager' && (!branchId || branchId === 'none')) {
      toast({
        title: "خطأ",
        description: "يجب تحديد الفرع لمدير الفرع",
        variant: "destructive",
      });
      return;
    }

    onAdd({
      name,
      employeeNumber,
      username: name, // Using name as username as requested
      password: "123456", // Hardcoded unified password
      initialBalance: parseFloat(initialBalance) || 0,
      role,
      branchId: branchId && branchId !== 'none' ? branchId : undefined,
    });

    setOpen(false);
    setName('');
    setEmployeeNumber('');
    setInitialBalance('');
    setRole('employee');
    setBranchId('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-add-employee">
          <Plus className="h-4 w-4 ml-2" />
          إضافة موظف
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>إضافة موظف جديد</DialogTitle>
          <DialogDescription>
            أدخل بيانات الموظف الجديد
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="grid gap-4 py-4 overflow-y-auto flex-1 px-1">
            <div className="space-y-2">
              <Label htmlFor="name">اسم الموظف</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="الاسم الكامل"
                disabled={isLoading}
                data-testid="input-employee-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="initialBalance">الرصيد الابتدائي</Label>
              <Input
                id="initialBalance"
                type="number"
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
                placeholder="0"
                disabled={isLoading}
                data-testid="input-initial-balance"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">الصلاحية</Label>
              <Select value={role} onValueChange={(v) => setRole(v as 'employee' | 'branch_manager' | 'manager')} disabled={isLoading}>
                <SelectTrigger data-testid="select-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">موظف</SelectItem>
                  <SelectItem value="branch_manager">مدير فرع</SelectItem>
                  <SelectItem value="manager">مدير عام</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(role === 'employee' || role === 'branch_manager') && branches.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="branch">الفرع</Label>
                <Select value={branchId} onValueChange={setBranchId} disabled={isLoading}>
                  <SelectTrigger data-testid="select-branch">
                    <SelectValue placeholder="اختر الفرع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">بدون فرع</SelectItem>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter className="pt-4 border-t mt-2">
            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto" data-testid="button-confirm-add">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  جاري الإضافة...
                </>
              ) : (
                "حفظ الموظف"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
