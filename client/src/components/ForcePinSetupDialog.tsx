import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Delete } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";

interface ForcePinSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ForcePinSetupDialog({ open, onOpenChange }: ForcePinSetupDialogProps) {
  const { toast } = useToast();
  const { refreshUser } = useAuth();
  
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  const setupPinMutation = useMutation({
    mutationFn: async (pinValue: string) => {
      const res = await apiRequest("POST", "/api/auth/setup-pin", {
        pin: pinValue,
      });
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "تم تفعيل الرمز السري",
        description: "تم تفعيل رمز الدخول الرقمي بنجاح، يمكنك الآن استخدامه للدخول في المرات القادمة",
      });
      refreshUser();
      onOpenChange(false);
      window.location.href = data.user.role === "manager" ? "/manager" : "/dashboard";
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
      setStep('enter');
      setPin("");
      setConfirmPin("");
    },
  });

  const handlePadClick = (num: string) => {
    if (step === 'enter') {
      if (pin.length < 10) setPin(prev => prev + num);
    } else {
      if (confirmPin.length < 10) setConfirmPin(prev => prev + num);
    }
  };

  const handleDelete = () => {
    if (step === 'enter') {
      setPin(prev => prev.slice(0, -1));
    } else {
      setConfirmPin(prev => prev.slice(0, -1));
    }
  };

  const handleNext = () => {
    if (step === 'enter') {
      if (pin.length < 5) {
        toast({
          title: "تنبيه",
          description: "الرمز السري يجب أن لا يقل عن 5 أرقام",
          variant: "destructive",
        });
        return;
      }
      setStep('confirm');
    } else {
      if (pin !== confirmPin) {
        toast({
          title: "خطأ",
          description: "الرمزين غير متطابقين، يرجى المحاولة مرة أخرى",
          variant: "destructive",
        });
        setStep('enter');
        setPin("");
        setConfirmPin("");
        return;
      }
      setupPinMutation.mutate(pin);
    }
  };

  // Prevent closing the dialog by clicking outside or pressing Escape
  const handlePointerDownOutside = (e: any) => {
    e.preventDefault();
  };

  const handleEscapeKeyDown = (e: any) => {
    e.preventDefault();
  };

  const currentVal = step === 'enter' ? pin : confirmPin;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-[400px] p-6" 
        onPointerDownOutside={handlePointerDownOutside}
        onEscapeKeyDown={handleEscapeKeyDown}
      >
        <DialogHeader className="space-y-4">
          <DialogTitle className="text-center text-xl">
            {step === 'enter' ? 'تعيين الرمز السري الجديد' : 'تأكيد الرمز السري'}
          </DialogTitle>
          <DialogDescription className="text-center text-sm leading-relaxed">
            {step === 'enter' 
              ? 'يرجى إدخال رمز سري جديد مكون من 5 أرقام على الأقل لحماية حسابك.'
              : 'أعد إدخال نفس الرمز السري للتأكيد.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-8 py-4">
          {/* Dots display */}
          <div className="flex justify-center gap-3 h-10 items-center" dir="ltr">
            {Array.from({ length: Math.max(5, currentVal.length) }).map((_, i) => (
              <div 
                key={i} 
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  i < currentVal.length ? 'bg-primary scale-110' : 'bg-muted border border-border'
                }`}
              />
            ))}
          </div>

          {/* iPhone style Pin Pad */}
          <div className="grid grid-cols-3 gap-4 px-4" dir="ltr">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <Button
                key={num}
                type="button"
                variant="outline"
                className="h-16 text-2xl rounded-full font-semibold hover:bg-primary hover:text-primary-foreground transition-colors shadow-sm"
                onClick={() => handlePadClick(num.toString())}
                disabled={setupPinMutation.isPending}
              >
                {num}
              </Button>
            ))}
            <div />
            <Button
              type="button"
              variant="outline"
              className="h-16 text-2xl rounded-full font-semibold hover:bg-primary hover:text-primary-foreground transition-colors shadow-sm"
              onClick={() => handlePadClick("0")}
              disabled={setupPinMutation.isPending}
            >
              0
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="h-16 rounded-full text-muted-foreground hover:text-destructive transition-colors"
              onClick={handleDelete}
              disabled={setupPinMutation.isPending || currentVal.length === 0}
            >
              <Delete className="h-7 w-7" />
            </Button>
          </div>

          <Button 
            className="w-full h-12 text-lg rounded-xl shadow-md mt-4" 
            onClick={handleNext}
            disabled={setupPinMutation.isPending || currentVal.length < 5}
          >
            {setupPinMutation.isPending ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin ml-2" />
                جاري الحفظ...
              </>
            ) : (
              step === 'enter' ? 'التالي' : 'تأكيد وحفظ'
            )}
          </Button>

          {step === 'confirm' && !setupPinMutation.isPending && (
            <Button 
              variant="ghost" 
              className="w-full text-muted-foreground mt-2"
              onClick={() => {
                setStep('enter');
                setConfirmPin("");
              }}
            >
              العودة وإعادة الإدخال
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
