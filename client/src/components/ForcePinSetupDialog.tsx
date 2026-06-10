import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2 } from "lucide-react";
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
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [showPin, setShowPin] = useState(false);

  const convertArabicNumerals = (str: string) => {
    const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return str.replace(/[٠-٩]/g, (w) => arabicNumbers.indexOf(w).toString());
  };

  const setupPinMutation = useMutation({
    mutationFn: async (pinValue: string) => {
      const res = await apiRequest("POST", "/api/auth/setup-pin", {
        pin: pinValue,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "تم تفعيل الرمز السري",
        description: "تم تفعيل رمز الدخول الرقمي بنجاح، يمكنك الآن استخدامه للدخول في المرات القادمة",
      });
      onOpenChange(false);
      refreshUser();
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const cleanPin = convertArabicNumerals(pin).replace(/\D/g, "");
    const cleanConfirm = convertArabicNumerals(confirmPin).replace(/\D/g, "");

    if (cleanPin.length < 5) {
      toast({
        title: "خطأ",
        description: "الرمز السري يجب أن يتكون من أرقام فقط ولا يقل عن 5 أرقام",
        variant: "destructive",
      });
      return;
    }

    if (cleanPin !== cleanConfirm) {
      toast({
        title: "خطأ",
        description: "الرمزين السريين غير متطابقين",
        variant: "destructive",
      });
      return;
    }

    setupPinMutation.mutate(cleanPin);
  };

  // Prevent closing the dialog by clicking outside or pressing Escape
  const handlePointerDownOutside = (e: any) => {
    e.preventDefault();
  };

  const handleEscapeKeyDown = (e: any) => {
    e.preventDefault();
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-[425px]" 
        onPointerDownOutside={handlePointerDownOutside}
        onEscapeKeyDown={handleEscapeKeyDown}
      >
        <DialogHeader>
          <DialogTitle className="text-right">تفعيل رمز الدخول الرقمي (PIN)</DialogTitle>
          <DialogDescription className="text-right mt-2 text-sm leading-relaxed">
            لقد تم تحديث نظام الأمان لتسجيل الدخول. يرجى تعيين رمز دخول رقمي جديد (مكون من أرقام فقط، لا يقل عن 5 أرقام) للوصول إلى حسابك وحماية رصيدك.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="pin-code" className="block text-right">الرمز السري الجديد (أرقام فقط)</Label>
              <div className="relative">
                <Input
                  id="pin-code"
                  type={showPin ? "text" : "password"}
                  value={pin}
                  onChange={(e) => setPin(convertArabicNumerals(e.target.value).replace(/\D/g, ""))}
                  placeholder="أدخل 5 أرقام على الأقل"
                  maxLength={10}
                  disabled={setupPinMutation.isPending}
                  className="pl-10 text-right"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute left-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPin(!showPin)}
                  disabled={setupPinMutation.isPending}
                >
                  {showPin ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-pin-code" className="block text-right">تأكيد الرمز السري الجديد</Label>
              <Input
                id="confirm-pin-code"
                type={showPin ? "text" : "password"}
                value={confirmPin}
                onChange={(e) => setConfirmPin(convertArabicNumerals(e.target.value).replace(/\D/g, ""))}
                placeholder="أعد إدخال الرمز السري"
                maxLength={10}
                disabled={setupPinMutation.isPending}
                className="text-right"
                required
              />
            </div>
          </div>
          <DialogFooter className="pt-4 border-t flex sm:justify-start items-center w-full">
            <Button type="submit" className="w-full" disabled={setupPinMutation.isPending}>
              {setupPinMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  جاري الحفظ وتفعيل الرمز السري...
                </>
              ) : (
                "حفظ وتفعيل الرمز السري"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
