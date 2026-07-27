// Shared mutable store — UstaApp.tsx writes everything here before rendering,
// tab components read what they need. Allows lazy-loading without threading
// hundreds of props through component boundaries.
export const store: Record<string, any> = {};
