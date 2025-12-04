import BalanceCard from "@/components/BalanceCard";
import TransactionHistory, { Transaction } from "@/components/TransactionHistory";
import WithdrawalForm from "@/components/WithdrawalForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";

// todo: remove mock functionality
const mockTransactions: Transaction[] = [
  { id: '1', date: '2024-12-01', type: 'deposit', amount: 2000, status: 'approved', description: 'إيداع شهري' },
  { id: '2', date: '2024-12-05', type: 'withdrawal', amount: 500, beneficiary: 'self', status: 'approved', hasAttachment: true },
  { id: '3', date: '2024-12-10', type: 'service_fee', amount: 50, status: 'approved', description: 'رسوم خدمة شهرية' },
  { id: '4', date: '2024-12-15', type: 'withdrawal', amount: 300, beneficiary: 'family', status: 'pending', hasAttachment: true },
  { id: '5', date: '2024-12-18', type: 'adjustment', amount: 100, status: 'approved', description: 'تعديل رصيد' },
];

export default function EmployeeDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  
  // todo: remove mock functionality
  const currentBalance = 5000;
  const pendingAmount = 300;
  const monthlyFee = 50;

  const handleWithdrawal = (data: { amount: number; beneficiary: 'self' | 'family'; notes: string }) => {
    console.log('Withdrawal request:', data);
    // todo: implement actual withdrawal logic
  };

  return (
    <div className="p-6 space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">مرحباً بك</h2>
        <p className="text-muted-foreground">إليك ملخص رصيدك ومعاملاتك</p>
      </div>

      <BalanceCard 
        currentBalance={currentBalance}
        pendingAmount={pendingAmount}
        monthlyFee={monthlyFee}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview" data-testid="tab-overview">سجل المعاملات</TabsTrigger>
          <TabsTrigger value="withdraw" data-testid="tab-withdraw">طلب سحب جديد</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-4">
          <TransactionHistory 
            transactions={mockTransactions}
            onViewAttachment={(id) => console.log('View attachment:', id)}
          />
        </TabsContent>
        
        <TabsContent value="withdraw" className="mt-4">
          <div className="max-w-md">
            <WithdrawalForm 
              maxAmount={currentBalance - pendingAmount}
              onSubmit={handleWithdrawal}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
