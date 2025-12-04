import AddEmployeeDialog from '../AddEmployeeDialog';
import { Toaster } from "@/components/ui/toaster";

export default function AddEmployeeDialogExample() {
  return (
    <div className="p-4">
      <AddEmployeeDialog 
        onAdd={(employee) => console.log('Employee added:', employee)}
      />
      <Toaster />
    </div>
  );
}
