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
import { ArrowRight, Loader2, Building2, Eye, EyeOff, KeyRound, UserCheck } from "lucide-react";
import { useLocation } from "wouter";

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
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginMode, setLoginMode] = useState<'passcode' | 'old'>('passcode');

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

  const toggleMode = () => {
    setLoginMode(prev => prev === 'passcode' ? 'old' : 'passcode');
    form.reset({ username: "", password: "" });
  };

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    
    const cleanUsername = convertArabicNumerals(data.username).trim();
    const cleanPassword = convertArabicNumerals(data.password).trim();

    // Custom validations for passcode mode
    if (loginMode === 'passcode') {
      if (!/^\d+$/.test(cleanUsername)) {
        form.setError("username", { message: "رقم الموظف يجب أن يتكون من أرقام فقط" });
        setIsLoading(false);
        return;
      }
      if (!/^\d{5,}$/.test(cleanPassword)) {
        form.setError("password", { message: "الرمز السري يجب أن يتكون من أرقام فقط ولا يقل عن 5 أرقام" });
        setIsLoading(false);
        return;
      }
    }

    try {
      const result = await login(cleanUsername, cleanPassword);
      toast({
        title: "تم تسجيل الدخول",
        description: `مرحباً ${result.user.name}`,
      });
      
      // Force page reload to ensure auth state is refreshed
      window.location.href = result.user.role === "manager" ? "/manager" : "/dashboard";
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "خطأ في تسجيل الدخول";
      
      let errorDescription = "فشل في تسجيل الدخول";
      if (message.includes("401")) {
        errorDescription = loginMode === 'passcode' 
          ? "رقم الموظف أو الرمز السري غير صحيح" 
          : "اسم المستخدم أو كلمة المرور غير صحيحة";
      } else {
        // Look for custom server messages
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
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/50 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md space-y-6">
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

        <Card className="border-t-4 border-primary">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              {loginMode === 'passcode' ? (
                <>
                  <KeyRound className="h-5 w-5 text-primary" />
                  تسجيل الدخول بالرمز السري (PIN)
                </>
              ) : (
                <>
                  <UserCheck className="h-5 w-5 text-primary" />
                  تسجيل الدخول بالنظام القديم
                </>
              )}
            </CardTitle>
            <CardDescription>
              {loginMode === 'passcode' 
                ? "أدخل رقم الموظف والرمز السري الرقمي للمتابعة" 
                : "أدخل اسم المستخدم القديم وكلمة المرور للمتابعة"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {loginMode === 'passcode' ? "رقم الموظف" : "اسم المستخدم"}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={loginMode === 'passcode' ? "مثال: 1024" : "أدخل اسم المستخدم"}
                          {...field}
                          onChange={(e) => {
                            const val = e.target.value;
                            field.onChange(loginMode === 'passcode' ? convertArabicNumerals(val).replace(/\D/g, "") : val);
                          }}
                          disabled={isLoading}
                          data-testid="input-username"
                          className="text-right"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {loginMode === 'passcode' ? "الرمز السري الرقمي" : "كلمة المرور"}
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder={loginMode === 'passcode' ? "أدخل الرمز السري (أرقام فقط)" : "أدخل كلمة المرور"}
                            {...field}
                            onChange={(e) => {
                              const val = e.target.value;
                              field.onChange(loginMode === 'passcode' ? convertArabicNumerals(val).replace(/\D/g, "") : convertArabicNumerals(val));
                            }}
                            maxLength={loginMode === 'passcode' ? 10 : undefined}
                            disabled={isLoading}
                            data-testid="input-password"
                            className="pl-10 text-right"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute left-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                            disabled={isLoading}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex flex-col gap-3 pt-2">
                  <Button type="submit" className="w-full" disabled={isLoading} data-testid="button-login">
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin ml-2" />
                        جاري تسجيل الدخول...
                      </>
                    ) : (
                      "تسجيل الدخول"
                    )}
                  </Button>

                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={toggleMode} 
                    disabled={isLoading}
                    className="text-sm text-primary hover:underline"
                  >
                    {loginMode === 'passcode' 
                      ? "الدخول بالنظام القديم (اسم المستخدم وكلمة المرور)" 
                      : "الدخول بالرمز السري الرقمي (رقم الموظف)"}
                  </Button>

                  <Button type="button" variant="outline" onClick={onBack} disabled={isLoading} data-testid="button-back">
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
            {loginMode === 'passcode' 
              ? "إذا نسيت الرمز السري الخاص بك، يرجى مراجعة المدير المسؤول لتعديله"
              : "الدخول القديم متاح لمرة واحدة فقط لتفعيل نظام الأرقام الجديد"}
          </p>
        </div>
      </div>
    </div>
  );
}
