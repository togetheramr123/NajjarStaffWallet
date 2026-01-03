import { useState, useEffect } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PushNotificationButton() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSupported, setIsSupported] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkSupport();
  }, []);

  async function checkSupport() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setIsSupported(false);
      setIsLoading(false);
      return;
    }

    setIsSupported(true);

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
      }
    } catch (error) {
      console.error('Error checking push subscription:', error);
    }
    
    setIsLoading(false);
  }

  async function subscribeToPush() {
    setIsLoading(true);
    
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast({
          title: "تنبيه",
          description: "يجب السماح بالإشعارات لتفعيل هذه الخاصية",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      let registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        registration = await navigator.serviceWorker.register('/sw.js');
        await navigator.serviceWorker.ready;
      }

      const response = await fetch('/api/push/vapid-key', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to get VAPID key');
      }
      
      const { publicKey } = await response.json();

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      await apiRequest('POST', '/api/push/subscribe', {
        subscription: subscription.toJSON(),
      });

      setIsSubscribed(true);
      toast({
        title: "تم التفعيل",
        description: "سيتم إرسال إشعارات لك على هذا الجهاز",
      });
    } catch (error) {
      console.error('Error subscribing to push:', error);
      toast({
        title: "خطأ",
        description: "فشل في تفعيل الإشعارات",
        variant: "destructive",
      });
    }
    
    setIsLoading(false);
  }

  async function unsubscribeFromPush() {
    setIsLoading(true);
    
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await apiRequest('POST', '/api/push/unsubscribe', {
            endpoint: subscription.endpoint,
          });
          await subscription.unsubscribe();
        }
      }

      setIsSubscribed(false);
      toast({
        title: "تم إلغاء التفعيل",
        description: "لن تتلقى إشعارات على هذا الجهاز",
      });
    } catch (error) {
      console.error('Error unsubscribing from push:', error);
      toast({
        title: "خطأ",
        description: "فشل في إلغاء الإشعارات",
        variant: "destructive",
      });
    }
    
    setIsLoading(false);
  }

  if (!isSupported) {
    return null;
  }

  if (isLoading) {
    return (
      <Button variant="ghost" size="icon" disabled data-testid="button-push-loading">
        <Loader2 className="h-5 w-5 animate-spin" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={isSubscribed ? unsubscribeFromPush : subscribeToPush}
      title={isSubscribed ? "إلغاء إشعارات الهاتف" : "تفعيل إشعارات الهاتف"}
      data-testid="button-push-toggle"
    >
      {isSubscribed ? (
        <Bell className="h-5 w-5 text-green-600" />
      ) : (
        <BellOff className="h-5 w-5 text-muted-foreground" />
      )}
    </Button>
  );
}
