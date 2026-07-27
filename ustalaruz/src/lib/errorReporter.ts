import { API_BASE } from './api';

export function reportError(
  message: string,
  source: string = 'frontend',
  extra: Record<string, unknown> = {}
) {
  fetch(`${API_BASE}/api/error-logs/report/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      level: 'error',
      message,
      source,
      url: window.location.href,
      data: extra,
      traceback: extra.stack || '',
    }),
  }).catch(() => {});
}

if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    reportError(
      event.message || 'Uncaught error',
      'frontend',
      { stack: event.error?.stack, filename: event.filename, lineno: event.lineno, colno: event.colno }
    );
  });
  window.addEventListener('unhandledrejection', (event) => {
    const err = event.reason;
    reportError(
      err?.message || err?.toString() || 'Unhandled Promise rejection',
      'frontend',
      { stack: err?.stack }
    );
  });
}
