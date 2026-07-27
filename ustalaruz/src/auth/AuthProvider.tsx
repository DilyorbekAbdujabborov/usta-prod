import React, {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
} from 'react';
import { authFetch, type Profile } from '../lib/api';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

interface AuthContextValue {
	profile: Profile | null;
	isLoaded: boolean;
	isSignedIn: boolean;
	startPhoneAuth: (phone: string) => Promise<{ accountExists: boolean }>;
	verifyPhoneAuth: (
		phone: string,
		code: string,
		name?: string
	) => Promise<{ user: Profile; isNewAccount: boolean }>;
	logout: () => Promise<void>;
	refreshProfile: () => Promise<void>;
	setProfile: (profile: Profile) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function authRequest<T>(path: string, body?: unknown): Promise<T> {
	const res = await fetch(`${API_BASE}/api${path}`, {
		method: 'POST',
		credentials: 'include',
		headers: { 'Content-Type': 'application/json' },
		body: body ? JSON.stringify(body) : undefined,
	});
	if (!res.ok) {
		const data = await res.json().catch(() => ({}));
		throw new Error(data.error || "So'rov muvaffaqiyatsiz tugadi");
	}
	if (res.status === 204) return undefined as T;
	return res.json();
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [profile, setProfile] = useState<Profile | null>(null);
	const [isLoaded, setIsLoaded] = useState(false);

	const refreshProfile = useCallback(async () => {
		// Skip the API call if we know there are no auth cookies (never logged in
		// or explicitly logged out).  A localStorage flag is set on login and
		// cleared on logout — not authoritative (server-side expiry can make it
		// stale), but avoids a pointless round-trip for every anonymous visitor.
		if (localStorage.getItem('Usta_has_session') !== 'true') {
			setIsLoaded(true);
			return;
		}
		try {
			const res = await authFetch(`${API_BASE}/api/profile/`, {
				credentials: 'include',
			});
			setProfile(res.ok ? await res.json() : null);
		} catch (err) {
			console.debug('[Auth] Profile refresh failed:', err);
			setProfile(null);
		} finally {
			setIsLoaded(true);
		}
	}, []);

	useEffect(() => {
		refreshProfile();
	}, [refreshProfile]);

	// Listen for auth:expired events fired by api.ts when the refresh endpoint
	// itself returns 401 (tokens are stale/revoked).  Clears the profile
	// immediately so the UI flips to the unauthenticated state without waiting
	// for the next refreshProfile cycle.
	useEffect(() => {
		const handler = () => {
			setProfile(null);
			localStorage.removeItem('Usta_has_session');
		};
		window.addEventListener('auth:expired', handler);
		return () => window.removeEventListener('auth:expired', handler);
	}, []);

	// Sign-in and sign-up are one phone-first flow (see AuthView): the SMS code
	// IS the credential, so there is no password login, registration or reset
	// path on the client any more. The /auth/login, /auth/register-* and
	// /auth/reset-* endpoints still exist server-side for legacy accounts.
	//
	// Step 1 of the phone-first flow: always sends a code, and tells the UI
	// which branch to render next (OTP straight to sign-in, or OTP followed
	// by the complete-profile step).
	const startPhoneAuth = useCallback(async (phone: string) => {
		return authRequest<{ accountExists: boolean }>('/auth/phone-start', { phone });
	}, []);

	// Step 2. `name` is only sent on the create-account branch; the server
	// answers 400 + needsProfile if it turns out to be required and missing,
	// which the caller turns into the profile step rather than an error.
	const verifyPhoneAuth = useCallback(
		async (phone: string, code: string, name?: string) => {
			const res = await fetch(`${API_BASE}/api/auth/phone-verify`, {
				method: 'POST',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ phone, code, ...(name ? { name } : {}) }),
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok) {
				const err = new Error(data.error || "So'rov muvaffaqiyatsiz tugadi") as Error & {
					needsProfile?: boolean;
				};
				err.needsProfile = data.needsProfile === true;
				throw err;
			}
			setProfile(data.user);
			localStorage.setItem('Usta_has_session', 'true');
			return { user: data.user as Profile, isNewAccount: data.isNewAccount === true };
		},
		[]
	);

	const logout = useCallback(async () => {
		await authRequest('/auth/logout');
		setProfile(null);
		localStorage.removeItem('Usta_has_session');
	}, []);

	return (
		<AuthContext.Provider
			value={{
				profile,
				isLoaded,
				isSignedIn: !!profile,
				startPhoneAuth,
				verifyPhoneAuth,
				logout,
				refreshProfile,
				setProfile,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuthSession(): AuthContextValue {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error('useAuthSession must be used within AuthProvider');
	return ctx;
}
