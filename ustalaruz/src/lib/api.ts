import { useMemo } from 'react';

// These mirror the JSON shapes returned by the Django REST backend
// (backend/*/serializers.py) - the app used to talk to a Neon/Drizzle
// database directly from Vercel serverless functions and inferred these
// types from db/schema.ts, but that layer was removed in favor of the
// Django backend (see backend/core/urls.py) without updating these types.
export type Profile = {
  id: number;
  phone: string;
  name: string;
  role: 'client' | 'master' | 'admin';
  isAdmin: boolean;
  balance: number;
  isBlocked: boolean;
  createdAt: string;
};
export type Order = {
  id: string;
  clientId: number;
  masterId: number | null;
  title: string;
  categoryId: string | null;
  categoryName: string | null;
  budget: number;
  region: string;
  district: string;
  desc: string;
  status: 'pending' | 'active' | 'postponed' | 'delayed' | 'completed' | 'cancelled';
  createdAt: string;
  clientName: string | null;
  clientPhone: string | null;
  masterName?: string | null;
  masterPhone?: string | null;
  masterHidden?: boolean;
  clientRating?: number | null;
  clientReview?: string;
};
export type Master = {
  id: number;
  userId: number;
  categoryId: string;
  categoryName: string;
  name: string;
  phone: string;
  avatarUrl: string;
  bio: string | null;
  extraPhone: string | null;
  telegram: string | null;
  specialty: string | null;
  priceComment: string | null;
  services: string;
  rating: number;
  reviewsCount: number;
  experience: number;
  price: number;
  region: string;
  district: string;
  isActive: boolean;
  isOnline: boolean;
  verified: boolean;
  completedJobs: number;
  monthlyEarnings: number;
  premiumUntil: string | null;
  createdAt: string;
  reviews: { id: string; author: string; rating: number; text: string; date: string }[];
};
export type MastersResponse = { data: Master[]; total: number };
export type Application = {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  phone: string;
  categoryId: string | null;
  categoryName: string | null;
  region: string;
  district: string;
  experience: number;
  price: number;
  bio: string | null;
  services: string | null;
  status: 'pending' | 'approved' | 'declined';
  createdAt: string;
  extraPhone: string | null;
  priceComment: string | null;
  avatarUrl: string | null;
};
export type Tariff = {
  id: string;
  name: string;
  price: number;
  months: number;
  comment: string | null;
  createdAt: string;
};
export type Payment = {
  id: number;
  masterId: number;
  packageId: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  receiptText: string | null;
  proofImageUrl: string | null;
  createdAt: string;
};
export type PlatformSettings = {
  premiumMode: string;
  adminCard: string;
  adminCardHolder: string;
  totalUsers: number;
  logotypePath: string | null;
};
export type Ad = {
  id: string;
  title: string;
  discount: string;
  code: string;
  bgGradient: string;
  clicks: number;
  createdAt: string;
};
// A job posted by a construction company, shown under the "Korxona
// buyurtmalari" toggle in SearchTab. Deliberately has no status - the
// master just calls the phone number on the listing (backend/enterprise).
export type EnterpriseOrder = {
  id: string;
  companyName: string;
  title: string;
  description: string;
  image: string | null;
  phone: string;
  categoryId: string | null;
  categoryName: string | null;
  region: string;
  district: string;
  isActive: boolean;
  createdAt: string;
};
export type NewEnterpriseOrderInput = {
  companyName: string;
  title: string;
  description: string;
  image?: string | null;
  phone: string;
  categoryId?: string | null;
  region?: string;
  district?: string;
};
export type Client = {
  id: string;
  name: string;
  phone: string;
  isBlocked: boolean;
  createdAt: string;
  completedOrdersCount: number;
};
export type TicketMessage = { id: number; ticketId: string; sender: 'user' | 'admin'; text: string; createdAt: string };
export type Ticket = {
  id: number;
  userId: number;
  userName: string;
  userRole: string;
  status: 'open' | 'resolved';
  createdAt: string;
  updatedAt: string;
  messages: TicketMessage[];
};
export type AppNotification = {
  id: number;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
};
export type NotificationsResponse = { data: AppNotification[]; unreadCount: number };
export type ChatMessage = { id?: number; sender: 'client' | 'master'; text: string; time: string };
export type Conversation = {
  id: number;
  viewerRole: 'client' | 'master';
  partner: { id: number | string; name: string; avatar: string | null; phone: string; categoryId: string | null };
  messages: ChatMessage[];
  unreadCount: number;
  partnerUnreadCount: number;
};

