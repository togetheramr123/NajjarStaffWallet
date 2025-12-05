import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";
import logoImage from "@assets/Screenshot_2025-08-19_143408_1764855126982.png";

interface WelcomePageProps {
  onLogin: () => void;
}

export default function WelcomePage({ onLogin }: WelcomePageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1e3a5f] via-[#1a2e4a] to-[#0f1c2e] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
      
      <div className="relative z-10 flex flex-col items-center gap-8 max-w-lg text-center">
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
          <img 
            src={logoImage} 
            alt="HSN GROUP Logo" 
            className="h-32 w-auto mx-auto mb-6"
            data-testid="img-logo"
          />
          
          <h1 className="text-3xl font-bold text-white mb-2" data-testid="text-company-name">
            HSN GROUP
          </h1>
          <p className="text-lg text-blue-200 mb-6" data-testid="text-system-name">
            نظام إدارة رصيد الموظفين
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <p className="text-xl text-white leading-relaxed" data-testid="text-welcome-message">
            مجموعة النجار تسعى لخدمة كل عناصر العاملين
          </p>
          <p className="text-2xl font-bold text-[#ef4444] mt-3" data-testid="text-welcome-highlight">
            وأنت واحد منهم، بل أفضلهم
          </p>
        </div>

        <Button 
          onClick={onLogin}
          size="lg"
          className="bg-[#ef4444] hover:bg-[#dc2626] text-white px-12 py-6 text-lg font-semibold shadow-lg"
          data-testid="button-login"
        >
          <LogIn className="ml-2 h-5 w-5" />
          تسجيل الدخول
        </Button>

        <p className="text-sm text-blue-300/60 mt-4">
          Employee Credit Management System
        </p>
      </div>
    </div>
  );
}
