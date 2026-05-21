import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, ArrowUpDown, FileText } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface Transaction {
  id: string;
  userId: string;
  type: "withdrawal" | "deposit" | "service_fee" | "adjustment";
  amount: number;
  beneficiary: string | null;
  status: "approved" | "pending" | "rejected";
  description: string | null;
  attachmentPath: string | null;
  createdAt: string;
  user?: {
    name: string;
    employeeNumber: string;
  };
}

export default function OperationsPage() {
  const { user: currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: transactions, isLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions/all"],
    refetchInterval: 30000,
  });

  const { data: employees } = useQuery<any[]>({
    queryKey: ["/api/employees"],
    enabled: currentUser?.role === "branch_manager",
  });

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case "withdrawal":
        return "سحب";
      case "deposit":
        return "إيداع";
      case "service_fee":
        return "رسوم الخدمة";
      case "adjustment":
        return "تعديل رصيد";
      default:
        return type;
    }
  };

  const getTransactionTypeBadgeColor = (type: string) => {
    switch (type) {
      case "withdrawal":
        return "destructive";
      case "deposit":
        return "default";
      case "service_fee":
        return "secondary";
      case "adjustment":
        return "outline";
      default:
        return "default";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "approved":
        return "مقبول";
      case "pending":
        return "معلق";
      case "rejected":
        return "مرفوض";
      default:
        return status;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "approved":
        return "success";
      case "pending":
        return "warning";
      case "rejected":
        return "destructive";
      default:
        return "default";
    }
  };

  // Build a map of employee names from the transaction userId if details aren't populated directly
  const { data: allUsers } = useQuery<any[]>({
    queryKey: ["/api/employees"],
  });

  const userMap = new Map(allUsers?.map(u => [u.id, u]) || []);

  const filteredTransactions = transactions?.filter((tx) => {
    const txUser = userMap.get(tx.userId);
    const userName = txUser?.name || "";
    const employeeNum = txUser?.employeeNumber || "";
    
    const matchesSearch = userName.includes(searchTerm) || 
                         employeeNum.includes(searchTerm) || 
                         (tx.description || "").includes(searchTerm);
    const matchesType = typeFilter === "all" || tx.type === typeFilter;
    const matchesStatus = statusFilter === "all" || tx.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  }) || [];

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold">العمليات المالية</h1>
        <p className="text-muted-foreground mt-1">عرض وتتبع جميع الحركات المالية في النظام</p>
      </div>

      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle>سجل العمليات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="البحث بالاسم، رقم الموظف أو الوصف..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
            
            <div className="flex flex-wrap gap-3">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="نوع العملية" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل العمليات</SelectItem>
                  <SelectItem value="withdrawal">سحب</SelectItem>
                  <SelectItem value="deposit">إيداع</SelectItem>
                  <SelectItem value="service_fee">رسوم خدمة</SelectItem>
                  <SelectItem value="adjustment">تعديل رصيد</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="حالة العملية" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الحالات</SelectItem>
                  <SelectItem value="approved">مقبول</SelectItem>
                  <SelectItem value="pending">معلق</SelectItem>
                  <SelectItem value="rejected">مرفوض</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="text-right">التاريخ</TableHead>
                  <TableHead className="text-right">الموظف</TableHead>
                  <TableHead className="text-right">النوع</TableHead>
                  <TableHead className="text-right">المبلغ</TableHead>
                  <TableHead className="text-right">البيان / الوصف</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">المرفقات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      لا توجد عمليات تطابق البحث
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((tx) => {
                    const txUser = userMap.get(tx.userId);
                    return (
                      <TableRow key={tx.id} className="hover:bg-muted/30">
                        <TableCell className="font-medium whitespace-nowrap">
                          {new Date(tx.createdAt).toLocaleDateString("ar-EG", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-semibold text-sm">{txUser?.name || "مستخدم غير معروف"}</span>
                            <span className="text-xs text-muted-foreground">{txUser?.employeeNumber || "---"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getTransactionTypeBadgeColor(tx.type) as any}>
                            {getTransactionTypeLabel(tx.type)}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-bold text-base whitespace-nowrap">
                          {tx.amount.toLocaleString("ar-EG")} ج.م
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-muted-foreground text-sm">
                          {tx.description || "---"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(tx.status) as any}>
                            {getStatusLabel(tx.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {tx.attachmentPath ? (
                            <a
                              href={tx.attachmentPath}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                            >
                              <FileText className="h-4 w-4" />
                              عرض المرفق
                            </a>
                          ) : (
                            <span className="text-xs text-muted-foreground">---</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
