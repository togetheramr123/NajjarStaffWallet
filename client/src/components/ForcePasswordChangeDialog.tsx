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

interface ForcePasswordChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ForcePasswordChangeDialog({ open, onOpenChange }: ForcePasswordChangeDialogProps) {
  const { toast } = useToast();
  const { refreshUser } = useAuth();
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const convertArabicNumerals = (str: string) => {
    const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return str.replace(/[٠-٩]/g, (w) => arabicNumbers.indexOf(w).toString());
  };

  const updatePasswordMutation = useMutation({
    mutationFn: async (password: string) => {
      const res = await apiRequest("PATCH", "/api/profile", {
        currentPassword: "123456",
        newPassword: password,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "تم التغيير بنجاح",
        description: "تم تغيير الرقم السري الخاص بك لحماية حسابك",
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
    if (newPassword.length < 4) {
      toast({
        title: "خطأ",
        description: "كلمة المرور يجب أن تكون 4 أحرف على الأقل",
        variant: "destructive",
      });
      return;
    }
    updatePasswordMutation.mutate(newPassword);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>تنبيه أمان: الرجاء تغيير الرقم السري</DialogTitle>
          <DialogDescription>
            يبدو أنك لا تزال تستخدم الرقم السري الافتراضي للنظام. حفاظاً على أمان وسرية رصيدك، يرجى تغييره الآن.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">الرقم السري الجديد</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(convertArabicNumerals(e.target.value))}
                  placeholder="أدخل الرقم السري الجديد"
                  disabled={updatePasswordMutation.isPending}
                  className="pl-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute left-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={updatePasswordMutation.isPending}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter className="pt-4 border-t mt-2 flex sm:justify-between items-center w-full gap-2 sm:gap-0">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={updatePasswordMutation.isPending}
              className="text-muted-foreground"
            >
              تخطي حالياً
            </Button>
            <Button type="submit" disabled={updatePasswordMutation.isPending}>
              {updatePasswordMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                "تغيير الآن"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
