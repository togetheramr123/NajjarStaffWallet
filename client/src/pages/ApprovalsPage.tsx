import { useState } from "react";
import ApprovalCard from "@/components/ApprovalCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";

interface WithdrawalRequest {
  id: string;
  userId: string;
  amount: number;
  beneficiary: "self" | "family";
  notes: string | null;
  attachmentPath: string | null;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  processedBy: string | null;
  processedAt: string | null;
  processingNotes: string | null;
  modifiedAmount: number | null;
}

interface PendingRequest {
  id: string;
  employeeName: string;
  employeeId: string;
  amount: number;
  beneficiary: "self" | "family";
  requestDate: string;
  hasAttachment: boolean;
  notes?: string;
}

export default function ApprovalsPage() {
  const [activeTab, setActiveTab] = useState("pending");
  const { toast } = useToast();

  const { data: pendingRequests, isLoading: pendingLoading } = useQuery<PendingRequest[]>({
    queryKey: ["/api/withdrawal-requests/pending"],
    refetchInterval: 15000,
  });

  const { data: allRequests, isLoading: allLoading } = useQuery<WithdrawalRequest[]>({
    queryKey: ["/api/withdrawal-requests/all"],
    refetchInterval: 30000,
  });

  const processRequestMutation = useMutation({
    mutationFn: async ({ id, action, notes, modifiedAmount }: { id: string; action: string; notes?: string; modifiedAmount?: number }) => {
      const res = await apiRequest("POST", `/api/withdrawal-requests/${id}/process`, { action, notes, modifiedAmount });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/withdrawal-requests/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/withdrawal-requests/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleApprove = (id: string, notes: string) => {
    processRequestMutation.mutate(
      { id, action: "approve", notes },
      {
        onSuccess: () => {
          toast({
            title: "تمت الموافقة",
            description: "تمت الموافقة على الطلب بنجاح",
          });
        },
      }
    );
  };

  const handleReject = (id: string, reason: string) => {
    processRequestMutation.mutate(
      { id, action: "reject", notes: reason },
      {
        onSuccess: () => {
          toast({
            title: "تم الرفض",
            description: "تم رفض الطلب",
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleModify = (id: string, amount: number, notes: string) => {
    processRequestMutation.mutate(
      { id, action: "modify", notes, modifiedAmount: amount },
      {
        onSuccess: () => {
          toast({
            title: "تم التعديل",
            description: "تم تعديل المبلغ والموافقة على الطلب",
          });
        },
      }
    );
  };

  const approvedRequests = allRequests?.filter((r) => r.status === "approved") || [];
  const rejectedRequests = allRequests?.filter((r) => r.status === "rejected") || [];

  const formatRequestForCard = (request: WithdrawalRequest) => ({
    id: request.id,
    employeeName: "موظف",
    employeeId: request.userId.slice(0, 8),
    amount: request.modifiedAmount || request.amount,
    beneficiary: request.beneficiary,
    requestDate: new Date(request.createdAt).toISOString().split("T")[0],
    hasAttachment: !!request.attachmentPath,
    notes: request.notes || undefined,
  });

  const isLoading = pendingLoading || allLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1" data-testid="text-approvals-title">طلبات السحب</h2>
        <p className="text-muted-foreground">مراجعة وإدارة طلبات سحب الموظفين</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending" className="gap-2" data-testid="tab-pending">
            معلقة
            <Badge variant="secondary" className="text-xs">{pendingRequests?.length || 0}</Badge>
          </TabsTrigger>
          <TabsTrigger value="approved" className="gap-2" data-testid="tab-approved">
            موافق عليها
            <Badge variant="secondary" className="text-xs">{approvedRequests.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="rejected" className="gap-2" data-testid="tab-rejected">
            مرفوضة
            <Badge variant="secondary" className="text-xs">{rejectedRequests.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          {pendingRequests?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">لا توجد طلبات معلقة</div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {pendingRequests?.map((request) => (
                <ApprovalCard
                  key={request.id}
                  request={{
                    id: request.id,
                    employeeName: request.employeeName,
                    employeeId: request.employeeId,
                    amount: request.amount,
                    beneficiary: request.beneficiary,
                    requestDate: new Date(request.requestDate).toISOString().split("T")[0],
                    hasAttachment: request.hasAttachment,
                    notes: request.notes,
                  }}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onModify={handleModify}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="approved" className="mt-6">
          {approvedRequests.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">لا توجد طلبات موافق عليها</div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {approvedRequests.map((request) => (
                <ApprovalCard
                  key={request.id}
                  request={formatRequestForCard(request)}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onModify={handleModify}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="rejected" className="mt-6">
          {rejectedRequests.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">لا توجد طلبات مرفوضة</div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {rejectedRequests.map((request) => (
                <ApprovalCard
                  key={request.id}
                  request={formatRequestForCard(request)}
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
