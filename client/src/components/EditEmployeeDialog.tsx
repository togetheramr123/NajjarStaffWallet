import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface Branch {
  id: string;
  name: string;
  code: string;
}

interface Employee {
  id: string;
  name: string;
  employeeNumber: string;
  username?: string;
  role: "employee" | "branch_manager" | "manager";
  status: "active" | "inactive";
  branchId?: string | null;
}

interface EditEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee | null;
  onSave: (data: { id: string; name: string; username: string; employeeNumber: string; password?: string; role: string; branchId?: string }) => void;
  isLoading?: boolean;
  branches?: Branch[];
}

export default function EditEmployeeDialog({ 
  open, 
  onOpenChange, 
  employee, 
  onSave, 
  isLoading,
  branches = []
}: EditEmployeeDialogProps) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [employeeNumber, setEmployeeNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<"employee" | "branch_manager" | "manager">("employee");
  const [branchId, setBranchId] = useState<string>("");

  const convertArabicNumerals = (str: string) => {
    const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return str.replace(/[٠-٩]/g, (w) => arabicNumbers.indexOf(w).toString());
  };

  useEffect(() => {
    if (employee) {
      setName(employee.name);
      setUsername(employee.username || "");
      setEmployeeNumber(employee.employeeNumber);
      setRole(employee.role);
      setBranchId(employee.branchId || "none");
      setPassword("");
    }
  }, [employee]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!employee) return;

    if (role === 'branch_manager' && (!branchId || branchId === 'none')) {
      toast({
        title: "خطأ",
        description: "يجب تحديد الفرع لمدير الفرع",
        variant: "destructive",
      });
      return;
    }

    onSave({
      id: employee.id,
      name,
      username,
      employeeNumber,
      password: password || undefined,
      role,
      branchId: branchId && branchId !== 'none' ? branchId : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>تعديل بيانات الموظف</DialogTitle>
          <DialogDescription>
            تعديل بيانات {employee?.name}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="grid gap-4 py-4 overflow-y-auto flex-1 px-1">
            <div className="space-y-2">
              <Label htmlFor="edit-name">اسم الموظف</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="الاسم الكامل"
                disabled={isLoading}
                data-testid="input-edit-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-username">اسم المستخدم (للدخول)</Label>
              <Input
                id="edit-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="اسم المستخدم"
                disabled={isLoading}
                data-testid="input-edit-username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-employeeNumber">رقم الموظف</Label>
              <Input
                id="edit-employeeNumber"
                value={employeeNumber}
                onChange={(e) => setEmployeeNumber(e.target.value)}
                placeholder="مثال: EMP001"
                disabled={isLoading}
                data-testid="input-edit-employee-number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-password">كلمة المرور الجديدة (اختياري)</Label>
              <div className="relative">
                <Input
                  id="edit-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(convertArabicNumerals(e.target.value))}
                  placeholder="اتركها فارغة لعدم التغيير"
                  disabled={isLoading}
                  data-testid="input-edit-password"
                  className="pl-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute left-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground leading-tight">
                * لأسباب أمنية (التشفير)، لا يمكن عرض كلمة المرور الحالية. لتغييرها، اكتب كلمة جديدة هنا، أو اترك الحقل فارغاً للاحتفاظ بالكلمة الحالية.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">الصلاحية</Label>
              <Select value={role} onValueChange={(v) => setRole(v as "employee" | "branch_manager" | "manager")} disabled={isLoading}>
                <SelectTrigger data-testid="select-edit-role">
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
                <Label htmlFor="edit-branch">الفرع</Label>
                <Select value={branchId} onValueChange={setBranchId} disabled={isLoading}>
                  <SelectTrigger data-testid="select-edit-branch">
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
          <DialogFooter className="mt-4 pt-2 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              إلغاء
            </Button>
            <Button type="submit" disabled={isLoading} data-testid="button-save-edit">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                "حفظ التعديلات"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
