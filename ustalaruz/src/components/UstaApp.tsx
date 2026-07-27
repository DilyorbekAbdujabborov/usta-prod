import React, { useState, useEffect, useRef, useCallback, useMemo, Suspense } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
	Home,
	MapPin,
	Search,
	Mic,
	Calendar,
	Plus,
	Award,
	TrendingUp,
	Heart,
	ChevronRight,
	ChevronDown,
	Sparkles,
	RefreshCw,
	Bell,
	BellOff,
	CheckCircle2,
	Phone,
	MessageSquare,
	Wrench,
	Grid,
	Layers,
	Trash2,
	Upload,
	User,
	LogOut,
	SlidersHorizontal,
	ThumbsUp,
	Clock,
	Copy,
	Send,
	X,
	CreditCard,
	Briefcase,
	PlusCircle,
	HelpCircle,
	Moon,
	Sun,
	Map,
	Shield,
	Activity,
	Monitor,
	ChevronLeft,
	Paperclip,
	CheckCheck,
	Check,
	Pencil,
	Trophy,
	AlertTriangle,
	Smartphone,
	XCircle,
	UserCheck,
	Download,
	LayoutDashboard,
	ClipboardList,
	Image,
	Settings,
	Save,
	BadgeCheck,
	Star,
	Camera,
} from 'lucide-react';

import { useAuthSession } from '../auth/AuthProvider';
import { useTheme } from '../theme/ThemeProvider';
import { REGION_DATA } from '../lib/regions';
import { CATEGORIES, type CategoryItem } from '../lib/categories';
import { store } from './UstaApp.store';

const CreateTab = React.lazy(() => import('./tabs/CreateTab'));
const MessagesTab = React.lazy(() => import('./tabs/MessagesTab'));
const SearchTab = React.lazy(() => import('./tabs/SearchTab'));
const OrdersTab = React.lazy(() => import('./tabs/OrdersTab'));
const HomeTab = React.lazy(() => import('./tabs/HomeTab'));
const WorkspaceTab = React.lazy(() => import('./tabs/WorkspaceTab'));
const ProfileTab = React.lazy(() => import('./tabs/ProfileTab'));
import CustomSelect from './CustomSelect';

// Preload ALL tab chunks at module init so none ever show a Suspense fallback.
// Without this, React.lazy only starts loading each chunk on first render,
// causing a flash of "Yuklanmoqda..." on slow connections when switching tabs.
void import('./tabs/CreateTab');
void import('./tabs/MessagesTab');
void import('./tabs/SearchTab');
void import('./tabs/OrdersTab');
void import('./tabs/HomeTab');
void import('./tabs/WorkspaceTab');
void import('./tabs/ProfileTab');
import {
	useApi,
	type Master as DbMaster,
	type Order as DbOrder,
	type Payment,
	type Tariff,
	type Conversation,
	type Ticket,
	type Ad,
	type EnterpriseOrder,
	type AppNotification as BackendNotification,
} from '../lib/api';
import { uploadImageFile } from '../lib/uploadImage';
import { responsiveCategoryImgProps } from '../lib/imgResponsive';
import UstaLogo from './UstaLogo';
import ForbiddenPage from './ForbiddenPage';
import ChatOverlay from './ChatOverlay';
import SupportChat from './SupportChat';
import {
	usePartnershipState,
	useWorkspaceState,
	usePaymentState,
	useEditProfileState,
} from './UstaApp.state';
import type {
	PartnershipState,
	WorkspaceState,
	PaymentState,
	EditProfileState,
} from './UstaApp.state';

// Region and district database
// Interactive category layout with representative icon and customized colors

// Rich data model for Master (Usta) profiles
interface Master {
	id: number;
	name: string;
	category: string;
	categoryId: string;
	rating: number;
	reviewsCount: number;
	completedJobs: number;
	experience: number; // in years
	distance: number; // in km
	isOnline: boolean;
	responseTime: string;
	startPrice: number; // UZS
	avatar: string;
	isVerified: boolean;
	phone: string;
	about: string;
	region: string;
	district: string;
	lat: number;
	lng: number;
	reviews?: {
		id: string;
		author: string;
		rating: number;
		text: string;
		date: string;
	}[];
	workHours?: string;
	offDays?: string[];
	restDays?: string;
	isActive?: boolean;
	extraPhone?: string;
	telegram?: string;
	specialty?: string;
	priceComment?: string;
	services?: string;
	premiumUntil?: string | Date | null;
	monthlyEarnings: number;
}

// Header/list display shape for the active chat partner - a Master (client
// chatting with a master) or a client profile (master chatting with a client,
// see api/conversations.ts). id is a masters.id (number) or a profiles.id (string).
type ChatPartner = {
	id: number | string;
	name: string;
	avatar: string;
	phone: string;
};

// A "received order" (master's queue) view of a real DB order row - see dbOrderToMasterReceived.
interface MasterReceivedOrder {
	id: string;
	title: string;
	clientName: string;
	clientPhone: string;
	budget: number; // in UZS numeric format
	date: string;
	status: 'pending' | 'active' | 'completed' | 'cancelled' | 'postponed';
	desc: string;
	region: string;
	district: string;
	clientOrderId: string;
	masterId: number | null;
	clientId: number;
}

// A client's own order view of a real DB order row - see dbOrderToLegacy.
interface UserOrder {
	id: string;
	title: string;
	category: string;
	budget: string;
	date: string;
	status:
		| 'pending'
		| 'active'
		| 'approved'
		| 'postponed'
		| 'delayed'
		| 'completed'
		| 'cancelled';
	region: string;
	district: string;
	desc: string;
	currentStep?: number;
	masterId?: number;
	masterName?: string;
	masterAvatar?: string;
	clientRating?: number | null;
	clientReview?: string;
}

const formatSom = (n: number): string => `${n.toLocaleString('ru-RU')} so'm`;

// Adapters between the DB row shape (src/lib/api.ts, backed by db/schema.ts)
// and this file's existing local Master/UserOrder shapes, so the rest of the
// component (search, cards, booking modal, etc.) doesn't need to change.
const dbMasterToLegacy = (m: DbMaster): Master => {
	const cat = CATEGORIES.find((c) => c.id === m.categoryId);
	return {
		id: m.id,
		name: m.name,
		category: cat?.name ?? m.categoryId,
		categoryId: m.categoryId,
		rating: m.rating,
		reviewsCount: m.reviewsCount,
		completedJobs: m.completedJobs,
		experience: m.experience,
		distance: 0,
		isOnline: m.isOnline,
		responseTime: '~30 daqiqa',
		startPrice: m.price,
		avatar:
			m.avatarUrl
				? m.avatarUrl
				: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=300',
		isVerified: m.verified,
		phone: m.phone,
		about: m.bio || '',
		region: m.region,
		district: m.district,
		lat: 0,
		lng: 0,
		isActive: m.isActive,
		extraPhone: m.extraPhone || '',
		telegram: m.telegram || '',
		specialty: m.specialty || '',
		priceComment: m.priceComment || '',
		services: m.services || '',
		premiumUntil: m.premiumUntil,
		monthlyEarnings: m.monthlyEarnings,
		reviews: m.reviews || [],
	};
};

const dbOrderToLegacy = (o: DbOrder): UserOrder => {
	const cat = CATEGORIES.find((c) => c.id === o.categoryId);
	return {
		id: o.id,
		title: o.title,
		category: cat?.name ?? o.categoryId ?? '',
		budget: formatSom(o.budget),
		date: new Date(o.createdAt).toLocaleString('uz-UZ'),
		status: o.status,
		region: o.region,
		district: o.district,
		desc: o.desc || '',
		masterId: o.masterId ?? undefined,
		masterName: o.masterName || undefined,
		clientRating: o.clientRating ?? null,
		clientReview: o.clientReview || '',
	};
};

// A "received order" (master's queue) is the SAME db order row viewed from the
// master's side; clientOrderId===id, kept as a separate field only because the
// UI historically modeled these as two linked objects (see MasterReceivedOrder).
const dbOrderToMasterReceived = (o: DbOrder): MasterReceivedOrder => ({
	id: o.id,
	title: o.title,
	clientName: o.clientName || 'Mijoz',
	clientPhone: o.clientPhone || '',
	budget: o.budget,
	date: new Date(o.createdAt).toLocaleString('uz-UZ'),
	status: o.status === 'delayed' ? 'active' : o.status,
	desc: o.desc || '',
	region: o.region || '',
	district: o.district || '',
	clientOrderId: o.id,
	masterId: o.masterId,
	clientId: o.clientId,
});

const ORDER_STEPS = [
	{ label: 'Kutilmoqda', icon: 'hourglass_empty' },
	{ label: "Usta yo'lda", icon: 'directions_car' },
	{ label: 'Usta keldi', icon: 'location_on' },
	{ label: 'Ish boshlandi', icon: 'construction' },
	{ label: 'Ish tugadi', icon: 'task_alt' },
	{ label: "To'lov qilindi", icon: 'payments' },
	{ label: 'Buyurtma yakunlandi', icon: 'verified' },
];

export const PRESET_USTA_AVATARS = [
	'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=300',
	'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=300',
	'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
	'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=300',
	'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
	'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300',
	'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300',
	'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300',
];

const isSamePhone = (p1: string, p2: string): boolean => {
	if (!p1 || !p2) return false;
	return p1.replace(/\D/g, '') === p2.replace(/\D/g, '');
};

interface UstaAppProps {
	userSession: { name: string; phone: string; role: string } | null;
	onLogout: () => void;
	onAdminOpen?: () => void;
	customLogoUrl: string | null;
	onLogoClick: (e: React.MouseEvent) => void;
	pwaInstallPrompt: BeforeInstallPromptEvent | null;
	setPwaInstallPrompt: (prompt: BeforeInstallPromptEvent | null) => void;
	showPwaBanner: boolean;
	setShowPwaBanner: (show: boolean) => void;
}

