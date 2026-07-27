import { MotionGlobalConfig, useReducedMotion } from 'motion/react';
import { useState, useEffect } from 'react';

type SpringPreset = {
  type: 'spring';
  stiffness: number;
  damping: number;
};

type TweenPreset = {
  duration: number;
  ease: string;
};

export type MotionPreset = {
  spring: SpringPreset;
  tween: TweenPreset;
  scaleHover: number;
  scaleTap: number;
  enabled: number;
};

/* ── Global: accessibility first ──
   prefers-reduced-motion = skip ALL motion animation globally. */
if (typeof window !== 'undefined') {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  MotionGlobalConfig.skipAnimations = reduced.matches;
  reduced.addEventListener('change', () => {
    MotionGlobalConfig.skipAnimations = reduced.matches;
  });
}

function detectMobile(): boolean {
  if (typeof window === 'undefined') return false;
  const isMobileSize = window.innerWidth < 640;
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isLowEnd =
    navigator.hardwareConcurrency !== undefined &&
    navigator.hardwareConcurrency <= 4;
  return isMobileSize || (isTouch && isLowEnd);
}

export function useMotionPreset(): MotionPreset {
  const reduced = useReducedMotion();
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    setMobile(detectMobile());
    const onResize = () => setMobile(detectMobile());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  if (reduced) {
    return {
      spring: { type: 'spring', stiffness: 1, damping: 1 },
      tween: { duration: 0.01, ease: 'easeOut' },
      scaleHover: 1,
      scaleTap: 1,
      enabled: 0,
    };
  }

  if (mobile) {
    return {
      spring: { type: 'spring', stiffness: 200, damping: 20 },
      tween: { duration: 0.15, ease: 'easeOut' },
      scaleHover: 1.03,
      scaleTap: 0.97,
      enabled: 1,
    };
  }

  return {
    spring: { type: 'spring', stiffness: 350, damping: 25 },
    tween: { duration: 0.22, ease: 'easeOut' },
    scaleHover: 1.05,
    scaleTap: 0.95,
    enabled: 1,
  };
}
