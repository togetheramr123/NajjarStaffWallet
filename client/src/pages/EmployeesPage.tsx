import { useState } from "react";
import EmployeeCard from "@/components/EmployeeCard";
import AddEmployeeDialog from "@/components/AddEmployeeDialog";
import AdjustBalanceDialog from "@/components/AdjustBalanceDialog";
import EditEmployeeDialog from "@/components/EditEmployeeDialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Loader2 } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Employee {
  id: string;
  name: string;
  employeeNumber: string;
  balance: number;
  role: "employee" | "manager";
  status: "active" | "inactive";
  createdAt: string;
}

export default function EmployeesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const { toast } = useToast();

  const { data: employees, isLoading } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
    refetchInterval: 30000,
  });

  const createEmployeeMutation = useMutation({
    mutationFn: async (data: { name: string; employeeNumber: string; username: string; password: string; role: string; initialBalance: number }) => {
      const res = await apiRequest("POST", "/api/employees", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({
        title: "تم الإضافة",
        description: "تمت إضافة الموظف بنجاح",
      });
    },
    onError: (error: Error) => {
      const message = error.message.includes("400") ? "اسم المستخدم مستخدم بالفعل" : error.message;
      toast({
        title: "خطأ",
        description: message,
        variant: "destructive",
      });
    },
  });

  const adjustBalanceMutation = useMutation({
    mutationFn: async ({ employeeId, amount, type, reason }: { employeeId: string; amount: number; type: "add" | "subtract"; reason: string }) => {
      const res = await apiRequest("POST", `/api/employees/${employeeId}/balance`, { amount, type, reason });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({
        title: "تم التعديل",
        description: "تم تعديل الرصيد بنجاح",
      });
      setAdjustDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "active" | "inactive" }) => {
      const res = await apiRequest("PATCH", `/api/employees/${id}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({
        title: "تم التحديث",
        description: "تم تحديث حالة الموظف",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const editEmployeeMutation = useMutation({
    mutationFn: async ({ id, name, employeeNumber, password, role }: { id: string; name: string; employeeNumber: string; password?: string; role: string }) => {
      const res = await apiRequest("PATCH", `/api/employees/${id}`, { name, employeeNumber, password, role });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({
        title: "تم التعديل",
        description: "تم تعديل بيانات الموظف بنجاح",
      });
      setEditDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredEmployees = employees?.filter((emp) => {
    const matchesSearch = emp.name.includes(searchTerm) || emp.employeeNumber.includes(searchTerm);
    const matchesStatus = statusFilter === "all" || emp.status === statusFilter;
    const matchesRole = roleFilter === "all" || emp.role === roleFilter;
    return matchesSearch && matchesStatus && matchesRole;
  }) || [];

  const handleAddEmployee = (data: { name: string; employeeNumber: string; username: string; password: string; initialBalance: number; role: "employee" | "manager" }) => {
    createEmployeeMutation.mutate(data);
  };

  const handleAdjustBalance = (data: { employeeId: string; amount: number; type: "add" | "subtract"; reason: string }) => {
    adjustBalanceMutation.mutate(data);
  };

  const handleToggleStatus = (id: string) => {
    const emp = employees?.find((e) => e.id === id);
    if (emp) {
      const newStatus = emp.status === "active" ? "inactive" : "active";
      toggleStatusMutation.mutate({ id, status: newStatus });
    }
  };

  const handleEditEmployee = (data: { id: string; name: string; employeeNumber: string; password?: string; role: string }) => {
    editEmployeeMutation.mutate(data);
  };

  const openEditDialog = (id: string) => {
    const emp = employees?.find((e) => e.id === id);
    if (emp) {
      setSelectedEmployee(emp);
      setEditDialogOpen(true);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold mb-1" data-testid="text-employees-title">إدارة الموظفين</h2>
          <p className="text-muted-foreground">عرض وإدارة جميع الموظفين</p>
        </div>
        <AddEmployeeDialog onAdd={handleAddEmployee} isLoading={createEmployeeMutation.isPending} />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث بالاسم أو رقم الموظف..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
            data-testid="input-search-employees"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40" data-testid="select-status-filter">
            <SelectValue placeholder="الحالة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل</SelectItem>
            <SelectItem value="active">نشط</SelectItem>
            <SelectItem value="inactive">معطل</SelectItem>
          </SelectContent>
        </Select>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-40" data-testid="select-role-filter">
            <SelectValue placeholder="الصلاحية" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل</SelectItem>
            <SelectItem value="employee">موظف</SelectItem>
            <SelectItem value="manager">مدير</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredEmployees.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {employees?.length === 0 ? "لا يوجد موظفين مسجلين" : "لا يوجد موظفين مطابقين للبحث"}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredEmployees.map((employee) => (
            <EmployeeCard
              key={employee.id}
              employee={{
                id: employee.id,
                name: employee.name,
                employeeNumber: employee.employeeNumber,
                balance: employee.balance,
                role: employee.role,
                status: employee.status,
                joinDate: new Date(employee.createdAt).toISOString().split("T")[0],
              }}
              onView={(id) => openEditDialog(id)}
              onEdit={(id) => openEditDialog(id)}
              onAdjustBalance={(id) => {
                const emp = employees?.find((e) => e.id === id);
                if (emp) {
                  setSelectedEmployee(emp);
                  setAdjustDialogOpen(true);
                }
              }}
              onToggleStatus={handleToggleStatus}
            />
          ))}
        </div>
      )}

      {selectedEmployee && (
        <AdjustBalanceDialog
          open={adjustDialogOpen}
          onOpenChange={setAdjustDialogOpen}
          employeeName={selectedEmployee.name}
          employeeId={selectedEmployee.id}
          currentBalance={selectedEmployee.balance}
          onAdjust={handleAdjustBalance}
        />
      )}

      <EditEmployeeDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        employee={selectedEmployee}
        onSave={handleEditEmployee}
        isLoading={editEmployeeMutation.isPending}
      />
    </div>
  );
}
