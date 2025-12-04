import BalanceCard from '../BalanceCard';

export default function BalanceCardExample() {
  // todo: remove mock functionality
  return (
    <div className="p-4">
      <BalanceCard 
        currentBalance={5000}
        pendingAmount={500}
        monthlyFee={50}
      />
    </div>
  );
}
