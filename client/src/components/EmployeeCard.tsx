import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical, Eye, Edit, Wallet, Ban, Building2 } from "lucide-react";

interface Employee {
  id: string;
  name: string;
  employeeNumber: string;
  balance: number;
  role: 'employee' | 'branch_manager' | 'manager';
  status: 'active' | 'inactive';
  joinDate: string;
  branchName?: string;
}

interface EmployeeCardProps {
  employee: Employee;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onAdjustBalance?: (id: string) => void;
  onToggleStatus?: (id: string) => void;
  viewOnly?: boolean;
}

export default function EmployeeCard({ 
  employee, 
  onView, 
  onEdit, 
  onAdjustBalance,
  onToggleStatus,
  viewOnly = false
}: EmployeeCardProps) {
  const initials = employee.name.split(' ').map(n => n[0]).join('').slice(0, 2);

  return (
    <Card className="overflow-hidden" data-testid={`card-employee-${employee.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-base" data-testid={`text-name-${employee.id}`}>
                {employee.name}
              </h3>
              <p className="text-xs text-muted-foreground">#{employee.employeeNumber}</p>
            </div>
          </div>
          {!viewOnly && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" data-testid={`button-menu-${employee.id}`}>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onView?.(employee.id)}>
                  <Eye className="h-4 w-4 ml-2" />
                  عرض التفاصيل
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit?.(employee.id)}>
                  <Edit className="h-4 w-4 ml-2" />
                  تعديل البيانات
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAdjustBalance?.(employee.id)}>
                  <Wallet className="h-4 w-4 ml-2" />
                  تعديل الرصيد
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onToggleStatus?.(employee.id)} className="text-destructive">
                  <Ban className="h-4 w-4 ml-2" />
                  {employee.status === 'active' ? 'تعطيل الحساب' : 'تفعيل الحساب'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">الرصيد</span>
          <span className="font-bold text-lg" data-testid={`text-balance-${employee.id}`}>
            {employee.balance.toLocaleString('ar-EG')} ج.م
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">تاريخ الانضمام</span>
          <span>{new Date(employee.joinDate).toLocaleDateString('ar-EG')}</span>
        </div>
        {employee.branchName && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              الفرع
            </span>
            <span>{employee.branchName}</span>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex items-center justify-between gap-2 pt-0">
        <Badge variant={employee.role === 'manager' ? 'default' : employee.role === 'branch_manager' ? 'outline' : 'secondary'}>
          {employee.role === 'manager' ? 'مدير عام' : employee.role === 'branch_manager' ? 'مدير فرع' : 'موظف'}
        </Badge>
        <Badge variant={employee.status === 'active' ? 'outline' : 'destructive'}>
          {employee.status === 'active' ? 'نشط' : 'معطل'}
        </Badge>
      </CardFooter>
    </Card>
  );
}
