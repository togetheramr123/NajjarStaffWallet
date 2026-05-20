import EmployeeCard from '../EmployeeCard';

// todo: remove mock functionality
const mockEmployee = {
  id: '1',
  name: 'أحمد محمد العلي',
  username: 'ahmed.mohamed',
  employeeNumber: 'EMP001',
  balance: 5000,
  role: 'employee' as const,
  status: 'active' as const,
  joinDate: '2023-06-15',
};

export default function EmployeeCardExample() {
  return (
    <div className="p-4 max-w-sm mx-auto">
      <EmployeeCard 
        employee={mockEmployee}
        onView={(id) => console.log('View:', id)}
        onEdit={(id) => console.log('Edit:', id)}
        onAdjustBalance={(id) => console.log('Adjust balance:', id)}
        onToggleStatus={(id) => console.log('Toggle status:', id)}
      />
    </div>
  );
}
