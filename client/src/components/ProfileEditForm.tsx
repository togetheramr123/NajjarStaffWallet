import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, User, Lock, Save } from "lucide-react";

const profileSchema = z.object({
  name: z.string().min(2, "الاسم يجب أن يكون حرفين على الأقل").optional().or(z.literal("")),
  currentPassword: z.string().optional().or(z.literal("")),
  newPassword: z.string().optional().or(z.literal("")),
  confirmPassword: z.string().optional().or(z.literal("")),
}).refine((data) => {
  if (data.newPassword && !data.currentPassword) {
    return false;
  }
  return true;
}, { message: "يجب إدخال كلمة المرور الحالية لتغيير كلمة المرور", path: ["currentPassword"] })
.refine((data) => {
  if (data.newPassword && data.newPassword.length < 4) {
    return false;
  }
  return true;
}, { message: "كلمة المرور الجديدة يجب أن تكون 4 أحرف على الأقل", path: ["newPassword"] })
.refine((data) => {
  if (data.newPassword && data.newPassword !== data.confirmPassword) {
    return false;
  }
  return true;
}, { message: "كلمات المرور غير متطابقة", path: ["confirmPassword"] });

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfileEditForm() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [showPasswordFields, setShowPasswordFields] = useState(false);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { name?: string; currentPassword?: string; newPassword?: string }) => {
      const response = await apiRequest("PATCH", "/api/profile", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "تم التحديث",
        description: data.message || "تم تحديث بياناتك بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      refreshUser();
      form.reset({
        name: data.user?.name || user?.name || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setShowPasswordFields(false);
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    const updateData: { name?: string; currentPassword?: string; newPassword?: string } = {};
    
    if (data.name && data.name !== user?.name) {
      updateData.name = data.name;
    }
    
    if (data.newPassword && data.currentPassword) {
      updateData.currentPassword = data.currentPassword;
      updateData.newPassword = data.newPassword;
    }

    if (Object.keys(updateData).length === 0) {
      toast({
        title: "تنبيه",
        description: "لا توجد تغييرات لحفظها",
        variant: "destructive",
      });
      return;
    }

    updateProfileMutation.mutate(updateData);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            البيانات الشخصية
          </CardTitle>
          <CardDescription>
            يمكنك تعديل اسمك وكلمة المرور الخاصة بك
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الاسم</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="أدخل اسمك" 
                        {...field} 
                        data-testid="input-profile-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="border-t pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPasswordFields(!showPasswordFields)}
                  className="mb-4"
                  data-testid="button-toggle-password"
                >
                  <Lock className="h-4 w-4 ml-2" />
                  {showPasswordFields ? "إخفاء تغيير كلمة المرور" : "تغيير كلمة المرور"}
                </Button>

                {showPasswordFields && (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>كلمة المرور الحالية</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="أدخل كلمة المرور الحالية" 
                              {...field} 
                              data-testid="input-current-password"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>كلمة المرور الجديدة</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="أدخل كلمة المرور الجديدة" 
                              {...field} 
                              data-testid="input-new-password"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>تأكيد كلمة المرور الجديدة</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="أعد إدخال كلمة المرور الجديدة" 
                              {...field} 
                              data-testid="input-confirm-password"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>

              <Button 
                type="submit" 
                disabled={updateProfileMutation.isPending}
                className="w-full"
                data-testid="button-save-profile"
              >
                {updateProfileMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 ml-2" />
                    حفظ التغييرات
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>معلومات الحساب</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-muted-foreground">اسم المستخدم</span>
            <span className="font-medium" data-testid="text-username">{user?.username}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-muted-foreground">رقم الموظف</span>
            <span className="font-medium" data-testid="text-employee-number">{user?.employeeNumber}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-muted-foreground">الصلاحية</span>
            <span className="font-medium" data-testid="text-role">
              {user?.role === "manager" ? "مدير" : "موظف"}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
