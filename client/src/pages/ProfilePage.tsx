import ProfileEditForm from "@/components/ProfileEditForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, QrCode } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import Barcode from "react-barcode";

export default function ProfilePage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

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

      {/* Employee Barcode Card */}
      {user?.employeeNumber && (
        <Card className="animate-fade-in-up overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <QrCode className="h-5 w-5 text-primary" />
              باركود الموظف
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center py-4">
            <div className="bg-white rounded-lg p-4">
              <Barcode
                value={user.employeeNumber}
                format="CODE128"
                width={2}
                height={60}
                fontSize={14}
                displayValue={true}
                background="#ffffff"
                lineColor="#1e293b"
              />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="max-w-lg">
        <ProfileEditForm />
      </div>
    </div>
  );
}
