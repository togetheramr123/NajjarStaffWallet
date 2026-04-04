import { useState, useMemo } from "react";
import EmployeeCard from "@/components/EmployeeCard";
import AddEmployeeDialog from "@/components/AddEmployeeDialog";
import AdjustBalanceDialog from "@/components/AdjustBalanceDialog";
import EditEmployeeDialog from "@/components/EditEmployeeDialog";
import BranchManagement from "@/components/BranchManagement";
import BulkBalanceDialog from "@/components/BulkBalanceDialog";
import WithdrawalOnBehalfDialog from "@/components/WithdrawalOnBehalfDialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Search, Loader2, Users, Building2 } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface Employee {
  id: string;
  name: string;
  employeeNumber: string;
  balance: number;
  role: "employee" | "branch_manager" | "manager";
  status: "active" | "inactive";
  branchId: string | null;
  createdAt: string;
}

interface Branch {
  id: string;
  name: string;
  code: string;
}

export default function EmployeesPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [branchFilter, setBranchFilter] = useState<string>("all");
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [withdrawalOnBehalfDialogOpen, setWithdrawalOnBehalfDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [activeTab, setActiveTab] = useState("employees");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<{id: string, name: string} | null>(null);
  const { toast } = useToast();

  const { data: employees, isLoading } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
    refetchInterval: 30000,
  });

  const { data: branches } = useQuery<Branch[]>({
    queryKey: ["/api/branches"],
  });

  const createEmployeeMutation = useMutation({
    mutationFn: async (data: { name: string; employeeNumber: string; username: string; password: string; role: string; initialBalance: number; branchId?: string }) => {
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
      let message = "حدث خطأ أثناء إضافة الموظف";
      try {
        const jsonStart = error.message.indexOf("{");
        if (jsonStart !== -1) {
          const parsed = JSON.parse(error.message.slice(jsonStart));
          message = parsed.message || message;
        }
      } catch {
        message = error.message;
      }
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
    mutationFn: async ({ id, name, employeeNumber, password, role, branchId }: { id: string; name: string; employeeNumber: string; password?: string; role: string; branchId?: string }) => {
      const res = await apiRequest("PATCH", `/api/employees/${id}`, { name, employeeNumber, password, role, branchId });
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

  const bulkBalanceMutation = useMutation({
    mutationFn: async (data: { employeeIds: string[]; amount: number; type: "add" | "subtract"; reason: string }) => {
      const res = await apiRequest("POST", "/api/employees/bulk-balance", data);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({
        title: "تم التعديل",
        description: data.message || "تم تعديل الرصيد الجماعي بنجاح",
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

  const withdrawalOnBehalfMutation = useMutation({
    mutationFn: async (data: { employeeId: string; amount: number; beneficiary: "self" | "family"; notes?: string }) => {
      const res = await apiRequest("POST", "/api/withdrawal-requests/on-behalf", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      queryClient.invalidateQueries({ queryKey: ["/api/withdrawal-requests"] });
      toast({
        title: "تم إرسال الطلب",
        description: "تم إنشاء طلب السحب بالنيابة عن الموظف بنجاح",
      });
      setWithdrawalOnBehalfDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteEmployeeMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/employees/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({
        title: "تم الحذف",
        description: "تم حذف الموظف بنجاح",
      });
      setDeleteDialogOpen(false);
      setEmployeeToDelete(null);
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
    const matchesBranch = branchFilter === "all" || emp.branchId === branchFilter || (branchFilter === "none" && !emp.branchId);
    return matchesSearch && matchesStatus && matchesRole && matchesBranch;
  }) || [];

  const getBranchName = (branchId: string | null) => {
    if (!branchId) return "بدون فرع";
    return branches?.find((b) => b.id === branchId)?.name || "غير معروف";
  };

  const bulkBalanceEmployees = useMemo(() => {
    const getBranch = (branchId: string | null) => {
      if (!branchId) return "بدون فرع";
      return branches?.find((b) => b.id === branchId)?.name || "غير معروف";
    };
    return (employees || [])
      .filter(e => e.role !== "manager")
      .map(e => ({
        id: e.id,
        name: e.name,
        employeeNumber: e.employeeNumber,
        balance: e.balance,
        branchName: getBranch(e.branchId),
      }));
  }, [employees, branches]);

  const handleAddEmployee = (data: { name: string; employeeNumber: string; username: string; password: string; initialBalance: number; role: "employee" | "branch_manager" | "manager"; branchId?: string }) => {
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

  const handleEditEmployee = (data: { id: string; name: string; employeeNumber: string; password?: string; role: string; branchId?: string }) => {
    editEmployeeMutation.mutate(data);
  };

  const openEditDialog = (id: string) => {
    const emp = employees?.find((e) => e.id === id);
    if (emp) {
      setSelectedEmployee(emp);
      setEditDialogOpen(true);
    }
  };

  const handleDeleteEmployee = (id: string) => {
    const emp = employees?.find((e) => e.id === id);
    if (emp) {
      setEmployeeToDelete({ id: emp.id, name: emp.name });
      setDeleteDialogOpen(true);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isMainManager = user?.role === "manager";

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold mb-1" data-testid="text-employees-title">إدارة الموظفين</h2>
          <p className="text-muted-foreground">عرض وإدارة جميع الموظفين والفروع</p>
        </div>
      </div>

      {isMainManager ? (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="employees" className="gap-2">
              <Users className="h-4 w-4" />
              الموظفين
            </TabsTrigger>
            <TabsTrigger value="branches" className="gap-2">
              <Building2 className="h-4 w-4" />
              الفروع
            </TabsTrigger>
          </TabsList>

          <TabsContent value="employees" className="mt-4 space-y-4">
            <div className="flex items-center justify-end gap-2 flex-wrap">
              <BulkBalanceDialog
                employees={bulkBalanceEmployees}
                onSubmit={(data) => bulkBalanceMutation.mutate(data)}
                isLoading={bulkBalanceMutation.isPending}
              />
              <AddEmployeeDialog onAdd={handleAddEmployee} isLoading={createEmployeeMutation.isPending} branches={branches || []} employeeCount={employees?.length || 0} />
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
                  <SelectItem value="branch_manager">مدير فرع</SelectItem>
                  <SelectItem value="manager">مدير عام</SelectItem>
                </SelectContent>
              </Select>
              <Select value={branchFilter} onValueChange={setBranchFilter}>
                <SelectTrigger className="w-full sm:w-40" data-testid="select-branch-filter">
                  <SelectValue placeholder="الفرع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الفروع</SelectItem>
                  <SelectItem value="none">بدون فرع</SelectItem>
                  {branches?.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
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
                      branchName: getBranchName(employee.branchId),
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
                    onDelete={handleDeleteEmployee}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="branches" className="mt-4">
            <BranchManagement />
          </TabsContent>
        </Tabs>
      ) : (
        <>
          {/* Branch Manager View - View Only, No Add/Edit/Balance Adjustment */}
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
          </div>

          {filteredEmployees.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {employees?.length === 0 ? "لا يوجد موظفين في فرعك" : "لا يوجد موظفين مطابقين للبحث"}
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
                    branchName: getBranchName(employee.branchId),
                  }}
                  viewOnly={true}
                  onWithdrawalOnBehalf={(id) => {
                    const emp = employees?.find((e) => e.id === id);
                    if (emp) {
                      setSelectedEmployee(emp);
                      setWithdrawalOnBehalfDialogOpen(true);
                    }
                  }}
                />
              ))}
            </div>
          )}
        </>
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
        branches={branches || []}
      />

      {selectedEmployee && (
        <WithdrawalOnBehalfDialog
          open={withdrawalOnBehalfDialogOpen}
          onOpenChange={setWithdrawalOnBehalfDialogOpen}
          employeeName={selectedEmployee.name}
          employeeId={selectedEmployee.id}
          availableBalance={selectedEmployee.balance}
          onSubmit={(data) => withdrawalOnBehalfMutation.mutate(data)}
          isLoading={withdrawalOnBehalfMutation.isPending}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد حذف الموظف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف الموظف "{employeeToDelete?.name}"؟ هذا الإجراء لا يمكن التراجع عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => employeeToDelete && deleteEmployeeMutation.mutate(employeeToDelete.id)}
              className="bg-destructive text-destructive-foreground"
              data-testid="button-confirm-delete-employee"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
