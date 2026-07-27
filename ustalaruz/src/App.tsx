import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { API_BASE } from './lib/api';
import {
	LogOut,
	Home as HomeIcon,
	User as UserIcon,
	ArrowRight,
	ShieldCheck,
	Moon,
	Sun,
	Monitor,
} from 'lucide-react';

import UstaLogo from './components/UstaLogo';
import Notification, { NotificationType } from './components/Notification';
import NotificationBanner from './components/NotificationBanner';
import ConsentBanner from './components/ConsentBanner';
import DeveloperCredit from './components/DeveloperCredit';
import SessionExpiredPage from './components/SessionExpiredPage';
import OfflineBanner from './components/OfflineBanner';
import BackendStatusMarquee from './components/BackendStatusMarquee';
import ForbiddenPage from './components/ForbiddenPage';
import AmbientBackground from './components/AmbientBackground';
import SplashScreen from './components/SplashScreen';
import { usePushNotifications } from './lib/usePushNotifications';
import { useAuthSession } from './auth/AuthProvider';
import { useTheme } from './theme/ThemeProvider';
import { activateAntiDebug } from './lib/antiDebug';

// Sign-in and sign-up are one phone-first flow now (see AuthView), so
// /register is kept only as a redirect for old links/bookmarks.
const AuthView = lazy(() => import('./components/AuthView'));
const UstaApp = lazy(() => import('./components/UstaApp'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const PrivacyPolicy = lazy(() => import('./components/PrivacyPolicy'));
const Guide = lazy(() => import('./components/Guide'));
const NotFoundPage = lazy(() => import('./components/NotFoundPage'));
const StaffLogin = lazy(() => import('./components/StaffLogin'));

interface UserSession {
	phone: string;
	name: string;
	role: string;
	rating: number;
	balance: number;
}

function useWakeLock() {
	useEffect(() => {
		let wakeLock: WakeLockSentinel | null = null;
		const request = async () => {
			try {
				if ('wakeLock' in navigator) {
					wakeLock = await navigator.wakeLock.request('screen');
				}
			} catch (err) { console.debug('[App] WakeLock request failed:', err); }
		};
		const handleVisibility = () => {
			if (document.visibilityState === 'visible') request();
		};
		request();
		document.addEventListener('visibilitychange', handleVisibility);
		return () => {
			document.removeEventListener('visibilitychange', handleVisibility);
			wakeLock?.release();
		};
	}, []);
}

export default function App() {
	useWakeLock();
	const { isLoaded, isSignedIn, profile, logout } = useAuthSession();
	usePushNotifications(isSignedIn);
	const { isDarkMode, theme, cycleTheme } = useTheme();
	const location = useLocation();
	const navigate = useNavigate();

	const [customLogoUrl, setCustomLogoUrl] = useState<string | null>(
		() => localStorage.getItem('custom_usta_logo') || null
	);
	const [logoClicks, setLogoClicks] = useState<number[]>([]);
	const fileInputRef = useRef<HTMLInputElement>(null);

	// Listen for logo updates fired from AdminDashboard's fallback upload
	useEffect(() => {
		const handler = (e: Event) => {
			setCustomLogoUrl((e as CustomEvent).detail);
			localStorage.setItem('Usta_logo_version', String(Date.now()));
		};
		window.addEventListener('logo-updated', handler);
		return () => window.removeEventListener('logo-updated', handler);
	}, []);

	const [notification, setNotification] = useState<{
		message: string;
		type: NotificationType;
	} | null>(null);

	const [userCount, setUserCount] = useState<number | null>(null);
	const antiDebugCleanupRef = useRef<(() => void) | null>(null);

	useEffect(() => {
		const applySettings = (data: { totalUsers?: number; logotypePath?: string; disableDevtools?: boolean }) => {
			if (data.totalUsers) setUserCount(data.totalUsers);
			if (data.logotypePath) applyLogotype(data.logotypePath);
			if (data.disableDevtools) antiDebugCleanupRef.current = activateAntiDebug();
		};

		const CACHE_KEY = 'public_settings_cache';
		const CACHE_TTL = 300_000; // 5 min
		const cached = sessionStorage.getItem(CACHE_KEY);
		if (cached) {
			try {
				const { data, ts } = JSON.parse(cached);
				if (Date.now() - ts < CACHE_TTL) {
					applySettings(data);
					return;
				}
			} catch (err) { console.debug('[App] Stale cache parse failed:', err); }
		}
			fetch(`${API_BASE}/api/settings/?public=1`)
			.then((res) => res.json())
			.then((data) => {
				sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
				applySettings(data);
			})
			.catch((err) => console.debug('[App] Public settings fetch failed:', err));

		return () => antiDebugCleanupRef.current?.();
	}, []);

	function applyLogotype(path: string) {
		const old = localStorage.getItem('custom_usta_logo');
		if (old !== path) {
			localStorage.setItem('Usta_logo_version', String(Date.now()));
		}
		setCustomLogoUrl(path);
		localStorage.setItem('custom_usta_logo', path);
	}

	// Captured at the App root (not inside /app) so a desktop/Android visitor
	// browsing the public landing page before logging in doesn't miss the
	// one-shot beforeinstallprompt event by the time they reach UstaApp.
	const [pwaInstallPrompt, setPwaInstallPrompt] =
		useState<BeforeInstallPromptEvent | null>(null);
	const [showPwaBanner, setShowPwaBanner] = useState<boolean>(() => {
		if (
			window.matchMedia('(display-mode: standalone)').matches ||
			window.navigator.standalone
		) {
			return false;
		}
		if (localStorage.getItem('usta_pwa_installed') === 'true') {
			return false;
		}
		return sessionStorage.getItem('usta_pwa_banner_closed') !== 'true';
	});

	useEffect(() => {
		const handleBeforeInstallPrompt = (e: Event) => {
			e.preventDefault();
			setPwaInstallPrompt(e as BeforeInstallPromptEvent);
		};
		const handleAppInstalled = () => {
			setShowPwaBanner(false);
			sessionStorage.setItem('usta_pwa_banner_closed', 'true');
			window.localStorage.setItem('usta_pwa_installed', 'true');
		};
		window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
		window.addEventListener('appinstalled', handleAppInstalled);
		return () => {
			window.removeEventListener(
				'beforeinstallprompt',
				handleBeforeInstallPrompt
			);
			window.removeEventListener('appinstalled', handleAppInstalled);
		};
	}, []);

	// AuthProvider fires this when the refresh endpoint itself returns 401
	// (tokens stale/revoked) - tagged here so the bounce-to-login effect below
	// can tell "session actually expired mid-use" apart from "never signed
	// in" and show SessionExpiredPage instead of a bare login form.
	const sessionExpiredRef = useRef(false);
	useEffect(() => {
		const handler = () => { sessionExpiredRef.current = true; };
		window.addEventListener('auth:expired', handler);
		return () => window.removeEventListener('auth:expired', handler);
	}, []);

	// /app is the logged-in shell; bounce back to /login if the session isn't
	// (or is no longer) active, once we actually know (isLoaded).
	useEffect(() => {
		if (isLoaded && !isSignedIn && location.pathname.startsWith('/app')) {
			const next = encodeURIComponent(location.pathname + location.search);
			const expiredFlag = sessionExpiredRef.current ? '&expired=1' : '';
			sessionExpiredRef.current = false;
			navigate('/login?next=' + next + expiredFlag, { replace: true });
		}
	}, [isLoaded, isSignedIn, location.pathname, navigate]);

	// Conversely, an already-signed-in visitor has no reason to see the
	// login/register forms - send them straight into the app.
	useEffect(() => {
		if (
			isLoaded &&
			isSignedIn &&
			(location.pathname === '/login' || location.pathname === '/register')
		) {
			const params = new URLSearchParams(location.search);
			const next = params.get('next') || '/app';
			navigate(next, { replace: true });
		}
	}, [isLoaded, isSignedIn, location.pathname, navigate]);

	// Dynamic document title based on route
	useEffect(() => {
		const path = location.pathname;
		if (path === '/login') document.title = 'Master Group – Tizimga kirish';
		else if (path === '/privacy')
			document.title = 'Master Group – Maxfiylik siyosati';
		else if (path === '/guide')
			document.title = "Master Group – Qo'llanma";
		else if (path.startsWith('/app')) document.title = 'Master Group – Ilova';
		else
			document.title =
				'Master Group – Uyingiz uchun professional ustalarni toping';
	}, [location.pathname]);

	// SW version check — force reload if new version deployed. Doubles as the
	// backend-reachability probe: a normal 5min cadence while the backend
	// answers, dropping to a fast 10s retry (like the messages poll's own
	// backoff) the moment it doesn't, so BackendStatusMarquee below reacts
	// quickly instead of waiting up to 5 minutes to notice a recovery.
	const [backendUnreachable, setBackendUnreachable] = useState(false);

	// Tracked here (not just inside OfflineBanner) so the layout below knows
	// to reserve space for whichever fixed top banner is currently showing -
	// otherwise it sits on top of the sticky header instead of pushing it down.
	const [isOffline, setIsOffline] = useState(
		typeof navigator !== 'undefined' && !navigator.onLine
	);
	useEffect(() => {
		const goOffline = () => setIsOffline(true);
		const goOnline = () => setIsOffline(false);
		window.addEventListener('offline', goOffline);
		window.addEventListener('online', goOnline);
		return () => {
			window.removeEventListener('offline', goOffline);
			window.removeEventListener('online', goOnline);
		};
	}, []);
	const hasTopBanner = isOffline || backendUnreachable;

	const [backendVersion, setBackendVersion] = useState<string | null>(null);
	const [backendVersionDate, setBackendVersionDate] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;
		let timeoutId: ReturnType<typeof setTimeout> | null = null;

		async function checkVersion() {
			let ok = false;
			try {
				const res = await fetch(`${API_BASE}/api/version`, { cache: 'no-store' });
				if (!res.ok) throw new Error('bad status');
				ok = true;
				const data = await res.json();
				const version = data.version || __APP_VERSION__;
				if (!cancelled) {
					setBackendVersion(version);
					setBackendVersionDate(data.date || null);
				}
				const stored = localStorage.getItem('usta_sw_version');
				if (stored && stored !== version && !cancelled) {
					console.log('[App] New version detected:', version, '(was:', stored, ')');
					localStorage.setItem('usta_sw_version', version);
					if (navigator.serviceWorker.controller) {
						navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
					}
					navigator.serviceWorker.ready.then((reg) => reg.update());
					setTimeout(() => window.location.reload(), 500);
				} else if (!stored) {
					localStorage.setItem('usta_sw_version', version);
				}
			} catch (err) {
				console.log('[App] Version check failed:', err);
			}
			if (cancelled) return;
			setBackendUnreachable(!ok);
			timeoutId = setTimeout(checkVersion, ok ? 5 * 60 * 1000 : 10 * 1000);
		}
		checkVersion();
		return () => {
			cancelled = true;
			if (timeoutId) clearTimeout(timeoutId);
		};
	}, []);

	// Expose admin panel opener globally so Playwright tests can show it
	// without the 5-click Easter egg.
	useEffect(() => {
		window.__openAdminPanel = () => {
			if (profile?.isAdmin) {
				navigate('/app/admin');
				showToast("Tizimga ma'mur sifatida kirdingiz!", 'success');
			}
		};
		return () => {
			delete window.__openAdminPanel;
		};
	}, [profile]);

	// Handle 5 clicks on the logo to reveal the admin panel (client-side gate
	// only — every admin API request is independently re-verified server-side
	// via profiles.isAdmin, see api/_lib/auth.ts).
	const handleLogoClick = (e: React.MouseEvent) => {
		e.stopPropagation();
		const now = Date.now();
		// Functional update so rapid clicks (each its own event, but potentially
		// batched by React before a re-render lands) always read the true latest
		// click list instead of a closure captured at the last render - with the
		// previous direct `setLogoClicks(newClicks)` form, clicks landing before
		// a re-render flushed all computed `newClicks` from the same stale
		// `logoClicks`, so the count could never actually reach 5.
		let reachedThreshold = false;
		setLogoClicks((prev) => {
			const next = [...prev.filter((t) => now - t < 3000), now];
			if (next.length >= 5) {
				reachedThreshold = true;
				return [];
			}
			return next;
		});
		if (reachedThreshold) {
			if (profile?.isAdmin) {
				navigate('/app/admin');
				showToast("Tizimga ma'mur sifatida kirdingiz!", 'success');
			} else {
				showToast(
					"Bu bo'lim faqat administratorlar uchun mo'ljallangan.",
					'error'
				);
			}
		}
	};

	// Trigger toast feedback
	const showToast = (message: string, type: NotificationType = 'success') => {
		setNotification({ message, type });
	};

	// manifest.json declares share_target (OS share sheet -> "/") and a
	// web+usta: protocol_handler (-> "/?handler=<uri>"), but nothing read
	// those query params, so a share or a deep link landed here silently
	// dropped. Surface it as a toast and strip the params so a refresh
	// doesn't replay it.
	useEffect(() => {
		if (location.pathname !== '/' || !location.search) return;
		const params = new URLSearchParams(location.search);
		const sharedTitle = params.get('name');
		const sharedText = params.get('description');
		const sharedLink = params.get('link');
		const handlerUri = params.get('handler');

		if (sharedTitle || sharedText || sharedLink) {
			showToast(
				['Ulashildi:', sharedTitle, sharedText, sharedLink]
					.filter(Boolean)
					.join(' '),
				'info'
			);
			navigate('/', { replace: true });
		} else if (handlerUri) {
			const path = handlerUri.replace(/^web\+usta:\/{0,2}/, '/');
			navigate(path.startsWith('/') ? path : '/app', { replace: true });
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [location.pathname, location.search]);

	// AuthView performs the actual auth call itself and only reaches here
	// after the session is already active - for both the sign-in and the
	// account-created branch.
	const handleLoginSuccess = (message: string) => {
		showToast(message, 'success');
		setTimeout(() => navigate('/app'), 500);
	};

	const handleFormError = (message: string) => {
		showToast(message, 'error');
	};

	const handleLogout = async () => {
		await logout();
		navigate('/login');
		showToast('Tizimdan muvaffaqiyatli chiqdingiz.', 'info');
	};

	// Handle Logo Upload and Custom Logo Reset
	const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		if (file.size > 5 * 1024 * 1024) {
			showToast('Rasm hajmi juda katta! 5MB dan kichik rasm yuklang.', 'error');
			return;
		}

		const reader = new FileReader();
		reader.onload = () => {
			const resultStr = reader.result as string;
			localStorage.setItem('custom_usta_logo', resultStr);
			localStorage.setItem('Usta_logo_version', String(Date.now()));
			setCustomLogoUrl(resultStr);
			showToast("Logotip muvaffaqiyatli o'zgartirildi!", 'success');
		};
		reader.onerror = () => {
			showToast('Faylni yuklashda xatolik yuz berdi.', 'error');
		};
		reader.readAsDataURL(file);
	};

	const handleResetLogo = () => {
		localStorage.removeItem('custom_usta_logo');
		localStorage.setItem('Usta_logo_version', String(Date.now()));
		setCustomLogoUrl(null);
		showToast('Logotip asliga qaytarildi.', 'success');
	};

	const isAppRoute = location.pathname.startsWith('/app');
	const isHomeRoute = location.pathname === '/';
	const isHomeTab = location.pathname === '/';
	const isProfileTab =
		location.pathname === '/login' ||
		location.pathname === '/register' ||
		isAppRoute;
	const isSessionExpired =
		location.pathname === '/login' &&
		new URLSearchParams(location.search).get('expired') === '1';

	// Admin panel is a routed sub-section of /app (/app/admin/:adminTab?)
	// rather than boolean modal state, so a specific admin tab is a real,
	// shareable/refreshable/back-button-able URL instead of resetting to
	// "analytics" on every reopen.
	const isAdminRoute =
		location.pathname === '/app/admin' || location.pathname.startsWith('/app/admin/');
	const adminTabFromUrl = isAdminRoute
		? location.pathname.replace(/^\/app\/admin\/?/, '').split('/')[0] || undefined
		: undefined;

	const userSessionForApp: UserSession | null =
		profile && isSignedIn
			? {
					phone: profile.phone,
					name: profile.name,
					role: profile.role,
					rating: 5.0, // refined once masters wiring (own listing) lands
					balance: profile.balance,
				}
			: null;

	if (!isLoaded) {
		return <SplashScreen />;
	}

	return (
		<div
			className={`relative w-full flex flex-col justify-between overflow-x-hidden font-sans text-text-primary ${
				isHomeRoute ? 'bg-surface' : 'bg-white dark:bg-surface'
			} ${isAppRoute ? 'h-dvh' : 'min-h-screen'} ${hasTopBanner ? 'pt-8' : ''}`}
		>
			<OfflineBanner />
			{backendUnreachable && <BackendStatusMarquee />}

			{/* Skip to content link for keyboard/screen reader users */}
			<a
				href="#main-content"
				className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-brand focus:text-white focus:rounded-xl focus:text-sm focus:font-bold focus:outline-none focus:ring-2 focus:ring-white"
			>
				Asosiy qismga o'tish
			</a>

			{/* Premium subtle light grid background decoration */}
			<div
				className={`absolute inset-0 pointer-events-none z-0 ${
					isHomeRoute ? 'opacity-20' : 'opacity-40'
				}`}
				style={{
					backgroundImage: isHomeRoute
						? 'radial-gradient(#475569 1.2px, transparent 1.2px)'
						: 'radial-gradient(#e2e8f0 1.2px, transparent 1.2px)',
					backgroundSize: '24px 24px',
				}}
			/>

			{/* Desktopda app to'liq ekran ko'rinishida */}

			{/* Modern sticky top header (Navbar) for the Website */}
			{!isAppRoute && (
				<header
					className={`sticky top-0 z-30 w-full ${
						isHomeRoute
							? 'bg-surface border-b border-border'
							: 'bg-white dark:bg-surface border-b border-slate-100 dark:border-border'
					} shadow-[0_1px_3px_rgba(0,0,0,0.01)] backdrop-blur-md`}
				>
					<div className="max-w-6xl mx-auto px-4 h-16 sm:px-6 flex items-center justify-between relative z-10">
						{/* Logo + Brand */}
						<div
							role="link"
							tabIndex={0}
							className="flex items-center gap-2.5 cursor-pointer select-none group"
							onClick={() => navigate('/')}
							onKeyDown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									e.preventDefault();
									navigate('/');
								}
							}}
						>
							<UstaLogo
								size={36}
								interactive={true}
								customUrl={customLogoUrl}
								onClick={handleLogoClick}
							/>
							<div>
								<span className="text-base font-extrabold text-brand-fg tracking-tight leading-none group-hover:text-brand-hover transition-colors">
									Master Group
								</span>
								<p className="text-xs text-text-secondary font-bold tracking-wide mt-0.5 uppercase">
									Platformasi
								</p>
							</div>
						</div>

						{/* Right side Actions */}
						<div className="flex items-center gap-2">
							<button
								onClick={cycleTheme}
								className="p-2.5 rounded-xl text-text-secondary hover:text-text-primary hover:bg-slate-100 dark:hover:bg-surface-secondary transition-all cursor-pointer"
								aria-label={
									theme === 'light'
										? 'Tungi rejim'
										: theme === 'dark'
											? 'Tizim rejimi'
											: 'Kunduzgi rejim'
								}
							>
								{theme === 'light' ? (
									<Moon size={18} />
								) : theme === 'dark' ? (
									<Sun size={18} />
								) : (
									<Monitor size={18} />
								)}
							</button>
							{isSignedIn ? (
								<div
									className={`flex items-center gap-3 ${
										isHomeRoute
											? 'bg-surface-secondary border-border'
											: 'bg-slate-50/80 dark:bg-surface-secondary border-slate-100 dark:border-border'
									} pl-3 pr-2 py-1 rounded-xl border`}
								>
									<div className="flex flex-col items-end hidden md:flex">
										<span className="text-xs font-extrabold text-text-primary leading-none">
											{profile?.name}
										</span>
										<span className="text-sm font-bold text-text-secondary mt-0.5">
											{profile?.role?.split(' • ')[1] ?? ''}
										</span>
									</div>
									<div className="w-8 h-8 rounded-lg bg-brand text-white flex items-center justify-center font-bold text-xs select-none shadow-sm">
										{profile?.name
											?.split(' ')
											.map((n) => n[0])
											.join('')}
									</div>
									<button
										onClick={handleLogout}
										className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
										aria-label="Chiqish"
									>
										<LogOut size={16} />
									</button>
								</div>
							) : (
								location.pathname !== '/login' && (
									<button
										onClick={() => navigate('/login')}
										className="bg-brand hover:bg-brand-hover text-white px-5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-sm shadow-brand/15"
									>
										Kirish
									</button>
								)
							)}
						</div>
					</div>
				</header>
			)}

			{/* Main content wrapper */}
			<main
				id="main-content"
				aria-label={isAppRoute ? 'Ilova asosiy qismi' : 'Bosh sahifa'}
				className={
					isAppRoute
						? 'flex-1 w-full flex flex-col z-10 relative overflow-hidden'
						: 'flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 md:py-16 pb-20 flex flex-col items-center justify-center z-10 relative'
				}
			>
				<Suspense
					fallback={
						<div className="flex-1 w-full flex items-center justify-center">
							<div className="w-8 h-8 border-2 border-border border-t-brand rounded-full animate-spin" />
						</div>
					}
				>
					<AnimatePresence mode="wait">
						<Routes location={location}>
							{/* Bosh sahifa */}
							<Route
								path="/"
								element={
									<motion.div
										key="home-screen"
										initial={{ opacity: 0, y: 10 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, y: -10 }}
										transition={{ duration: 0.22 }}
										className="w-full relative"
									>
										<AmbientBackground />
										<div className="relative z-10 max-w-2xl mx-auto text-center">
											{userCount !== null && (
													<div className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 px-3 py-0.5 sm:px-3.5 sm:py-1 rounded-full text-sm sm:text-xs font-bold border border-emerald-100 dark:border-emerald-900/50 mb-4 sm:mb-5 shadow-sm">
														<span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
														{userCount.toLocaleString('uz-UZ')} ta faol
														foydalanuvchilar
													</div>
												)}
												<h1
													className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-brand tracking-tight leading-[1.05] px-2 sm:px-0"
													style={{ textWrap: 'balance' }}
												>
													Uyingiz uchun professional ustalarni toping
												</h1>
												<p className="mt-4 sm:mt-5 text-base sm:text-lg text-text-secondary max-w-xl mx-auto leading-relaxed px-2 sm:px-0">
													Santexnikdan quruvchigacha — tekshirilgan, mahalliy
													ustalarni bir necha daqiqada toping va ishni ishonch
													bilan yakunlang.
												</p>

												<div className="mt-7 sm:mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5 px-4 sm:px-0">
													{isSignedIn ? (
														<button
															onClick={() => navigate('/app')}
															className="w-full sm:w-auto bg-brand hover:bg-brand-hover text-white py-3 sm:py-3.5 px-6 sm:px-8 rounded-xl font-bold text-sm sm:text-base shadow-md shadow-brand/10 hover:shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 group cursor-pointer"
														>
															Ilovaga o'tish
															<ArrowRight
																size={16}
																className="transition-transform group-hover:translate-x-1"
															/>
														</button>
													) : (
														// Sign-in and sign-up are the same phone-first flow now,
														// so two side-by-side CTAs pointing at one screen would
														// just be a fake choice.
														<button
															onClick={() => navigate('/login')}
															className="w-full sm:w-auto bg-brand hover:bg-brand-hover text-white py-3 sm:py-3.5 px-6 sm:px-8 rounded-xl font-bold text-sm sm:text-base shadow-md shadow-brand/10 hover:shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 group cursor-pointer"
														>
															Platformaga kirish
															<ArrowRight
																size={16}
																className="transition-transform group-hover:translate-x-1"
															/>
														</button>
													)}
												</div>

												<div className="mt-6 inline-flex items-center gap-2 text-xs font-bold text-text-secondary">
													<ShieldCheck size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
													Barcha ustalar hujjat va tajribasi bo'yicha tekshirilgan
												</div>

												<div className="mt-6 flex items-center justify-center gap-4 text-text-secondary">
													<button
														onClick={() => navigate('/privacy')}
														className="hover:text-brand transition-colors cursor-pointer"
													>
														Maxfiylik siyosati
													</button>
													<span className="w-1 h-1 rounded-full bg-slate-300" />
													<button
														onClick={() => navigate('/guide')}
														className="hover:text-brand transition-colors cursor-pointer"
													>
														Qo'llanma
													</button>
													<span className="w-1 h-1 rounded-full bg-slate-300" />
													<a
														href="mailto:info@ustalar.uz"
														className="hover:text-brand transition-colors"
													>
														Bog'lanish
													</a>
												</div>
										</div>
									</motion.div>
								}
							/>

							{/* Tizimga kirish */}
							<Route
								path="/login"
								element={
									<motion.div
										key="login-screen"
										initial={{ opacity: 0, y: 10 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, y: -10 }}
										transition={{ duration: 0.22 }}
										className="w-full max-w-md flex flex-col items-center relative"
									>
										<AmbientBackground />
										{isSessionExpired ? (
											<div className="relative z-10 w-full">
											<SessionExpiredPage
												onContinue={() => {
													const params = new URLSearchParams(location.search);
													params.delete('expired');
													const qs = params.toString();
													navigate(`/login${qs ? '?' + qs : ''}`, { replace: true });
												}}
											/>
											</div>
										) : (
											<div className="relative z-10 w-full bg-white dark:bg-surface border border-slate-200 dark:border-border rounded-xl p-5 sm:p-8 shadow-auth-card flex flex-col items-center">
												<div className="flex flex-col items-center justify-center mb-4 sm:mb-5">
													<UstaLogo
														size={76}
														customUrl={customLogoUrl}
														onClick={handleLogoClick}
													/>
												</div>

												<AuthView
													onSuccess={handleLoginSuccess}
													onError={handleFormError}
												/>
											</div>
										)}
									</motion.div>
								}
							/>

							{/* Xodimlar uchun parol bilan kirish. Ataylab hech qayerdan
							    havola qilinmagan - SMS yetib kelmasa admin qolib ketmasligi
							    uchun zaxira yo'l. */}
							<Route
								path="/staff-login"
								element={
									<div className="w-full max-w-md flex flex-col items-center relative">
										<AmbientBackground />
										<div className="relative z-10 w-full bg-white dark:bg-surface border border-slate-200 dark:border-border rounded-xl p-5 sm:p-8 shadow-auth-card">
											<StaffLogin
												onSuccess={(m) => showToast(m, 'success')}
												onError={handleFormError}
											/>
										</div>
									</div>
								}
							/>

							{/* Ro'yxatdan o'tish - endi /login bilan bitta oqim */}
							<Route path="/register" element={<Navigate to="/login" replace />} />

						{/* Maxfiylik siyosati */}
						<Route
							path="/privacy"
							element={
								<motion.div
									key="privacy-screen"
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: -10 }}
									transition={{ duration: 0.22 }}
									className="w-full"
								>
									<PrivacyPolicy />
								</motion.div>
							}
						/>

						{/* Foydalanish qo'llanmasi */}
						<Route
							path="/guide"
							element={
								<motion.div
									key="guide-screen"
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: -10 }}
									transition={{ duration: 0.22 }}
									className="w-full"
								>
									<Guide />
								</motion.div>
							}
						/>

						{/* Premium Usta mobile app experience (protected) */}
						<Route
								path="/app/:tab?"
								element={
									isSignedIn ? (
										<motion.div
											key="app-screen"
											initial={{ opacity: 0, scale: 0.98 }}
											animate={{ opacity: 1, scale: 1 }}
											exit={{ opacity: 0, scale: 0.98 }}
											transition={{ duration: 0.22 }}
											className="w-full flex-1 flex flex-col overflow-hidden"
										>
											<UstaApp
												userSession={userSessionForApp}
												onLogout={handleLogout}
												onAdminOpen={
													profile?.isAdmin
														? () => navigate('/app/admin')
														: undefined
												}
												customLogoUrl={customLogoUrl}
												onLogoClick={handleLogoClick}
												pwaInstallPrompt={pwaInstallPrompt}
												setPwaInstallPrompt={setPwaInstallPrompt}
												showPwaBanner={showPwaBanner}
												setShowPwaBanner={setShowPwaBanner}
											/>
										</motion.div>
									) : null
								}
							/>

							{/* Admin panel content is rendered by the fixed overlay below (see
							    isAdminRoute), not inside <Routes> - this route just claims the
							    /app/admin/* path space so a sub-page like /app/admin/masters
							    matches here instead of falling through to the 404 catch-all
							    (a splat is needed since /app/:tab? above only covers exactly
							    one segment past /app). */}
							<Route path="/app/admin/*" element={null} />

							{/* Noma'lum manzillar */}
							<Route
								path="*"
								element={
									<motion.div
										key="not-found-screen"
										initial={{ opacity: 0, y: 10 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, y: -10 }}
										transition={{ duration: 0.22 }}
										className="w-full flex flex-col items-center"
									>
										<NotFoundPage />
									</motion.div>
								}
							/>
						</Routes>
					</AnimatePresence>
				</Suspense>
			</main>

			{/* Site version footer - client build tied to git SHA at compile time
			    (vite.config.ts), server build read live from the deployed repo's
			    HEAD (/api/version) - so a redeploy shows up here with no manual
			    version bump on either side. */}
			{!isAppRoute && (
				<footer className="relative z-10 w-full py-4 text-center text-[11px] text-text-muted font-mono">
					<div>
						Master Group v{__APP_VERSION__}
						{__APP_VERSION_DATE__ && ` (${__APP_VERSION_DATE__})`}
						{backendVersion && ` · server v${backendVersion}`}
						{backendVersionDate && ` (${backendVersionDate})`}
					</div>
					<DeveloperCredit className="mt-1 block" />
				</footer>
			)}

			{/* Floating Bottom Navigation Bar - not on the marketing landing page
			    itself (isHomeRoute), the header's "Ilovaga o'tish" CTA already
			    covers that entry point without a second, redundant nav. */}
			{isSignedIn && !isAppRoute && !isHomeRoute && (
				<nav
					aria-label="Asosiy navigatsiya"
					className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-white/95 dark:bg-surface/95 backdrop-blur-md border border-slate-200/80 dark:border-border rounded-2xl py-2 px-3.5 shadow-[0_12px_30px_rgba(0,0,0,0.08)] flex items-center gap-1.5"
				>
					<button
						onClick={() => navigate('/')}
						className={`px-4 py-2 rounded-xl flex items-center gap-2 cursor-pointer text-xs font-bold transition-all duration-150 ${
							isHomeTab
								? 'text-white bg-brand shadow-sm'
								: 'text-text-secondary hover:text-text-primary'
						}`}
						aria-current={isHomeTab ? 'page' : undefined}
					>
						<HomeIcon size={16} strokeWidth={isHomeTab ? 2.5 : 2} />
						<span>Bosh sahifa</span>
					</button>
					<button
						onClick={() => navigate(isSignedIn ? '/app' : '/login')}
						className={`px-4 py-2 rounded-xl flex items-center gap-2 cursor-pointer text-xs font-bold transition-all duration-150 ${
							isProfileTab
								? 'text-white bg-brand shadow-sm'
								: 'text-text-secondary hover:text-text-primary'
						}`}
						aria-current={isProfileTab ? 'page' : undefined}
					>
						<UserIcon size={16} strokeWidth={isProfileTab ? 2.5 : 2} />
						<span>Profil</span>
					</button>
				</nav>
			)}

			{/* Admin Logo Panel Modal / Full-Screen PC Dashboard - routed at
			    /app/admin/:adminTab? rather than boolean modal state (see
			    isAdminRoute/adminTabFromUrl above). */}
			<AnimatePresence>
				{isAdminRoute && isSignedIn && (
					<motion.div
						initial={{ opacity: 0, scale: 0.99 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.99 }}
						transition={{ duration: 0.2 }}
						className="fixed inset-0 z-50 overflow-hidden bg-slate-50 flex flex-col"
					>
						{profile?.isAdmin ? (
							<Suspense
								fallback={
									<div className="flex-1 w-full flex items-center justify-center">
										<div className="w-8 h-8 border-2 border-border border-t-brand rounded-full animate-spin" />
									</div>
								}
							>
								<input
									type="file"
									ref={fileInputRef}
									onChange={handleLogoUpload}
									accept="image/*"
									className="hidden"
								/>
								<AdminDashboard
									activeTab={adminTabFromUrl}
									onTabChange={(tab) => navigate(`/app/admin/${tab}`)}
									onClose={() => navigate('/app')}
									customLogoUrl={customLogoUrl}
									fileInputRef={fileInputRef}
									handleResetLogo={handleResetLogo}
									showToast={(msg, type) =>
										showToast(
											msg,
											type === 'info'
												? 'info'
												: type === 'error'
													? 'error'
													: 'success'
										)
									}
								/>
							</Suspense>
						) : (
							<div className="flex-1 w-full flex items-center justify-center p-4">
								<ForbiddenPage message="Boshqaruv paneli faqat administratorlar uchun." />
							</div>
						)}
					</motion.div>
				)}
			</AnimatePresence>

			{/* Notification Toast System */}
			<AnimatePresence>
				{notification && (
					<Notification
						message={notification.message}
						type={notification.type}
						onClose={() => setNotification(null)}
					/>
				)}
			</AnimatePresence>

			{isAppRoute && isSignedIn && <NotificationBanner />}

			{/* Cookie/analytics consent - every route, including the landing
			    page, since the tag is gated on it. */}
			<ConsentBanner />
		</div>
	);
}
