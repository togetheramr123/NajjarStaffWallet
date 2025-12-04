import TransactionHistory, { Transaction } from '../TransactionHistory';

// todo: remove mock functionality
const mockTransactions: Transaction[] = [
  { id: '1', date: '2024-12-01', type: 'deposit', amount: 2000, status: 'approved', description: 'إيداع شهري' },
  { id: '2', date: '2024-12-05', type: 'withdrawal', amount: 500, beneficiary: 'self', status: 'approved', hasAttachment: true },
  { id: '3', date: '2024-12-10', type: 'service_fee', amount: 50, status: 'approved', description: 'رسوم خدمة شهرية' },
  { id: '4', date: '2024-12-15', type: 'withdrawal', amount: 300, beneficiary: 'family', status: 'pending', hasAttachment: true },
  { id: '5', date: '2024-12-18', type: 'adjustment', amount: 100, status: 'approved', description: 'تعديل رصيد' },
  { id: '6', date: '2024-12-20', type: 'withdrawal', amount: 200, beneficiary: 'self', status: 'rejected' },
];

export default function TransactionHistoryExample() {
  return (
    <div className="p-4">
      <TransactionHistory 
        transactions={mockTransactions}
        onViewAttachment={(id) => console.log('View attachment:', id)}
      />
    </div>
  );
}
