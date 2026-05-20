import { useQuery } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function AbuOmarBanner() {
  const { data: bannerSetting, isLoading } = useQuery({
    queryKey: ["/api/settings/abu_omar_banner"],
    staleTime: 60000,
  });

  if (isLoading) return null;

  // Default text if empty
  const defaultText = "حين طلب اي اشاعه يمكن متابعه ابو عمر في هذا لضمان اعلي خصم لك هاتف رقم 01091888960";
  const text = bannerSetting?.value || defaultText;

  return (
    <Alert className="mb-6 border-blue-500/50 bg-blue-50/50 dark:bg-blue-950/20 text-blue-900 dark:text-blue-200">
      <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
      <AlertTitle className="text-blue-800 dark:text-blue-300 font-bold mb-1">
        بيان خاص بالتحاليل والأشعة
      </AlertTitle>
      <AlertDescription className="text-sm leading-relaxed whitespace-pre-line">
        {text}
      </AlertDescription>
    </Alert>
  );
}
