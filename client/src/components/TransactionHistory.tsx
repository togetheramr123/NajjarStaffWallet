import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Download, Calendar, FileText } from "lucide-react";
import { useState } from "react";

export interface Transaction {
  id: string;
  date: string;
  type: 'withdrawal' | 'deposit' | 'service_fee' | 'adjustment';
  amount: number;
  beneficiary?: 'self' | 'family';
  status: 'approved' | 'pending' | 'rejected';
  description?: string;
  hasAttachment?: boolean;
}

interface TransactionHistoryProps {
  transactions: Transaction[];
  onViewAttachment?: (id: string) => void;
}

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  approved: { label: 'تمت الموافقة', variant: 'default' },
  pending: { label: 'قيد الانتظار', variant: 'secondary' },
  rejected: { label: 'مرفوض', variant: 'destructive' },
};

const typeLabels: Record<string, string> = {
  withdrawal: 'سحب',
  deposit: 'إيداع',
  service_fee: 'رسوم خدمة',
  adjustment: 'تعديل',
};

const beneficiaryLabels: Record<string, string> = {
  self: 'شخصي',
  family: 'للأسرة',
};

export default function TransactionHistory({ transactions, onViewAttachment }: TransactionHistoryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.description?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.id.includes(searchTerm);
    const matchesType = typeFilter === 'all' || t.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
        <CardTitle className="text-xl">سجل المعاملات</CardTitle>
        <Button variant="outline" size="sm" data-testid="button-export">
          <Download className="h-4 w-4 ml-2" />
          تصدير
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث في المعاملات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
              data-testid="input-search"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-40" data-testid="select-type-filter">
              <SelectValue placeholder="نوع المعاملة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="withdrawal">سحب</SelectItem>
              <SelectItem value="deposit">إيداع</SelectItem>
              <SelectItem value="service_fee">رسوم خدمة</SelectItem>
              <SelectItem value="adjustment">تعديل</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40" data-testid="select-status-filter">
              <SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="approved">تمت الموافقة</SelectItem>
              <SelectItem value="pending">قيد الانتظار</SelectItem>
              <SelectItem value="rejected">مرفوض</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <ScrollArea className="h-[400px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">التاريخ</TableHead>
                <TableHead className="text-right">النوع</TableHead>
                <TableHead className="text-right">المبلغ</TableHead>
                <TableHead className="text-right">المستفيد</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">المرفق</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    لا توجد معاملات
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id} data-testid={`row-transaction-${transaction.id}`}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {new Date(transaction.date).toLocaleDateString('ar-SA')}
                      </div>
                    </TableCell>
                    <TableCell>{typeLabels[transaction.type]}</TableCell>
                    <TableCell className={transaction.type === 'withdrawal' || transaction.type === 'service_fee' ? 'text-destructive' : 'text-chart-3'}>
                      {transaction.type === 'withdrawal' || transaction.type === 'service_fee' ? '-' : '+'}
                      {transaction.amount.toLocaleString('ar-SA')} ر.س
                    </TableCell>
                    <TableCell>
                      {transaction.beneficiary ? beneficiaryLabels[transaction.beneficiary] : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusLabels[transaction.status].variant} className="text-xs">
                        {statusLabels[transaction.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {transaction.hasAttachment ? (
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => onViewAttachment?.(transaction.id)}
                          data-testid={`button-attachment-${transaction.id}`}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
