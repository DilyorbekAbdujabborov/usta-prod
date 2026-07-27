import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertTriangle, X, Info } from 'lucide-react';
import { useMotionPreset } from '../lib/useMotionPreset';

export type NotificationType = 'success' | 'error' | 'info';

interface NotificationProps {
  message: string;
  type: NotificationType;
  onClose: () => void;
  duration?: number;
}

const titles: Record<NotificationType, string> = {
  success: 'Muvaffaqiyatli',
  error: 'Xatolik',
  info: 'Ma\'lumot',
};

const config = {
  success: {
    border: 'border-emerald-400/20',
    bg: 'from-emerald-600/90 to-emerald-700/90',
    glow: 'shadow-emerald-500/25',
    icon: CheckCircle2,
    iconBg: 'bg-emerald-400/20',
    accent: 'bg-emerald-400',
    ring: 'ring-emerald-500/20',
  },
  error: {
    border: 'border-rose-400/20',
    bg: 'from-rose-600/90 to-rose-700/90',
    glow: 'shadow-rose-500/25',
    icon: AlertTriangle,
    iconBg: 'bg-rose-400/20',
    accent: 'bg-rose-400',
    ring: 'ring-rose-500/20',
  },
  info: {
    border: 'border-sky-400/20',
    bg: 'from-sky-600/90 to-sky-700/90',
    glow: 'shadow-sky-500/25',
    icon: Info,
    iconBg: 'bg-sky-400/20',
    accent: 'bg-sky-400',
    ring: 'ring-sky-500/20',
  },
} as const;

export default function Notification({ message, type, onClose, duration = 4000 }: NotificationProps) {
  const { spring, enabled } = useMotionPreset();
  const onCloseRef = useRef(onClose);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (duration <= 0) return;
    const timer = setTimeout(() => {
      setDismissed(true);
      setTimeout(onCloseRef.current, 250);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration]);

  const current = config[type];
  const Icon = current.icon;

  const handleClose = () => {
    setDismissed(true);
    setTimeout(onClose, 250);
  };

  return (
    <motion.div
      initial={enabled ? { opacity: 0, y: 50, scale: 0.92 } : { opacity: 1, y: 0, scale: 1 }}
      animate={
        dismissed
          ? { opacity: 0, y: 30, scale: 0.95 }
          : { opacity: 1, y: 0, scale: 1 }
      }
      exit={{ opacity: 0, y: -15, scale: 0.95 }}
      transition={enabled ? { type: 'spring', stiffness: 400, damping: 28, mass: 0.8 } : { duration: 0 }}
      className={`fixed bottom-4 left-4 right-4 sm:left-auto sm:bottom-6 sm:right-6 z-50 sm:w-[420px] rounded-2xl border bg-gradient-to-br text-white shadow-xl backdrop-blur-xl overflow-hidden ${current.border} ${current.bg} ${current.glow} ${current.ring} ring-1`}
      role="alert"
      style={{ willChange: 'transform, opacity' }}
    >
      {/* Accent strip */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${current.accent}`} />

      <div className="flex gap-4 p-5 pl-6">
        {/* Icon */}
        <div className={`p-2.5 rounded-xl ${current.iconBg} shrink-0 self-start`}>
          <Icon size={24} className="text-white" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <p className="text-[15px] font-bold leading-tight tracking-tight">
              {titles[type]}
            </p>
            <button
              onClick={handleClose}
              className="p-1 rounded-lg bg-white/10 hover:bg-white/20 active:scale-90 transition-all text-white/50 hover:text-white shrink-0 -mr-1 -mt-1"
              aria-label="Yopish"
            >
              <X size={18} />
            </button>
          </div>
          <p className="text-sm text-white/85 leading-relaxed mt-1.5 pr-2">
            {message}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      {duration > 0 && !dismissed && (
        <div className="h-1.5 bg-white/10 mx-5 mb-4 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: duration / 1000, ease: 'linear' }}
            className={`h-full ${current.accent} rounded-full`}
          />
        </div>
      )}
    </motion.div>
  );
}