export type Category = {
  id: string;
  name: string;
  color: string | null;
  image: string | null;
  sortOrder: number;
  isActive: boolean;
};
export type SmsTemplate = {
  key: string;
  label: string;
  body: string;
  isActive: boolean;
  updatedAt: string;
};
export type ErrorLogEntry = {
  id: number;
  level: string;
  message: string;
  source: string;
  url: string;
  createdAt: string;
};
export type AdminConversation = {
  id: number;
  client: { id: number; name: string; phone: string };
  master: { id: number; name: string; phone: string };
  clientUnreadCount: number;
  masterUnreadCount: number;
  createdAt: string;
  messages: ChatMessage[];
};
export type PushDevice = {
  id: number;
  userId: number;
  userName: string;
  userPhone: string;
  active: boolean;
  browser: string | null;
  dateCreated: string | null;
};

export interface NewOrderInput {
  title: string;
  categoryId: string;
  budget: number;
  region: string;
  district: string;
  desc?: string;
  masterId?: number;
}

export interface NewApplicationInput {
  firstName: string;
  lastName: string;
  phone: string;
  extraPhone?: string;
  categoryId: string;
  experience?: number;
  price?: number;
  priceComment?: string;
  bio?: string;
  services?: string;
  avatarUrl?: string;
  region: string;
  district: string;
}

export interface NewMasterInput {
  userId?: string;
  categoryId: string;
  name: string;
  phone: string;
  avatarUrl?: string;
  bio?: string;
  extraPhone?: string;
  telegram?: string;
  specialty?: string;
  priceComment?: string;
  services?: string;
  experience?: number;
  price?: number;
  region: string;
  district: string;
  verified?: boolean;
}

// Dedupes concurrent refresh attempts: if several requests 401 at once (e.g.
// several components fetching on mount right as the access token expires),
// only one POST /api/auth/refresh goes out - the refresh token is single-use
// (rotated server-side), so firing it more than once would just fail the
// second caller.
// An ORIGIN, never a full API URL: every caller appends /api itself, as in
// `${API_BASE}/api${path}`. A deploy that sets VITE_API_BASE_URL to
// "https://host/api" - the obvious thing to write - produced /api/api/... and
// a 404 on every request, so the trailing /api is stripped here rather than
// left to each caller to get right. Empty means same-origin.
export function normalizeApiBase(raw: string | undefined): string {
  return (raw || '').trim().replace(/\/+$/, '').replace(/\/api$/, '');
}

export const API_BASE = normalizeApiBase(import.meta.env.VITE_API_BASE_URL);

let refreshInFlight: Promise<boolean> | null = null;

function tryRefresh(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = fetch(`${API_BASE}/api/auth/refresh`, { method: 'POST', credentials: 'include' })
      .then(res => res.ok)
      .catch(() => false)
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

// fetch wrapper that transparently retries once after a silent access-token
// refresh on 401, so a short-lived access token expiring mid-session doesn't
// bounce the user - they only get signed out once the refresh token itself
// is invalid/expired (see api/auth/[action].ts "refresh").
export async function authFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const res = await fetch(input, { ...init, credentials: 'include' });
  if (res.status === 401 && !input.includes('/api/auth/')) {
    const refreshed = await tryRefresh();
    if (refreshed) return fetch(input, { ...init, credentials: 'include' });
    // Refresh itself returned 401 — tokens are stale/revoked.
    // Fire a custom event so AuthProvider can clear the profile immediately
    // without waiting for the next refreshProfile call.
    window.dispatchEvent(new Event('auth:expired'));
  }
  return res;
}

async function call<T>(path: string, options: RequestInit = {}): Promise<T> {
  return callWithRetry(path, options, 0);
}

