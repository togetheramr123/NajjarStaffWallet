import WithdrawalForm from '../WithdrawalForm';
import { Toaster } from "@/components/ui/toaster";

export default function WithdrawalFormExample() {
  return (
    <div className="p-4 max-w-md mx-auto">
      <WithdrawalForm 
        maxAmount={4500}
        onSubmit={(data) => console.log('Withdrawal submitted:', data)}
      />
      <Toaster />
    </div>
  );
}
