import { useState } from "react";
import ApprovalCard from "@/components/ApprovalCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

// todo: remove mock functionality
const mockRequests = {
  pending: [
    { id: '1', employeeName: 'أحمد محمد', employeeId: 'EMP001', amount: 1500, beneficiary: 'self' as const, requestDate: '2024-12-20', hasAttachment: true, notes: 'احتاج المبلغ لظروف طارئة' },
    { id: '2', employeeName: 'سارة أحمد', employeeId: 'EMP002', amount: 800, beneficiary: 'family' as const, requestDate: '2024-12-19', hasAttachment: true },
    { id: '3', employeeName: 'محمد علي', employeeId: 'EMP003', amount: 2000, beneficiary: 'self' as const, requestDate: '2024-12-18', hasAttachment: true },
    { id: '4', employeeName: 'فاطمة حسن', employeeId: 'EMP004', amount: 500, beneficiary: 'family' as const, requestDate: '2024-12-17', hasAttachment: true },
  ],
  approved: [
    { id: '5', employeeName: 'عبدالله محمد', employeeId: 'EMP005', amount: 1000, beneficiary: 'self' as const, requestDate: '2024-12-15', hasAttachment: true },
    { id: '6', employeeName: 'نورة السالم', employeeId: 'EMP006', amount: 600, beneficiary: 'family' as const, requestDate: '2024-12-14', hasAttachment: true },
  ],
  rejected: [
    { id: '7', employeeName: 'خالد الأحمد', employeeId: 'EMP007', amount: 5000, beneficiary: 'self' as const, requestDate: '2024-12-13', hasAttachment: false, notes: 'تجاوز الحد المسموح' },
  ],
};

export default function ApprovalsPage() {
  const [activeTab, setActiveTab] = useState('pending');
  const { toast } = useToast();

  const handleApprove = (id: string, notes: string) => {
    console.log('Approved:', id, notes);
    toast({
      title: "تمت الموافقة",
      description: "تمت الموافقة على الطلب بنجاح",
    });
  };

  const handleReject = (id: string, reason: string) => {
    console.log('Rejected:', id, reason);
    toast({
      title: "تم الرفض",
      description: "تم رفض الطلب",
      variant: "destructive",
    });
  };

  const handleModify = (id: string, amount: number, notes: string) => {
    console.log('Modified:', id, amount, notes);
    toast({
      title: "تم التعديل",
      description: "تم تعديل المبلغ والموافقة على الطلب",
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1">طلبات السحب</h2>
        <p className="text-muted-foreground">مراجعة وإدارة طلبات سحب الموظفين</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending" className="gap-2" data-testid="tab-pending">
            معلقة
            <Badge variant="secondary" className="text-xs">{mockRequests.pending.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="approved" className="gap-2" data-testid="tab-approved">
            موافق عليها
            <Badge variant="secondary" className="text-xs">{mockRequests.approved.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="rejected" className="gap-2" data-testid="tab-rejected">
            مرفوضة
            <Badge variant="secondary" className="text-xs">{mockRequests.rejected.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          {mockRequests.pending.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              لا توجد طلبات معلقة
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {mockRequests.pending.map((request) => (
                <ApprovalCard
                  key={request.id}
                  request={request}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onModify={handleModify}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="approved" className="mt-6">
          {mockRequests.approved.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              لا توجد طلبات موافق عليها
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {mockRequests.approved.map((request) => (
                <ApprovalCard
                  key={request.id}
                  request={request}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onModify={handleModify}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="rejected" className="mt-6">
          {mockRequests.rejected.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              لا توجد طلبات مرفوضة
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {mockRequests.rejected.map((request) => (
                <ApprovalCard
                  key={request.id}
                  request={request}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onModify={handleModify}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
