/// <reference types="vite/client" />

// Git short SHA + commit date baked in at build time - see vite.config.ts.
declare const __APP_VERSION__: string;
declare const __APP_VERSION_DATE__: string;

interface ImportMetaEnv {
  readonly VITE_CLERK_PUBLISHABLE_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface Window {
  __openAdminPanel?: () => void;
  // Consent-gated analytics loader defined inline in index.html - see
  // src/lib/consent.ts, the only caller.
  __ustaLoadAnalytics?: () => void;
  __ustaDenyAnalytics?: () => void;
  __ustaAnalyticsLoaded?: boolean;
}

interface Navigator {
  standalone?: boolean;
}
