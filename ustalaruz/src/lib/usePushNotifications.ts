import { useEffect, useRef } from 'react';
import { API_BASE } from './api';

const STORAGE_KEY = 'push_subscription_v1';

/** Fired once a push subscription exists, so any "enable notifications"
 *  prompt still on screen can take itself down (NotificationBanner). */
export const PUSH_SUBSCRIBED_EVENT = 'usta-push-subscribed';

/** True when this browser already handed us a push token. Cheap/sync, so a
 *  prompt can skip its first paint instead of flashing and disappearing. */
export function hasPushSubscription(): boolean {
  return getStoredSubscription() !== null;
}

let cachedPublicKey: Promise<string> | null = null;

function fetchPublicKey(): Promise<string> {
  if (!cachedPublicKey) {
    cachedPublicKey = fetch(`${API_BASE}/api/push/public-key/`)
      .then(res => res.json())
      .then(body => body.publicKey as string)
      .catch(err => {
        cachedPublicKey = null;
        throw err;
      });
  }
  return cachedPublicKey;
}

function getStoredSubscription(): PushSubscriptionJSON | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.debug('[Push] Failed to parse stored subscription:', err);
  }
  return null;
}

function storeSubscription(sub: PushSubscriptionJSON) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sub));
  } catch (err) {
    console.debug('[Push] Failed to store subscription:', err);
  }
}

function clearStoredSubscription() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.debug('[Push] Failed to clear stored subscription:', err);
  }
}

export function usePushNotifications(enabled: boolean) {
  const subscribedRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    if (Notification.permission === 'denied') return;

    function markSubscribed() {
      subscribedRef.current = true;
      window.dispatchEvent(new Event(PUSH_SUBSCRIBED_EVENT));
    }

    async function subscribe() {
      try {
        if (Notification.permission === 'default') {
          const permission = await Notification.requestPermission();
          if (permission !== 'granted') return;
        }

        const reg = await navigator.serviceWorker.ready;

        // 1. Check existing subscription in SW
        const existingSub = await reg.pushManager.getSubscription();
        if (existingSub) {
          const subJSON = existingSub.toJSON();
          // Register existing subscription with server
          storeSubscription(subJSON);
          await registerSubscription(subJSON);
          markSubscribed();
          return;
        }

        // 2. Check localStorage for stored subscription (re-register if valid)
        const stored = getStoredSubscription();
        if (stored) {
          try {
            await registerSubscription(stored);
            markSubscribed();
            return;
          } catch {
            // Stored subscription invalid, clear and create new
            clearStoredSubscription();
          }
        }

        // 3. Create new subscription
        const publicKey = await fetchPublicKey();
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });

        const subJSON = sub.toJSON();
        storeSubscription(subJSON);
        await registerSubscription(subJSON);
        markSubscribed();
      } catch (err) {
        console.log('[push] subscription failed:', err);
        subscribedRef.current = false;
      }
    }

    async function registerSubscription(subJSON: PushSubscriptionJSON) {
      const keys = subJSON.keys;
      if (!keys?.p256dh || !keys?.auth || !subJSON.endpoint) return;
      try {
        const res = await fetch(`${API_BASE}/api/push/register/`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endpoint: subJSON.endpoint,
            p256dh: subJSON.keys?.p256dh,
            auth: subJSON.keys?.auth,
          }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          console.debug('[Push] Register failed:', body.error || res.status);
        }
      } catch (err) {
        console.debug('[Push] Register network error:', err);
      }
    }

    subscribe();

    return () => {
      subscribedRef.current = false;
    };
  }, [enabled]);
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
}
