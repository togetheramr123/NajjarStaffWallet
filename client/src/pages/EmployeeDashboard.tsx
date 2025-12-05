import BalanceCard from "@/components/BalanceCard";
import TransactionHistory from "@/components/TransactionHistory";
import WithdrawalForm from "@/components/WithdrawalForm";
import AccountStatement from "@/components/AccountStatement";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface BalanceData {
  currentBalance: number;
  pendingAmount: number;
  availableBalance: number;
  monthlyFee: number;
}

interface Transaction {
  id: string;
  userId: string;
  type: "withdrawal" | "deposit" | "service_fee" | "adjustment";
  amount: number;
  beneficiary: "self" | "family" | null;
  status: "approved" | "pending" | "rejected";
  description: string | null;
  attachmentPath: string | null;
  createdAt: string;
  processedBy: string | null;
  processedAt: string | null;
  processingNotes: string | null;
}

export default function EmployeeDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: balanceData, isLoading: balanceLoading } = useQuery<BalanceData>({
    queryKey: ["/api/balance"],
    refetchInterval: 30000,
  });

  const { data: transactions, isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
    refetchInterval: 30000,
  });

  const withdrawMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      console.log("Sending withdrawal request to server...");
      try {
        const res = await fetch("/api/withdrawal-requests", {
          method: "POST",
          body: formData,
          credentials: "include",
        });
        console.log("Response status:", res.status);
        if (!res.ok) {
          const error = await res.json();
          console.log("Error response:", error);
          throw new Error(error.message || "خطأ في إرسال الطلب");
        }
        const result = await res.json();
        console.log("Success response:", result);
        return result;
      } catch (error) {
        console.error("Fetch error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "تم إرسال الطلب",
        description: "تم إرسال طلب السحب بنجاح وسيتم مراجعته",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/balance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/withdrawal-requests"] });
      setActiveTab("overview");
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleWithdrawal = (data: { amount: number; beneficiary: "self" | "family"; notes: string; attachment?: File }) => {
    console.log("Withdrawal data received:", data);
    console.log("Attachment:", data.attachment);
    
    const formData = new FormData();
    formData.append("amount", data.amount.toString());
    formData.append("beneficiary", data.beneficiary);
    if (data.notes) {
      formData.append("notes", data.notes);
    }
    if (data.attachment) {
      formData.append("attachment", data.attachment);
      console.log("Attachment appended:", data.attachment.name);
    }
    
    console.log("Submitting withdrawal request...");
    withdrawMutation.mutate(formData);
  };

  const handleViewAttachment = (attachmentPath: string) => {
    window.open(attachmentPath, "_blank");
  };

  if (balanceLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const currentBalance = balanceData?.currentBalance || 0;
  const pendingAmount = balanceData?.pendingAmount || 0;
  const monthlyFee = balanceData?.monthlyFee || 50;
  const availableBalance = balanceData?.availableBalance || 0;

  const formattedTransactions =
    transactions?.map((t) => ({
      id: t.id,
      date: new Date(t.createdAt).toISOString().split("T")[0],
      type: t.type,
      amount: t.amount,
      beneficiary: t.beneficiary || undefined,
      status: t.status,
      description: t.description || undefined,
      hasAttachment: !!t.attachmentPath,
      attachmentPath: t.attachmentPath || undefined,
    })) || [];

  return (
    <div className="p-6 space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2" data-testid="text-welcome">
          مرحباً {user?.name}
        </h2>
        <p className="text-muted-foreground">إليك ملخص رصيدك ومعاملاتك</p>
      </div>

      <BalanceCard currentBalance={currentBalance} pendingAmount={pendingAmount} monthlyFee={monthlyFee} />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" data-testid="tab-overview">
            سجل المعاملات
          </TabsTrigger>
          <TabsTrigger value="statement" data-testid="tab-statement">
            كشف الحساب
          </TabsTrigger>
          <TabsTrigger value="withdraw" data-testid="tab-withdraw">
            طلب سحب جديد
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          {transactionsLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <TransactionHistory
              transactions={formattedTransactions}
              onViewAttachment={(id) => {
                const transaction = formattedTransactions.find((t) => t.id === id);
                if (transaction?.attachmentPath) {
                  handleViewAttachment(transaction.attachmentPath);
                }
              }}
            />
          )}
        </TabsContent>

        <TabsContent value="statement" className="mt-4">
          {transactionsLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <AccountStatement
              transactions={formattedTransactions}
              currentBalance={currentBalance}
              employeeName={user?.name || ""}
              employeeNumber={user?.employeeNumber || ""}
            />
          )}
        </TabsContent>

        <TabsContent value="withdraw" className="mt-4">
          <div className="max-w-md">
            <WithdrawalForm
              maxAmount={availableBalance}
              onSubmit={handleWithdrawal}
              isLoading={withdrawMutation.isPending}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
