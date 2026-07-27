import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
	Users,
	Wrench,
	CheckCircle2,
	TrendingUp,
	DollarSign,
	X,
	Upload,
	Layers,
	MessageSquare,
	Gift,
	Settings,
	Menu,
	Moon,
	Sun,
	Monitor,
	ClipboardList,
	LayoutGrid,
	MessageCircle,
	Bug,
	MessagesSquare,
	BellRing,
	Building2,
} from 'lucide-react';
import { useTheme } from '../theme/ThemeProvider';
import { useAdminData } from './admin/useAdminData';
import { cx } from './admin/AdminUI';
import type { AdminTab } from './admin/adminTypes';
import AddMasterModal from './admin/AddMasterModal';
import AnalyticsTab from './admin/tabs/AnalyticsTab';
import MastersTab from './admin/tabs/MastersTab';
import ClientsTab from './admin/tabs/ClientsTab';
import OrdersTab from './admin/tabs/OrdersTab';
import ApprovalsTab from './admin/tabs/ApprovalsTab';
import AdsTab from './admin/tabs/AdsTab';
import EnterpriseTab from './admin/tabs/EnterpriseTab';
import MarketplaceTab from './admin/tabs/MarketplaceTab';
import PaymentsTab from './admin/tabs/PaymentsTab';
import SupportTab from './admin/tabs/SupportTab';
import LogoTab from './admin/tabs/LogoTab';
import CategoriesTab from './admin/tabs/CategoriesTab';
import SmsTemplatesTab from './admin/tabs/SmsTemplatesTab';
import ErrorLogsTab from './admin/tabs/ErrorLogsTab';
import ConversationsTab from './admin/tabs/ConversationsTab';
import NotificationsTab from './admin/tabs/NotificationsTab';

const ADMIN_TABS: AdminTab[] = [
	'analytics', 'masters', 'clients', 'orders', 'approvals', 'ads', 'enterprise',
	'marketplace', 'support', 'logo', 'payments', 'categories', 'sms',
	'errorlogs', 'conversations', 'notifications',
];