async function callWithRetry<T>(path: string, options: RequestInit, attempt: number): Promise<T> {
  const res = await authFetch(`${API_BASE}/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const errMsg = body.error || '';
    // Retry once on DB connection failures (Neon cold-start / transient)
    if (
      attempt < 1 &&
      (errMsg.includes('Error connecting to database') || errMsg.includes('fetch failed'))
    ) {
      await new Promise(r => setTimeout(r, 1000));
      return callWithRetry(path, options, attempt + 1);
    }
    throw new Error(errMsg || `So'rov muvaffaqiyatsiz tugadi: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// Bound API client. Usage: const api = useApi(); await api.getOrders();
export function useApi() {
  return useMemo(
    () => ({
      getProfile: () => call<Profile>('/profile/'),
      updateProfile: (
        data: Partial<Pick<Profile, 'name' | 'role' | 'balance' | 'phone'>> & {
          currentPassword?: string;
          newPassword?: string;
        }
      ) => call<Profile>('/profile/', { method: 'PATCH', body: JSON.stringify(data) }),

      getOrders: () => call<Order[]>('/orders/'),
      createOrder: (data: NewOrderInput) => call<Order>('/orders/', { method: 'POST', body: JSON.stringify(data) }),
      updateOrder: (id: string, data: Partial<Pick<Order, 'status' | 'masterId' | 'masterHidden'>>) =>
        call<Order>(`/orders/?id=${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
      rateOrder: (id: string, data: { clientRating: number; clientReview?: string }) =>
        call<Order>(`/orders/?id=${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
      deleteOrder: (id: string) => call<void>(`/orders/?id=${id}`, { method: 'DELETE' }),

      getMasters: () => call<MastersResponse>('/masters/'),
      getMaster: (id: number) => call<Master>(`/masters/?id=${id}`),
      searchMasters: (params: {
        category?: string; region?: string; district?: string;
        q?: string; sortBy?: string; sortDir?: string;
        page?: number; limit?: number;
      }) => {
        const qs = new URLSearchParams();
        Object.entries(params).forEach(([k, v]) => {
          if (v !== undefined && v !== '' && v !== 'all') qs.set(k, String(v));
        });
        return call<MastersResponse>(`/masters/?${qs.toString()}`);
      },
      createMaster: (data: NewMasterInput) => call<Master>('/masters/', { method: 'POST', body: JSON.stringify(data) }),
      updateMaster: (id: number, data: Partial<Master>) =>
        call<Master>(`/masters/?id=${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
      deleteMaster: (id: number) => call<void>(`/masters/?id=${id}`, { method: 'DELETE' }),
      rateMaster: (id: number, score: number) =>
        call<Master>(`/masters/?id=${id}`, { method: 'PATCH', body: JSON.stringify({ addRating: score }) }),

      getApplications: () => call<Application[]>('/applications/'),
      createApplication: (data: NewApplicationInput) =>
        call<Application>('/applications/', { method: 'POST', body: JSON.stringify(data) }),
      reviewApplication: (id: number, status: 'approved' | 'declined') =>
        call<Application>(`/applications/?id=${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),

      getTariffs: () => call<Tariff[]>('/tariffs/'),
      createTariff: (data: Tariff) => call<Tariff>('/tariffs/', { method: 'POST', body: JSON.stringify(data) }),
      updateTariff: (id: string, data: Partial<Tariff>) =>
        call<Tariff>(`/tariffs/?id=${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
      deleteTariff: (id: string) => call<void>(`/tariffs/?id=${id}`, { method: 'DELETE' }),

      getPayments: () => call<Payment[]>('/payments/'),
      createPayment: (data: { packageId: string; amount: number; receiptText?: string; proofImageUrl?: string }) =>
        call<Payment>('/payments/', { method: 'POST', body: JSON.stringify(data) }),
      reviewPayment: (id: number, status: 'approved' | 'rejected') =>
        call<Payment>(`/payments/?id=${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),

      getSettings: () => call<PlatformSettings>('/settings/'),
      updateSettings: (data: Partial<Pick<PlatformSettings, 'adminCard' | 'adminCardHolder' | 'premiumMode' | 'totalUsers' | 'logotypePath'>>) =>
        call<PlatformSettings>('/settings/', { method: 'PATCH', body: JSON.stringify(data) }),
      getPublicSettings: () =>
        fetch(`${API_BASE}/api/settings/?public=1`).then(res => res.json()) as Promise<{ totalUsers: number; logotypePath: string | null; disableDevtools: boolean }>,

      getAnalytics: () => call<{ name: string; earnings: number; premium: number }[]>('/analytics/'),

      getClients: () => call<Client[]>('/clients/'),
      setClientBlocked: (id: string, isBlocked: boolean) =>
        call<Client>(`/clients/block/?id=${id}`, { method: 'PATCH', body: JSON.stringify({ isBlocked }) }),
      deleteClient: (id: string) => call<void>(`/clients/delete/?id=${id}`, { method: 'DELETE' }),

      getAds: () => call<Ad[]>('/ads/'),
      createAd: (data: { title: string; discount: string; code: string; bgGradient: string }) =>
        call<Ad>('/ads/', { method: 'POST', body: JSON.stringify(data) }),
      deleteAd: (id: string) => call<void>(`/ads/?id=${id}`, { method: 'DELETE' }),

      getEnterpriseOrders: (params: { category?: string; region?: string; district?: string; q?: string } = {}) => {
        const qs = new URLSearchParams();
        Object.entries(params).forEach(([k, v]) => {
          if (v !== undefined && v !== '' && v !== 'all') qs.set(k, String(v));
        });
        const query = qs.toString();
        return call<EnterpriseOrder[]>(`/enterprise-orders/${query ? `?${query}` : ''}`);
      },
      getEnterpriseOrdersAdmin: () => call<EnterpriseOrder[]>('/enterprise-orders/?all=1'),
      createEnterpriseOrder: (data: NewEnterpriseOrderInput) =>
        call<EnterpriseOrder>('/enterprise-orders/', { method: 'POST', body: JSON.stringify(data) }),
      updateEnterpriseOrder: (id: string, data: Partial<NewEnterpriseOrderInput> & { isActive?: boolean }) =>
        call<EnterpriseOrder>(`/enterprise-orders/?id=${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
      deleteEnterpriseOrder: (id: string) =>
        call<void>(`/enterprise-orders/?id=${id}`, { method: 'DELETE' }),

      getTickets: () => call<Ticket[]>('/tickets/'),
      replyTicket: (id: string, message: string) =>
        call<Ticket>(`/tickets/?id=${id}`, { method: 'PATCH', body: JSON.stringify({ message }) }),
      resolveTicket: (id: string) =>
        call<Ticket>(`/tickets/?id=${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'resolved' }) }),
      sendSupportMessage: (message: string) =>
        call<Ticket>('/tickets/', { method: 'POST', body: JSON.stringify({ message }) }),

      getApplicationStatus: () =>
        call<{ status: string | null; application: object | null }>('/applications/status/'),

      getConversations: () => call<Conversation[]>('/conversations/'),
      sendMessageToMaster: (masterId: number, text: string) =>
        call<{ conversationId: number; message: ChatMessage }>('/conversations/', { method: 'POST', body: JSON.stringify({ masterId, text }) }),
      sendMessageToClient: (clientId: string, text: string) =>
        call<{ conversationId: number; message: ChatMessage }>('/conversations/', { method: 'POST', body: JSON.stringify({ clientId, text }) }),
      markConversationRead: (id: number) =>
        call<void>(`/conversations/?id=${id}`, { method: 'PATCH', body: JSON.stringify({ read: true }) }),

      getNotifications: () => call<NotificationsResponse>('/notifications/'),
      markNotificationRead: (id: number) =>
        call<AppNotification>(`/notifications/?id=${id}`, { method: 'PATCH', body: JSON.stringify({ isRead: true }) }),
      markAllNotificationsRead: () =>
        call<{ updated: number }>('/notifications/', { method: 'PATCH', body: JSON.stringify({}) }),
      registerPushSubscription: (sub: { endpoint: string; p256dh: string; auth: string }) =>
        call<{ ok: boolean }>('/push/register/', { method: 'POST', body: JSON.stringify(sub) }),

      unregisterPushSubscription: (endpoint: string) =>
        call<{ ok: boolean }>('/push/unregister/', { method: 'POST', body: JSON.stringify({ endpoint }) }),

      sendPush: (target: { userId?: string | number; role?: 'client' | 'master' | 'all' }, title: string, body: string) =>
        call<{ ok: boolean; sent: number; targeted: number }>('/push/send/', {
          method: 'POST',
          body: JSON.stringify({ ...target, title, body }),
        }),
      getPushDevices: () =>
        call<{ totalActive: number; totalInactive: number; devices: PushDevice[] }>('/push/devices/'),

      getCategoriesAdmin: () => call<Category[]>('/categories/?all=1'),
      createCategory: (data: { id: string; name: string; color?: string; image?: string; sortOrder?: number }) =>
        call<Category>('/categories/', { method: 'POST', body: JSON.stringify(data) }),
      updateCategory: (id: string, data: Partial<Pick<Category, 'name' | 'color' | 'image' | 'sortOrder' | 'isActive'>>) =>
        call<Category>(`/categories/?id=${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
      deleteCategory: (id: string) => call<void>(`/categories/?id=${id}`, { method: 'DELETE' }),

      getSmsTemplates: () => call<SmsTemplate[]>('/sms-templates/'),
      updateSmsTemplate: (key: string, data: Partial<Pick<SmsTemplate, 'body' | 'isActive'>>) =>
        call<SmsTemplate>(`/sms-templates/${key}`, { method: 'PATCH', body: JSON.stringify(data) }),

      getErrorLogs: () => call<ErrorLogEntry[]>('/error-logs/'),

      getConversationsAdmin: () => call<AdminConversation[]>('/conversations/admin/'),
    }),
    []
  );
}
