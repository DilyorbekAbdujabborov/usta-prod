import { Bell, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  PUSH_SUBSCRIBED_EVENT,
  hasPushSubscription,
} from '../lib/usePushNotifications';
import { useConsent } from '../lib/consent';

export default function NotificationBanner() {
  const consent = useConsent();
  const [dismissed, setDismissed] = useState(
    () =>
      localStorage.getItem('usta_notif_banner_dismissed') === 'true' ||
      // Already holding a push token - nothing left to ask for.
      hasPushSubscription()
  );
  const [permissionState, setPermissionState] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  );

  // usePushNotifications requests permission on its own as soon as the user
  // signs in, so the token can land while this banner is already mounted -
  // without listening, it would sit there asking for something that is
  // already granted. Re-checking on focus covers the case where the native
  // prompt was answered in a way that fires no event.
  useEffect(() => {
    const hide = () => setDismissed(true);
    const recheck = () => {
      if (typeof Notification !== 'undefined') {
        setPermissionState(Notification.permission);
      }
      if (hasPushSubscription()) setDismissed(true);
    };

    window.addEventListener(PUSH_SUBSCRIBED_EVENT, hide);
    window.addEventListener('focus', recheck);
    document.addEventListener('visibilitychange', recheck);
    return () => {
      window.removeEventListener(PUSH_SUBSCRIBED_EVENT, hide);
      window.removeEventListener('focus', recheck);
      document.removeEventListener('visibilitychange', recheck);
    };
  }, []);

  // Live subscription check - a token can exist in the service worker even
  // when localStorage was cleared.
  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    let cancelled = false;
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => {
        if (!cancelled && sub) setDismissed(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Never stack on top of the cookie/analytics banner - that one has to be
  // answered first (ConsentBanner).
  if (consent === null) return null;
  if (dismissed || permissionState !== 'default') return null;

  const handleEnable = async () => {
    try {
      const result = await Notification.requestPermission();
      setPermissionState(result);
      if (result === 'granted') {
        setDismissed(true);
        localStorage.setItem('usta_notif_banner_dismissed', 'true');
      }
    } catch {
      // Silently fail
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('usta_notif_banner_dismissed', 'true');
  };

  return (
    <div className="fixed bottom-20 lg:bottom-4 left-4 right-4 z-50 max-w-sm mx-auto lg:mx-0">
      <div className="bg-white dark:bg-surface-card border border-border rounded-2xl shadow-xl p-4 flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-brand/10 text-brand flex items-center justify-center shrink-0 mt-0.5">
          <Bell size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-black text-text-primary">Bildirishnomalarni yoqish</h4>
          <p className="text-[10px] text-text-secondary font-bold mt-1 leading-relaxed">
            Buyurtmalar va xabarlar haqida tezkor xabardor bo'ling
          </p>
          <div className="flex items-center gap-2 mt-2.5">
            <button
              onClick={handleEnable}
              className="px-3 py-1.5 bg-brand hover:bg-brand-hover text-white text-[10px] font-black rounded-lg transition-all cursor-pointer active:scale-95"
            >
              Yoqish
            </button>
            <button
              onClick={handleDismiss}
              className="px-3 py-1.5 text-text-secondary hover:text-text-primary text-[10px] font-bold rounded-lg transition-all cursor-pointer"
            >
              Keyinroq
            </button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="p-1 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-tertiary transition-all cursor-pointer shrink-0"
          aria-label="Yopish"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