interface AdminDashboardProps {
	activeTab?: string;
	onTabChange: (tab: AdminTab) => void;
	onClose: () => void;
	customLogoUrl: string | null;
	fileInputRef: React.RefObject<HTMLInputElement | null>;
	handleResetLogo: () => void;
	showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

interface NavItem {
	id: AdminTab;
	label: string;
	icon: typeof Users;
	badge?: number;
	badgeTone?: 'danger' | 'amber';
}

export default function AdminDashboard({
	activeTab,
	onTabChange,
	onClose,
	customLogoUrl,
	fileInputRef,
	handleResetLogo,
	showToast,
}: AdminDashboardProps) {
	const { theme, cycleTheme } = useTheme();
	const data = useAdminData(showToast);
	const { masters, clients, orders, applications, pendingPayments, categories, enterpriseOrders, dataLoading } = data;

	// URL is the source of truth (see App.tsx's /app/admin/:adminTab? route) -
	// an unknown/missing segment falls back to 'analytics' rather than 404ing,
	// same as the main app's /app/:tab? handling.
	const adminTab: AdminTab =
		activeTab && (ADMIN_TABS as string[]).includes(activeTab)
			? (activeTab as AdminTab)
			: 'analytics';
	const [sidebarOpen, setSidebarOpen] = useState(false);

	// useAdminData's own mount effect already loads every tab's data once;
	// this only re-pulls the tab being switched to, so a long-open admin
	// session doesn't show stale data on tabs revisited later.
	const isFirstTabRender = useRef(true);
	useEffect(() => {
		if (isFirstTabRender.current) {
			isFirstTabRender.current = false;
			return;
		}
		data.refetchTab(adminTab);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [adminTab]);

	// Payments can also get approved/rejected from the Telegram review chat
	// now (see backend payments/telegram.py) - re-pull every 30min while an
	// admin is sitting on this tab so that shows up without them needing to
	// leave and come back.
	useEffect(() => {
		if (adminTab !== 'payments') return;
		const interval = setInterval(() => data.refetchTab('payments'), 30 * 60 * 1000);
		return () => clearInterval(interval);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [adminTab]);

	const pendingPaymentCount = pendingPayments.filter((p) => p.status === 'pending').length;
	const activeOrderCount = orders.filter((o) => o.status === 'pending' || o.status === 'active').length;

	const navItems: NavItem[] = [
		{ id: 'analytics', label: 'Bosh sahifa & Analitika', icon: TrendingUp },
		{ id: 'masters', label: `Ustalar (${masters.length})`, icon: Wrench },
		{ id: 'clients', label: `Mijozlar (${clients.length})`, icon: Users },
		{
			id: 'orders',
			label: `Buyurtmalar (${orders.length})`,
			icon: ClipboardList,
			badge: activeOrderCount || undefined,
			badgeTone: 'amber',
		},
		{
			id: 'approvals',
			label: "Tasdiqlash bo'limi",
			icon: CheckCircle2,
			badge: applications.length || undefined,
			badgeTone: 'danger',
		},
		{ id: 'ads', label: 'Reklama sozlamalari', icon: Gift },
		{ id: 'enterprise', label: `Korxona e'lonlari (${enterpriseOrders.length})`, icon: Building2 },
		{ id: 'categories', label: `Kategoriyalar (${categories.length})`, icon: LayoutGrid },
		{ id: 'marketplace', label: 'Premium va Tariflar', icon: Layers },
		{
			id: 'payments',
			label: "To'lovlar & Tarix",
			icon: DollarSign,
			badge: pendingPaymentCount || undefined,
			badgeTone: 'amber',
		},
		{ id: 'notifications', label: 'Bildirishnomalar', icon: BellRing },
		{ id: 'conversations', label: 'Suhbatlar', icon: MessagesSquare },
		{ id: 'support', label: "Qo'llab-quvvatlash", icon: MessageSquare },
		{ id: 'sms', label: 'SMS Shablonlari', icon: MessageCircle },
		{ id: 'errorlogs', label: 'Xato loglari', icon: Bug },
		{ id: 'logo', label: 'Logo va Dizayn', icon: Upload },
	];

	function selectTab(id: AdminTab) {
		onTabChange(id);
		setSidebarOpen(false);
	}

	const sidebarContent = (
		<>
			<div className="flex flex-col gap-1.5">
				<span className="text-[11px] text-text-secondary font-black uppercase tracking-widest pl-3 mb-2">
					Platforma boshqaruvi
				</span>

				{navItems.map((item) => {
					const Icon = item.icon;
					const isActive = adminTab === item.id;
					return (
						<button
							key={item.id}
							onClick={() => selectTab(item.id)}
							className={cx(
								'w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer',
								isActive
									? 'bg-[#0E5A3C] text-white shadow-md shadow-[#0E5A3C]/10'
									: 'text-slate-300 hover:bg-slate-800 hover:text-white'
							)}
						>
							<Icon size={16} className={item.id === 'payments' && !isActive ? 'text-amber-500' : ''} />
							<span className="truncate">{item.label}</span>
							{item.badge ? (
								<span
									className={cx(
										'ml-auto text-[11px] font-black px-1.5 py-0.5 rounded-full shrink-0',
										item.badgeTone === 'amber'
											? 'bg-amber-500 text-slate-950'
											: 'bg-red-500 text-white'
									)}
								>
									{item.badge}
								</span>
							) : item.id === 'support' ? (
								<span className="ml-auto w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
							) : null}
						</button>
					);
				})}
			</div>

			<div className="flex flex-col gap-2">
				<button
					onClick={cycleTheme}
					className="flex items-center gap-2.5 px-3 py-2 w-full rounded-lg text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition-all cursor-pointer"
				>
					{theme === 'light' ? (
						<Moon size={16} />
					) : theme === 'dark' ? (
						<Sun size={16} />
					) : (
						<Monitor size={16} />
					)}
					<span>
						{theme === 'light' ? 'Tungi rejim' : theme === 'dark' ? 'Kunduzgi rejim' : 'Tizim rejimi'}
					</span>
				</button>

				<div className="bg-slate-800/50 p-3.5 rounded-2xl border border-slate-800 text-[11px] font-bold">
					<span className="text-text-secondary uppercase text-[11px] tracking-wider block mb-2">
						Tizim holati
					</span>
					<div className="flex items-center justify-between mb-1.5 text-slate-300">
						<span>Ulanish</span>
						<span className="text-emerald-400 font-extrabold flex items-center gap-1.5">
							<span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
							Xavfsiz
						</span>
					</div>
					<div className="flex items-center justify-between text-slate-300">
						<span>Jami yozuvlar</span>
						<span className="text-blue-400 font-extrabold font-mono">
							{masters.length + clients.length}
						</span>
					</div>
				</div>
			</div>
		</>
	);

	return (
		<div className="flex flex-col h-full w-full bg-surface-secondary text-text-primary">
			{/* Header */}
			<div className="bg-brand text-white py-3.5 px-4 sm:px-6 flex justify-between items-center shadow-md shrink-0">
				<div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
					<button
						onClick={() => setSidebarOpen(true)}
						className="lg:hidden p-2 -ml-1 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer shrink-0"
						aria-label="Menyu"
					>
						<Menu size={18} />
					</button>
					<div className="p-2 bg-white/10 rounded-xl shrink-0 hidden sm:block">
						<Settings size={22} className="text-emerald-300" />
					</div>
					<div className="min-w-0">
						<div className="flex items-center gap-2">
							<h2 className="text-sm sm:text-base font-black tracking-tight truncate">
								Master Group Boshqaruv Paneli
							</h2>
							<span className="hidden sm:inline bg-red-500 text-[11px] font-black uppercase px-2 py-0.5 rounded-full animate-pulse shrink-0">
								Boshqaruv Rejimi
							</span>
						</div>
						<p className="hidden sm:block text-[11px] text-slate-300 font-bold uppercase tracking-wider mt-0.5 truncate">
							Kompyuter va Planshetlar uchun optimallashtirilgan ish stoli
						</p>
					</div>
				</div>

				<div className="flex items-center gap-2 sm:gap-4 shrink-0">
					<button
						onClick={onClose}
						className="p-2 sm:px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer font-bold flex items-center gap-1.5 text-xs"
					>
						<X size={16} />
						<span className="hidden sm:inline">Chiqish</span>
					</button>
				</div>
			</div>

			<div className="flex flex-1 overflow-hidden relative">
				{/* Desktop sidebar */}
				<div className="hidden lg:flex w-56 bg-slate-900 text-slate-300 flex-col justify-between shrink-0 p-3 border-r border-slate-800 overflow-y-auto">
					{sidebarContent}
				</div>

				{/* Mobile sidebar drawer */}
				<AnimatePresence>
					{sidebarOpen && (
						<div className="lg:hidden fixed inset-0 z-40 flex">
							<motion.div
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
								onClick={() => setSidebarOpen(false)}
							/>
							<motion.div
								initial={{ x: '-100%' }}
								animate={{ x: 0 }}
								exit={{ x: '-100%' }}
								transition={{ type: 'tween', duration: 0.2 }}
								className="relative w-64 max-w-[80vw] bg-slate-900 text-slate-300 flex flex-col justify-between p-3 overflow-y-auto"
							>
								{sidebarContent}
							</motion.div>
						</div>
					)}
				</AnimatePresence>

				{/* Main content */}
				<div className="flex-1 overflow-y-auto p-4 lg:p-5 text-left mx-auto w-full">
					{dataLoading ? (
						<div className="flex flex-col gap-4 animate-pulse">
							<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
								{[1, 2, 3, 4].map((i) => (
									<div key={i} className="bg-surface-tertiary rounded-xl h-24" />
								))}
							</div>
							<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
								{[1, 2].map((i) => (
									<div key={i} className="bg-surface-tertiary rounded-xl h-80" />
								))}
							</div>
						</div>
					) : (
						<>
							{adminTab === 'analytics' && <AnalyticsTab data={data} />}
							{adminTab === 'masters' && <MastersTab data={data} />}
							{adminTab === 'clients' && <ClientsTab data={data} />}
						{adminTab === 'orders' && <OrdersTab data={data} />}
							{adminTab === 'approvals' && <ApprovalsTab data={data} />}
							{adminTab === 'ads' && <AdsTab data={data} />}
							{adminTab === 'enterprise' && <EnterpriseTab data={data} />}
							{adminTab === 'marketplace' && <MarketplaceTab data={data} />}
							{adminTab === 'payments' && <PaymentsTab data={data} />}
							{adminTab === 'categories' && <CategoriesTab data={data} />}
							{adminTab === 'notifications' && <NotificationsTab data={data} />}
							{adminTab === 'conversations' && <ConversationsTab data={data} />}
							{adminTab === 'support' && <SupportTab data={data} />}
							{adminTab === 'sms' && <SmsTemplatesTab data={data} />}
							{adminTab === 'errorlogs' && <ErrorLogsTab data={data} />}
							{adminTab === 'logo' && (
								<LogoTab
									customLogoUrl={customLogoUrl}
									fileInputRef={fileInputRef}
									handleResetLogo={handleResetLogo}
									showToast={showToast}
								/>
							)}
						</>
					)}

					<AddMasterModal data={data} />
				</div>
			</div>
		</div>
	);
}
