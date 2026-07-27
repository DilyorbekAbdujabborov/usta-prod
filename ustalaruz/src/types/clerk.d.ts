// Clerk's documented pattern for typing custom publicMetadata: augment the
// global interface it declares (empty by default) via declaration merging.
// `role: 'admin'` is set manually in the Clerk Dashboard for admin accounts;
// api/_lib/auth.ts's requireAdmin() re-checks this server-side on every
// protected request, so this client-side type only gates UI, not access.
export {};

declare global {
  interface UserPublicMetadata {
    role?: 'admin' | 'client' | 'master';
  }
}
