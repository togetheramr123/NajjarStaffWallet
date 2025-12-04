import { useState } from 'react';
import { Button } from '@/components/ui/button';
import AdjustBalanceDialog from '../AdjustBalanceDialog';
import { Toaster } from "@/components/ui/toaster";

export default function AdjustBalanceDialogExample() {
  const [open, setOpen] = useState(false);
  
  return (
    <div className="p-4">
      <Button onClick={() => setOpen(true)}>تعديل الرصيد</Button>
      <AdjustBalanceDialog 
        open={open}
        onOpenChange={setOpen}
        employeeName="أحمد محمد"
        employeeId="1"
        currentBalance={5000}
        onAdjust={(data) => console.log('Balance adjusted:', data)}
      />
      <Toaster />
    </div>
  );
}
