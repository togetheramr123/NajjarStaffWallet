import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save } from "lucide-react";
import { useState, useEffect } from "react";

export default function SettingsPage() {
  const { toast } = useToast();
  const [bannerText, setBannerText] = useState("");

  const { data: bannerSetting, isLoading } = useQuery<{ value: string }>({
    queryKey: ["/api/settings/abu_omar_banner"],
  });

  useEffect(() => {
    if (bannerSetting && bannerSetting.value) {
      setBannerText(bannerSetting.value);
    } else if (bannerSetting && !bannerSetting.value && bannerText === "") {
      // Default text if empty
      setBannerText("حين طلب اي اشاعه يمكن متابعه ابو عمر في هذا لضمان اعلي خصم لك هاتف رقم 01091888960");
    }
  }, [bannerSetting]);

  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const res = await apiRequest("POST", "/api/settings", { key, value });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "تم الحفظ",
        description: "تم تحديث الإعدادات بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/settings/abu_omar_banner"] });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSaveBanner = () => {
    updateSettingMutation.mutate({ key: "abu_omar_banner", value: bannerText });
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto" dir="rtl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">الإعدادات العامة</h1>
          <p className="text-muted-foreground mt-1">تخصيص لوحات الإعلانات والنظام</p>
        </div>
      </div>

      <div className="grid gap-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>بيان التحاليل والأشعة (أبو عمر)</CardTitle>
            <CardDescription>
              هذا النص سيظهر بشكل ثابت في أعلى لوحة تحكم جميع الموظفين.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="banner-text">محتوى البيان</Label>
              <Textarea
                id="banner-text"
                placeholder="أدخل النص هنا..."
                value={bannerText}
                onChange={(e) => setBannerText(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            <Button 
              onClick={handleSaveBanner} 
              disabled={updateSettingMutation.isPending}
            >
              {updateSettingMutation.isPending ? (
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 ml-2" />
              )}
              حفظ البيان
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
