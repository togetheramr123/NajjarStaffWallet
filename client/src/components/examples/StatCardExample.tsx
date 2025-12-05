import StatCard from '../StatCard';
import { Users, Wallet, Clock, CheckCircle } from 'lucide-react';

export default function StatCardExample() {
  // todo: remove mock functionality
  return (
    <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard 
        title="إجمالي الموظفين"
        value={125}
        icon={Users}
        description="موظف نشط"
        variant="primary"
      />
      <StatCard 
        title="إجمالي الرصيد"
        value="150,000 ج.م"
        icon={Wallet}
        trend={{ value: 12, isPositive: true }}
      />
      <StatCard 
        title="طلبات معلقة"
        value={8}
        icon={Clock}
        variant="warning"
      />
      <StatCard 
        title="طلبات موافق عليها"
        value={45}
        icon={CheckCircle}
        variant="success"
      />
    </div>
  );
}
