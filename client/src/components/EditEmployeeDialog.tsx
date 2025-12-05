import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

interface Employee {
  id: string;
  name: string;
  employeeNumber: string;
  username?: string;
  role: "employee" | "manager";
  status: "active" | "inactive";
}

interface EditEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee | null;
  onSave: (data: { id: string; name: string; employeeNumber: string; password?: string; role: string }) => void;
  isLoading?: boolean;
}

export default function EditEmployeeDialog({ 
  open, 
  onOpenChange, 
  employee, 
  onSave, 
  isLoading 
}: EditEmployeeDialogProps) {
  const [name, setName] = useState("");
  const [employeeNumber, setEmployeeNumber] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"employee" | "manager">("employee");

  useEffect(() => {
    if (employee) {
      setName(employee.name);
      setEmployeeNumber(employee.employeeNumber);
      setRole(employee.role);
      setPassword("");
    }
  }, [employee]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!employee) return;

    onSave({
      id: employee.id,
      name,
      employeeNumber,
      password: password || undefined,
      role,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>تعديل بيانات الموظف</DialogTitle>
          <DialogDescription>
            تعديل بيانات {employee?.name}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
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
              <Input
                id="edit-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="اتركها فارغة لعدم التغيير"
                disabled={isLoading}
                data-testid="input-edit-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">الصلاحية</Label>
              <Select value={role} onValueChange={(v) => setRole(v as "employee" | "manager")} disabled={isLoading}>
                <SelectTrigger data-testid="select-edit-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">موظف</SelectItem>
                  <SelectItem value="manager">مدير</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="pt-4 border-t mt-2">
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
