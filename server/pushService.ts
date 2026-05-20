import webpush from 'web-push';
import { storage } from './storage';
import { log } from './index';

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@hsngroup.com';

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

export async function sendPushNotification(userId: string, title: string, body: string, url?: string) {
  if (!vapidPublicKey || !vapidPrivateKey) {
    log('VAPID keys not configured, skipping push notification', 'push');
    return;
  }

  try {
    const subscriptions = await storage.getPushSubscriptions(userId);
    
    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          JSON.stringify({ title, body, url: url || '/' })
        );
      } catch (error: any) {
        if (error.statusCode === 410 || error.statusCode === 404) {
          await storage.deletePushSubscription(userId, sub.endpoint);
        }
      }
    }
  } catch (error) {
    log(`Error sending push notification: ${error}`, 'push');
  }
}

export async function sendPushToManagers(title: string, body: string, url?: string) {
  if (!vapidPublicKey || !vapidPrivateKey) {
    return;
  }

  try {
    const subscriptions = await storage.getAllManagerPushSubscriptions();
    
    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          JSON.stringify({ title, body, url: url || '/' })
        );
      } catch (error: any) {
        if (error.statusCode === 410 || error.statusCode === 404) {
          await storage.deletePushSubscription(sub.userId, sub.endpoint);
        }
      }
    }
  } catch (error) {
    log(`Error sending push to managers: ${error}`, 'push');
  }
}

export async function sendPushToBranchManagers(branchId: string, title: string, body: string, url?: string) {
  if (!vapidPublicKey || !vapidPrivateKey) {
    return;
  }

  try {
    const subscriptions = await storage.getBranchManagerPushSubscriptions(branchId);
    
    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          JSON.stringify({ title, body, url: url || '/' })
        );
      } catch (error: any) {
        if (error.statusCode === 410 || error.statusCode === 404) {
          await storage.deletePushSubscription(sub.userId, sub.endpoint);
        }
      }
    }
  } catch (error) {
    log(`Error sending push to branch managers: ${error}`, 'push');
  }
}

export function getVapidPublicKey(): string | undefined {
  return vapidPublicKey;
}
