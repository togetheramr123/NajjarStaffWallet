import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, Loader2, Building2, KeyRound, Delete } from "lucide-react";
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
    const currentPass = form.getValues("password");
    if (currentPass.length < 10) {
      form.setValue("password", currentPass + num, { shouldValidate: true });
    }
  };

  const handleDelete = () => {
    const currentPass = form.getValues("password");
    form.setValue("password", currentPass.slice(0, -1), { shouldValidate: true });
  };

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    
    const cleanUsername = convertArabicNumerals(data.username).replace(/\D/g, "").trim();
    const cleanPassword = convertArabicNumerals(data.password).replace(/\D/g, "").trim();

    if (!cleanUsername) {
      form.setError("username", { message: "رقم الموظف يجب أن يتكون من أرقام فقط" });
      setIsLoading(false);
      return;
    }
    if (cleanPassword.length < 5) {
      form.setError("password", { message: "الرمز السري يجب أن لا يقل عن 5 أرقام" });
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
      form.setValue("password", ""); // Clear password on error
    }
  };

  const handlePinSetupComplete = () => {
    setShowPinSetup(false);
  };

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
              أدخل رقم الموظف والرمز السري للمتابعة
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-center block text-muted-foreground">رقم الموظف</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="مثال: 19939"
                          {...field}
                          onChange={(e) => {
                            const val = e.target.value;
                            field.onChange(convertArabicNumerals(val).replace(/\D/g, ""));
                          }}
                          disabled={isLoading}
                          className="text-center text-xl tracking-wider h-12 bg-muted/50 font-bold"
                          inputMode="numeric"
                        />
                      </FormControl>
                      <FormMessage className="text-center" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="space-y-4">
                      <FormLabel className="text-center block text-muted-foreground">الرمز السري</FormLabel>
                      <FormControl>
                        <div className="flex justify-center gap-3 h-10 items-center">
                          {Array.from({ length: Math.max(5, field.value.length) }).map((_, i) => (
                            <div 
                              key={i} 
                              className={`w-4 h-4 rounded-full transition-all duration-200 ${
                                i < field.value.length ? 'bg-primary scale-110' : 'bg-muted border border-border'
                              }`}
                            />
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage className="text-center" />

                      {/* iPhone style Pin Pad */}
                      <div className="grid grid-cols-3 gap-3 pt-4 px-2" dir="ltr">
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
                          disabled={isLoading || field.value.length === 0}
                        >
                          <Delete className="h-6 w-6" />
                        </Button>
                      </div>
                    </FormItem>
                  )}
                />

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
