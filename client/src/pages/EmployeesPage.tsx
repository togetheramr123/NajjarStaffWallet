import { useState } from "react";
import EmployeeCard from "@/components/EmployeeCard";
import AddEmployeeDialog from "@/components/AddEmployeeDialog";
import AdjustBalanceDialog from "@/components/AdjustBalanceDialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

// todo: remove mock functionality
const mockEmployees = [
  { id: '1', name: 'أحمد محمد العلي', employeeNumber: 'EMP001', balance: 5000, role: 'employee' as const, status: 'active' as const, joinDate: '2023-06-15' },
  { id: '2', name: 'سارة أحمد الخالد', employeeNumber: 'EMP002', balance: 3500, role: 'employee' as const, status: 'active' as const, joinDate: '2023-08-20' },
  { id: '3', name: 'محمد علي السعيد', employeeNumber: 'EMP003', balance: 7200, role: 'manager' as const, status: 'active' as const, joinDate: '2022-01-10' },
  { id: '4', name: 'فاطمة حسن النور', employeeNumber: 'EMP004', balance: 2800, role: 'employee' as const, status: 'inactive' as const, joinDate: '2023-11-05' },
  { id: '5', name: 'عبدالله محمد', employeeNumber: 'EMP005', balance: 4100, role: 'employee' as const, status: 'active' as const, joinDate: '2024-02-15' },
  { id: '6', name: 'نورة السالم', employeeNumber: 'EMP006', balance: 6000, role: 'employee' as const, status: 'active' as const, joinDate: '2023-09-01' },
];

export default function EmployeesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<typeof mockEmployees[0] | null>(null);

  const filteredEmployees = mockEmployees.filter(emp => {
    const matchesSearch = emp.name.includes(searchTerm) || emp.employeeNumber.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || emp.status === statusFilter;
    const matchesRole = roleFilter === 'all' || emp.role === roleFilter;
    return matchesSearch && matchesStatus && matchesRole;
  });

  const handleAddEmployee = (data: { name: string; employeeNumber: string; initialBalance: number; role: 'employee' | 'manager' }) => {
    console.log('Add employee:', data);
    // todo: implement actual add logic
  };

  const handleAdjustBalance = (data: { employeeId: string; amount: number; type: 'add' | 'subtract'; reason: string }) => {
    console.log('Adjust balance:', data);
    // todo: implement actual adjust logic
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold mb-1">إدارة الموظفين</h2>
          <p className="text-muted-foreground">عرض وإدارة جميع الموظفين</p>
        </div>
        <AddEmployeeDialog onAdd={handleAddEmployee} />
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
          لا يوجد موظفين مطابقين للبحث
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredEmployees.map((employee) => (
            <EmployeeCard
              key={employee.id}
              employee={employee}
              onView={(id) => console.log('View:', id)}
              onEdit={(id) => console.log('Edit:', id)}
              onAdjustBalance={(id) => {
                const emp = mockEmployees.find(e => e.id === id);
                if (emp) {
                  setSelectedEmployee(emp);
                  setAdjustDialogOpen(true);
                }
              }}
              onToggleStatus={(id) => console.log('Toggle status:', id)}
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
    </div>
  );
}
