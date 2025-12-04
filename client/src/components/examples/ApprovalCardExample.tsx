import ApprovalCard from '../ApprovalCard';

// todo: remove mock functionality
const mockRequest = {
  id: '1',
  employeeName: 'أحمد محمد',
  employeeId: 'EMP001',
  amount: 1500,
  beneficiary: 'self' as const,
  requestDate: '2024-12-20',
  hasAttachment: true,
  notes: 'احتاج المبلغ لظروف طارئة',
};

export default function ApprovalCardExample() {
  return (
    <div className="p-4 max-w-sm mx-auto">
      <ApprovalCard 
        request={mockRequest}
        onApprove={(id, notes) => console.log('Approved:', id, notes)}
        onReject={(id, reason) => console.log('Rejected:', id, reason)}
        onModify={(id, amount, notes) => console.log('Modified:', id, amount, notes)}
        onViewAttachment={(id) => console.log('View attachment:', id)}
      />
    </div>
  );
}
