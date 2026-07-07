import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, Loader2, Building2, KeyRound, Delete, User, Lock } from "lucide-react";
import ForcePinSetupDialog from "@/components/ForcePinSetupDialog";

const loginSchema = z.object({
  username: z.string().min(1, "هذا الحقل مطلوب"),
  password: z.string().min(1, "هذا الحقل مطلوب"),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginPageProps {
  onBack: () => void;
}

export default function LoginPage({ onBack }: LoginPageProps) {
  const { login } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [loginResult, setLoginResult] = useState<any>(null);
  const [activeField, setActiveField] = useState<'username' | 'password'>('username');

  const convertArabicNumerals = (str: string) => {
    const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return str.replace(/[٠-٩]/g, (w) => arabicNumbers.indexOf(w).toString());
  };

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const handlePadClick = (num: string) => {
    const currentVal = form.getValues(activeField);
    const maxLen = activeField === 'username' ? 15 : 10;
    if (currentVal.length < maxLen) {
      form.setValue(activeField, currentVal + num, { shouldValidate: true });
    }
  };

  const handleDelete = () => {
    const currentVal = form.getValues(activeField);
    if (currentVal.length > 0) {
      form.setValue(activeField, currentVal.slice(0, -1), { shouldValidate: true });
    } else if (activeField === 'password') {
      // If PIN is empty and user presses delete, go back to employee number
      setActiveField('username');
    }
  };

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    
    const cleanUsername = convertArabicNumerals(data.username).replace(/\D/g, "").trim();
    const cleanPassword = convertArabicNumerals(data.password).replace(/\D/g, "").trim();

    if (!cleanUsername) {
      form.setError("username", { message: "رقم الموظف يجب أن يتكون من أرقام فقط" });
      setActiveField('username');
      setIsLoading(false);
      return;
    }
    if (cleanPassword.length < 5) {
      form.setError("password", { message: "الرمز السري يجب أن لا يقل عن 5 أرقام" });
      setActiveField('password');
      setIsLoading(false);
      return;
    }

    try {
      const result = await login(cleanUsername, cleanPassword);
      toast({
        title: "تم تسجيل الدخول",
        description: `مرحباً ${result.user.name}`,
      });
      
      if (result.user.requiresPinSetup) {
        setLoginResult(result);
        setShowPinSetup(true);
        setIsLoading(false);
      } else {
        window.location.href = result.user.role === "manager" ? "/manager" : "/dashboard";
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "خطأ في تسجيل الدخول";
      
      let errorDescription = "فشل في تسجيل الدخول";
      if (message.includes("401")) {
        errorDescription = "رقم الموظف أو الرمز السري غير صحيح";
      } else {
        try {
          const jsonStart = message.indexOf("{");
          if (jsonStart !== -1) {
            const parsed = JSON.parse(message.slice(jsonStart));
            errorDescription = parsed.message || errorDescription;
          } else {
            errorDescription = message;
          }
        } catch {
          errorDescription = message;
        }
      }

      toast({
        title: "خطأ في تسجيل الدخول",
        description: errorDescription,
        variant: "destructive",
      });
      setIsLoading(false);
      form.setValue("password", "");
      setActiveField('username');
    }
  };

  const handlePinSetupComplete = () => {
    setShowPinSetup(false);
  };

  const usernameVal = form.watch("username");
  const passwordVal = form.watch("password");

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/50 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="h-16 w-16 rounded-md bg-primary flex items-center justify-center">
              <Building2 className="h-10 w-10 text-primary-foreground" />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-2xl font-bold text-primary">HSN GROUP</span>
              <span className="text-sm text-muted-foreground">فريق النجار</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold">نظام إدارة رصيد الموظفين</h1>
        </div>

        <Card className="border-t-4 border-primary shadow-lg">
          <CardHeader className="text-center pb-4">
            <CardTitle className="flex items-center justify-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              تسجيل الدخول
            </CardTitle>
            <CardDescription>
              اضغط على الحقل ثم استخدم لوحة الأرقام للإدخال
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                {/* Employee Number Field — tappable display */}
                <FormField
                  control={form.control}
                  name="username"
                  render={() => (
                    <FormItem>
                      <FormLabel className="text-center block text-muted-foreground text-xs">رقم الموظف</FormLabel>
                      <div
                        onClick={() => setActiveField('username')}
                        className={`flex items-center justify-center gap-2 h-12 rounded-lg cursor-pointer transition-all duration-200 ${
                          activeField === 'username'
                            ? 'bg-primary/10 border-2 border-primary shadow-sm'
                            : 'bg-muted/50 border-2 border-transparent'
                        }`}
                      >
                        <User className={`h-4 w-4 ${activeField === 'username' ? 'text-primary' : 'text-muted-foreground'}`} />
                        {usernameVal ? (
                          <span className="text-xl font-bold tracking-wider" dir="ltr">{usernameVal}</span>
                        ) : (
                          <span className="text-muted-foreground text-sm">اضغط هنا ثم أدخل رقم الموظف</span>
                        )}
                      </div>
                      <FormMessage className="text-center" />
                    </FormItem>
                  )}
                />

                {/* PIN Field — tappable dots display */}
                <FormField
                  control={form.control}
                  name="password"
                  render={() => (
                    <FormItem>
                      <FormLabel className="text-center block text-muted-foreground text-xs">الرمز السري</FormLabel>
                      <div
                        onClick={() => setActiveField('password')}
                        className={`flex items-center justify-center gap-2 h-12 rounded-lg cursor-pointer transition-all duration-200 ${
                          activeField === 'password'
                            ? 'bg-primary/10 border-2 border-primary shadow-sm'
                            : 'bg-muted/50 border-2 border-transparent'
                        }`}
                      >
                        <Lock className={`h-4 w-4 ${activeField === 'password' ? 'text-primary' : 'text-muted-foreground'}`} />
                        {passwordVal ? (
                          <div className="flex gap-2" dir="ltr">
                            {Array.from({ length: passwordVal.length }).map((_, i) => (
                              <div key={i} className="w-3.5 h-3.5 rounded-full bg-primary" />
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">اضغط هنا ثم أدخل الرمز السري</span>
                        )}
                      </div>
                      <FormMessage className="text-center" />
                    </FormItem>
                  )}
                />

                {/* Shared numeric pad */}
                <div className="grid grid-cols-3 gap-3 pt-2 px-2" dir="ltr">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <Button
                      key={num}
                      type="button"
                      variant="outline"
                      className="h-14 text-2xl rounded-full font-semibold hover:bg-primary hover:text-primary-foreground transition-colors shadow-sm"
                      onClick={() => handlePadClick(num.toString())}
                      disabled={isLoading}
                    >
                      {num}
                    </Button>
                  ))}
                  <div />
                  <Button
                    type="button"
                    variant="outline"
                    className="h-14 text-2xl rounded-full font-semibold hover:bg-primary hover:text-primary-foreground transition-colors shadow-sm"
                    onClick={() => handlePadClick("0")}
                    disabled={isLoading}
                  >
                    0
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-14 rounded-full text-muted-foreground hover:text-destructive transition-colors"
                    onClick={handleDelete}
                    disabled={isLoading || (activeField === 'username' && usernameVal.length === 0)}
                  >
                    <Delete className="h-6 w-6" />
                  </Button>
                </div>

                <div className="flex flex-col gap-3 pt-4">
                  <Button type="submit" className="w-full h-12 text-lg rounded-xl shadow-md" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin ml-2" />
                        جاري تسجيل الدخول...
                      </>
                    ) : (
                      "دخول"
                    )}
                  </Button>

                  <Button type="button" variant="ghost" onClick={onBack} disabled={isLoading} className="text-muted-foreground">
                    <ArrowRight className="h-4 w-4 ml-2" />
                    العودة
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            إذا نسيت الرمز السري الخاص بك، يرجى مراجعة المدير المسؤول لتعديله
          </p>
        </div>
      </div>

      <ForcePinSetupDialog 
        open={showPinSetup} 
        onOpenChange={(open) => {
          if (!open) handlePinSetupComplete();
        }} 
      />
    </div>
  );
}