export default function UstaApp({
	userSession,
	onLogout,
	onAdminOpen,
	customLogoUrl,
	onLogoClick,
	pwaInstallPrompt,
	setPwaInstallPrompt,
	showPwaBanner,
	setShowPwaBanner,
}: UstaAppProps) {
	const api = useApi();
	const { profile: authProfile, setProfile } = useAuthSession();
	const clerkUserId = authProfile?.id; // current user's own profile id (not Clerk anymore)

	// Navigation layout state: 'home' | 'orders' | 'create' | 'messages' | 'profile' | 'search'.
	// Synced with the URL (/app/:tab) below, so tabs are real, shareable, back/
	// forward-navigable routes instead of pure in-memory state.
	type Tab =
		| 'home'
		| 'orders'
		| 'create'
		| 'messages'
		| 'profile'
		| 'search'
		| 'workspace';
	const VALID_TABS: Tab[] = [
		'home',
		'orders',
		'create',
		'messages',
		'profile',
		'search',
		'workspace',
	];
	// Locally-created notifications (chat messages, ticket replies) carry
	// structured data instead of plain text - `target` says where a click
	// should take the user (which tab, and which chat to open if it's a
	// message), rather than the bell dropdown being a dead end. Backend
	// notifications (BackendNotification, from lib/api) are mapped into this
	// same display shape below before being merged into `allNotifications`.
	interface LocalNotification {
		id: number;
		text: string;
		target?: { tab: Tab; chatMaster?: ChatPartner; openSupport?: boolean };
		isRead?: boolean;
		createdAt?: string;
	}

	const routeParams = useParams<{ tab?: string }>();
	const routeNavigate = useNavigate();
	const [activeTab, setActiveTab] = useState<Tab>(() => {
		const fromUrl = routeParams.tab;
		return fromUrl && (VALID_TABS as string[]).includes(fromUrl)
			? (fromUrl as Tab)
			: 'home';
	});

	// Sync URL → state when user uses browser back/forward
	const tabSyncingRef = useRef(false);
	const initialTabRef = useRef(true);
	useEffect(() => {
		const urlTab = routeParams.tab as Tab | undefined;
		if (urlTab && VALID_TABS.includes(urlTab) && urlTab !== activeTab) {
			tabSyncingRef.current = true;
			setActiveTab(urlTab);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [routeParams.tab]);

	// Sync state → URL when user clicks a tab (but not when URL triggered the change).
	// First nav (from login) uses replace to avoid login in history; subsequent tab
	// changes use push so back/forward navigates between tabs properly.
	useEffect(() => {
		if (tabSyncingRef.current) {
			tabSyncingRef.current = false;
			return;
		}
		routeNavigate(`/app/${activeTab}`, { replace: initialTabRef.current });
		initialTabRef.current = false;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [activeTab]);

	// Close chat when leaving Messages tab
	useEffect(() => {
		if (activeTab !== 'messages') {
			setChatMaster(null);
			setSupportChatOpen(false);
		}
	}, [activeTab]);

	const [ordersTab, setOrdersTab] = useState<
		'received' | 'my_orders' | 'analytics'
	>('received');
	const [viewingLeaderboard, setViewingLeaderboard] = useState<boolean>(false);

	// Location States with persistent LocalStorage memory
	const [selectedRegion, setSelectedRegion] = useState<string>(() => {
		return localStorage.getItem('Usta_region') || 'Toshkent viloyati';
	});
	const [selectedDistrict, setSelectedDistrict] = useState<string>(() => {
		return localStorage.getItem('Usta_district') || 'Yangiyoʻl';
	});

	// Search & Filter state
	const [searchQuery, setSearchQuery] = useState<string>('');
	const [activeCategory, setActiveCategory] = useState<string>('all');
	const [sortBy, setSortBy] = useState<'jobs' | 'price' | 'experience'>('jobs');
	const [hasSelectedRegion, setHasSelectedRegion] = useState<boolean>(false);

	// UX Settings & UI status indicators (theme is global, see ThemeProvider)
	const { isDarkMode, theme, cycleTheme } = useTheme();
	const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);
	const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
	const [shimmerLoading, setShimmerLoading] = useState<boolean>(false);
	const [favorites, setFavorites] = useState<number[]>(() => {
		try {
			const stored = localStorage.getItem('Usta_favorites');
			return stored ? JSON.parse(stored) : [];
		} catch {
			return [];
		}
	});

	const [deletedChats, setDeletedChats] = useState<(number | string)[]>(() => {
		try {
			const stored = localStorage.getItem(
				`Usta_deleted_chats_${userSession?.phone || 'anon'}`
			);
			return stored ? JSON.parse(stored) : [];
		} catch {
			return [];
		}
	});

	useEffect(() => {
		localStorage.setItem(
			`Usta_deleted_chats_${userSession?.phone || 'anon'}`,
			JSON.stringify(deletedChats)
		);
	}, [deletedChats, userSession]);

	// Dynamic document title based on active tab
	const TAB_TITLES: Record<string, string> = {
		home: 'Bosh sahifa',
		search: 'Usta qidirish',
		orders: 'Buyurtmalar',
		messages: 'Xabarlar',
		profile: 'Profil sozlamalari',
		workspace: 'Ish stoli',
		create: "Yangi e'lon",
	};
	useEffect(() => {
		document.title = `Master Group – ${TAB_TITLES[activeTab] || 'Ilova'}`;
	}, [activeTab]);

	const [allMasters, setAllMasters] = useState<Master[]>([]);
	const [mastersLoaded, setMastersLoaded] = useState<boolean>(false);
	const mastersFetchAttempted = useRef(false);

	const loadMasters = useCallback(async () => {
		mastersFetchAttempted.current = true;
		try {
			const res = await api.getMasters();
			setAllMasters(res.data.map(dbMasterToLegacy));
		} catch {
			showToast("Ustalar ro'yxatini yuklashda xatolik yuz berdi.", 'error');
		} finally {
			setMastersLoaded(true);
		}
	}, []);

	// Lazy-load masters only when the user visits a tab that needs them.
	// 'profile' is in this list because myMasterProfile (own premiumUntil,
	// used by isPremiumActive below) comes from this same array - without it,
	// a master landing directly on Profile never triggers the fetch at all.
	useEffect(() => {
		if ((activeTab === 'home' || activeTab === 'search' || activeTab === 'workspace' || activeTab === 'profile') && !mastersLoaded) {
			loadMasters();
		}
	}, [activeTab, loadMasters]);

	// Own premium/payment status changes server-side (Telegram admin approval)
	// without the app open to receive it - push covers the common case, but
	// this re-pull is the fallback so premiumUntil/pendingPayments catch up
	// on their own within half an hour even if the push never arrived.
	useEffect(() => {
		if (!clerkUserId) return;
		const interval = setInterval(() => {
			loadMasters();
			api.getPayments().then((p) => spm('pendingPayments', p)).catch(() => {});
		}, 30 * 60 * 1000);
		return () => clearInterval(interval);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [clerkUserId, loadMasters]);

	const [searchResults, setSearchResults] = useState<Master[]>([]);
	const [searchLoading, setSearchLoading] = useState(false);
	const [searchPage, setSearchPage] = useState(1);
	const [searchTotal, setSearchTotal] = useState(0);
	const searchControllerRef = useRef<AbortController | null>(null);
	const SEARCH_LIMIT = 20;

	const fetchSearch = useCallback(async (
		opts: { category?: string; region?: string; district?: string; q?: string; sortBy?: string; page?: number }
	) => {
		searchControllerRef.current?.abort();
		const ctrl = new AbortController();
		searchControllerRef.current = ctrl;

		setSearchLoading(true);
		try {
			const res = await api.searchMasters({
				category: opts.category,
				region: opts.region,
				district: opts.district,
				q: opts.q,
				sortBy: opts.sortBy,
				page: opts.page || 1,
				limit: SEARCH_LIMIT,
			});
			if (!ctrl.signal.aborted) {
				setSearchResults(res.data.map(dbMasterToLegacy));
				setSearchTotal(res.total);
			}
		} catch {
			if (!ctrl.signal.aborted) {
				showToast("Ustalarni yuklashda xatolik yuz berdi", 'error');
			}
		} finally {
			if (!ctrl.signal.aborted) setSearchLoading(false);
		}
	}, []);

	// Construction-company job listings, shown under the second toggle on the
	// search tab. Unlike masters these aren't paginated (the volume is small
	// and admin-curated) and they carry no status - the master just calls the
	// phone number on the listing. See backend/enterprise/.
	const [searchMode, setSearchMode] = useState<'masters' | 'enterprise'>('masters');
	const [enterpriseOrders, setEnterpriseOrders] = useState<EnterpriseOrder[]>([]);
	const [enterpriseLoading, setEnterpriseLoading] = useState(false);
	const enterpriseControllerRef = useRef<AbortController | null>(null);

	const fetchEnterpriseOrders = useCallback(async (
		opts: { category?: string; region?: string; district?: string; q?: string }
	) => {
		enterpriseControllerRef.current?.abort();
		const ctrl = new AbortController();
		enterpriseControllerRef.current = ctrl;

		setEnterpriseLoading(true);
		try {
			const rows = await api.getEnterpriseOrders(opts);
			if (!ctrl.signal.aborted) setEnterpriseOrders(rows);
		} catch {
			if (!ctrl.signal.aborted) {
				showToast('Korxona buyurtmalarini yuklashda xatolik yuz berdi', 'error');
			}
		} finally {
			if (!ctrl.signal.aborted) setEnterpriseLoading(false);
		}
	}, []);

	// Promo banners the admin creates in AdminDashboard's "Reklama sozlamalari"
	// tab (see api/ads.ts) - rendered on the home screen below.
	const [ads, setAds] = useState<Ad[]>([]);
	useEffect(() => {
		api.getAds().then(setAds).catch(() => {});
	}, []);

	// Popups & detail drawers states
	const [bottomSheetOpen, setBottomSheetOpen] = useState<boolean>(false);
	const [bottomSheetStep, setBottomSheetStep] = useState<'region' | 'district'>(
		'region'
	);
	const [allCategoriesOpen, setAllCategoriesOpen] = useState<boolean>(false);
	const [selectedCategoryForSheet, setSelectedCategoryForSheet] =
		useState<CategoryItem | null>(null);
	const [viewingMaster, setViewingMaster] = useState<Master | null>(null);
	const [revealedPhone, setRevealedPhone] = useState<boolean>(false);
	const [mapViewEnabled, setMapViewEnabled] = useState<boolean>(false);
	const [recentlyViewed, setRecentlyViewed] = useState<number[]>([]);
	const [completionModalOpen, setCompletionModalOpen] =
		useState<boolean>(false);
	const [completingOrderId, setCompletingOrderId] = useState<string | null>(
		null
	);
	const [selectedMasterForCompletion, setSelectedMasterForCompletion] =
		useState<number | null>(null);

	// New states for direct booking, stepper timeline tracking, and ratings
	const [bookingMaster, setBookingMaster] = useState<Master | null>(null);
	const [bookingModalOpen, setBookingModalOpen] = useState<boolean>(false);
	const [bookingTitle, setBookingTitle] = useState('');
	const [bookingBudget, setBookingBudget] = useState('');
	const [bookingDesc, setBookingDesc] = useState('');
	const [bookingRegion, setBookingRegion] = useState('');
	const [bookingDistrict, setBookingDistrict] = useState('');
	const [successModalOpen, setSuccessModalOpen] = useState<boolean>(false);
	const [successModalData, setSuccessModalData] = useState<{
		orderId: string;
		masterId: number;
		masterName: string;
		masterAvatar: string;
	} | null>(null);
	const [ratingModalOpen, setRatingModalOpen] = useState<boolean>(false);
	const [ratingMaster, setRatingMaster] = useState<Master | null>(null);
	const [ratingOrderId, setRatingOrderId] = useState<string | null>(null);
	const [ratingStars, setRatingStars] = useState<number>(5);
	const [ratingComment, setRatingComment] = useState<string>('');

	// Client rates the master after the master marks an order completed
	// (see OrdersTab.tsx "Baho berish" button on a completed order card).
	const handleOpenRatingModal = (order: UserOrder) => {
		if (!order.masterId) return;
		const master = allMasters.find((m) => m.id === order.masterId);
		setRatingMaster(
			master || {
				id: order.masterId,
				name: order.masterName || 'Usta',
				avatar: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=300',
				category: '',
			} as Master
		);
		setRatingOrderId(order.id);
		setRatingStars(5);
		setRatingComment('');
		setRatingModalOpen(true);
	};

	// Order details viewing state
	const [viewingOrder, setViewingOrder] = useState<any | null>(null);

	// Backend notifications (created by signals on server, fetched via API)
	const [backendNotifications, setBackendNotifications] = useState<BackendNotification[]>([]);
	const [backendUnreadCount, setBackendUnreadCount] = useState(0);

	useEffect(() => {
		if (!clerkUserId) return;
		const fetchNotifs = () => {
			api.getNotifications().then((res) => {
				setBackendNotifications(res.data);
				setBackendUnreadCount(res.unreadCount);
			}).catch(() => {});
		};
		fetchNotifs();
		const interval = setInterval(fetchNotifs, 15000);
		// The service worker posts this the moment a web push actually
		// arrives, so the bell reflects it immediately instead of waiting
		// up to 15s for the next poll. This used to only refresh the bell -
		// a master's own premiumUntil (isPremiumActive, allMasters) and
		// pendingPayments only caught up on the 30-minute loadMasters()
		// poll below, so an admin approving a payment (instant push) still
		// left "Premium To'lov Kutilmoqda" on screen for up to half an hour.
		// The push payload carries no type, so just refresh both on every push.
		const onSwMessage = (event: MessageEvent) => {
			if (event.data?.type === 'PUSH_RECEIVED') {
				fetchNotifs();
				loadMasters();
				api.getPayments().then((p) => spm('pendingPayments', p)).catch(() => {});
			}
		};
		navigator.serviceWorker?.addEventListener?.('message', onSwMessage);
		return () => {
			clearInterval(interval);
			navigator.serviceWorker?.removeEventListener?.('message', onSwMessage);
		};
	}, [clerkUserId, loadMasters]);

	// Local notifications (chat messages, ticket replies)
	const [notifications, setNotifications] = useState<LocalNotification[]>([]);
	const notificationIdRef = useRef(0);
	const nextNotificationId = () => ++notificationIdRef.current;

	// Backend + local notifications merged for the bell dropdown.
	// Backend notifications carry a `type` string; we derive the target tab
	// from it so clicking the bell item navigates the user to the right place.
	const allNotifications = useMemo(() => {
		const backendItems: LocalNotification[] = backendNotifications.map((n) => {
			const tabFromType: Tab | undefined =
				n.type === 'order_new' || n.type === 'order_accepted' ||
				n.type === 'order_completed' || n.type === 'order_cancelled' ||
				n.type === 'order_postponed'
					? 'orders'
					: n.type === 'application_approved' || n.type === 'application_rejected'
						? 'profile'
						: n.type === 'payment_approved' || n.type === 'payment_rejected'
							? 'profile'
							: undefined;
			return {
				id: n.id,
				text: `${n.title}: ${n.body}`,
				isRead: n.isRead,
				createdAt: n.createdAt,
				target: tabFromType ? { tab: tabFromType } : undefined,
			};
		});
		const localWithReadFlag = notifications.map((n) => ({ ...n, isRead: false }));
		return [...backendItems, ...localWithReadFlag];
	}, [backendNotifications, notifications]);

	const totalUnreadCount = backendUnreadCount + notifications.length;

	const [showNotificationsDropdown, setShowNotificationsDropdown] =
		useState<boolean>(false);
	const notificationsRef = useRef<HTMLDivElement>(null);

	// Close the notifications dropdown on outside click or Escape - without
	// this it only ever closes by clicking the bell again, which reads as
	// broken/stuck to anyone used to how every other dropdown behaves.
	useEffect(() => {
		if (!showNotificationsDropdown) return;
		const handlePointerDown = (e: MouseEvent) => {
			if (!notificationsRef.current?.contains(e.target as Node)) {
				setShowNotificationsDropdown(false);
			}
		};
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') setShowNotificationsDropdown(false);
		};
		document.addEventListener('mousedown', handlePointerDown);
		document.addEventListener('keydown', handleKeyDown);
		return () => {
			document.removeEventListener('mousedown', handlePointerDown);
			document.removeEventListener('keydown', handleKeyDown);
		};
	}, [showNotificationsDropdown]);

	// Workspace management state
	const [ws, dispatchWs] = useWorkspaceState();
	const {
		name: workspaceName,
		phone: workspacePhone,
		avatar: workspaceAvatar,
		hours: workspaceHours,
		offDays: workspaceOffDays,
		active: workspaceActive,
		region: workspaceRegion,
		district: workspaceDistrict,
		loadedPhone: workspaceLoadedPhone,
		monthlyEarnings: workspaceMonthlyEarnings,
	} = ws;
	function sw<K extends keyof WorkspaceState>(
		field: K,
		value: WorkspaceState[K]
	) {
		dispatchWs({ type: 'SET_WORKSPACE', field, value });
	}

	const [submittingPartnership, setSubmittingPartnership] = useState(false);

	// Master Partnership state variables. Real per-account data (masterStatus,
	// and all partnershipX/masterX fields below) always starts from a safe
	// default and gets overwritten by the "sync from myMasterProfile" effect
	// further down once the real DB data loads - never from localStorage, which
	// isn't scoped per-account and previously leaked master status across
	// logins on the same browser (see myMasterProfile/mastersLoaded below).
	const [ps, dispatchPs] = usePartnershipState();
	const {
		modalOpen: partnershipModalOpen,
		status: masterStatus,
		category: partnershipCategory,
		name: partnershipName,
		phone: partnershipPhone,
		experience: partnershipExp,
		price: partnershipPrice,
		passport: partnershipPassport,
		bio: partnershipBio,
		agreed: partnershipAgreed,
		step: partnershipStep,
		region: partnershipRegion,
		district: partnershipDistrict,
		firstName: partnershipFirstName,
		lastName: partnershipLastName,
		specialty: partnershipSpecialty,
		extraPhone: partnershipExtraPhone,
		telegram: partnershipTelegram,
		services: partnershipServices,
		priceComment: partnershipPriceComment,
		avatar: partnershipAvatar,
		workStart: masterWorkStart,
		workEnd: masterWorkEnd,
		restDays: masterRestDays,
		workHours: masterWorkHours,
		isActive: masterIsActive,
		monthlyEarnings: masterMonthlyEarnings,
		profileEditTab,
	} = ps;
	function sp<K extends keyof PartnershipState>(
		field: K,
		value: PartnershipState[K]
	) {
		dispatchPs({ type: 'SET_PARTNERSHIP', field, value });
	}

	// Auto-fill partnership fields from auth profile when modal opens
	const autoFillDone = useRef(false);
	useEffect(() => {
		if (partnershipModalOpen && !autoFillDone.current) {
			autoFillDone.current = true;
			if (authProfile?.name) {
				sp('name', authProfile.name);
				const parts = authProfile.name.trim().split(/\s+/);
				if (parts.length >= 2) {
					sp('firstName', parts[0]);
					sp('lastName', parts.slice(1).join(' '));
				}
			}
			if (authProfile?.phone) sp('phone', authProfile.phone);
			// Pick random mock avatar if none set
			if (!partnershipAvatar) {
				const random = PRESET_USTA_AVATARS[Math.floor(Math.random() * PRESET_USTA_AVATARS.length)];
				sp('avatar', random);
			}
		}
		if (!partnershipModalOpen) {
			autoFillDone.current = false;
		}
	}, [partnershipModalOpen]);

	const currentUstaPhone =
		authProfile?.phone || userSession?.phone || partnershipPhone || '';
	const myMasterProfile = allMasters.find((m) =>
		isSamePhone(m.phone, currentUstaPhone)
	);

	// Sync partnership form fields from the real master profile once it loads.
	// ProfileTab's edit-profile panel (handleSavePartnershipProfile) reuses
	// this same `ps` state, but is always rendered - not gated behind
	// partnershipModalOpen like the effect above - so it never ran there.
	// name/phone stayed at the initialPartnership '' default, which the
	// backend rejects outright ("This field may not be blank."), and
	// category/experience/price/bio/etc stayed at unrelated placeholder
	// defaults that silently overwrote the master's real profile on save.
	const profileAutoFillDone = useRef<number | null>(null);
	useEffect(() => {
		if (myMasterProfile && profileAutoFillDone.current !== myMasterProfile.id) {
			profileAutoFillDone.current = myMasterProfile.id;
			sp('name', myMasterProfile.name || '');
			const nameParts = (myMasterProfile.name || '').trim().split(/\s+/);
			sp('firstName', nameParts[0] || '');
			sp('lastName', nameParts.slice(1).join(' ') || nameParts[0] || '');
			sp('phone', myMasterProfile.phone || '');
			sp('category', myMasterProfile.categoryId || 'plumbing');
			sp('specialty', myMasterProfile.specialty || '');
			sp('experience', myMasterProfile.experience || 0);
			sp('price', myMasterProfile.startPrice || 0);
			sp('bio', myMasterProfile.about || '');
			sp('region', myMasterProfile.region || '');
			sp('district', myMasterProfile.district || '');
			sp('services', myMasterProfile.services || '');
			sp('priceComment', myMasterProfile.priceComment || '');
			sp('extraPhone', myMasterProfile.extraPhone || '');
			sp('telegram', myMasterProfile.telegram || '');
			sp('avatar', myMasterProfile.avatar || '');
		}
	}, [myMasterProfile]);

	const [clientOrderFilter, setClientOrderFilter] = useState<string>('all');

	// PWA, Profile Edit, Payment History modals
	const [pwaModalOpen, setPwaModalOpen] = useState<boolean>(false);
	const [paymentHistoryModalOpen, setPaymentHistoryModalOpen] =
		useState<boolean>(false);

	// Edit Profile modal state
	const [ep, dispatchEp] = useEditProfileState();
	const {
		modalOpen: editProfileModalOpen,
		name: editProfileName,
		phone: editProfilePhone,
		currentPassword: editProfileCurrentPassword,
		newPassword: editProfileNewPassword,
		saving: editProfileSaving,
	} = ep;
	function sep<K extends keyof EditProfileState>(
		field: K,
		value: EditProfileState[K]
	) {
		dispatchEp({ type: 'SET_EDIT_PROFILE', field, value });
	}
	// Loaded from the DB alongside `orders` below (same underlying query - a
	// master's "received orders" queue is just orders NOT posted by themselves).
	const [masterOrders, setMasterOrders] = useState<MasterReceivedOrder[]>([]);

	// A master can only switch their work zone (region/district) while they have
	// no order actively in progress - jumping zones mid-job would strand a client.
	const hasActiveMasterOrder = masterOrders.some(
		(o) =>
			o.masterId === myMasterProfile?.id &&
			(o.status === 'active' || o.status === 'postponed')
	);

	// Premium, Card settings and Payment tracking states
	const [pm, dispatchPm] = usePaymentState();
	const {
		premiumMode,
		adminCard,
		adminCardHolder,
		pendingPayments,
		tariffs,
		premiumTimeLeft,
		paymentPackage,
		paymentReceipt,
		paymentProofImage,
		submittingPayment,
	} = pm;
	function spm<K extends keyof PaymentState>(field: K, value: PaymentState[K]) {
		dispatchPm({ type: 'SET_PAYMENT', field, value });
	}

	// Platform settings (admin card, premium enforcement mode), tariffs, and this
	// master's own payment history all come from the DB.
	useEffect(() => {
		if (!clerkUserId) return;
		api
			.getSettings()
			.then((s) => {
				spm('premiumMode', s.premiumMode as 'active' | 'noactive');
				spm('adminCard', s.adminCard);
				spm('adminCardHolder', s.adminCardHolder);
			})
			.catch(() => showToast('Sozlamalarni yuklashda xatolik', 'error'));
		api
			.getTariffs()
			.then((t) => spm('tariffs', t))
			.catch(() => showToast('Tariflarni yuklashda xatolik', 'error'));
		api
			.getPayments()
			.then((p) => spm('pendingPayments', p))
			.catch(() => showToast("To'lovlarni yuklashda xatolik", 'error'));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [clerkUserId]);

	// Premium countdown timer — managed inside paymentState (premiumTimeLeft)

	// Default the selected package once tariffs load.
	const paymentSetRef = useRef(false);
	useEffect(() => {
		if (!paymentSetRef.current && tariffs.length > 0) {
			spm('paymentPackage', tariffs[0].id);
			paymentSetRef.current = true;
		}
	}, [tariffs.length]);

	// Dynamic user authored state
	const [orders, setOrders] = useState<UserOrder[]>([]);

	// Load orders from the DB: own postings go to `orders`, everything else the
	// server returned (assigned to my master profile, or unclaimed and matching
	// my category) is my "received orders" queue.
	const refreshOrders = () => {
		if (!clerkUserId) return Promise.resolve(false);
		return api
			.getOrders()
			.then((rows) => {
				setOrders(
					rows.filter((o) => String(o.clientId) === String(clerkUserId)).map(dbOrderToLegacy)
				);
				setMasterOrders(
					rows
						.filter((o) => String(o.clientId) !== String(clerkUserId))
						.map(dbOrderToMasterReceived)
				);
				return true;
			})
			.catch(() => {
				showToast('Buyurtmalarni yuklashda xatolik yuz berdi.', 'error');
				return false;
			});
	};

	useEffect(() => {
		refreshOrders();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [clerkUserId]);

	// Re-pull on every visit to Buyurtmalar/Ish stolim - both read the same
	// `orders` table, and otherwise a status change made elsewhere (another
	// device, the admin panel, a master accepting a job) wouldn't show up
	// here until a full page reload.
	const ordersTabFirstRender = useRef(true);
	useEffect(() => {
		if (ordersTabFirstRender.current) {
			ordersTabFirstRender.current = false;
			return;
		}
		if (activeTab === 'orders' || activeTab === 'workspace') refreshOrders();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [activeTab]);

	// Client<->master chat state, backed by /api/conversations (see src/lib/api.ts).
	const [chatMaster, setChatMaster] = useState<ChatPartner | null>(null);
	const [conversations, setConversations] = useState<Conversation[]>([]);

	const refreshConversations = () => {
		return api
			.getConversations()
			.then((data) => {
				setConversations(data);
				return true;
			})
			.catch((e) => {
				console.error('refreshConversations:', e);
				return false;
			});
	};

	const refreshTicket = () => {
		return api
			.getTickets()
			.then((rows) => {
				setMyTicket(rows[0] ?? null);
				return true;
			})
			.catch((e) => {
				console.error('loadTicket:', e);
				return false;
			});
	};

	// Permanent "Qo'llab-quvvatlash" chat, backed by /api/tickets - every
	// signed-in user has at most one open ticket at a time (see api/tickets.ts).
	const [myTicket, setMyTicket] = useState<Ticket | null>(null);
	const [supportChatOpen, setSupportChatOpen] = useState<boolean>(false);
	const [supportMessage, setSupportMessage] = useState<string>('');

	// Load conversations + ticket on mount; poll only when chat tabs are open.
	// Self-scheduling (setTimeout that re-arms itself once the in-flight
	// requests settle) rather than a blind setInterval - a fixed interval
	// keeps firing on schedule even if a request is still pending, so any
	// slowness (slow network, a stalled dev backend) causes requests to pile
	// up faster than they complete, which read as the chat "looping".
	const initialLoadDone = useRef(false);
	useEffect(() => {
		if (!clerkUserId) return;
		if (!initialLoadDone.current) {
			initialLoadDone.current = true;
			refreshConversations();
			refreshTicket();
		}
		// An open conversation has to keep polling wherever it was opened from -
		// ChatOverlay is also reachable from the search tab and from a master's
		// detail sheet, and keying this on the messages tab alone left those
		// chats frozen: outgoing messages appeared, replies never did until the
		// user navigated to the messages tab.
		const shouldPoll = activeTab === 'messages' || supportChatOpen || !!chatMaster;
		if (!shouldPoll) return;

		let cancelled = false;
		let timeoutId: ReturnType<typeof setTimeout> | null = null;
		let pollInterval = 3000;

		const tick = () => {
			Promise.all([refreshConversations(), refreshTicket()]).then(([convOk, ticketOk]) => {
				pollInterval = convOk && ticketOk ? 3000 : Math.min(pollInterval * 2, 30000);
			}).finally(() => {
				if (!cancelled) timeoutId = setTimeout(tick, pollInterval);
			});
		};
		tick();

		return () => {
			cancelled = true;
			if (timeoutId) clearTimeout(timeoutId);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [clerkUserId, activeTab, supportChatOpen, chatMaster?.id]);

	// Notify once per new unread chat message, not on every 5s poll - a ref
	// (not state) tracks the last-seen unreadCount per conversation purely to
	// dedupe, since the conversation's real unread state already lives in the
	// `conversations` array itself (see markConversationRead elsewhere).
	const notifiedUnreadRef = useRef<Record<number, number>>({});
	useEffect(() => {
		conversations.forEach((c) => {
			const prevUnread = notifiedUnreadRef.current[c.id] ?? 0;
			// No "yangi xabar keldi" popup for the conversation that is open on
			// screen right now - the message is already visible, and it is marked
			// read a tick later anyway.
			const isOpenOnScreen =
				!!chatMaster && String(c.partner.id) === String(chatMaster.id);
			if (c.unreadCount > prevUnread && !isOpenOnScreen) {
				setNotifications((prev) => [
					{
						id: nextNotificationId(),
						text: `💬 ${c.partner.name}: yangi xabar keldi`,
						target: {
							tab: 'messages',
							chatMaster: {
								id: c.partner.id,
								name: c.partner.name,
								avatar: c.partner.avatar || PRESET_USTA_AVATARS[0],
								phone: c.partner.phone,
							},
						},
					},
					...prev,
				]);
			}
			notifiedUnreadRef.current[c.id] = c.unreadCount;
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [conversations]);

	// Same idea for the support ticket - "seen" watermark is how many of its
	// messages the user has already looked at, persisted per-account (phone-
	// scoped) like the other legitimate local UI-state caches in this file
	// (not security-sensitive, unlike the old global masterStatus leak - see
	// myMasterProfile effect).
	const [ticketSeenCount, setTicketSeenCount] = useState<number>(0);
	useEffect(() => {
		if (!currentUstaPhone) return;
		setTicketSeenCount(
			Number(localStorage.getItem(`Usta_ticket_seen_${currentUstaPhone}`) || 0)
		);
	}, [currentUstaPhone]);

	useEffect(() => {
		if (!myTicket || myTicket.messages.length <= ticketSeenCount) return;
		const last = myTicket.messages[myTicket.messages.length - 1];
		if (last.sender === 'admin' && !supportChatOpen) {
			setNotifications((prev) => [
				{
					id: nextNotificationId(),
					text: "🎧 Qo'llab-quvvatlash xizmatidan yangi javob keldi",
					target: { tab: 'messages', openSupport: true },
				},
				...prev,
			]);
		}
		// Opening the support chat itself counts as reading it either way.
		if (supportChatOpen) {
			localStorage.setItem(
				`Usta_ticket_seen_${currentUstaPhone}`,
				String(myTicket.messages.length)
			);
		}
		setTicketSeenCount(myTicket.messages.length);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [myTicket?.messages.length, supportChatOpen]);

	const handleSendSupportMessage = async (e: React.FormEvent) => {
		e.preventDefault();
		const text = supportMessage.trim();
		if (!text) return;
		setSupportMessage('');
		try {
			const updated = await api.sendSupportMessage(text);
			setMyTicket(updated);
		} catch (err) {
			showToast(
				err instanceof Error ? err.message : 'Xabar yuborilmadi',
				'error'
			);
		}
	};

	const isMasterChatMode = masterStatus === 'approved';
	const activeConversation = chatMaster
		? conversations.find(
				(c) =>
					c.viewerRole === (isMasterChatMode ? 'master' : 'client') &&
					String(c.partner.id) === String(chatMaster.id)
			)
		: undefined;
	const activeChatMessages = activeConversation?.messages || [];

	const [pendingMessages, setPendingMessages] = useState<Record<number | string, { text: string; time: string }[]>>({});

	// Clean up pending messages that have been confirmed by API polling.
	// Matching against `activeConversation` (which is role-filtered) rather
	// than the first conversation with this partner id matters for accounts
	// that are both a client and an approved master: the same person can
	// appear as a partner in one conversation per role.
	useEffect(() => {
		if (!chatMaster) return;
		const conv = activeConversation;
		if (!conv || !pendingMessages[chatMaster.id]) return;
		// Pending entries are always MY OWN outgoing messages (see
		// pendingForChat below) - matching against every confirmed message in
		// the conversation, not just my own, meant a same-text reply from the
		// other participant ("ha", "yo'q", "ok"...) would wrongly clear my
		// pending bubble, making the two sides' messages appear to merge.
		const myRole = isMasterChatMode ? 'master' : 'client';
		// Text alone isn't enough either: short replies repeat ("ok", "ha"), so
		// an identical message sent yesterday would clear today's pending bubble
		// before the server ever confirmed it. Only a confirmed message that is
		// no older than the pending one counts (60s of slack for clock skew
		// between the device and the server).
		const myConfirmed = conv.messages
			.filter((m) => m.sender === myRole)
			.map((m) => ({ text: m.text, at: new Date(m.time).getTime() }));
		const isConfirmed = (p: { text: string; time: string }) => {
			const sentAt = new Date(p.time).getTime();
			return myConfirmed.some((m) => m.text === p.text && m.at >= sentAt - 60_000);
		};
		setPendingMessages((prev) => {
			const next = { ...prev };
			if (next[chatMaster.id]) {
				next[chatMaster.id] = next[chatMaster.id].filter((p) => !isConfirmed(p));
				if (next[chatMaster.id].length === 0) delete next[chatMaster.id];
			}
			return next;
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [conversations]);

	// Merge pending messages into activeChatMessages for instant display
	const pendingForChat = chatMaster ? (pendingMessages[chatMaster.id] || []) : [];
	const allChatMessages = pendingForChat.length > 0
		? [
				...activeChatMessages,
				...pendingForChat.map((p) => ({
					sender: (isMasterChatMode ? 'master' : 'client') as 'client' | 'master',
					text: p.text,
					time: p.time,
					_pending: true as const,
				})),
			]
		: activeChatMessages;

	// Mark messages as read while the chat is open (loop-safe: the local
	// unreadCount is zeroed immediately, so this re-fires only when polling
	// brings in genuinely new unread messages). Keying it on the conversation
	// id alone left every reply that arrived while the chat was already open
	// counted as unread - the badge in the messages tab kept growing in front
	// of a user who was reading those very messages, and the sender never got
	// the read receipt.
	useEffect(() => {
		if (!chatMaster) return;
		if (!activeConversation || activeConversation.unreadCount === 0) return;
		const convId = activeConversation.id;
		api.markConversationRead(convId).catch((e) => console.error('markRead:', e));
		setConversations((prev) =>
			prev.map((c) => (c.id === convId ? { ...c, unreadCount: 0 } : c))
		);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [chatMaster?.id, activeConversation?.id, activeConversation?.unreadCount]);

	useEffect(() => {
		if (!viewingMaster) {
			setRevealedPhone(false);
		}
	}, [viewingMaster]);

	// Order registration form states
	const [newOrderTitle, setNewOrderTitle] = useState<string>('');
	const [newOrderCategory, setNewOrderCategory] = useState<string>('plumbing');
	const [newOrderBudget, setNewOrderBudget] = useState<string>('');
	const [newOrderDesc, setNewOrderDesc] = useState<string>('');

	// Toast message system
	const [toast, setToast] = useState<{
		message: string;
		type: 'success' | 'info' | 'error';
	} | null>(null);

	const showToast = (
		message: string,
		type: 'success' | 'info' | 'error' = 'success'
	) => {
		setToast({ message, type });
		setTimeout(() => setToast(null), 3000);
	};

	// Confirm dialog (replaces window.confirm with app-styled modal)
	const [confirmDialog, setConfirmDialog] = useState<{
		message: string;
		resolve: (v: boolean) => void;
	} | null>(null);

	const confirmToast = (message: string): Promise<boolean> => {
		return new Promise((resolve) => {
			setConfirmDialog({ message, resolve });
		});
	};

	// Sync state with storage
	useEffect(() => {
		localStorage.setItem('Usta_region', selectedRegion);
		localStorage.setItem('Usta_district', selectedDistrict);
	}, [selectedRegion, selectedDistrict]);

	useEffect(() => {
		localStorage.setItem('Usta_favorites', JSON.stringify(favorites));
	}, [favorites]);

	// A master's status is derived straight from the real masters list, in
	// both directions: a row there means approved (more authoritative than the
	// optimistic 'pending' flag set right after submitting an application),
	// and no row once the list has actually loaded means this account was
	// never a master - guards against a stale 'approved'/'pending' status
	// wrongly carrying over (this used to be read from a single global
	// localStorage key shared by every account that ever logged into this
	// browser, so switching accounts could show one user another's master
	// workspace).
	useEffect(() => {
		if (!mastersLoaded) return;
		if (myMasterProfile) {
			if (masterStatus !== 'approved') sp('status', 'approved');
		} else if (masterStatus === 'approved') {
			sp('status', 'not_applied');
		}
	}, [myMasterProfile?.id, masterStatus, mastersLoaded]);

	// Populate the Ish stolim (Workspace) form from the real master profile
	// once it loads - previously `ws` only ever got written on manual save
	// (see handleSaveWorkspaceProfile below), so every fresh visit to the
	// tab showed blank/default fields instead of the master's actual data.
	// Gated on loadedPhone (not just myMasterProfile.id) so it doesn't
	// clobber in-progress unsaved edits on every re-render.
	useEffect(() => {
		if (!myMasterProfile || workspaceLoadedPhone === myMasterProfile.phone) return;
		sw('name', myMasterProfile.name || '');
		sw('phone', myMasterProfile.phone || '');
		sw('avatar', myMasterProfile.avatar || '');
		sw('region', myMasterProfile.region || '');
		sw('district', myMasterProfile.district || '');
		sw('active', myMasterProfile.isActive ?? true);
		sw('monthlyEarnings', myMasterProfile.monthlyEarnings || 0);
		const savedHours = localStorage.getItem('Usta_master_work_hours_' + myMasterProfile.phone);
		if (savedHours) sw('hours', savedHours);
		const savedOffDays = localStorage.getItem('Usta_master_off_days_' + myMasterProfile.phone);
		if (savedOffDays) {
			try {
				sw('offDays', JSON.parse(savedOffDays));
			} catch {
				/* ignore malformed cache */
			}
		}
		sw('loadedPhone', myMasterProfile.phone);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [myMasterProfile?.id]);

	// Restore pending application status on page refresh
	useEffect(() => {
		if (!clerkUserId || masterStatus !== 'not_applied') return;
		api.getApplicationStatus().then((res) => {
			if (res.status === 'pending') {
				sp('status', 'pending');
			} else if (res.status === 'approved') {
				sp('status', 'approved');
			} else if (res.status === 'declined') {
				sp('status', 'declined');
			}
		}).catch(() => {});
	}, [clerkUserId]);

	// Premium deadline countdown ticking effect
	useEffect(() => {
		const updateCountdown = () => {
			const premiumUntil = myMasterProfile?.premiumUntil;
			if (!premiumUntil) {
				spm('premiumTimeLeft', "Faol emas (To'lov kutilmoqda)");
				return;
			}
			const diff = new Date(premiumUntil).getTime() - new Date().getTime();
			if (diff <= 0) {
				spm('premiumTimeLeft', "Muddati tugagan (To'lov kutilmoqda)");
				return;
			}

			const days = Math.floor(diff / (1000 * 60 * 60 * 24));
			const hours = Math.floor(
				(diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
			);
			const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
			const seconds = Math.floor((diff % (1000 * 60)) / 1000);

			spm(
				'premiumTimeLeft',
				`${days} kun, ${hours} soat, ${minutes} daqiqa, ${seconds} soniya`
			);
		};

		updateCountdown();
		const interval = setInterval(updateCountdown, 1000);
		return () => clearInterval(interval);
	}, [myMasterProfile?.premiumUntil]);

	// Workspace functions to save edited profile and settings
	const handleSaveWorkspaceProfile = async (
		newName: string,
		newPhone: string,
		newAvatar: string,
		newRegion: string,
		newDistrict: string
	) => {
		if (!myMasterProfile) return;

		if (
			(newRegion !== myMasterProfile.region ||
				newDistrict !== myMasterProfile.district) &&
			hasActiveMasterOrder
		) {
			showToast(
				"Faol buyurtmangiz bor ekan, ish hududini hozir almashtirib bo'lmaydi.",
				'error'
			);
			return;
		}

		try {
			const updated = await api.updateMaster(myMasterProfile.id, {
				name: newName,
				phone: newPhone,
				avatarUrl: newAvatar,
				region: newRegion,
				district: newDistrict,
			});
			sw('name', newName);
			sw('phone', newPhone);
			sw('avatar', newAvatar);
			setAllMasters((prev) =>
				prev.map((m) => (m.id === updated.id ? dbMasterToLegacy(updated) : m))
			);
			showToast("Profil ma'lumotlari muvaffaqiyatli saqlandi!", 'success');
		} catch (err) {
			showToast(
				err instanceof Error ? err.message : 'Xatolik yuz berdi',
				'error'
			);
		}
	};

	const handleSaveWorkingSettings = async (
		hours: string,
		offDays: string[],
		active: boolean
	) => {
		// No DB column for working hours/off-days yet - kept local for now.
		localStorage.setItem('Usta_master_work_hours_' + currentUstaPhone, hours);
		localStorage.setItem(
			'Usta_master_off_days_' + currentUstaPhone,
			JSON.stringify(offDays)
		);

		if (!myMasterProfile) return;
		try {
			const updated = await api.updateMaster(myMasterProfile.id, {
				isActive: active,
			});
			setAllMasters((prev) =>
				prev.map((m) => (m.id === updated.id ? dbMasterToLegacy(updated) : m))
			);
			showToast('Ish vaqti va holati muvaffaqiyatli saqlandi!', 'success');
		} catch (err) {
			showToast(
				err instanceof Error ? err.message : 'Xatolik yuz berdi',
				'error'
			);
		}
	};

	// Delete user order
	const handleDeleteUserOrder = async (orderId: string) => {
		const target = orders.find((o) => o.id === orderId);
		try {
			await api.deleteOrder(orderId);
			setOrders(orders.filter((o) => o.id !== orderId));
			showToast("Buyurtma muvaffaqiyatli o'chirildi", 'success');
		} catch (err) {
			showToast(
				err instanceof Error
					? err.message
					: "Buyurtmani o'chirishda xatolik yuz berdi",
				'error'
			);
		}
	};

	// Delay user order
	const handleDelayUserOrder = async (orderId: string) => {
		try {
			await api.updateOrder(orderId, { status: 'delayed' });
			setOrders(
				orders.map((o) => {
					if (o.id === orderId) {
						return {
							...o,
							status: 'delayed',
							date: 'Kechiktirildi (+1 kun)',
						};
					}
					return o;
				})
			);
			showToast('Buyurtma 1 kunga kechiktirildi', 'success');
		} catch (err) {
			showToast(
				err instanceof Error ? err.message : 'Xatolik yuz berdi',
				'error'
			);
		}
	};

	// Complete received master order. The server credits masters.completedJobs/
	// monthlyEarnings and profiles.completedJobs itself (see api/orders.ts) -
	// this just reflects that in local UI state.
	const handleCompleteMasterOrder = async (orderId: string, budget: number) => {
		try {
			await api.updateOrder(orderId, { status: 'completed' });
			setMasterOrders(
				masterOrders.map((o) =>
					o.id === orderId ? { ...o, status: 'completed' } : o
				)
			);
			setOrders((prev) =>
				prev.map((o) => (o.id === orderId ? { ...o, status: 'completed' } : o))
			);
			sw('monthlyEarnings', ws.monthlyEarnings + budget);
			if (myMasterProfile) {
				setAllMasters((prev) =>
					prev.map((m) =>
						m.id === myMasterProfile.id
							? { ...m, completedJobs: m.completedJobs + 1 }
							: m
					)
				);
			}
			showToast(
				`Ish muvaffaqiyatli yakunlandi! Daromadga +${budget.toLocaleString()} so'm qo'shildi.`,
				'success'
			);
		} catch (err) {
			showToast(
				err instanceof Error ? err.message : 'Xatolik yuz berdi',
				'error'
			);
		}
	};

	// Accept received master order request
	const handleAcceptMasterOrder = async (orderId: string) => {
		const targetOrder = masterOrders.find((o) => o.id === orderId);
		if (!targetOrder || !myMasterProfile) return;

		try {
			await api.updateOrder(orderId, {
				status: 'active',
				masterId: myMasterProfile.id,
			});
			setMasterOrders((prev) =>
				prev.map((o) =>
					o.id === orderId
						? { ...o, status: 'active', masterId: myMasterProfile.id }
						: o
				)
			);
			setOrders((prev) =>
				prev.map((o) =>
					o.id === targetOrder.id ? { ...o, status: 'active' } : o
				)
			);

			const ustaName = myMasterProfile?.name || 'Usta';
			const msgText = `Assalomu alaykum! Siz yuborgan "${targetOrder.title}" xizmat buyurtmangizni bajonidil qabul qildim. Yaqin orada xizmatingizga boraman.`;
			api
				.sendMessageToClient(String(targetOrder.clientId), msgText)
				.then(refreshConversations)
				.catch((e) => console.error('sendMessageToClient:', e));

			showToast(
				'Buyurtma qabul qilindi va mijozga xabar yuborildi!',
				'success'
			);
		} catch (err) {
			showToast(
				err instanceof Error ? err.message : 'Xatolik yuz berdi',
				'error'
			);
		}
	};

	// Postpone received master order request
	const handlePostponeMasterOrder = async (orderId: string) => {
		const targetOrder = masterOrders.find((o) => o.id === orderId);
		if (!targetOrder || !myMasterProfile) return;

		try {
			await api.updateOrder(orderId, {
				status: 'postponed',
				masterId: myMasterProfile.id,
			});
			setMasterOrders((prev) =>
				prev.map((o) =>
					o.id === orderId
						? { ...o, status: 'postponed', masterId: myMasterProfile.id }
						: o
				)
			);
			setOrders((prev) =>
				prev.map((o) =>
					o.id === targetOrder.id ? { ...o, status: 'delayed' } : o
				)
			);

			const ustaName = myMasterProfile?.name || 'Usta';
			const msgText = `Kechirasiz, hozirda boshqa ishlarim cho'zilib ketgani sababli, buyurtmangizni ("${targetOrder.title}") biroz kechiktirishga majburman. Tushunishingiz uchun rahmat.`;
			api
				.sendMessageToClient(String(targetOrder.clientId), msgText)
				.then(refreshConversations)
				.catch((e) => console.error('sendMessageToClient:', e));

			showToast('Buyurtma kechiktirildi va mijozga xabar yuborildi', 'info');
		} catch (err) {
			showToast(
				err instanceof Error ? err.message : 'Xatolik yuz berdi',
				'error'
			);
		}
	};

	// Decline/Cancel received master order request
	const handleDeclineMasterOrder = async (orderId: string) => {
		const targetOrder = masterOrders.find((o) => o.id === orderId);
		if (!targetOrder) return;

		try {
			await api.updateOrder(orderId, { status: 'cancelled' });
			setMasterOrders((prev) => prev.filter((o) => o.id !== orderId));
			setOrders((prev) =>
				prev.map((o) =>
					o.id === targetOrder.id ? { ...o, status: 'cancelled' } : o
				)
			);

			const ustaName = myMasterProfile?.name || 'Usta';
			const msgText = `Kechirasiz, hozirgi vaqtda bo'sh emasligim sababli sizning "${targetOrder.title}" buyurtmangizni qabul qila olmayman (bekor qildim).`;
			api
				.sendMessageToClient(String(targetOrder.clientId), msgText)
				.then(refreshConversations)
				.catch((e) => console.error('sendMessageToClient:', e));

			showToast('Buyurtma rad etildi va mijozga xabar yuborildi', 'error');
		} catch (err) {
			showToast(
				err instanceof Error ? err.message : 'Xatolik yuz berdi',
				'error'
			);
		}
	};

	const updateCurrentMasterAvatar = async (newAvatarUrl: string) => {
		if (!myMasterProfile) return;
		try {
			const updated = await api.updateMaster(myMasterProfile.id, {
				avatarUrl: newAvatarUrl,
			});
			// ProfileTab's "Usta Profili (Kabineti)" avatar reads partnershipAvatar
			// (ps state) - sw() alone left it stuck at whatever it was before, so
			// a successful upload never appeared there even though it saved fine.
			sw('avatar', newAvatarUrl);
			sp('avatar', newAvatarUrl);
			setAllMasters((prev) =>
				prev.map((m) => (m.id === updated.id ? dbMasterToLegacy(updated) : m))
			);
			showToast('Profilingiz rasmi muvaffaqiyatli yangilandi!', 'success');
		} catch (e) {
			console.error('Error updating master avatar:', e);
			showToast('Rasmni saqlashda xatolik yuz berdi.', 'error');
		}
	};

	const handleSavePartnershipProfile = async () => {
		if (!myMasterProfile) return;
		try {
			const updated = await api.updateMaster(myMasterProfile.id, {
				name: partnershipName,
				categoryId: partnershipCategory,
				experience: partnershipExp,
				price: partnershipPrice,
				bio: partnershipBio,
				region: partnershipRegion,
				district: partnershipDistrict,
				phone: partnershipPhone,
				extraPhone: partnershipExtraPhone,
				telegram: partnershipTelegram,
				specialty: partnershipSpecialty,
				services: partnershipServices,
				priceComment: partnershipPriceComment,
			});
			if (mastersFetchAttempted.current) {
				mastersFetchAttempted.current = false;
				loadMasters();
			}
			setAllMasters((prev) =>
				prev.map((m) => (m.id === updated.id ? dbMasterToLegacy(updated) : m))
			);
			showToast(
				'Sozlamalar saqlandi va barcha mijozlar sahifalarida yangilandi!',
				'success'
			);
		} catch (err) {
			showToast(
				err instanceof Error ? err.message : 'Xatolik yuz berdi',
				'error'
			);
		}
	};

	const handleAvatarFileChange = async (
		e: React.ChangeEvent<HTMLInputElement>,
		isAlreadyApproved: boolean
	) => {
		const file = e.target.files?.[0];
		e.target.value = '';
		if (!file) return;
		if (file.size > 5 * 1024 * 1024) {
			showToast('Rasm hajmi juda katta! 5MB dan kam rasm yuklang.', 'error');
			return;
		}
		try {
			const url = await uploadImageFile(file);
			if (isAlreadyApproved) {
				updateCurrentMasterAvatar(url);
			} else {
				sp('avatar', url);
				showToast('Rasm muvaffaqiyatli tanlandi!', 'success');
			}
		} catch {
			showToast('Rasmni yuklashda xatolik yuz berdi.', 'error');
		}
	};

	// Delete/Cancel master received order (if completed, deduct the amount)
	const handleDeleteMasterOrder = async (orderId: string) => {
		const targetOrder = masterOrders.find((o) => o.id === orderId);
		if (!targetOrder) return;

		try {
			await api.updateOrder(orderId, { masterHidden: true });
		} catch (err) {
			showToast(
				err instanceof Error ? err.message : 'Xatolik yuz berdi',
				'error'
			);
			return;
		}

		if (targetOrder.status === 'completed') {
			sp(
				'monthlyEarnings',
				Math.max(0, ps.monthlyEarnings - targetOrder.budget)
			);
			showToast(
				"Bajarilgan buyurtma o'chirildi va oylik daromaddan olib tashlandi.",
				'info'
			);
		} else {
			showToast("Buyurtma ro'yxatdan olib tashlandi.", 'success');
		}

		setMasterOrders(masterOrders.filter((o) => o.id !== orderId));
	};

	// Client confirms job completion. The server credits the assigned master's
	// completedJobs/monthlyEarnings itself once status flips to 'completed'
	// (see api/orders.ts) - this just reflects that in local UI state.
	const handleAwardJobCompletion = async (
		masterId: number,
		orderId: string
	) => {
		try {
			const order = orders.find((o) => o.id === orderId);
			if (order && order.status === 'completed') return;
			await api.updateOrder(orderId, { status: 'completed' });
			setOrders((prev) =>
				prev.map((o) =>
					o.id === orderId ? { ...o, status: 'completed' as const } : o
				)
			);
			setAllMasters((prev) =>
				prev.map((m) =>
					m.id === masterId ? { ...m, completedJobs: m.completedJobs + 1 } : m
				)
			);
			showToast(
				'Ish bajarilganligi tasdiqlandi va usta muvaffaqiyatli ishlari soni oshirildi!',
				'success'
			);
		} catch (err) {
			showToast(
				err instanceof Error ? err.message : 'Xatolik yuz berdi',
				'error'
			);
		}
	};

	const handleOpenBookingModal = (master: Master) => {
		if (isSamePhone(master.phone, currentUstaPhone)) {
			showToast("O'zingizga o'zingiz buyurtma bera olmaysiz!", 'error');
			return;
		}
		if (master.isActive === false) {
			showToast(
				'Usta hozirda dam olmoqda (Noactive holatda). Hozircha buyurtma qabul qilinmaydi!',
				'error'
			);
			return;
		}
		setBookingMaster(master);
		setBookingTitle(`${master.category || 'Xizmat'} (${master.name})`);
		setBookingBudget(String(master.startPrice || ''));
		setBookingDesc(`Siz usta ${master.name} bilan to'g'ridan-to'g'ri buyurtma rasmiylashtiryapsiz.`);
		setBookingRegion(master.region || '');
		setBookingDistrict(master.district || '');
		setBookingModalOpen(true);
	};

	// Premium payment methods
	const handlePaymentProofUpload = async (
		e: React.ChangeEvent<HTMLInputElement>
	) => {
		const file = e.target.files?.[0];
		e.target.value = '';
		if (!file) return;
		if (file.size > 5 * 1024 * 1024) {
			showToast('Rasm hajmi juda katta! 5MB dan kam rasm yuklang.', 'error');
			return;
		}
		try {
			const url = await uploadImageFile(file, 'payments');
			spm('paymentProofImage', url);
			showToast(
				"To'lov cheki rasm sifatida muvaffaqiyatli yuklandi!",
				'success'
			);
		} catch {
			showToast('Rasmni yuklashda xatolik yuz berdi.', 'error');
		}
	};

	const handlePayPremiumSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!paymentPackage) {
			showToast('Iltimos, tarif rejasini tanlang!', 'error');
			return;
		}
		if (!paymentReceipt.trim() && !paymentProofImage) {
			showToast(
				"Iltimos, kvitansiya raqami yoki to'lov cheki rasmini kiriting!",
				'error'
			);
			return;
		}

		const selectedTariff = tariffs.find((t) => t.id === paymentPackage);
		const amount = selectedTariff ? selectedTariff.price : 150000;

		spm('submittingPayment', true);
		try {
			const created = await api.createPayment({
				packageId: paymentPackage,
				amount,
				receiptText: paymentReceipt || undefined,
				proofImageUrl: paymentProofImage || undefined,
			});
			spm('pendingPayments', [created, ...pm.pendingPayments]);
			spm('paymentReceipt', '');
			spm('paymentProofImage', '');
			showToast(
				"To'lov muvaffaqiyatli yuborildi! Admin tez orada tekshiradi.",
				'success'
			);
		} catch (err) {
			showToast(
				err instanceof Error
					? err.message
					: "To'lovni yuborishda xatolik yuz berdi",
				'error'
			);
		} finally {
			spm('submittingPayment', false);
		}
	};

	const handleConfirmBooking = async () => {
		if (!bookingMaster) return;
		if (!bookingTitle.trim()) {
			showToast('Iltimos, buyurtma sarlavhasini kiriting', 'error');
			return;
		}

		try {
			const created = await api.createOrder({
				title: bookingTitle.trim(),
				categoryId: bookingMaster.categoryId || 'all',
				budget: Math.max(0, parseInt(bookingBudget, 10) || 0),
				region: bookingRegion || bookingMaster.region,
				district: bookingDistrict || bookingMaster.district,
				desc: bookingDesc.trim() || 'Tavsif berilmagan.',
				masterId: bookingMaster.id,
			});

			setOrders((prev) => [dbOrderToLegacy(created), ...prev]);
			setBookingModalOpen(false);
			showToast(
				`Usta ${bookingMaster.name} bilan buyurtma rasmiylashtirildi!`,
				'success'
			);

			setActiveTab('orders');
			setClientOrderFilter('pending');
		} catch (err) {
			showToast(
				err instanceof Error
					? err.message
					: 'Buyurtma yaratishda xatolik yuz berdi',
				'error'
			);
		}
	};

	const handleAdvanceOrderStep = (orderId: string) => {
		setOrders((prev) =>
			prev.map((o) => {
				if (o.id === orderId) {
					const nextStep = (o.currentStep || 1) + 1;
					if (nextStep === 7) {
						setSuccessModalData({
							orderId: o.id,
							masterId: o.masterId!,
							masterName: o.masterName || 'Usta',
							masterAvatar:
								o.masterAvatar ||
								'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300',
						});
						setSuccessModalOpen(true);
						return { ...o, currentStep: 7 };
					} else if (nextStep < 7) {
						showToast(
							`Buyurtma bosqichi yangilandi: ${ORDER_STEPS[nextStep - 1].label}`,
							'success'
						);
						return { ...o, currentStep: nextStep };
					}
				}
				return o;
			})
		);
	};

	const handleCloseSuccessAndOpenRating = async () => {
		if (!successModalData) {
			setSuccessModalOpen(false);
			return;
		}

		const { orderId, masterId } = successModalData;
		const currentMaster = allMasters.find((m) => m.id === masterId);
		const order = orders.find((o) => o.id === orderId);

		if (order && order.status !== 'completed') {
			try {
				await api.updateOrder(orderId, { status: 'completed' });
				setOrders((prev) =>
					prev.map((o) =>
						o.id === orderId ? { ...o, status: 'completed' as const } : o
					)
				);
				if (currentMaster) {
					setAllMasters((prev) =>
						prev.map((m) =>
							m.id === masterId ? { ...m, completedJobs: m.completedJobs + 1 } : m
						)
					);
				}
			} catch (err) {
				showToast(
					err instanceof Error ? err.message : 'Xatolik yuz berdi',
					'error'
				);
			}
		}

		setSuccessModalOpen(false);
		setRatingMaster(currentMaster || null);
		setRatingStars(5);
		setRatingComment('');
		setRatingModalOpen(true);
	};

	const handleSubmitRating = async () => {
		if (!ratingMaster || !ratingOrderId) {
			setRatingModalOpen(false);
			return;
		}

		const masterId = ratingMaster.id;
		const orderId = ratingOrderId;
		const reviewText = ratingComment || "Ajoyib xizmat ko'rsatildi! Rahmat.";

		try {
			await api.rateOrder(orderId, {
				clientRating: ratingStars,
				clientReview: reviewText,
			});
			setOrders((prev) =>
				prev.map((o) =>
					o.id === orderId
						? { ...o, clientRating: ratingStars, clientReview: reviewText }
						: o
				)
			);
			// Refetch rather than hand-splice: the server owns the averaged
			// rating/reviewsCount and the full reviews list.
			const freshMaster = await api.getMaster(masterId);
			setAllMasters((prev) =>
				prev.map((m) => (m.id === masterId ? dbMasterToLegacy(freshMaster) : m))
			);
			showToast('Bahoingiz muvaffaqiyatli yuborildi. Rahmat!', 'success');
		} catch (err) {
			showToast(
				err instanceof Error
					? err.message
					: "Xatolik yuz berdi. Iltimos qaytadan urunib ko'ring.",
				'error'
			);
		}

		setRatingModalOpen(false);
		setRatingOrderId(null);
	};

	// Handle pull-to-refresh effect simulator
	const triggerPullToRefresh = () => {
		setIsRefreshing(true);
		showToast("Ma'lumotlar qayta yuklanmoqda...", 'info');
		setTimeout(() => {
			setIsRefreshing(false);
			showToast(
				'Barcha xizmatlar va ustalar muvaffaqiyatli yangilandi!',
				'success'
			);
		}, 1500);
	};

	// Switch region handler which resets district to the first available of that region
	const handleRegionSelect = (region: string) => {
		setSelectedRegion(region);
		setHasSelectedRegion(true);
		const districts = REGION_DATA[region] || [];
		if (districts.length > 0) {
			setSelectedDistrict(districts[0]);
		}
		setBottomSheetStep('district');
	};

	const handleDistrictSelect = (district: string) => {
		setSelectedDistrict(district);
		setBottomSheetOpen(false);
		setShimmerLoading(true);
		showToast(`Hudud o'zgartirildi: ${selectedRegion}, ${district}`, 'success');

		if (myMasterProfile) {
			api
				.updateMaster(myMasterProfile.id, { region: selectedRegion, district })
				.then((updated) => {
					setAllMasters((prev) =>
						prev.map((m) =>
							m.id === updated.id ? dbMasterToLegacy(updated) : m
						)
					);
				})
				.catch((e) => console.error('updateMaster district:', e));
		}

		setTimeout(() => {
			setShimmerLoading(false);
		}, 700);
	};

	// Toggle favorite list
	const toggleFavorite = (id: number, e: React.MouseEvent) => {
		e.stopPropagation();
		if (favorites.includes(id)) {
			setFavorites(favorites.filter((favId) => favId !== id));
			showToast('Sevimlilardan olib tashlandi', 'info');
		} else {
			setFavorites([...favorites, id]);
			showToast("Sevimli ustalar ro'yxatiga qo'shildi!", 'success');
		}
	};

	// Create a brand new order
	const handleCreateOrder = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!newOrderTitle || !newOrderBudget) {
			showToast("Iltimos, sarlavha va narxni to'ldiring", 'error');
			return;
		}

		const categoryId = newOrderCategory;

		try {
			const created = await api.createOrder({
				title: newOrderTitle,
				categoryId,
				budget: Math.max(0, parseInt(newOrderBudget, 10) || 0),
				region: selectedRegion,
				district: selectedDistrict,
				desc: newOrderDesc || 'Tavsif berilmagan.',
			});

			setOrders((prev) => [dbOrderToLegacy(created), ...prev]);
			showToast('Buyurtmangiz muvaffaqiyatli joylashtirildi!', 'success');

			// Clear inputs and redirect
			setNewOrderTitle('');
			setNewOrderBudget('');
			setNewOrderDesc('');
			setActiveTab('orders');

		} catch {
			showToast('Buyurtma yaratishda xatolik yuz berdi.', 'error');
		}
	};

	// Simulated AI recommendation score or system
	const getAIRecommendation = (master: Master) => {
		if (searchQuery) {
			const q = searchQuery.toLowerCase();
			if (
				master.category.toLowerCase().includes(q) ||
				master.name.toLowerCase().includes(q)
			) {
				return 99; // strong match
			}
		}
		// calculate a smart match index
		return Math.round(90 + master.rating * 1.5 + master.experience / 5);
	};

	// Master selection handler to track recently viewed
	const handleSelectMaster = (master: Master) => {
		setViewingMaster(master);
		if (!recentlyViewed.includes(master.id)) {
			setRecentlyViewed([master.id, ...recentlyViewed.slice(0, 3)]);
		}
	};

	// Send a real chat message via /api/conversations, optimistically merging
	// the result into local state (find-or-create - see api/conversations.ts).
	// Resolves to false when the message did not reach the server, so the
	// composer can put the text back instead of silently eating it.
	const sendChatMessage = async (text: string): Promise<boolean> => {
		if (!chatMaster || !text.trim()) return false;
		setDeletedChats((prev) => prev.filter((id) => id !== chatMaster.id));
		const chatMasterId = chatMaster.id;
		const pendingMsg = { text, time: new Date().toISOString() };
		// Show instantly as pending
		setPendingMessages((prev) => ({
			...prev,
			[chatMasterId]: [...(prev[chatMasterId] || []), pendingMsg],
		}));
		try {
			const { conversationId, message } = isMasterChatMode
				? await api.sendMessageToClient(String(chatMaster.id), text)
				: await api.sendMessageToMaster(Number(chatMaster.id), text);
			// Remove from pending, add to confirmed conversations
			setPendingMessages((prev) => {
				const next = { ...prev };
				if (next[chatMasterId]) {
					next[chatMasterId] = next[chatMasterId].filter(
						(p) => p.time !== pendingMsg.time
					);
					if (next[chatMasterId].length === 0) delete next[chatMasterId];
				}
				return next;
			});
			setConversations((prev) => {
				if (prev.some((c) => c.id === conversationId)) {
					return prev.map((c) =>
						c.id === conversationId
							? { ...c, messages: [...c.messages, message], unreadCount: 0 }
							: c
					);
				}
				return [
					...prev,
					{
						id: conversationId,
						viewerRole: isMasterChatMode
							? ('master' as const)
							: ('client' as const),
						partner: { ...chatMaster, categoryId: null },
						messages: [message],
						unreadCount: 0,
						// The message I just sent is by definition unread by them yet.
						partnerUnreadCount: 1,
					},
				];
			});
			return true;
		} catch (err) {
			// Remove failed pending message
			setPendingMessages((prev) => {
				const next = { ...prev };
				if (next[chatMasterId]) {
					next[chatMasterId] = next[chatMasterId].filter(
						(p) => p.time !== pendingMsg.time
					);
					if (next[chatMasterId].length === 0) delete next[chatMasterId];
				}
				return next;
			});
			showToast(
				err instanceof Error ? err.message : 'Xabar yuborilmadi',
				'error'
			);
			return false;
		}
	};

	// Normalize Uzbek text for comparison - handles different Unicode apostrophe variants
	const normalizeUzbek = (s: string): string =>
		s
			.normalize('NFKD')
			.replace(/[ʻʼ`'‘’″′‛´]/g, "'")
			.toLowerCase();

	// Server-side search fetch whenever filters change
	useEffect(() => {
		setSearchPage(1);
	}, [activeCategory, selectedRegion, selectedDistrict, searchQuery, sortBy, hasSelectedRegion]);

	useEffect(() => {
		fetchSearch({
			category: activeCategory,
			...(hasSelectedRegion ? { region: selectedRegion, district: selectedDistrict } : {}),
			q: searchQuery,
			sortBy,
			page: searchPage,
		});
	}, [activeCategory, selectedRegion, selectedDistrict, searchQuery, sortBy, hasSelectedRegion, searchPage, fetchSearch]);

	// Same filters drive the enterprise listings, but only fetched while that
	// toggle is actually selected - clients on the masters view never pay for
	// the request.
	useEffect(() => {
		if (searchMode !== 'enterprise') return;
		fetchEnterpriseOrders({
			category: activeCategory,
			...(hasSelectedRegion ? { region: selectedRegion, district: selectedDistrict } : {}),
			q: searchQuery,
		});
	}, [searchMode, activeCategory, selectedRegion, selectedDistrict, searchQuery, hasSelectedRegion, fetchEnterpriseOrders]);

	// Filter masters dynamically based on region, district, active category, and live search input
	const filteredMasters = useMemo(() => allMasters.filter((master) => {
		if (normalizeUzbek(master.region) !== normalizeUzbek(selectedRegion))
			return false;
		if (normalizeUzbek(master.district) !== normalizeUzbek(selectedDistrict))
			return false;
		if (activeCategory !== 'all' && master.categoryId !== activeCategory)
			return false;
		if (searchQuery.trim() !== '') {
			const query = normalizeUzbek(searchQuery);
			const matchName = normalizeUzbek(master.name).includes(query);
			const matchCategory = normalizeUzbek(master.category).includes(query);
			const matchAbout = normalizeUzbek(master.about).includes(query);
			const matchServices = normalizeUzbek(master.services || '').includes(query);
			const matchSpecialty = normalizeUzbek(master.specialty || '').includes(query);
			if (!matchName && !matchCategory && !matchAbout && !matchServices && !matchSpecialty)
				return false;
		}
		return true;
	}), [allMasters, selectedRegion, selectedDistrict, activeCategory, searchQuery]);

	// Sort filtered masters
	const clientFilteredMasters = useMemo(() => [...filteredMasters].sort((a, b) => {
		if (sortBy === 'jobs')
			return (b.completedJobs || 0) - (a.completedJobs || 0);
		if (sortBy === 'price') return a.startPrice - b.startPrice;
		if (sortBy === 'experience') return b.experience - a.experience;
		return 0;
	}), [filteredMasters, sortBy]);

	// Get total masters count for active region/district
	const localMastersCount = useMemo(() => allMasters.filter(
		(m) =>
			normalizeUzbek(m.region) === normalizeUzbek(selectedRegion) &&
			normalizeUzbek(m.district) === normalizeUzbek(selectedDistrict)
	).length, [allMasters, selectedRegion, selectedDistrict]);

	// While mastersLoaded is still false, we simply don't know this master's
	// premiumUntil yet - treating that as "not active" showed the payment
	// paywall to already-paid masters for however long the fetch took (worse
	// on slow connections, easy to hit). Only fall back to "not active" once
	// the fetch has actually finished (success or failure) and there's
	// genuinely no active premiumUntil.
	const isPremiumActive =
		premiumMode === 'noactive' ||
		!mastersLoaded ||
		(myMasterProfile?.premiumUntil
			? new Date(myMasterProfile.premiumUntil) > new Date()
			: false);
	const activePendingPayment = pendingPayments.find(
		(p) => p.status === 'pending'
	);

	const desktopNavItems = [
		{ id: 'home' as Tab, icon: Home, label: 'Bosh sahifa' },
		{ id: 'orders' as Tab, icon: Calendar, label: 'Buyurtmalar' },
		{ id: 'search' as Tab, icon: Search, label: 'Usta qidirish' },
		{ id: 'messages' as Tab, icon: MessageSquare, label: 'Xabarlar' },
		...(masterStatus === 'approved'
			? [{ id: 'workspace' as Tab, icon: Briefcase, label: 'Ish stolim' }]
			: []),
		{ id: 'profile' as Tab, icon: User, label: 'Profil' },
	];

	// Sync shared store so lazy-loaded tab components can read state
	Object.assign(store, {
		activeTab, setActiveTab, uploadImageFile, isMasterChatMode,
		allMasters, mastersLoaded, searchResults, searchLoading,
		searchQuery, setSearchQuery, activeCategory, setActiveCategory,
		sortBy, setSortBy, fetchSearch, showToast, confirmToast,
		searchPage, setSearchPage, searchTotal, SEARCH_LIMIT,
		searchMode, setSearchMode, enterpriseOrders, enterpriseLoading,
		selectedRegion, selectedDistrict, hasSelectedRegion,
		newOrderTitle, setNewOrderTitle,
		newOrderCategory, setNewOrderCategory,
		newOrderBudget, setNewOrderBudget,
		newOrderDesc, setNewOrderDesc,
		handleCreateOrder,
		conversations, deletedChats, setDeletedChats,
		supportChatOpen, setSupportChatOpen, setChatMaster, isDarkMode,
		viewingLeaderboard, setViewingLeaderboard,
		orders, masterOrders, masterStatus,
		myMasterProfile, viewingMaster, setViewingMaster,
		viewingOrder, setViewingOrder,
		notifications: allNotifications, setNotifications,
		backendUnreadCount, totalUnreadCount,
		ws, dispatchWs, sw,
		pm, dispatchPm, spm,
		ps, dispatchPs, sp,
		ep, dispatchEp, sep,
		premiumMode, isPremiumActive,
		userSession, clerkUserId,
		customLogoUrl,
		api,
		isSamePhone, currentUstaPhone,
		handleSelectMaster, handleOpenBookingModal,
		setBottomSheetOpen, setBottomSheetStep,
		showNotificationsDropdown, setShowNotificationsDropdown,
		notificationsRef,
		pwaInstallPrompt, setPwaInstallPrompt,
		showPwaBanner, setShowPwaBanner,
		setPwaModalOpen, pwaModalOpen,
		ads, theme, cycleTheme,
		setAllCategoriesOpen, setSelectedCategoryForSheet,
		ordersTab, setOrdersTab, clientOrderFilter, setClientOrderFilter,
		masterMonthlyEarnings,
		handleAcceptMasterOrder, handlePostponeMasterOrder,
		handleDeclineMasterOrder, handleCompleteMasterOrder,
		handleDeleteMasterOrder, handleDeleteUserOrder,
		handleOpenRatingModal,
		dbMasterToLegacy,
		setAllMasters,
		chatMaster,
		myTicket,
		handleAvatarFileChange,
		handleSaveWorkspaceProfile, handleSaveWorkingSettings,
		handleSavePartnershipProfile,
		workspaceName, workspacePhone, workspaceAvatar,
		workspaceRegion, workspaceDistrict,
		workspaceHours, workspaceOffDays, workspaceActive,
		hasActiveMasterOrder,
		partnershipName, partnershipPhone, partnershipAvatar,
		partnershipFirstName, partnershipLastName,
		partnershipExtraPhone, partnershipTelegram,
		partnershipCategory, partnershipSpecialty,
		partnershipExp, partnershipPrice,
		partnershipServices, partnershipPriceComment, partnershipBio,
		masterIsActive, premiumTimeLeft,
		tariffs, paymentPackage, paymentReceipt, paymentProofImage,
		submittingPayment,  handlePayPremiumSubmit,
		handlePaymentProofUpload,
		adminCard, adminCardHolder, activePendingPayment,
		pendingPayments, setPaymentHistoryModalOpen,
		profileEditTab,
		masterWorkStart, masterWorkEnd, masterRestDays,
		UstaLogo, onLogout, onAdminOpen, authProfile,
	});

	return (
		<div className={`w-full h-full transition-colors duration-300 bg-surface text-text-primary flex flex-col lg:grid lg:grid-cols-[220px_1fr] relative ${masterStatus === 'approved' ? 'role-master' : ''}`}>
			{/* DESKTOP LEFT SIDEBAR */}
			<aside className="hidden lg:flex flex-col border-r bg-surface-sidebar border-border h-dvh">
				{/* Logo / Brand (sticky top) */}
				<div className="shrink-0 flex items-center gap-2.5 px-5 pt-5 pb-4 border-b border-border">
					<UstaLogo size={28} customUrl={customLogoUrl} onClick={onLogoClick} />
					<div>
						<h1 className="text-sm font-extrabold text-brand dark:text-white tracking-tight leading-none">
							Master Group
						</h1>
						<p className="text-[10px] text-text-secondary font-bold tracking-wide uppercase leading-tight">
							Platformasi
						</p>
					</div>
				</div>

				{/* New search button (sticky top) */}
				<div className="shrink-0 px-3 pt-4 pb-2">
					<button
						onClick={() => {
							setActiveTab('search');
							setActiveCategory('all');
							setSearchQuery('');
						}}
						className={`w-full py-2.5 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
							activeTab === 'search'
								? 'bg-brand text-brand-text shadow-sm'
								: 'bg-brand/10 text-brand hover:bg-brand/20'
						}`}
					>
						<Search size={14} />
						Yangi qo'shish
					</button>
				</div>

				{/* Nav items (scrolls if needed) */}
				<nav className="flex-1 overflow-y-auto flex flex-col gap-0.5 px-3 pt-2 pb-4">
					{desktopNavItems
						.filter((n) => n.id !== 'search')
						.map((item) => {
							const IconComp = item.icon;
							const isActive = activeTab === item.id;
							return (
								<motion.button
									key={item.id}
									aria-label={item.label}
									onClick={() => setActiveTab(item.id)}
									whileHover={{ x: 2 }}
									whileTap={{ scale: 0.98 }}
									className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-xs transition-colors cursor-pointer text-left ${
										isActive
											? 'bg-brand/10 text-brand'
											: 'text-text-secondary hover:bg-surface-tertiary'
									}`}
								>
									{isActive && <motion.span layoutId="navBar" className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-brand" />}
									<IconComp size={18} className="shrink-0" />
									<span>{item.label}</span>
								</motion.button>
							);
						})}
				</nav>

				{/* Quick theme toggle in sidebar */}
				<div className="shrink-0 px-3 py-2">
					<button
						onClick={cycleTheme}
						className="flex items-center gap-3 px-3 py-2 w-full rounded-xl font-bold text-xs text-text-secondary hover:bg-surface-tertiary transition-all cursor-pointer"
						aria-label={
							theme === 'light'
								? 'Tungi rejim'
								: theme === 'dark'
									? 'Tizim rejimi'
									: 'Kunduzgi rejim'
						}
					>
						<span className="flex items-center justify-center w-5 h-5 rounded-md bg-brand/10 text-brand shrink-0">
							{theme === 'light' ? (
								<Moon size={12} />
							) : theme === 'dark' ? (
								<Sun size={12} />
							) : (
								<Monitor size={12} />
							)}
						</span>
						<span className="flex-1 text-left">
							{theme === 'light'
								? 'Tungi rejim'
								: theme === 'dark'
									? 'Kunduzgi rejim'
									: 'Tizim rejimi'}
						</span>
						<span
							className={`relative w-8 h-4 rounded-full transition-colors duration-300 ${
								theme === 'dark'
									? 'bg-brand'
									: theme === 'light'
										? 'bg-amber-400'
										: 'bg-slate-400'
							}`}
						>
							<span
								className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform duration-300 ${
									theme === 'dark'
										? 'translate-x-4'
										: theme === 'light'
											? 'translate-x-0'
											: 'translate-x-2'
								}`}
							/>
						</span>
					</button>
				</div>

				{/* Admin panel button (only for admin users) */}
				{onAdminOpen && (
					<div className="shrink-0 px-3 pb-1">
						<button
							onClick={onAdminOpen}
							className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl font-bold text-xs transition-all cursor-pointer text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 dark:text-amber-400 dark:bg-amber-950/30 dark:border-amber-900/50 dark:hover:bg-amber-950/50"
						>
							<Shield size={18} className="shrink-0" />
							<span>Admin panel</span>
						</button>
					</div>
				)}

				{/* Logout at bottom (sticky bottom) */}
				<div className="shrink-0 px-3 pb-4 pt-2 border-t border-border">
					<button
						onClick={onLogout}
						className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer w-full text-danger border border-transparent hover:bg-danger-bg hover:border-danger-border"
					>
						<LogOut size={18} className="shrink-0" />
						<span>Profilni tark etish</span>
					</button>
				</div>
			</aside>

			{/* INNER CONTENT */}
			<div className="relative flex flex-col flex-1 select-none overflow-y-auto pb-[72px] lg:pb-0">
				<div className="lg:max-w-4xl lg:mx-auto lg:w-full">
					{/* PREMIUM PAYWALL OVERLAY FOR ALL TABS EXCEPT PROFILE */}
					{activeTab !== 'profile' &&
						masterStatus === 'approved' &&
						!isPremiumActive &&
						premiumMode === 'active' && (
							<div className="absolute inset-0 bg-surface z-40 flex flex-col items-center justify-center p-5 overflow-y-auto no-scrollbar">
								<motion.div
									initial={{ opacity: 0, y: 15 }}
									animate={{ opacity: 1, y: 0 }}
									className="w-full max-w-sm bg-surface text-text-primary flex flex-col gap-4 text-center"
								>
									<div className="mx-auto w-12 h-12 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center">
										<Sparkles size={24} />
									</div>

									<div>
										<h3 className="text-sm font-black text-text-primary uppercase tracking-wider flex items-center justify-center gap-1.5">
											💎 Premium Tarif
										</h3>
										<p className="text-[10px] text-text-secondary font-bold mt-1 leading-relaxed">
											Ilovadan foydalanish uchun premium tarifni faollashtiring.
										</p>
									</div>

									{activePendingPayment ? (
										/* PENDING APPROVAL VIEW */
										<div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/25 flex flex-col gap-3 text-center">
											<div className="mx-auto w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
												<Clock size={20} />
											</div>
											<div>
												<h5 className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider">
													To'lovingiz tekshirilmoqda
												</h5>
												<p className="text-[9px] text-text-secondary font-bold mt-1">
													Yuborilgan ariza admin tomonidan ko'rib chiqilmoqda.
												</p>
											</div>

											<div className="p-2.5 rounded-xl bg-surface-tertiary text-[9px] font-bold text-left flex flex-col gap-1.5 text-text-secondary border border-border">
												<div className="flex justify-between items-center">
													<span className="text-text-secondary flex items-center gap-1">
														<Clock size={10} /> Vaqt:
													</span>
													<span className="font-black text-text-primary">
														{new Date(
															activePendingPayment.createdAt
														).toLocaleString('uz-UZ')}
													</span>
												</div>
												<div className="flex justify-between items-center">
													<span className="text-text-secondary flex items-center gap-1">
														<Sparkles size={10} /> Paket:
													</span>
													<span className="text-brand font-black uppercase">
														{tariffs.find(
															(t) => t.id === activePendingPayment.packageId
														)?.name || activePendingPayment.packageId}
													</span>
												</div>
												<div className="flex justify-between items-center">
													<span className="text-text-secondary flex items-center gap-1">
														<CreditCard size={10} /> Summa:
													</span>
													<span className="font-black text-text-primary">
														{(
															activePendingPayment.amount || 0
														).toLocaleString()}{' '}
														UZS
													</span>
												</div>
											</div>
										</div>
									) : (
										/* PURCHASE FLOW */
										<form
											onSubmit={handlePayPremiumSubmit}
											className="flex flex-col gap-4 text-left"
										>
											<div className="flex flex-col gap-1.5">
												<span className="text-[9px] font-black uppercase text-text-secondary tracking-wider flex items-center gap-1">
													<Sparkles size={10} /> 1. Tarif rejasini tanlang:
												</span>
												{tariffs.length === 0 ? (
													<p className="text-[10px] font-bold text-text-secondary p-2.5 bg-surface-tertiary rounded-xl border border-border">
														Hozircha tariflar mavjud emas. Iltimos, birozdan so'ng qayta urinib ko'ring.
													</p>
												) : (
													<div className="grid grid-cols-3 gap-1.5">
														{tariffs.map((pkg) => (
															<button
																key={pkg.id}
																type="button"
																onClick={() => spm('paymentPackage', pkg.id)}
																className={`p-1.5 rounded-xl border flex flex-col gap-0.5 items-center justify-center transition-all cursor-pointer ${
																	paymentPackage === pkg.id
																		? 'border-brand bg-blue-500/5'
																		: 'border-border hover:border-slate-400 dark:hover:border-slate-500'
																}`}
															>
																<span className="text-[9px] font-black uppercase text-text-secondary truncate max-w-full">
																	{pkg.name}
																</span>
																<span
																	className={`text-[10px] font-black ${paymentPackage === pkg.id ? 'text-brand' : 'text-text-primary'}`}
																>
																	{(pkg.price || 0).toLocaleString()} UZS
																</span>
															</button>
														))}
													</div>
												)}
											</div>

											<div className="flex flex-col gap-1.5 p-2.5 bg-surface-tertiary rounded-2xl border border-border">
												<span className="text-[9px] font-black uppercase text-text-secondary tracking-wider flex items-center gap-1">
													<CreditCard size={10} /> 2. To'lov tafsilotlari:
												</span>

												<div className="p-2 rounded-xl bg-surface-card border border-border flex flex-col gap-1">
													<div className="flex justify-between items-center text-[9px] font-bold">
														<span className="text-text-secondary">
															Karta raqami:
														</span>
														<span className="text-text-primary font-mono font-black tracking-wider flex items-center gap-1.5">
															{adminCard}
															<button
																type="button"
																onClick={() => {
																	navigator.clipboard.writeText(
																		adminCard.replace(/\s+/g, '')
																	);
																	showToast('Karta raqami nusxalandi!', 'info');
																}}
																className="text-brand text-[10px] uppercase hover:underline cursor-pointer font-black flex items-center gap-0.5"
															>
																<Copy size={8} /> Nusxa
															</button>
														</span>
													</div>
													<div className="flex justify-between text-[9px] font-bold">
														<span className="text-text-secondary">Karta egasi:</span>
														<span className="text-text-primary font-black uppercase truncate max-w-[120px]">
															{adminCardHolder}
														</span>
													</div>
												</div>
											</div>

											<div className="flex flex-col gap-1.5">
												<label className="text-[9px] font-black uppercase text-text-secondary tracking-wider flex items-center gap-1">
													<CheckCircle2 size={10} /> 3. To'lov tasdig'i:
												</label>
												<input
													type="text"
													value={paymentReceipt}
													onChange={(e) =>
														spm('paymentReceipt', e.target.value)
													}
													placeholder="Kvitansiya / tranzaksiya raqami"
													className="w-full p-2 text-xs font-bold rounded-xl border border-border outline-none bg-surface-input text-text-primary focus:border-brand"
												/>

												{/* Receipt Image Upload */}
												<div className="mt-0.5 flex items-center gap-2">
													<label className="flex-1 py-2 px-3 border border-dashed border-border hover:border-slate-400 dark:hover:border-slate-500 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer text-[9px] font-bold bg-surface-tertiary">
														<Upload size={10} className="text-text-secondary" />
														<span className="text-text-secondary truncate">
															{paymentProofImage
																? 'Chek rasmi yuklandi ✓'
																: 'Chek rasmini yuklash'}
														</span>
														<input
															type="file"
															accept="image/*"
															onChange={handlePaymentProofUpload}
															className="hidden"
														/>
													</label>
												</div>
											</div>

											<button
												type="submit"
												disabled={submittingPayment}
												className="w-full py-2.5 bg-brand hover:bg-brand-hover disabled:opacity-50 text-white font-black text-xs rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-blue-900/10"
											>
												{submittingPayment ? (
													<span>Yuborilmoqda...</span>
												) : (
													<>
														<CheckCircle2 size={13} />
														<span>To'lovni yuborish</span>
													</>
												)}
											</button>
										</form>
									)}
								</motion.div>
							</div>
						)}

					{/* TOAST SYSTEM POPUP */}
					<AnimatePresence>
						{toast && (
							<motion.div
								initial={{ opacity: 0, y: -24 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -16, scale: 0.95 }}
								transition={{ type: 'spring', stiffness: 350, damping: 25 }}
								className="fixed top-14 left-1/2 -translate-x-1/2 z-[9999] w-[90%] sm:w-auto sm:min-w-[400px] max-w-lg pointer-events-none"
							>
								<div
									className={`flex items-center gap-3 p-4 sm:p-5 rounded-2xl shadow-2xl border text-left font-semibold text-sm sm:text-base leading-relaxed backdrop-blur-xl ${
										toast.type === 'success'
											? 'bg-emerald-600/95 text-white border-emerald-400/30 shadow-emerald-500/20'
											: toast.type === 'error'
												? 'bg-rose-600/95 text-white border-rose-400/30 shadow-rose-500/20'
												: 'bg-sky-600/95 text-white border-sky-400/30 shadow-sky-500/20'
									}`}
								>
									<span>{toast.message}</span>
								</div>
							</motion.div>
						)}
					</AnimatePresence>

					{/* CONFIRM DIALOG (replaces window.confirm) */}
					<AnimatePresence>
						{confirmDialog && (
							<motion.div
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
							>
								<motion.div
									initial={{ opacity: 0, scale: 0.95, y: 10 }}
									animate={{ opacity: 1, scale: 1, y: 0 }}
									exit={{ opacity: 0, scale: 0.95, y: 10 }}
									className="bg-white dark:bg-surface rounded-2xl shadow-2xl border border-border p-5 max-w-sm w-full text-left"
								>
									<p className="text-sm font-bold text-text-primary leading-relaxed mb-5">
										{confirmDialog.message}
									</p>
									<div className="flex gap-2.5 justify-end">
										<button
											onClick={() => { confirmDialog.resolve(false); setConfirmDialog(null); }}
											className="px-4 py-2.5 rounded-xl text-xs font-black text-text-secondary bg-surface-tertiary hover:bg-border transition-all cursor-pointer"
										>
											Yo'q
										</button>
										<button
											onClick={() => { confirmDialog.resolve(true); setConfirmDialog(null); }}
											className="px-4 py-2.5 rounded-xl text-xs font-black text-white bg-brand hover:bg-brand-hover transition-all cursor-pointer"
										>
											Ha
										</button>
									</div>
								</motion.div>
							</motion.div>
						)}
					</AnimatePresence>

					{/* Integrated Header and Body Views below */}

					{/* APP VIEWS ACCORDING TO TABS */}
					<div className="pb-24">
						<AnimatePresence mode="wait">
							<motion.div
								key={activeTab}
								initial={{ opacity: 0, y: 6 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -4 }}
								transition={{ duration: 0.15, ease: 'easeOut' }}
							>
								{activeTab === 'home' && (
									<Suspense fallback={<div className="flex items-center justify-center p-4"><div className="w-4 h-4 border-2 border-brand/30 border-t-brand rounded-full animate-spin" /></div>}>
										<HomeTab />
									</Suspense>
								)}
								{activeTab === 'search' && (
									<Suspense fallback={<div className="flex items-center justify-center p-4"><div className="w-4 h-4 border-2 border-brand/30 border-t-brand rounded-full animate-spin" /></div>}>
										<SearchTab />
									</Suspense>
								)}
								{activeTab === 'orders' && (
									<Suspense fallback={<div className="flex items-center justify-center p-4"><div className="w-4 h-4 border-2 border-brand/30 border-t-brand rounded-full animate-spin" /></div>}>
										<OrdersTab />
									</Suspense>
								)}
								{activeTab === 'create' && (
									<Suspense fallback={<div className="flex items-center justify-center p-4"><div className="w-4 h-4 border-2 border-brand/30 border-t-brand rounded-full animate-spin" /></div>}>
										<CreateTab />
									</Suspense>
								)}
								{activeTab === 'messages' && (
									<Suspense fallback={<div className="flex items-center justify-center p-4"><div className="w-4 h-4 border-2 border-brand/30 border-t-brand rounded-full animate-spin" /></div>}>
										<MessagesTab />
									</Suspense>
								)}
								{activeTab === 'workspace' && (
									masterStatus === 'approved' ? (
										<Suspense fallback={<div className="flex items-center justify-center p-4"><div className="w-4 h-4 border-2 border-brand/30 border-t-brand rounded-full animate-spin" /></div>}>
											<WorkspaceTab />
										</Suspense>
									) : (
										<div className="p-4">
											<ForbiddenPage message="Ish maydoni faqat tasdiqlangan ustalar uchun ochiq." />
										</div>
									)
								)}
								{activeTab === 'profile' && (
									<Suspense fallback={<div className="flex items-center justify-center p-4"><div className="w-4 h-4 border-2 border-brand/30 border-t-brand rounded-full animate-spin" /></div>}>
										<ProfileTab />
									</Suspense>
								)}
							</motion.div>
						</AnimatePresence>
					</div>

					<ChatOverlay
						chatMaster={chatMaster}
						activeChatMessages={allChatMessages}
						isMasterChatMode={isMasterChatMode}
						partnerUnreadCount={activeConversation?.partnerUnreadCount ?? 1}
						onClose={() => setChatMaster(null)}
						onSend={sendChatMessage}
						onDelete={async () => {
							const ok = await confirmToast("Ushbu suhbatni o'chirmoqchimisiz? (Faqat siz uchun o'chiriladi)");
							if (!ok) return;
							setDeletedChats((prev) => [...prev, chatMaster!.id]);
							setChatMaster(null);
							showToast("Suhbat o'chirildi.", 'info');
						}}
					/>

					<SupportChat
						open={supportChatOpen}
						myTicket={myTicket}
						onClose={() => setSupportChatOpen(false)}
						onSend={async (text) => {
							try {
								const updated = await api.sendSupportMessage(text);
								setMyTicket(updated);
							} catch (err) {
								showToast(
									err instanceof Error ? err.message : 'Xabar yuborilmadi',
									'error'
								);
							}
						}}
					/>
				</div>
				{/* /.max-w-4xl wrapper */}

				{/* BOTTOM NAVIGATION (mobile only) */}
				{!(activeTab === 'messages' && (chatMaster || supportChatOpen)) && (
					<div className={`lg:hidden fixed bottom-0 left-0 right-0 z-40 grid ${masterStatus === 'approved' ? 'grid-cols-6' : 'grid-cols-5'} border-t bg-surface-nav border-border safe-area-pb`}>
						{/* Tab 1: Home */}
						<button
							aria-label="Bosh sahifa"
							onClick={() => setActiveTab('home')}
							className={`relative flex flex-col items-center justify-center pt-2 pb-2.5 transition-all cursor-pointer ${
								activeTab === 'home'
									? 'text-brand'
									: 'text-text-secondary hover:text-slate-600'
							}`}
						>
							<div className={`flex items-center justify-center w-10 h-10 rounded-xl mb-0.5 transition-colors ${activeTab === 'home' ? 'bg-brand/10' : ''}`}>
								<Home size={20} />
							</div>
							<span
								className={`text-[9px] font-black leading-none ${activeTab === 'home' ? 'text-brand' : 'text-text-secondary'}`}
							>
								Bosh sahifa
							</span>
						</button>

						{/* Tab 2: Orders */}
						<button
							aria-label="Buyurtmalar"
							onClick={() => setActiveTab('orders')}
							className={`flex flex-col items-center justify-center pt-2 pb-2.5 transition-all cursor-pointer ${
								activeTab === 'orders'
									? 'text-brand'
									: 'text-text-secondary hover:text-slate-600'
							}`}
						>
							<div className={`flex items-center justify-center w-10 h-10 rounded-xl mb-0.5 transition-colors ${activeTab === 'orders' ? 'bg-brand/10' : ''}`}>
								<Calendar size={20} />
							</div>
							<span
								className={`text-[9px] font-black leading-none ${activeTab === 'orders' ? 'text-brand' : 'text-text-secondary'}`}
							>
								Buyurtmalar
							</span>
						</button>

						{/* Tab 3: Search (Elevated FAB) */}
						<div className="flex items-center justify-center">
							<motion.button
								aria-label="Usta qidirish"
								onClick={() => {
									setActiveTab('search');
									setActiveCategory('all');
									setSearchQuery('');
									showToast("Usta qidirish bo'limi", 'info');
								}}
								whileHover={{ scale: 1.08 }}
								whileTap={{ scale: 0.92 }}
								className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-colors -translate-y-3 ${
									activeTab === 'search'
										? 'bg-blue-700 text-white shadow-blue-500/30 scale-110'
										: 'bg-brand text-white hover:bg-brand-hover'
								}`}
								title="Usta qidirish"
							>
								<Search size={20} />
							</motion.button>
						</div>

						{/* Tab 4: Messages */}
						<button
							aria-label="Xabarlar"
							onClick={() => setActiveTab('messages')}
							className={`flex flex-col items-center justify-center pt-2 pb-2.5 transition-all cursor-pointer ${
								activeTab === 'messages'
									? 'text-brand'
									: 'text-text-secondary hover:text-slate-600'
							}`}
						>
							<div className={`flex items-center justify-center w-10 h-10 rounded-xl mb-0.5 transition-colors ${activeTab === 'messages' ? 'bg-brand/10' : ''}`}>
								<MessageSquare size={20} />
							</div>
							<span
								className={`text-[9px] font-black leading-none ${activeTab === 'messages' ? 'text-brand' : 'text-text-secondary'}`}
							>
								Xabarlar
							</span>
						</button>

						{/* Tab 5: Workspace (masters only) */}
						{masterStatus === 'approved' && (
							<button
								aria-label="Ish stolim"
								onClick={() => setActiveTab('workspace')}
								className={`flex flex-col items-center justify-center pt-2 pb-2.5 transition-all cursor-pointer ${
									activeTab === 'workspace'
										? 'text-brand'
										: 'text-text-secondary hover:text-slate-600'
								}`}
							>
								<div className={`flex items-center justify-center w-10 h-10 rounded-xl mb-0.5 transition-colors ${activeTab === 'workspace' ? 'bg-brand/10' : ''}`}>
									<Briefcase size={20} />
								</div>
								<span
									className={`text-[9px] font-black leading-none ${activeTab === 'workspace' ? 'text-brand' : 'text-text-secondary'}`}
								>
									Ish stolim
								</span>
							</button>
						)}

						{/* Tab 6: Profile */}
						<button
							aria-label="Profil"
							onClick={() => setActiveTab('profile')}
							className={`flex flex-col items-center justify-center pt-2 pb-2.5 transition-all cursor-pointer ${
								activeTab === 'profile'
									? 'text-brand'
									: 'text-text-secondary hover:text-slate-600'
							}`}
						>
							<div className={`flex items-center justify-center w-10 h-10 rounded-xl mb-0.5 transition-colors ${activeTab === 'profile' ? 'bg-brand/10' : ''}`}>
								<User size={20} />
							</div>
							<span
								className={`text-[9px] font-black leading-none ${activeTab === 'profile' ? 'text-brand' : 'text-text-secondary'}`}
							>
								Profil
							</span>
						</button>
					</div>
				)}

				{/* BOTTOM SHEET: REGION & DISTRICT SELECTION POPUP */}
				<AnimatePresence>
					{bottomSheetOpen && (
						<div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 backdrop-blur-sm">
							{/* Backing dismiss trigger */}
							<div
								className="absolute inset-0"
								onClick={() => setBottomSheetOpen(false)}
							/>

							<motion.div
								initial={{ y: '100%' }}
								animate={{ y: 0 }}
								exit={{ y: '100%' }}
								transition={{ type: 'spring', damping: 25, stiffness: 220 }}
								className="w-full max-w-lg rounded-t-[32px] p-6 shadow-2xl relative z-10 max-h-[85vh] flex flex-col overflow-y-auto no-scrollbar bg-surface text-text-primary"
							>
								{/* Drag accent bar */}
								<div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-4 shrink-0" />

								<div className="flex items-center justify-between mb-4 border-b pb-3 border-slate-50 dark:border-slate-800/80">
									<div>
										<h3 className="text-sm font-black flex items-center gap-1 text-brand">
											<MapPin size={16} />
											{bottomSheetStep === 'region'
												? 'Viloyatni tanlang'
												: 'Tumanni tanlang'}
										</h3>
										<p className="text-[10px] text-text-secondary font-bold mt-0.5">
											{bottomSheetStep === 'region'
												? "O'zbekiston hududlari ro'yxati"
												: `${selectedRegion} tumanlari`}
										</p>
									</div>

									<button
										onClick={() => setBottomSheetOpen(false)}
										className="p-1.5 rounded-lg text-text-secondary hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
									>
										<X size={16} />
									</button>
								</div>

								{bottomSheetStep === 'region' ? (
									// STEP 1: REGIONS LIST
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
										{Object.keys(REGION_DATA).map((region) => (
											<button
												key={region}
												onClick={() => handleRegionSelect(region)}
												className={`w-full text-left p-3 rounded-2xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-between ${
													selectedRegion === region
														? 'bg-brand/10 border-brand text-brand'
														: 'border-slate-100 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800/60'
												}`}
											>
												<span>{region}</span>
												<ChevronRight size={13} className="text-brand" />
											</button>
										))}
									</div>
								) : (
									// STEP 2: DISTRICTS LIST
									<div className="flex flex-col gap-2">
										<button
											onClick={() => setBottomSheetStep('region')}
											className="text-xs font-bold text-text-secondary hover:text-slate-600 mb-2 flex items-center gap-1 cursor-pointer"
										>
											<ChevronLeft size={14} /> Viloyatlar ro'yxatiga qaytish
										</button>

										<div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
											{(REGION_DATA[selectedRegion] || []).map((district) => (
												<button
													key={district}
													onClick={() => handleDistrictSelect(district)}
													className={`w-full text-left p-3 rounded-2xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-between ${
														selectedDistrict === district
															? 'bg-brand/10 border-brand text-brand'
															: 'border-slate-100 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800/60'
													}`}
												>
													<span>{district}</span>
													<CheckCircle2
														size={13}
														className={
															selectedDistrict === district
																? 'text-brand'
																: 'opacity-0'
														}
													/>
												</button>
											))}
										</div>
									</div>
								)}
							</motion.div>
						</div>
					)}
				</AnimatePresence>

				{/* BOTTOM SHEET / MODAL: ALL CATEGORIES & NESTED MASTERS */}
				<AnimatePresence>
					{allCategoriesOpen && (
						<div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 backdrop-blur-sm">
							<div
								className="absolute inset-0"
								onClick={() => setAllCategoriesOpen(false)}
							/>

							<motion.div
								initial={{ y: '100%' }}
								animate={{ y: 0 }}
								exit={{ y: '100%' }}
								transition={{ type: 'spring', damping: 25, stiffness: 220 }}
								className="w-full max-w-lg rounded-t-[32px] p-6 shadow-2xl relative z-10 h-[80vh] flex flex-col bg-surface text-text-primary"
							>
								{/* Drag accent bar */}
								<div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-4 shrink-0" />

								{/* Header */}
								<div className="flex items-center justify-between mb-4 border-b pb-3 border-slate-50 dark:border-slate-800/80 shrink-0">
									<div>
										<h3 className="text-sm font-black flex items-center gap-1.5 text-brand dark:text-blue-400">
											<Layers size={16} />
											{selectedCategoryForSheet
												? selectedCategoryForSheet.name
												: 'Barcha toifalar'}
										</h3>
										<p className="text-[10px] text-text-secondary font-bold mt-0.5">
											{selectedCategoryForSheet
												? `${selectedCategoryForSheet.name} toifasidagi ustalar ro'yxati`
												: "Xizmat turini tanlang va mutaxassislarni ko'ring"}
										</p>
									</div>

									<button
										onClick={() => setAllCategoriesOpen(false)}
										className="p-1.5 rounded-lg text-text-secondary hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
									>
										<X size={16} />
									</button>
								</div>

								{/* Content body with custom styling */}
								<div className="flex-1 overflow-y-auto no-scrollbar pb-6">
									{!selectedCategoryForSheet ? (
										// STEP 1: CATEGORIES GRID/LIST
										<div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
											{CATEGORIES.filter((c) => c.id !== 'all').map(
												(category) => {
													const IconComp = category.icon;
													const mastersCount = allMasters.filter(
														(m) =>
															m.categoryId === category.id &&
															normalizeUzbek(m.region) ===
																normalizeUzbek(selectedRegion) &&
															normalizeUzbek(m.district) ===
																normalizeUzbek(selectedDistrict)
													).length;
												const catImg =
													localStorage.getItem(
														`Usta_category_image_${category.id}`
													) || category.image;
												const catResp = catImg && !catImg.startsWith('data:') ? responsiveCategoryImgProps(catImg) : { src: catImg, srcSet: undefined };
												return (
													<button
														key={category.id}
														onClick={() =>
															setSelectedCategoryForSheet(category)
														}
														className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group active:scale-[0.99] ${
															isDarkMode
																? 'bg-[#1e2329] border-slate-800 hover:bg-slate-800/80 text-slate-200'
																: 'bg-surface-card border-border hover:bg-slate-50/80 text-slate-700 shadow-sm'
														}`}
													>
														<div className="flex items-center gap-3 text-left">
															<div className="w-12 h-12 rounded-2xl overflow-hidden shrink-0 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-center bg-slate-50 dark:bg-slate-900 transition-transform group-hover:scale-105">
																{catImg ? (
																	<img
																		loading="lazy"
																		src={catResp.src}
																		srcSet={catResp.srcSet}
																		sizes="48px"
																			className="w-full h-full object-cover"
																			alt={category.name}
																			referrerPolicy="no-referrer"
																		/>
																	) : (
																		<div className="p-2 w-full h-full flex items-center justify-center rounded-2xl bg-brand/10 text-brand">
																			<IconComp size={18} />
																		</div>
																	)}
																</div>
																<div>
																	<h4 className="text-xs font-extrabold">
																		{category.name}
																	</h4>
																	<span className="text-[9px] text-text-secondary font-bold block mt-0.5">
																		{mastersCount > 0
																			? `${mastersCount} ta mutaxassis`
																			: 'Ustalar mavjud emas'}
																	</span>
																</div>
															</div>
															<ChevronRight
																size={14}
																className="text-text-secondary group-hover:text-brand transition-colors"
															/>
														</button>
													);
												}
											)}
										</div>
									) : (
										// STEP 2: MASTERS FOR SELECTED CATEGORY
										<div className="flex flex-col gap-2.5">
											<button
												onClick={() => setSelectedCategoryForSheet(null)}
												className="text-[10px] font-black text-text-secondary hover:text-brand mb-2 flex items-center gap-1.5 cursor-pointer self-start transition-colors uppercase"
											>
												<ChevronLeft size={14} /> Toifalar ro'yxatiga qaytish
											</button>

											{(() => {
												const categoryMasters = allMasters.filter(
													(m) =>
														m.categoryId === selectedCategoryForSheet.id &&
														normalizeUzbek(m.region) ===
															normalizeUzbek(selectedRegion) &&
														normalizeUzbek(m.district) ===
															normalizeUzbek(selectedDistrict)
												);
												if (categoryMasters.length === 0) {
													return (
														<div className="text-center py-12 px-4">
															<div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
																<User size={20} className="text-text-secondary" />
															</div>
															<h4 className="text-xs font-black text-slate-600 dark:text-slate-300">
																Usta bu yo'nalishda mavjud emas
															</h4>
															<p className="text-[10px] text-text-secondary font-bold mt-1">
																Tez orada yangi mutaxassislar qo'shiladi!
															</p>
														</div>
													);
												}

												return (
													<div className="flex flex-col gap-2.5">
														{categoryMasters.map((master) => (
															<div
																key={master.id}
																onClick={() => {
																	setViewingMaster(master);
																	setAllCategoriesOpen(false); // Close category sheet so master card details are presented nicely
																	showToast(`${master.name} profili`, 'info');
																}}
																className={`p-3.5 rounded-2xl border cursor-pointer transition-all active:scale-[0.99] hover:shadow-sm ${
																	isDarkMode
																		? 'bg-[#1e2329] border-slate-800 hover:bg-slate-800/80 text-slate-200'
																		: 'bg-surface-card border-border hover:bg-slate-50/80 text-slate-700 shadow-sm'
																}`}
															>
																<div className="flex items-center gap-3">
																	<div className="relative shrink-0">
																		<img
																			loading="lazy"
																			src={master.avatar}
																			alt={`${master.name} – Usta`}
																			className="w-11 h-11 rounded-xl object-cover avatar-face shadow-sm"
																		/>
																		{master.isOnline && (
																			<span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-white dark:border-[#1e2329]" />
																		)}
																	</div>
																	<div className="flex-1 min-w-0 text-left">
																		<div className="flex items-center justify-between gap-1">
																			<h4 className="text-xs font-black truncate text-slate-800 dark:text-white flex items-center gap-1">
																				{master.name}
																				{master.isVerified && (
																					<CheckCircle2
																						size={11}
																						className="text-blue-500 fill-blue-500/10 shrink-0"
																					/>
																				)}
																			</h4>
																			<span className="text-[10px] font-black text-brand dark:text-blue-400 shrink-0 flex items-center gap-0.5 font-mono">
																				<Briefcase
																					size={10}
																					className="text-brand dark:text-blue-400"
																				/>{' '}
																				{master.completedJobs || 0} ta ish
																			</span>
																		</div>
																		<div className="flex items-center gap-2 mt-1">
																			<span className="text-[9px] text-brand dark:text-blue-400 font-extrabold px-1.5 py-0.5 rounded-md bg-brand/5 dark:bg-blue-500/10">
																				{master.experience} yil tajriba
																			</span>
																			<span className="text-[9px] text-text-secondary font-bold">
																				bajarilgan
																			</span>
																		</div>
																		<p className="text-[9px] text-text-secondary font-bold mt-1.5 flex items-center gap-1">
																			<MapPin
																				size={10}
																				className="text-text-secondary"
																			/>
																			{master.region}, {master.district}
																		</p>
																	</div>
																</div>
															</div>
														))}
													</div>
												);
											})()}
										</div>
									)}
								</div>
							</motion.div>
						</div>
					)}
				</AnimatePresence>

				{/* BOTTOM SHEET / MODAL: VIEW MASTER DETAILED PROFILE */}
				<AnimatePresence>
					{viewingMaster && (
						<div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 backdrop-blur-sm">
							<div
								className="absolute inset-0"
								onClick={() => setViewingMaster(null)}
							/>

							<motion.div
								initial={{ y: '100%' }}
								animate={{ y: 0 }}
								exit={{ y: '100%' }}
								transition={{ type: 'spring', damping: 25, stiffness: 220 }}
								className="w-full max-w-lg rounded-t-[32px] p-6 shadow-2xl relative z-10 max-h-[90vh] flex flex-col overflow-y-auto no-scrollbar bg-surface text-text-primary"
							>
								{/* Drag handle */}
								<div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-4 shrink-0" />

								<div className="flex justify-between items-start mb-4">
									<div className="flex items-center gap-3">
										<img
											loading="lazy"
											src={viewingMaster.avatar}
											alt={`${viewingMaster.name} – Usta tafsilotlari`}
											className="w-14 h-14 rounded-2xl object-cover avatar-face shadow"
										/>
										<div>
											<div className="flex items-center gap-1">
												<h3 className="text-sm font-black">
													{viewingMaster.name}
												</h3>
												{viewingMaster.isVerified && (
													<span className="p-0.5 bg-blue-500 text-white rounded-full flex items-center justify-center shrink-0">
														<CheckCircle2 size={10} fill="currentColor" />
													</span>
												)}
											</div>
											<span
												onClick={() => {
													setViewingMaster(null);
													setActiveCategory(viewingMaster.categoryId);
													setActiveTab('search');
													setSearchQuery('');
												}}
												className="text-[10px] font-extrabold text-brand dark:text-blue-400 hover:underline cursor-pointer uppercase tracking-wider block mt-0.5"
											>
												{viewingMaster.category}
											</span>
											<span className="text-[9px] text-text-secondary font-bold block">
												{viewingMaster.region}, {viewingMaster.district}
											</span>
										</div>
									</div>

									<button
										onClick={() => setViewingMaster(null)}
										className="p-1.5 rounded-lg text-text-secondary hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
									>
										<X size={16} />
									</button>
								</div>

								{/* Verified premium badge or safety guarantee banner */}
								<div className="mb-4 p-3 bg-blue-500/10 border border-blue-100/40 dark:border-blue-500/20 rounded-2xl flex items-center gap-2.5 text-brand text-[10px] font-bold">
									<Shield size={14} />
									<span>
										Master Group Xavfsiz Shartnoma kafolati ostida ishlaydigan
										professional
									</span>
								</div>

								{viewingMaster.isActive === false && (
									<div className="mb-4 p-3 bg-rose-500/10 border border-rose-200/40 rounded-2xl flex items-center gap-2 text-rose-600 dark:text-rose-400 text-[10px] font-bold text-left">
										<XCircle size={14} className="select-none shrink-0" />
										<span>
											Usta hozirda dam olmoqda (Noactive holatda). Yangi
											buyurtmalar qabul qilinmaydi!
										</span>
									</div>
								)}

								{/* About Description */}
								<div className="mb-4 text-left">
									<h4 className="text-[10px] font-black uppercase tracking-wider text-text-secondary mb-1.5">
										Usta haqida
									</h4>
									<p className="text-xs font-bold leading-relaxed text-slate-600 dark:text-slate-300">
										{viewingMaster.about}
									</p>
								</div>

								{/* Ish Sharoitlari va Tafsilotlar (Usta kiritgan ish vaqti, to'lov summalari vizitkada aks etadi) */}
								<div className="mb-4 p-4 rounded-2xl bg-surface-card border border-border shadow-sm text-left flex flex-col gap-3">
									<h4 className="text-[9.5px] font-black uppercase tracking-wider text-brand border-b pb-1.5 border-border flex items-center gap-1">
										<Clock size={12} />
										Ish vaqti rejimi va xizmat narxlari
									</h4>

									<div className="grid grid-cols-2 gap-3 text-[10.5px]">
										<div className="flex flex-col gap-0.5">
											<span className="text-[10px] text-text-secondary font-extrabold uppercase">
												Ish vaqti rejimi:
											</span>
											<span className="font-black text-text-primary">
												{viewingMaster.workHours || '09:00 - 18:00'}
											</span>
										</div>
										<div className="flex flex-col gap-0.5">
											<span className="text-[10px] text-text-secondary font-extrabold uppercase">
												Dam olish kunlari:
											</span>
											{viewingMaster.offDays &&
											viewingMaster.offDays.length > 0 ? (
												<div className="flex flex-wrap gap-1 mt-0.5">
													{viewingMaster.offDays.map((day) => (
														<span
															key={day}
															className="px-1.5 py-0.5 text-[9px] font-black bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 rounded shadow-sm"
														>
															{day}
														</span>
													))}
												</div>
											) : viewingMaster.restDays &&
											  viewingMaster.restDays !== "Yo'q" &&
											  viewingMaster.restDays !== "Yo'q (Har kuni)" ? (
												<span className="font-black text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 px-2 py-0.5 text-[9px] border border-rose-200 dark:border-rose-500/30 rounded shadow-sm self-start mt-0.5">
													{viewingMaster.restDays}
												</span>
											) : (
												<span className="font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 text-[9px] border border-emerald-100 dark:border-emerald-500/30 rounded shadow-sm self-start mt-0.5">
													Yo'q (Har kuni ishlaydi)
												</span>
											)}
										</div>
									</div>

									<div className="grid grid-cols-2 gap-3 text-[10.5px] border-t pt-2 border-border">
										<div className="flex flex-col gap-0.5">
											<span className="text-[10px] text-text-secondary font-extrabold uppercase">
												Mutaxassisligi:
											</span>
											<span className="font-black text-text-primary">
												{viewingMaster.specialty || 'Professional mutaxassis'}
											</span>
										</div>
										<div className="flex flex-col gap-0.5">
											<span className="text-[10px] text-text-secondary font-extrabold uppercase">
												Xizmat narxi (soatiga):
											</span>
											<span className="font-black text-blue-600">
											{viewingMaster.startPrice
												? `${viewingMaster.startPrice.toLocaleString()} UZS`
													: 'Kelishiladi'}
											</span>
										</div>
									</div>

									{viewingMaster.priceComment && (
										<div className="text-[10px] text-text-secondary bg-surface-tertiary p-2 rounded-xl border border-border">
											<span className="font-black text-[10px] uppercase tracking-wider text-brand block mb-0.5">
												Narx izohi:
											</span>
											{viewingMaster.priceComment}
										</div>
									)}

									{viewingMaster.services && (
										<div className="text-[10px] text-slate-600 dark:text-text-secondary bg-white/55 dark:bg-slate-900 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
											<span className="font-black text-[10px] uppercase tracking-wider text-brand dark:text-blue-400 block mb-0.5">
												Xizmatlar ro'yxati:
											</span>
											<p className="whitespace-pre-line leading-relaxed font-bold">
												{viewingMaster.services}
											</p>
										</div>
									)}

									{(viewingMaster.extraPhone || viewingMaster.telegram) && (
										<div className="border-t pt-2 border-slate-100 dark:border-slate-800 flex flex-col gap-1.5">
											{viewingMaster.extraPhone && (
												<div className="text-[10.5px] text-slate-700 dark:text-slate-200 flex items-center justify-between">
													<span className="text-[10px] text-text-secondary font-extrabold uppercase">
														Qo'shimcha telefon:
													</span>
													<span className="font-mono font-black">
														{viewingMaster.extraPhone}
													</span>
												</div>
											)}

											{viewingMaster.telegram && (
												<div className="text-[10.5px] text-slate-700 dark:text-slate-200 flex items-center justify-between">
													<span className="text-[10px] text-text-secondary font-extrabold uppercase">
														Telegram:
													</span>
													<a
														href={`https://t.me/${viewingMaster.telegram.replace('@', '')}`}
														target="_blank"
														rel="noreferrer"
														className="text-blue-500 hover:underline font-black flex items-center gap-0.5"
													>
														@{viewingMaster.telegram.replace('@', '')}
													</a>
												</div>
											)}
										</div>
									)}
								</div>

								{/* Key statistics row */}
								<div className="grid grid-cols-4 gap-2 mb-5 text-center">
									<div className="p-2.5 rounded-xl border transition-all bg-surface-card border-border shadow-sm">
										<span className="text-[11px] font-black flex items-center justify-center gap-0.5 text-blue-500 font-mono">
											<CheckCircle2
												size={11}
												className="fill-blue-500/10 text-blue-500"
											/>{' '}
											{viewingMaster.reviewsCount || 0} ta
										</span>
										<span className="text-[10px] text-text-secondary font-bold uppercase mt-0.5 block">
											Mijozlar
										</span>
									</div>
									<div className="p-2.5 rounded-xl border transition-all bg-surface-card border-border shadow-sm">
										<span className="text-[11px] font-black block font-mono">
											{viewingMaster.completedJobs} ta
										</span>
										<span className="text-[10px] text-text-secondary font-bold uppercase mt-0.5 block">
											Bitgan ish
										</span>
									</div>
									<div className="p-2.5 rounded-xl border transition-all bg-surface-card border-border shadow-sm">
										<span className="text-[11px] font-black block font-mono">
											{viewingMaster.experience} yil
										</span>
										<span className="text-[10px] text-text-secondary font-bold uppercase mt-0.5 block">
											Tajriba
										</span>
									</div>
									<div className="p-2.5 rounded-xl border transition-all bg-surface-card border-border shadow-sm">
										<span className="text-[11px] font-black block font-mono text-blue-600">
											{viewingMaster.responseTime}
										</span>
										<span className="text-[10px] text-text-secondary font-bold uppercase mt-0.5 block">
											Aloqa
										</span>
									</div>
								</div>

								{/* Dynamically Revealed Phone Section */}
								{revealedPhone && (
									<motion.div
										initial={{ opacity: 0, height: 0 }}
										animate={{ opacity: 1, height: 'auto' }}
										className="mb-4 p-3 bg-blue-500/10 dark:bg-blue-500/20 rounded-2xl border border-blue-500/20 flex items-center justify-between"
									>
										<div className="flex items-center gap-2">
											<Phone
												size={14}
												className="text-brand dark:text-blue-400"
											/>
											<div className="text-left">
												<span className="text-[10px] text-text-secondary dark:text-slate-300 font-extrabold uppercase block leading-none mb-0.5">
													Usta telefon raqami
												</span>
												<span className="text-xs font-black font-mono text-brand dark:text-blue-400 select-all">
													{viewingMaster.phone}
												</span>
											</div>
										</div>
										<div className="flex items-center gap-1.5">
											<a
												href={`tel:${viewingMaster.phone.replace(/\s+/g, '')}`}
												className="px-2.5 py-1 bg-brand hover:bg-brand-hover dark:bg-blue-600 dark:hover:bg-brand-hover text-white text-[9px] font-black rounded-lg transition-all cursor-pointer shadow-sm flex items-center gap-1"
											>
												<Phone size={10} /> Qo'ng'iroq
											</a>
											<button
												onClick={() => {
													navigator.clipboard.writeText(viewingMaster.phone);
													showToast('Telefon raqami nusxalandi!', 'success');
												}}
												className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[9px] font-black rounded-lg transition-all cursor-pointer"
											>
												Nusxalash
											</button>
										</div>
									</motion.div>
								)}

								{/* Reviews list section inside profile */}
								<div className="mb-5 text-left border-t border-dashed border-slate-100 dark:border-slate-800 pt-4">
									<h4 className="text-[10px] font-black uppercase tracking-wider text-text-secondary mb-2.5 flex items-center gap-1">
										<CheckCircle2 size={12} className="text-blue-500" />{' '}
										Mijozlar fikrlari ({viewingMaster.reviewsCount || 0})
									</h4>
									{viewingMaster.reviews && viewingMaster.reviews.length > 0 ? (
										<div className="flex flex-col gap-2 max-h-[140px] overflow-y-auto no-scrollbar">
											{viewingMaster.reviews.map((rev) => (
												<div
													key={rev.id}
													className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80"
												>
													<div className="flex items-center justify-between mb-1">
														<span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
															{rev.author}
														</span>
														<span className="text-[10px] text-text-secondary font-bold">
															{rev.date}
														</span>
													</div>
													<div className="flex items-center gap-0.5 text-amber-400 mb-1">
														{Array.from({ length: 5 }).map((_, i) => (
															<Star
																key={i}
																size={10}
																className="select-none"
																fill={i < rev.rating ? 'currentColor' : 'none'}
															/>
														))}
													</div>
													<p className="text-[10px] text-slate-600 dark:text-text-secondary font-medium leading-relaxed">
														{rev.text}
													</p>
												</div>
											))}
										</div>
									) : (
										<p className="text-[10px] text-text-secondary font-bold italic">
											Hozircha fikrlar mavjud emas. Birinchi bo'lib fikr
											qoldiring!
										</p>
									)}
								</div>

								{/* Direct Booking Action Button */}
								<div className="mb-4">
									{viewingMaster &&
									isSamePhone(viewingMaster.phone, currentUstaPhone) ? (
										<button
											disabled
											className="w-full py-3 bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-black text-xs rounded-2xl flex items-center justify-center gap-2 cursor-not-allowed opacity-85 border border-purple-200 dark:border-purple-900"
										>
											<User size={14} className="select-none" />
											O'zingiz ochgan profilga buyurtma bera olmaysiz
										</button>
									) : viewingMaster && viewingMaster.isActive === false ? (
										<button
											disabled
											className="w-full py-3 bg-slate-100 dark:bg-slate-900/60 text-text-secondary dark:text-slate-600 font-black text-xs rounded-2xl flex items-center justify-center gap-2 cursor-not-allowed border border-slate-200 dark:border-slate-800"
										>
											<XCircle size={14} className="select-none" />
											Usta hozirda dam olmoqda (Buyurtmalar yopiq)
										</button>
									) : (
										<button
											onClick={() => {
												handleOpenBookingModal(viewingMaster!);
											}}
											className="w-full py-3 bg-gradient-to-r from-blue-600 to-brand hover:from-blue-700 hover:to-brand-hover text-white font-black text-xs rounded-2xl transition-all shadow-md shadow-blue-950/20 flex items-center justify-center gap-2 cursor-pointer"
										>
											<ClipboardList size={14} className="select-none" />
											Buyurtmani rasmiylashtirish
										</button>
									)}
								</div>

								{/* Interaction Action CTA buttons */}
								<div className="flex gap-2.5">
									{isSamePhone(viewingMaster.phone, currentUstaPhone) ? (
										<button
											disabled
											className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-900/60 text-text-secondary dark:text-slate-600 font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-not-allowed border border-slate-200/50 dark:border-slate-800"
										>
											<MessageSquare size={14} />
											O'zingizga xabar yozib bo'lmaydi
										</button>
									) : (
										<button
											onClick={() => {
												setSupportChatOpen(false);
												setChatMaster(viewingMaster);
												setViewingMaster(null);
												setActiveTab('messages');
												showToast(
													`${viewingMaster.name} bilan suhbat boshlandi`,
													'info'
												);
											}}
											className="flex-1 py-3.5 bg-brand hover:bg-brand-hover text-white font-extrabold text-xs rounded-xl transition-all shadow-md shadow-blue-950/10 flex items-center justify-center gap-1.5 cursor-pointer"
										>
											<MessageSquare size={14} />
											Suhbatni boshlash
										</button>
									)}

									<button
										onClick={() => {
											setRevealedPhone(!revealedPhone);
											showToast(
												revealedPhone
													? 'Raqam yashirildi'
													: `Telefon raqami: ${viewingMaster.phone}`,
												'success'
											);
										}}
										className={`px-4 rounded-xl border font-bold transition-all cursor-pointer flex items-center justify-center ${
											revealedPhone
												? 'bg-brand/10 border-brand text-brand dark:text-blue-400 dark:bg-blue-500/10'
												: 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
										}`}
										title="Telefon qilish"
									>
										<Phone
											size={14}
											className="text-brand dark:text-blue-400"
										/>
									</button>
								</div>
							</motion.div>
						</div>
					)}
				</AnimatePresence>

				{/* BIZ BILAN HAMKORLIK / COOPERATION AGREEMENT & REGISTRATION MODAL */}
				<AnimatePresence>
					{partnershipModalOpen && (
						<div
							className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
							onKeyDown={(e) => {
								if (e.key === 'Escape') sp('modalOpen', false);
							}}
						>
							<div
								className="absolute inset-0"
								onClick={() => sp('modalOpen', false)}
							/>

							<motion.div
								initial={{ opacity: 0, scale: 0.95, y: 20 }}
								animate={{ opacity: 1, scale: 1, y: 0 }}
								exit={{ opacity: 0, scale: 0.95, y: 20 }}
								className="w-full max-w-lg bg-white dark:bg-surface rounded-xl p-6 shadow-2xl relative z-10 max-h-[92vh] flex flex-col overflow-y-auto no-scrollbar text-text-primary font-sans"
								id="partnership-modal"
							>
								{/* Header */}
								<div className="flex items-center justify-between border-b pb-4 border-border shrink-0">
									<div className="flex items-center gap-2">
										<div className="p-2 bg-blue-50 dark:bg-blue-500/10 text-brand rounded-xl">
											<Award size={18} />
										</div>
										<div className="text-left">
											<h3 className="text-sm font-black text-text-primary uppercase tracking-wide">
												Hamkorlik Shartnomasi va Ariza
											</h3>
											<p className="text-[10px] text-text-secondary font-bold mt-0.5">
												Platformada rasmiy usta bo'lib ish boshlash shartlari
											</p>
										</div>
									</div>

									<button
										onClick={() => sp('modalOpen', false)}
										className="p-1.5 rounded-lg text-text-secondary hover:bg-slate-100 cursor-pointer"
									>
										<X size={16} />
									</button>
								</div>

									{/* Form or Submitted State */}
									{masterStatus === 'approved' ? (
										/* APPROVED STATE — already a master */
										<div className="flex flex-col gap-5 mt-4 text-left">
											<div className="flex flex-col items-center text-center py-4">
												<div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border-2 border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center mb-3">
													<CheckCircle2 size={32} className="text-emerald-500" />
												</div>
												<h4 className="text-sm font-black text-text-primary">
													Siz allaqachon usta hamkorsiz
												</h4>
												<p className="text-[11px] text-text-secondary font-bold mt-1.5 max-w-xs leading-relaxed">
													Profilingiz tasdiqlangan va mijozlar sizga buyurtma berishi mumkin.
												</p>
											</div>
											<button
												onClick={() => { sp('modalOpen', false); setActiveTab('workspace'); }}
												className="w-full py-3 bg-brand hover:bg-brand-hover text-white font-black text-xs rounded-xl cursor-pointer transition-all"
											>
												Ish stoliga o'tish
											</button>
										</div>
									) : masterStatus === 'pending' ? (
										/* PENDING STATE — SUBMITTED SUCCESSFULLY */
										<div className="flex flex-col gap-5 mt-4 text-left">
											<div className="flex flex-col items-center text-center py-4">
												<div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border-2 border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center mb-3">
													<CheckCircle2 size={32} className="text-emerald-500" />
												</div>
												<h4 className="text-sm font-black text-text-primary">
													Arizangiz qabul qilindi
												</h4>
												<p className="text-[11px] text-text-secondary font-bold mt-1.5 max-w-xs leading-relaxed">
													Hamkorlik arizangiz Master Group moderatorlari tomonidan tekshirishga qabul qilindi.
													Tasdiqlansa, sizga xabar beramiz.
												</p>
											</div>

											<div className="border border-border rounded-2xl p-4 bg-surface-card flex flex-col gap-3">
												<h4 className="text-[9px] font-black uppercase tracking-wider text-text-secondary pb-1.5 border-b border-border">
													Yuborilgan ma'lumotlar
												</h4>
												<div className="grid grid-cols-2 gap-3 text-[11px] font-bold">
													<div><span className="text-text-secondary block text-[9px] uppercase tracking-wider text-left">To'liq Ism</span><span className="text-text-primary font-black block text-left">{partnershipName}</span></div>
													<div><span className="text-text-secondary block text-[9px] uppercase tracking-wider text-left">Telefon</span><span className="text-text-primary font-mono block text-left">{partnershipPhone}</span></div>
													<div><span className="text-text-secondary block text-[9px] uppercase tracking-wider text-left">Mutaxassislik</span><span className="text-brand uppercase font-black block text-left">{CATEGORIES.find(c => c.id === partnershipCategory)?.name || ''}</span></div>
													<div><span className="text-text-secondary block text-[9px] uppercase tracking-wider text-left">Tajriba</span><span className="text-text-primary block text-left">{partnershipExp} yil</span></div>
													<div><span className="text-text-secondary block text-[9px] uppercase tracking-wider text-left">Boshlang'ich narx</span><span className="text-text-primary block text-left">{partnershipPrice.toLocaleString()} so'm</span></div>
													<div><span className="text-text-secondary block text-[9px] uppercase tracking-wider text-left">Hudud</span><span className="text-text-primary block text-left">{partnershipRegion}, {partnershipDistrict}</span></div>
												</div>
												{partnershipBio && (
													<div className="col-span-2">
														<span className="text-text-secondary block text-[9px] uppercase tracking-wider text-left">Tavsif</span>
														<p className="text-slate-600 dark:text-slate-400 bg-surface-tertiary p-2.5 rounded-lg border border-border mt-1 italic text-left text-[11px]">
															"{partnershipBio}"
														</p>
													</div>
												)}
											</div>

											<button
												onClick={() => sp('modalOpen', false)}
												className="w-full py-3 bg-slate-900 hover:bg-black text-white font-black text-xs rounded-xl cursor-pointer transition-all"
											>
												Yopish
											</button>
										</div>
									) : (
										/* FRESH 4-STEP REGISTRATION */
										<div className="flex flex-col mt-4 text-left">
											{/* Progress Stepper */}
											<div className="flex items-center justify-between mb-6 pb-4 border-b border-border shrink-0">
												{[
													{ num: 1, label: "Ma'lumotlar" },
													{ num: 2, label: 'Kasbiy' },
													{ num: 3, label: 'Tavsif' },
													{ num: 4, label: 'Shartnoma' },
												].map((s, index, arr) => {
													const isActive = partnershipStep === s.num;
													const isDone = partnershipStep > s.num;
													return (
														<React.Fragment key={s.num}>
															<div className={`flex items-center gap-1.5 transition-all ${isActive ? '' : isDone ? 'opacity-80' : 'opacity-40'}`}>
																<span className={`w-6 h-6 rounded-full text-[10px] flex items-center justify-center transition-all font-black ${
																	isDone
																		? 'bg-emerald-500 text-white'
																		: isActive
																			? 'bg-brand text-white shadow-md shadow-blue-500/20 scale-110'
																			: 'bg-slate-200 dark:bg-slate-700 text-text-secondary'
																}`}>
																	{isDone ? <Check size={13} strokeWidth={3} /> : s.num}
																</span>
																<span className={`hidden sm:block text-[10px] uppercase tracking-wider ${
																	isActive ? 'font-black text-brand' : 'font-bold text-text-secondary'
																}`}>
																	{s.label}
																</span>
															</div>
															{index < arr.length - 1 && (
																<div className={`flex-1 mx-1 border-t-2 transition-all ${
																	isDone ? 'border-emerald-400' : 'border-slate-200 dark:border-slate-800'
																}`} />
															)}
														</React.Fragment>
													);
												})}
											</div>

											{/* Step Content */}
											<div className="flex-1 min-h-[260px]">
												<AnimatePresence mode="wait">
													<motion.div
														key={partnershipStep}
														initial={{ opacity: 0, x: 20 }}
														animate={{ opacity: 1, x: 0 }}
														exit={{ opacity: 0, x: -20 }}
														transition={{ duration: 0.15 }}
													>
														{partnershipStep === 1 && (
												/* STEP 1 WIDGET: PERSONAL INFO & PHOTO */
												<div className="flex flex-col gap-4 animate-fade-in">
													{/* Circular Photo Upload */}
													<div className="flex flex-col items-center mb-2">
														<div className="relative w-24 h-24">
															<div className="w-24 h-24 rounded-full overflow-hidden group border-4 border-blue-50 dark:border-slate-800 bg-slate-50 dark:bg-[#181C20] shadow-md">
																{partnershipAvatar ? (
																	<img
																		src={partnershipAvatar}
																		alt="Usta profil surati"
																		className="w-full h-full object-cover avatar-face transition-transform group-hover:scale-105 duration-300"
																	/>
																) : (
																	<div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
																		<User size={32} />
																	</div>
																)}
															</div>
															{/* Always-visible camera badge (no hover dependency, mobile-friendly) */}
															<label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-brand hover:bg-brand-hover text-white flex items-center justify-center border-2 border-white dark:border-[#12151a] shadow-md cursor-pointer transition-colors">
																<Camera size={14} />
																<input
																	type="file"
																	accept="image/*"
																	className="hidden"
																	onChange={(e) =>
																		handleAvatarFileChange(e, false)
																	}
																/>
															</label>
														</div>
														<p className="text-[10px] text-text-secondary font-bold tracking-tight text-center mt-2">
															JPG, PNG, 5MB gacha
														</p>
													</div>

													{/* Inputs Grid */}
													<div className="flex flex-col gap-3.5">
														{/* Ism Familiya */}
														<div>
															<label className="text-[9px] font-black uppercase tracking-wider text-text-secondary dark:text-slate-600 block mb-1 ml-0.5">
																Ism Familiya{' '}
																<span className="text-red-500">*</span>
															</label>
															<div className="relative">
																<span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary">
																	<User size={14} />
																</span>
																<input
																	type="text"
																	value={partnershipName}
																	onChange={(e) => sp('name', e.target.value)}
																	placeholder="Ism va Familiyangizni kiriting"
																	className="w-full text-xs font-bold pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#181C20] text-slate-800 dark:text-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-brand dark:focus:border-blue-500 transition-all shadow-sm"
																	required
																/>
															</div>
														</div>

														{/* Kasb turi (Dropdown) */}
														<div>
															<label className="text-[9px] font-black uppercase tracking-wider text-text-secondary dark:text-slate-600 block mb-1 ml-0.5">
																Kasb turi{' '}
																<span className="text-red-500">*</span>
															</label>
															<CustomSelect
																options={CATEGORIES.filter(c => c.id !== 'all').map(c => ({ value: c.id, label: c.name }))}
																value={partnershipCategory}
																onChange={(val) => sp('category', val)}
																icon={<Wrench size={14} />}
																placeholder="Kasb turini tanlang"
															/>
														</div>

														{/* Region and District Dropdowns (Shahar/Viloyat) */}
														<div className="grid grid-cols-2 gap-3">
															<div>
																<label className="text-[9px] font-black uppercase tracking-wider text-text-secondary dark:text-slate-600 block mb-1 ml-0.5">
																	Shahar / Viloyat{' '}
																	<span className="text-red-500">*</span>
																</label>
																<CustomSelect
																	options={Object.keys(REGION_DATA).map(r => ({ value: r, label: r }))}
																	value={partnershipRegion}
																	onChange={(val) => {
																		sp('region', val);
																		sp('district', REGION_DATA[val]?.[0] || '');
																	}}
																	icon={<MapPin size={13} />}
																	placeholder="Viloyatni tanlang"
																/>
															</div>

															<div>
																<label className="text-[9px] font-black uppercase tracking-wider text-text-secondary dark:text-slate-600 block mb-1 ml-0.5">
																	Tuman / Hudud{' '}
																	<span className="text-red-500">*</span>
																</label>
																<CustomSelect
																	options={(REGION_DATA[partnershipRegion] || []).map((d: string) => ({ value: d, label: d }))}
																	value={partnershipDistrict}
																	onChange={(val) => sp('district', val)}
																	icon={<Map size={13} />}
																	placeholder="Tumanni tanlang"
																/>
															</div>
														</div>

														{/* Phone Number */}
														<div>
															<label className="text-[9px] font-black uppercase tracking-wider text-text-secondary dark:text-slate-600 block mb-1 ml-0.5">
																Aloqa Telefon raqamingiz
															</label>
															<div className="relative">
																<span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary">
																	<Phone size={14} />
																</span>
																<input
																	type="text"
																	value={partnershipPhone}
																	onChange={(e) => sp('phone', e.target.value)}
																	placeholder="+998"
																	className="w-full text-xs font-bold pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#181C20] text-slate-800 dark:text-slate-100 rounded-2xl outline-none font-mono focus:ring-2 focus:ring-blue-500/10 focus:border-brand dark:focus:border-blue-500 transition-all shadow-sm"
																/>
															</div>
														</div>
													</div>
												</div>
											)}

											{partnershipStep === 2 && (
												/* STEP 2 WIDGET: PROFESSIONAL DATA */
												<div className="flex flex-col gap-4 animate-fade-in">
													{/* Ish tajribasi */}
													<div>
														<label className="text-[9px] font-black uppercase tracking-wider text-text-secondary block mb-1 ml-0.5">
															Ish tajribangiz (yil){' '}
															<span className="text-red-500">*</span>
														</label>
														<div className="relative">
															<span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary">
																<Briefcase size={14} />
															</span>
															<input
																type="number"
																value={partnershipExp}
																onChange={(e) =>
																	sp(
																		'experience',
																		parseInt(e.target.value) || 0
																	)
																}
																placeholder="Masalan: 5"
																min="1"
																className="w-full text-xs font-bold pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#181C20] text-slate-800 dark:text-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-brand transition-all shadow-sm"
																required
															/>
														</div>
													</div>

													{/* Boshlang'ich xizmat haqi */}
													<div>
														<label className="text-[9px] font-black uppercase tracking-wider text-text-secondary block mb-1 ml-0.5">
															Boshlang'ich xizmat haqi (so'm){' '}
															<span className="text-red-500">*</span>
														</label>
														<div className="relative">
															<span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary">
																<CreditCard size={14} />
															</span>
															<input
																type="number"
																value={partnershipPrice}
																onChange={(e) =>
																	sp('price', parseInt(e.target.value) || 0)
																}
																placeholder="Masalan: 50000"
																min="1000"
																className="w-full text-xs font-bold pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#181C20] text-slate-800 dark:text-slate-100 rounded-2xl outline-none font-mono focus:ring-2 focus:ring-blue-500/10 focus:border-brand transition-all shadow-sm"
																required
															/>
														</div>
													</div>

													{/* Mutaxassislik bo'yicha aniq soha */}
													<div>
														<label className="text-[9px] font-black uppercase tracking-wider text-text-secondary block mb-1 ml-0.5">
															Mutaxassislik bo'yicha aniq yo'nalish
														</label>
														<div className="relative">
															<span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary">
																<Sparkles size={14} />
															</span>
															<input
																type="text"
																value={partnershipSpecialty}
																onChange={(e) =>
																	sp('specialty', e.target.value)
																}
																placeholder="Masalan: Plastik quvurlar va isitish qozonlari"
																className="w-full text-xs font-bold pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#181C20] text-slate-800 dark:text-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-brand transition-all shadow-sm"
															/>
														</div>
													</div>
												</div>
											)}

											{partnershipStep === 3 && (
												/* STEP 3 WIDGET: DESCRIPTION */
												<div className="flex flex-col gap-4 animate-fade-in">
													{/* Tavsif (Bio) */}
													<div>
														<label className="text-[9px] font-black uppercase tracking-wider text-text-secondary block mb-1 ml-0.5">
															O'zingiz va mahoratingiz haqida tavsif{' '}
															<span className="text-red-500">*</span>
														</label>
														<textarea
															value={partnershipBio}
															onChange={(e) => {
																if (e.target.value.length <= 1000) sp('bio', e.target.value);
															}}
															placeholder="Mijozlar sizga ishonishi va buyurtma berishi uchun o'z tajribangiz haqida batafsil ma'lumot yozing..."
															rows={4}
															maxLength={1000}
															className="w-full text-xs font-bold p-3.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#181C20] text-slate-800 dark:text-slate-100 rounded-lg outline-none resize-none focus:ring-2 focus:ring-blue-500/10 focus:border-brand transition-all shadow-sm leading-relaxed"
															required
														/>
														<span className="text-[9px] text-text-secondary font-bold mt-1 text-right block">{partnershipBio.length}/1000</span>
													</div>
												</div>
											)}

											{partnershipStep === 4 && (
												/* STEP 4 WIDGET: CONTRACT & CONFIRMATION */
												<div className="flex flex-col gap-4 animate-fade-in">
													<div>
														<h4 className="text-[9px] font-black uppercase tracking-wider text-text-secondary mb-2">
															Hamkorlik Shartnomasi va Nizomlar
														</h4>
														<div className="p-4 bg-slate-50 dark:bg-[#181C20] rounded-2xl border border-slate-200 dark:border-slate-800 text-[10.5px] font-semibold text-slate-600 dark:text-slate-300 flex flex-col gap-3.5 max-h-56 overflow-y-auto no-scrollbar">
															<div className="flex gap-2.5 items-start">
																<span className="text-blue-600 font-bold mt-0.5">
																	✔
																</span>
																<p>
																	<strong className="text-slate-800 dark:text-white font-black">
																		Sifat Kafolati:
																	</strong>{' '}
																	Har bir buyurtma bo'yicha ishlarni yuqori
																	sifatda bajarasiz. Kamchilik bo'lsa, o'z
																	hisobingizdan bepul tuzatasiz.
																</p>
															</div>
															<div className="flex gap-2.5 items-start">
																<span className="text-blue-600 font-bold mt-0.5">
																	✔
																</span>
																<p>
																	<strong className="text-slate-800 dark:text-white font-black">
																		Odob-axloq:
																	</strong>{' '}
																	Mijozlar bilan xushmuomala, halol va hurmat
																	bilan suhbatlashasiz. Noo'rin harakatlar
																	profilingizning doimiy bloklanishiga sabab
																	bo'ladi.
																</p>
															</div>
															<div className="flex gap-2.5 items-start">
																<span className="text-blue-600 font-bold mt-0.5">
																	✔
																</span>
																<p>
																	<strong className="text-slate-800 dark:text-white font-black">
																		Aloqa tezligi:
																	</strong>{' '}
																	Mijozlardan kelgan qo'ng'iroq va chat
																	xabarlariga kamida 15 daqiqa ichida javob
																	berishga harakat qilasiz.
																</p>
															</div>
															<div className="flex gap-2.5 items-start">
																<span className="text-blue-600 font-bold mt-0.5">
																	✔
																</span>
																<p>
																	<strong className="text-slate-800 dark:text-white font-black">
																		Soliq va qonuniylik:
																	</strong>{' '}
																	Shartnomaga muvofiq, o'z sohangiz bo'yicha
																	soliq qonunchiligi (masalan, o'zini o'zi band
																	qilish shakli) qoidalariga rioya qilasiz.
																</p>
															</div>
															<div className="flex gap-2.5 items-start">
																<span className="text-blue-600 font-bold mt-0.5">
																	✔
																</span>
																<p>
																	<strong className="text-slate-800 dark:text-white font-black">
																		Raqobat va Halollik:
																	</strong>{' '}
																	Mijozlarni aldash, sun'iy ravishda yuqori narx
																	aytish yoki platformani chetlab o'tib
																	qonunbuzarlik qilish qat'iyan man etiladi.
																</p>
															</div>
														</div>
													</div>

													{/* Checkbox */}
													<label className="flex items-start gap-3 mt-1 cursor-pointer select-none">
														<input
															type="checkbox"
															checked={partnershipAgreed}
															onChange={(e) => sp('agreed', e.target.checked)}
															className="sr-only"
														/>
														<span
															className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
																partnershipAgreed
																	? 'bg-brand border-brand'
																	: 'bg-white dark:bg-transparent border-slate-300 dark:border-slate-600'
															}`}
														>
															{partnershipAgreed && (
																<Check
																	size={13}
																	className="text-white"
																	strokeWidth={3}
																/>
															)}
														</span>
														<span className="text-[10px] font-bold text-slate-600 dark:text-text-secondary leading-normal">
															Men Master Group hamkorlik shartlariga, soliq qoidalariga
															hamda mijozlarga xizmat ko'rsatish talablariga
															to'liq roziman va rioya qilishga va'da beraman.
														</span>
													</label>
												</div>
											)}
										</motion.div>
									</AnimatePresence>
								</div>

								{/* Stepper Footer Controls */}
										<div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2 shrink-0">
											{partnershipStep < 4 ? (
												<button
													type="button"
													onClick={() => {
														// Validation per step
														if (partnershipStep === 1) {
															if (!partnershipName.trim()) {
																showToast(
																	'Iltimos, ism va familiyangizni kiriting!',
																	'error'
																);
																return;
															}
														} else if (partnershipStep === 2) {
															if (!partnershipExp || partnershipExp < 1) {
																showToast(
																	'Iltimos, ish tajribasini (yil) kiriting!',
																	'error'
																);
																return;
															}
															if (!partnershipPrice || partnershipPrice <= 0) {
																showToast(
																	'Iltimos, xizmat haqini kiriting!',
																	'error'
																);
																return;
															}
														} else if (partnershipStep === 3) {
															if (!partnershipBio.trim()) {
																showToast(
																	'Iltimos, tavsif/bio kiriting!',
																	'error'
																);
																return;
															}
														}
														sp('step', ps.step + 1);
													}}
													className="w-full py-3.5 bg-brand hover:bg-brand-hover text-white font-black text-xs rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/10 uppercase tracking-wider"
												>
													Keyingi <ChevronRight size={13} />
												</button>
											) : (
												<button
													type="button"
													disabled={!partnershipAgreed || submittingPartnership}
													onClick={async () => {
														if (!partnershipAgreed || submittingPartnership) {
															if (!partnershipAgreed) showToast(
																'Iltimos, avval hamkorlik shartlariga rozilik bildiring!',
																'error'
															);
															return;
														}
														setSubmittingPartnership(true);

														const [firstName, ...rest] = partnershipName
															.trim()
															.split(' ');
														const lastName = rest.join(' ') || firstName;

														try {
															await api.createApplication({
																firstName,
																lastName,
																phone: partnershipPhone,
																categoryId: partnershipCategory,
																experience: partnershipExp,
																price: partnershipPrice,
																priceComment: partnershipPriceComment,
																bio: partnershipBio,
																services: partnershipServices,
																avatarUrl: partnershipAvatar,
																region: partnershipRegion,
																district: partnershipDistrict,
															});

															sp('status', 'pending');
															showToast(
																'Hamkorlik uchun arizangiz muvaffaqiyatli topshirildi!',
																'success'
															);
															sp('modalOpen', false);
														} catch {
															showToast(
																'Arizani yuborishda xatolik yuz berdi.',
																'error'
															);
														} finally {
															setSubmittingPartnership(false);
														}
													}}
													className={`w-full py-3.5 text-white text-xs font-black rounded-2xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md uppercase tracking-wider ${
														partnershipAgreed
															? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/10'
															: 'bg-slate-200 text-text-secondary cursor-not-allowed shadow-none'
													}`}
												>
													{submittingPartnership ? <><RefreshCw size={13} className="animate-spin" /> Yuborilmoqda...</> : <><Send size={13} /> Arizani yuborish</>}
												</button>
											)}

											{partnershipStep > 1 && (
												<button
													type="button"
													onClick={() => sp('step', ps.step - 1)}
													className="w-full py-2 text-slate-600 hover:text-slate-700 dark:hover:text-slate-300 text-xs font-bold transition-all cursor-pointer text-center"
												>
													Orqaga qaytish
												</button>
											)}
										</div>
									</div>
								)}
							</motion.div>
						</div>
					)}
				</AnimatePresence>

				{/* CLIENT COMPLETION CONFIRMATION MODAL */}
				<AnimatePresence>
					{completionModalOpen && (
						<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
							<div
								className="absolute inset-0"
								onClick={() => setCompletionModalOpen(false)}
							/>

							<motion.div
								initial={{ opacity: 0, scale: 0.95, y: 20 }}
								animate={{ opacity: 1, scale: 1, y: 0 }}
								exit={{ opacity: 0, scale: 0.95, y: 20 }}
								className="w-full max-w-sm bg-white dark:bg-[#181C20] rounded-xl p-5 shadow-2xl relative z-10 text-left border border-slate-100 dark:border-slate-800"
							>
								<div className="flex items-center justify-between mb-4">
									<h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white">
										Ish bajarilganligini tasdiqlash
									</h3>
									<button
										onClick={() => setCompletionModalOpen(false)}
										className="p-1.5 rounded-lg text-text-secondary hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
									>
										<X size={16} />
									</button>
								</div>

								<p className="text-[10px] text-slate-600 dark:text-text-secondary font-bold mb-3 leading-relaxed">
									Ushbu buyurtma bo'yicha ishni bajargan ustani tanlang.
									Tanlangan ustaning muvaffaqiyatli ishlar soni{' '}
									<strong>1 taga oshadi</strong>.
								</p>

								<div className="flex flex-col gap-2 max-h-48 overflow-y-auto no-scrollbar mb-4">
									{allMasters.map((master) => (
										<div
											key={master.id}
											onClick={() => setSelectedMasterForCompletion(master.id)}
											className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
												selectedMasterForCompletion === master.id
													? 'bg-brand/10 border-brand text-brand'
													: 'bg-slate-50 dark:bg-slate-900/40 border-slate-100 dark:border-slate-800 hover:bg-slate-100'
											}`}
										>
											<div className="flex items-center gap-2.5">
												<img
													loading="lazy"
													src={master.avatar}
													alt={`${master.name} – Usta`}
													className="w-8 h-8 rounded-full object-cover avatar-face"
												/>
												<div className="text-left">
													<h4 className="text-[11px] font-black">
														{master.name}
													</h4>
													<span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-text-secondary uppercase font-black tracking-wide">
														{master.category}
													</span>
												</div>
											</div>
											<div className="text-right shrink-0">
												<span className="text-[9px] font-black block font-mono">
													{master.completedJobs} ta ish
												</span>
												{selectedMasterForCompletion === master.id ? (
													<span className="text-[10px] text-brand font-black uppercase tracking-wider">
														Tanlangan ✔
													</span>
												) : (
													<span className="text-[10px] text-text-secondary font-bold">
														Tanlash
													</span>
												)}
											</div>
										</div>
									))}
								</div>

								<div className="flex gap-2 shrink-0">
									<button
										onClick={() => setCompletionModalOpen(false)}
										className="flex-1 py-2.5 border border-slate-200 text-slate-700 dark:text-slate-300 dark:border-slate-800 hover:bg-slate-50 text-[10px] font-black rounded-xl cursor-pointer"
									>
										Bekor qilish
									</button>
									<button
										disabled={selectedMasterForCompletion === null}
										onClick={() => {
											if (
												selectedMasterForCompletion !== null &&
												completingOrderId !== null
											) {
												handleAwardJobCompletion(
													selectedMasterForCompletion,
													completingOrderId
												);
												setCompletionModalOpen(false);
											}
										}}
										className={`flex-1 py-2.5 text-white text-[10px] font-black rounded-xl cursor-pointer flex items-center justify-center gap-1 transition-all ${
											selectedMasterForCompletion !== null
												? 'bg-brand hover:bg-brand-hover'
												: 'bg-slate-200 text-text-secondary dark:bg-slate-800 cursor-not-allowed'
										}`}
									>
										Tasdiqlash
									</button>
								</div>
							</motion.div>
						</div>
					)}
				</AnimatePresence>

				{/* DIRECT BOOKING CONFIRMATION MODAL */}
				<AnimatePresence>
					{bookingModalOpen && bookingMaster && (
						<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
							<div
								className="absolute inset-0"
								onClick={() => setBookingModalOpen(false)}
							/>

							<motion.div
								initial={{ opacity: 0, scale: 0.95, y: 20 }}
								animate={{ opacity: 1, scale: 1, y: 0 }}
								exit={{ opacity: 0, scale: 0.95, y: 20 }}
								className="w-full max-w-sm bg-white dark:bg-[#181C20] rounded-xl p-6 shadow-2xl relative z-10 text-left border border-slate-100 dark:border-slate-800"
							>
								<div className="flex items-center gap-3 mb-5">
									<div className="w-10 h-10 bg-blue-50 dark:bg-blue-950/20 text-brand dark:text-blue-400 rounded-full flex items-center justify-center shrink-0">
										<ClipboardList size={20} className="select-none" />
									</div>
									<div>
										<h3 className="text-sm font-black text-slate-800 dark:text-white">
											{bookingMaster.name} ga buyurtma
										</h3>
										<p className="text-[10px] text-slate-500 dark:text-text-secondary font-bold">
											Quyidagi ma'lumotlarni to'ldiring
										</p>
									</div>
								</div>

								<form
									onSubmit={(e) => {
										e.preventDefault();
										handleConfirmBooking();
									}}
									className="flex flex-col gap-3"
								>
									<div>
										<label className="text-[9px] font-black uppercase tracking-wider text-text-secondary block mb-1">
											Buyurtma sarlavhasi <span className="text-danger">*</span>
										</label>
										<input
											type="text"
											value={bookingTitle}
											onChange={(e) => setBookingTitle(e.target.value)}
											placeholder="Masalan: Uy krantini ta'mirlash"
											className="w-full text-xs font-bold p-2.5 rounded-lg border outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand bg-surface-input border-border"
											required
										/>
									</div>

									<div>
										<label className="text-[9px] font-black uppercase tracking-wider text-text-secondary block mb-1">
											Byudjet (so'm)
										</label>
										<input
											type="number"
											value={bookingBudget}
											onChange={(e) => setBookingBudget(e.target.value)}
											placeholder="Masalan: 70000"
											className="w-full text-xs font-bold p-2.5 rounded-lg border outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand bg-surface-input border-border"
										/>
									</div>

									<div>
										<label className="text-[9px] font-black uppercase tracking-wider text-text-secondary block mb-1">
											Batafsil tavsif
										</label>
										<textarea
											value={bookingDesc}
											onChange={(e) => setBookingDesc(e.target.value)}
											placeholder="Kerakli xizmat turi va sharoitlarni yozib qoldiring..."
											rows={3}
											className="w-full text-xs font-bold p-2.5 rounded-lg border outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand resize-none bg-surface-input border-border"
										/>
									</div>

									<div className="grid grid-cols-2 gap-3">
										<div>
											<label className="text-[9px] font-black uppercase tracking-wider text-text-secondary block mb-1 flex items-center gap-1">
												<MapPin size={10} /> Viloyat
											</label>
											<select
												value={bookingRegion}
												onChange={(e) => {
													setBookingRegion(e.target.value);
													setBookingDistrict(REGION_DATA[e.target.value]?.[0] || '');
												}}
												className="w-full text-xs font-bold p-2.5 rounded-lg border outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand bg-surface-input border-border"
											>
												{Object.keys(REGION_DATA).map((r) => (
													<option key={r} value={r}>{r}</option>
												))}
											</select>
										</div>
										<div>
											<label className="text-[9px] font-black uppercase tracking-wider text-text-secondary block mb-1 flex items-center gap-1">
												<Map size={10} /> Tuman
											</label>
											<select
												value={bookingDistrict}
												onChange={(e) => setBookingDistrict(e.target.value)}
												className="w-full text-xs font-bold p-2.5 rounded-lg border outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand bg-surface-input border-border"
											>
												{(REGION_DATA[bookingRegion] || []).map((d: string) => (
													<option key={d} value={d}>{d}</option>
												))}
											</select>
										</div>
									</div>

									<div className="flex gap-3 mt-1">
										<button
											type="button"
											onClick={() => setBookingModalOpen(false)}
											className="flex-1 py-3 border border-slate-200 text-slate-700 dark:text-slate-300 dark:border-slate-800 hover:bg-slate-50 text-[10.5px] font-black rounded-xl cursor-pointer flex items-center justify-center gap-1.5 transition-all"
										>
											<X size={12} className="select-none" />
											Bekor qilish
										</button>
										<button
											type="submit"
											className="flex-1 py-3 bg-brand hover:bg-brand-hover text-white text-[10.5px] font-black rounded-xl cursor-pointer flex items-center justify-center gap-1.5 transition-all shadow-md shadow-blue-950/10"
										>
											<CheckCircle2 size={12} className="select-none" />
											Buyurtma berish
										</button>
									</div>
								</form>
							</motion.div>
						</div>
					)}
				</AnimatePresence>

				{/* POST-COMPLETION SUCCESS MODAL */}
				<AnimatePresence>
					{successModalOpen && (
						<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
							<div
								className="absolute inset-0"
								onClick={() => handleCloseSuccessAndOpenRating()}
							/>

							<motion.div
								initial={{ opacity: 0, scale: 0.95, y: 20 }}
								animate={{ opacity: 1, scale: 1, y: 0 }}
								exit={{ opacity: 0, scale: 0.95, y: 20 }}
								className="w-full max-w-sm bg-white dark:bg-[#181C20] rounded-xl p-6 shadow-2xl relative z-10 text-center border border-slate-100 dark:border-slate-800"
							>
								<div className="w-16 h-16 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20">
									<BadgeCheck size={30} className="select-none" />
								</div>

								<h3 className="text-base font-black text-slate-800 dark:text-white mb-2">
									Buyurtma muvaffaqiyatli yakunlandi.
								</h3>

								<p className="text-[11px] text-slate-600 dark:text-text-secondary font-bold mb-5 leading-relaxed">
									Tabriklaymiz! Buyurtma to'liq yakunlandi va tarix bo'limiga
									ko'chirildi. Ustaga o'z xizmatlari uchun munosib baho bering!
								</p>

								<button
									onClick={() => handleCloseSuccessAndOpenRating()}
									className="w-full py-3 bg-brand hover:bg-brand-hover text-white text-[11px] font-black rounded-xl cursor-pointer flex items-center justify-center gap-1.5 transition-all shadow-md shadow-blue-950/10"
								>
									<MessageSquare size={14} className="select-none" />
									Fikr-mulohaza bildirish
								</button>
							</motion.div>
						</div>
					)}
				</AnimatePresence>

				{/* RATING & FEEDBACK MODAL */}
				<AnimatePresence>
					{ratingModalOpen && ratingMaster && (
						<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
							<div
								className="absolute inset-0"
								onClick={() => setRatingModalOpen(false)}
							/>

							<motion.div
								initial={{ opacity: 0, scale: 0.95, y: 20 }}
								animate={{ opacity: 1, scale: 1, y: 0 }}
								exit={{ opacity: 0, scale: 0.95, y: 20 }}
								className="w-full max-w-sm bg-white dark:bg-[#181C20] rounded-xl p-6 shadow-2xl relative z-10 text-left border border-slate-100 dark:border-slate-800"
							>
								<div className="flex justify-between items-center mb-4 pb-2 border-b border-dashed border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white">
									<h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
										<Star size={14} className="text-amber-500 select-none" />
										Usta faoliyatini baholash
									</h3>
									<button
										onClick={() => setRatingModalOpen(false)}
										className="p-1.5 rounded-lg text-text-secondary hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-center"
									>
										<X size={14} className="select-none" />
									</button>
								</div>

								<div className="flex items-center gap-3 mb-4 p-2.5 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-800 text-slate-800 dark:text-white">
									<img
										loading="lazy"
										src={ratingMaster.avatar}
										alt={`${ratingMaster.name} – Reyting`}
										className="w-10 h-10 rounded-full object-cover avatar-face"
									/>
									<div>
										<h4 className="text-xs font-black">{ratingMaster.name}</h4>
										<span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 uppercase font-black tracking-wide">
											{ratingMaster.category}
										</span>
									</div>
								</div>

								{/* Rating Stars Input */}
								<div className="mb-4 text-center">
									<label className="text-[9px] font-black uppercase tracking-wider text-text-secondary block mb-2">
										Ustaga baho bering
									</label>
									<div className="flex justify-center gap-2">
										{[1, 2, 3, 4, 5].map((starVal) => (
											<button
												key={starVal}
												type="button"
												onClick={() => setRatingStars(starVal)}
												className="p-1.5 hover:scale-115 transition-transform cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand/20 rounded-lg"
											>
												<Star
													size={30}
													className={`select-none transition-colors ${
														starVal <= ratingStars
															? 'text-amber-400'
															: 'text-slate-200 dark:text-slate-800'
													}`}
												/>
											</button>
										))}
									</div>
								</div>

								{/* Rating Comment Input */}
								<div className="mb-5">
									<label className="text-[9px] font-black uppercase tracking-wider text-text-secondary block mb-1.5 flex items-center gap-1">
										<MessageSquare size={12} className="select-none" />
										Fikr-mulohaza (Ixtiyoriy)
									</label>
									<textarea
										value={ratingComment}
										onChange={(e) => setRatingComment(e.target.value)}
										placeholder="Xizmat ko'rsatish sifati, tezligi va usta muomalasi haqida yozing..."
										rows={3}
										className="w-full text-xs font-bold p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none resize-none focus:border-brand"
									/>
								</div>

								<button
									onClick={() => handleSubmitRating()}
									className="w-full py-3 bg-brand hover:bg-brand-hover text-white text-xs font-black rounded-xl cursor-pointer flex items-center justify-center gap-1.5 transition-all shadow-md shadow-blue-950/10"
								>
									<Send size={14} className="select-none" />
									Yuborish
								</button>
							</motion.div>
						</div>
					)}
				</AnimatePresence>

				{/* ORDER DETAILS MODAL */}
				<AnimatePresence>
					{viewingOrder && (
						<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
							<div
								className="absolute inset-0"
								onClick={() => setViewingOrder(null)}
							/>

							<motion.div
								initial={{ opacity: 0, scale: 0.95, y: 20 }}
								animate={{ opacity: 1, scale: 1, y: 0 }}
								exit={{ opacity: 0, scale: 0.95, y: 20 }}
								className="w-full max-w-md bg-white dark:bg-[#181C20] rounded-xl p-6 shadow-2xl relative z-10 text-left border border-slate-100 dark:border-slate-800 text-slate-900 dark:text-slate-100"
							>
								<div className="flex justify-between items-center mb-4 pb-2 border-b border-dashed border-slate-200 dark:border-slate-700">
									<h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
										<Briefcase size={15} className="text-brand dark:text-blue-400" />
										Buyurtma Tafsilotlari
									</h3>
									<button
										onClick={() => setViewingOrder(null)}
										className="p-1.5 rounded-lg text-text-secondary dark:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-center transition-all"
									>
										<X size={15} />
									</button>
								</div>

								<div className="space-y-4">
									<div>
										<h4 className="text-sm font-black text-slate-900 dark:text-white mb-1">{viewingOrder.title}</h4>
										<div className="flex items-center gap-2 text-xs text-text-secondary font-bold">
											<MapPin size={12} className="text-brand" />
											<span>{viewingOrder.district}, {viewingOrder.region}</span>
										</div>
									</div>

									<div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
										<span className="text-xs font-bold text-text-secondary">Byudjet:</span>
										<span className="text-sm font-black font-mono text-slate-900 dark:text-white">
											{viewingOrder.budget?.toLocaleString()} so'm
										</span>
									</div>

									{viewingOrder.desc && (
										<div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
											<p className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-relaxed">
												{viewingOrder.desc}
											</p>
										</div>
									)}

									<div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
										<span className="text-xs font-bold text-text-secondary">Holat:</span>
										<span className={`text-xs font-black ${
											viewingOrder.status === 'pending' ? 'text-amber-600 dark:text-amber-400' :
											viewingOrder.status === 'active' || viewingOrder.status === 'approved' ? 'text-emerald-600 dark:text-emerald-400' :
											viewingOrder.status === 'completed' ? 'text-blue-600 dark:text-blue-400' :
											'text-rose-600 dark:text-rose-400'
										}`}>
											{viewingOrder.status === 'pending' ? 'Kutilmoqda' :
											viewingOrder.status === 'active' || viewingOrder.status === 'approved' ? 'Jarayonda' :
											viewingOrder.status === 'completed' ? 'Bajarildi' :
											viewingOrder.status === 'cancelled' ? 'Bekor qilindi' :
											viewingOrder.status}
										</span>
									</div>

									<div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
										<span className="text-xs font-bold text-text-secondary">Sana:</span>
										<span className="text-xs font-black text-slate-700 dark:text-slate-300">
											{viewingOrder.date || new Date(viewingOrder.createdAt).toLocaleDateString('uz-UZ')}
										</span>
									</div>

									{viewingMaster && (
										<div className="pt-3 border-t border-slate-200 dark:border-slate-700">
											<button
												onClick={() => {
													setViewingOrder(null);
													setActiveTab('home');
												}}
												className="w-full py-2.5 bg-brand hover:bg-brand-hover text-white text-xs font-black rounded-xl cursor-pointer flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-900/10"
											>
												<User size={14} />
												Usta Profilini Ko'rish
											</button>
										</div>
									)}
								</div>
							</motion.div>
						</div>
					)}
				</AnimatePresence>

				{/* PWA INSTALL MODAL */}
				<AnimatePresence>
					{pwaModalOpen && (
						<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
							<div
								className="absolute inset-0"
								onClick={() => setPwaModalOpen(false)}
							/>

							<motion.div
								initial={{ opacity: 0, scale: 0.95, y: 20 }}
								animate={{ opacity: 1, scale: 1, y: 0 }}
								exit={{ opacity: 0, scale: 0.95, y: 20 }}
								className="w-full max-w-sm bg-white dark:bg-[#181C20] rounded-xl p-6 shadow-2xl relative z-10 text-left border border-slate-100 dark:border-slate-800 text-slate-900 dark:text-slate-100"
							>
								<div className="flex justify-between items-center mb-4 pb-2 border-b border-dashed border-slate-200 dark:border-slate-700">
									<h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
										<Smartphone
											size={15}
											className="text-brand dark:text-blue-400"
										/>
										Ilovani o'rnatish
									</h3>
									<button
										onClick={() => setPwaModalOpen(false)}
										className="p-1.5 rounded-lg text-text-secondary dark:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-center transition-all"
									>
										<X size={15} />
									</button>
								</div>

								<div className="text-center mb-5">
									<div className="mx-auto w-16 h-16 rounded-[24%] overflow-hidden shadow-lg flex items-center justify-center mb-2.5">
										<img
											loading="lazy"
											src="/icon-512x512.png"
											className="w-full h-full object-cover rounded-[24%]"
											alt="Master Group – Professional ustalar platformasi"
										/>
									</div>
									<h4 className="text-sm font-black text-slate-900 dark:text-white">
										Master Group Ilovasi
									</h4>
									<p className="text-[10px] text-text-secondary dark:text-text-secondary font-bold">
										Hech qanday Play Market yoki App Store'siz oson yuklash!
									</p>
								</div>

								<div className="flex flex-col gap-4">
									{/* DIRECT ACCESSIBLE BUTTON */}
									<button
										onClick={async () => {
											if (pwaInstallPrompt) {
												try {
													await pwaInstallPrompt.prompt();
													const { outcome } = await pwaInstallPrompt.userChoice;
													if (outcome === 'accepted') {
														showToast('Ilova telefonga yuklandi!', 'success');
														setPwaInstallPrompt(null);
														setShowPwaBanner(false);
														setPwaModalOpen(false);
														return;
													}
												} catch (e) {}
												setPwaInstallPrompt(null);
											}
											showToast(
												"Ilova yuklanmadi. Quyidagi ko'rsatmalarga amal qiling yoki brauzer menyusidan 'Asosiy ekranga qo'shish'ni tanlang.",
												'info'
											);
										}}
										className="w-full py-3 bg-brand hover:bg-brand-hover text-white text-xs font-black rounded-2xl cursor-pointer flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-900/10"
									>
										<Smartphone size={14} />
										AVTOMATIK O'RNATISH
									</button>

									{/* iOS Safari Instructions */}
									<div className="p-3 bg-amber-500/5 dark:bg-amber-500/10 rounded-2xl border border-amber-500/10 text-left">
										<h5 className="text-[10px] font-black text-amber-600 dark:text-amber-400 flex items-center gap-1 mb-1.5">
											<span>🍎</span> iPhone / iPad (iOS) uchun:
										</h5>
										<ol className="text-[10px] text-slate-600 dark:text-slate-300 font-bold space-y-1.5">
											<li className="flex items-start gap-1.5">
												<span className="bg-amber-500/20 text-amber-700 dark:text-amber-300 rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold mt-0.5 shrink-0">
													1
												</span>
												<span>
													Safari brauzerida pastdagi{' '}
													<strong>"Ulashish" (Share)</strong> 📤 tugmasini
													bosing.
												</span>
											</li>
											<li className="flex items-start gap-1.5">
												<span className="bg-amber-500/20 text-amber-700 dark:text-amber-300 rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold mt-0.5 shrink-0">
													2
												</span>
												<span>
													Menyudan{' '}
													<strong>"Ekran kiritish" (Add to Home Screen)</strong>{' '}
													➕ bandini tanlang.
												</span>
											</li>
											<li className="flex items-start gap-1.5">
												<span className="bg-amber-500/20 text-amber-700 dark:text-amber-300 rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold mt-0.5 shrink-0">
													3
												</span>
												<span>
													Yuqori burchakdagi <strong>"Qo'shish" (Add)</strong>{' '}
													tugmasini bosib tasdiqlang.
												</span>
											</li>
										</ol>
									</div>

									{/* Android / Chrome Manual Guide fallback */}
									<div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-2xl border border-blue-100 dark:border-blue-900/30 text-left">
										<h5 className="text-[10px] font-black text-blue-600 dark:text-blue-400 flex items-center gap-1 mb-1.5">
											<span>🤖</span> Android / Chrome uchun:
										</h5>
										<ol className="text-[10px] text-slate-600 dark:text-slate-300 font-bold space-y-1.5">
											<li className="flex items-start gap-1.5">
												<span className="bg-blue-500/20 text-blue-700 dark:text-blue-300 rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold mt-0.5 shrink-0">
													1
												</span>
												<span>
													Yuqoridagi <strong>"AVTOMATIK O'RNATISH"</strong>{' '}
													tugmasini bosing.
												</span>
											</li>
											<li className="flex items-start gap-1.5">
												<span className="bg-blue-500/20 text-blue-700 dark:text-blue-300 rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold mt-0.5 shrink-0">
													2
												</span>
												<span>
													Agar o'rnatilmasa, brauzer menyusidan (3 ta nuqta ⋮){' '}
													<strong>"Ilovani o'rnatish"</strong> bandini bosing.
												</span>
											</li>
										</ol>
									</div>
								</div>

								<div className="mt-5 pt-3 border-t border-dashed border-slate-100 dark:border-slate-800 text-center">
									<p className="text-[9px] text-text-secondary dark:text-slate-600 font-bold">
										Play Market yoki App Store'dan yuklab olish shart emas!
									</p>
								</div>
							</motion.div>
						</div>
					)}

					{editProfileModalOpen && (
						<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
							<div
								className="absolute inset-0"
								onClick={() => sep('modalOpen', false)}
							/>

							<motion.div
								initial={{ opacity: 0, scale: 0.95, y: 20 }}
								animate={{ opacity: 1, scale: 1, y: 0 }}
								exit={{ opacity: 0, scale: 0.95, y: 20 }}
								className="w-full max-w-sm bg-white dark:bg-[#181C20] rounded-xl p-6 shadow-2xl relative z-10 text-left border border-slate-100 dark:border-slate-800 text-slate-900 dark:text-slate-100 max-h-[85vh] overflow-y-auto no-scrollbar"
							>
								<div className="flex justify-between items-center mb-4 pb-2 border-b border-dashed border-slate-200 dark:border-slate-700">
									<h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
										<UserCheck
											size={15}
											className="text-brand dark:text-blue-400"
										/>
										Profilni tahrirlash
									</h3>
									<button
										onClick={() => sep('modalOpen', false)}
										className="p-1.5 rounded-lg text-text-secondary dark:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-center transition-all"
									>
										<X size={15} />
									</button>
								</div>

								<div className="flex flex-col gap-3.5">
									<div>
										<label className="text-[9px] font-black uppercase tracking-wider text-text-secondary dark:text-slate-600 block mb-1 ml-0.5">
											Ism va familiya
										</label>
										<input
											type="text"
											value={editProfileName}
											onChange={(e) => sep('name', e.target.value)}
											className="w-full text-xs font-bold px-4 py-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1215] text-slate-800 dark:text-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-brand dark:focus:border-blue-500 transition-all"
										/>
									</div>

									<div>
										<label className="text-[9px] font-black uppercase tracking-wider text-text-secondary dark:text-slate-600 block mb-1 ml-0.5">
											Telefon raqami
										</label>
										<input
											type="text"
											value={editProfilePhone}
											onChange={(e) => {
												let digits = e.target.value.replace(/\D/g, '');
												if (digits.startsWith('998'))
													digits = digits.substring(3);
												digits = digits.substring(0, 9);
												let formatted = '+998 ';
												if (digits.length > 0)
													formatted += digits.substring(0, 2);
												if (digits.length >= 3)
													formatted += ' ' + digits.substring(2, 5);
												if (digits.length >= 6)
													formatted += ' ' + digits.substring(5, 7);
												if (digits.length >= 8)
													formatted += ' ' + digits.substring(7, 9);
												sep('phone', formatted);
											}}
											placeholder="+998 __ ___ __ __"
											className="w-full text-xs font-bold px-4 py-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1215] text-slate-800 dark:text-slate-100 rounded-2xl outline-none font-mono focus:ring-2 focus:ring-blue-500/10 focus:border-brand dark:focus:border-blue-500 transition-all"
										/>
									</div>

									<div className="mt-1 pt-3 border-t border-dashed border-slate-200 dark:border-slate-800">
										<h4 className="text-[9px] font-black uppercase tracking-wider text-text-secondary dark:text-slate-600 mb-2.5">
											Parolni almashtirish (ixtiyoriy)
										</h4>
										<div className="flex flex-col gap-3">
											<input
												type="password"
												value={editProfileCurrentPassword}
												onChange={(e) => sep('currentPassword', e.target.value)}
												placeholder="Joriy parol"
												className="w-full text-xs font-bold px-4 py-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1215] text-slate-800 dark:text-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-brand dark:focus:border-blue-500 transition-all"
											/>
											<input
												type="password"
												value={editProfileNewPassword}
												onChange={(e) => sep('newPassword', e.target.value)}
												placeholder="Yangi parol (kamida 8 belgi)"
												className="w-full text-xs font-bold px-4 py-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1215] text-slate-800 dark:text-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-brand dark:focus:border-blue-500 transition-all"
											/>
										</div>
									</div>
								</div>

								<button
									disabled={editProfileSaving}
									onClick={async () => {
										if (!editProfileName.trim()) {
											showToast("Ism bo'sh bo'lishi mumkin emas", 'error');
											return;
										}
										if (editProfilePhone.replace(/\D/g, '').length !== 12) {
											showToast("Telefon raqamini to'liq kiriting", 'error');
											return;
										}
										if (
											editProfileNewPassword &&
											editProfileNewPassword.length < 8
										) {
											showToast(
												"Yangi parol kamida 8 ta belgidan iborat bo'lishi kerak",
												'error'
											);
											return;
										}
										sep('saving', true);
										try {
											const updated = await api.updateProfile({
												name: editProfileName.trim(),
												phone: '+' + editProfilePhone.replace(/\D/g, ''),
												...(editProfileNewPassword && {
													currentPassword: editProfileCurrentPassword,
													newPassword: editProfileNewPassword,
												}),
											});
											setProfile(updated);
											sep('currentPassword', '');
											sep('newPassword', '');
											sep('modalOpen', false);
											showToast('Profil muvaffaqiyatli yangilandi!', 'success');
										} catch (err) {
											showToast(
												err instanceof Error
													? err.message
													: 'Xatolik yuz berdi',
												'error'
											);
										} finally {
											sep('saving', false);
										}
									}}
									className="w-full mt-5 py-3 bg-brand hover:bg-brand-hover disabled:opacity-60 text-white text-xs font-black rounded-2xl cursor-pointer flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-900/10"
								>
									{editProfileSaving
										? 'Saqlanmoqda...'
										: "O'zgarishlarni saqlash"}
								</button>
							</motion.div>
						</div>
					)}

					{paymentHistoryModalOpen && (
						<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
							<div
								className="absolute inset-0"
								onClick={() => setPaymentHistoryModalOpen(false)}
							/>

							<motion.div
								initial={{ opacity: 0, scale: 0.95, y: 20 }}
								animate={{ opacity: 1, scale: 1, y: 0 }}
								exit={{ opacity: 0, scale: 0.95, y: 20 }}
								className="w-full max-w-sm bg-white dark:bg-[#181C20] rounded-xl p-6 shadow-2xl relative z-10 text-left border border-slate-100 dark:border-slate-800 text-slate-900 dark:text-slate-100 max-h-[85vh] overflow-y-auto no-scrollbar"
							>
								<div className="flex justify-between items-center mb-4 pb-2 border-b border-dashed border-slate-200 dark:border-slate-700">
									<h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
										<CreditCard
											size={15}
											className="text-brand dark:text-blue-400"
										/>
										To'lovlar tarixi
									</h3>
									<button
										onClick={() => setPaymentHistoryModalOpen(false)}
										className="p-1.5 rounded-lg text-text-secondary dark:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-center transition-all"
									>
										<X size={15} />
									</button>
								</div>

								{pendingPayments.length === 0 ? (
									<div className="flex flex-col items-center gap-3 py-8 text-center">
										<CreditCard
											size={32}
											className="text-slate-300 dark:text-slate-600"
										/>
										<p className="text-xs font-bold text-text-secondary">
											To'lovlar mavjud emas
										</p>
									</div>
								) : (
									<div className="flex flex-col gap-2">
										{pendingPayments.map((payment) => {
											const tariff = tariffs.find(
												(t) => t.id === payment.packageId
											);
											return (
												<div
													key={payment.id}
													className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 flex flex-col gap-1.5"
												>
													<div className="flex items-center justify-between">
														<span className="text-[10px] font-black uppercase text-text-secondary">
															{tariff?.name || payment.packageId}
														</span>
														<span
															className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
																payment.status === 'approved'
																	? 'bg-green-500/10 text-green-600'
																	: payment.status === 'rejected'
																		? 'bg-red-500/10 text-red-500'
																		: 'bg-amber-500/10 text-amber-600'
															}`}
														>
															{payment.status === 'approved'
																? 'Tasdiqlangan'
																: payment.status === 'rejected'
																	? 'Bekor qilingan'
																	: 'Kutilmoqda'}
														</span>
													</div>
													<div className="flex justify-between text-[10px] font-bold">
														<span className="text-text-secondary">Summa:</span>
														<span className="text-slate-700 dark:text-slate-300">
															{(payment.amount || 0).toLocaleString()} UZS
														</span>
													</div>
													{payment.receiptText && (
														<div className="flex justify-between text-[10px] font-bold">
															<span className="text-text-secondary">
																Kvitansiya:
															</span>
															<span className="text-slate-700 dark:text-slate-300 font-mono">
																{payment.receiptText}
															</span>
														</div>
													)}
													<div className="flex justify-between text-[9px] font-bold">
														<span className="text-text-secondary">Sana:</span>
														<span className="text-text-secondary">
															{new Date(payment.createdAt).toLocaleString(
																'uz-UZ'
															)}
														</span>
													</div>
												</div>
											);
										})}
									</div>
								)}

								<button
									onClick={() => setPaymentHistoryModalOpen(false)}
									className="w-full mt-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-black rounded-xl cursor-pointer transition-all"
								>
									Yopish
								</button>
							</motion.div>
						</div>
					)}
				</AnimatePresence>
			</div>
		</div>
	);
}
