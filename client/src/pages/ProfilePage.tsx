import ProfileEditForm from "@/components/ProfileEditForm";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useLocation } from "wouter";

export default function ProfilePage() {
  const [, setLocation] = useLocation();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => setLocation("/")}
          data-testid="button-back"
        >
          <ArrowRight className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold" data-testid="text-profile-title">
            الملف الشخصي
          </h2>
          <p className="text-muted-foreground">إدارة بياناتك الشخصية</p>
        </div>
      </div>

      <div className="max-w-lg">
        <ProfileEditForm />
      </div>
    </div>
  );
}
