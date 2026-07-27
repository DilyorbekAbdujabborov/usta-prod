import { useEffect, useMemo, useReducer, useState } from 'react';
import {
	useApi,
	type Tariff,
	type Payment,
	type Ad,
	type EnterpriseOrder,
	type Order,
	type Category,
	type SmsTemplate,
	type ErrorLogEntry,
	type AdminConversation,
	type PushDevice,
} from '../../lib/api';
import type { AdminTab } from './adminTypes';
import { CATEGORIES } from '../../lib/categories';
import {
	dbApplicationToPending,
	dbClientToLocal,
	dbMasterToProfile,
	dbTicketToLocal,
	settingsReducer,
	initialSettings,
	adFormReducer,
	initialAdForm,
	enterpriseFormReducer,
	initialEnterpriseForm,
	tariffFormReducer,
	initialTariffForm,
	masterFormReducer,
	initialMasterForm,
	type ClientUser,
	type MasterProfile,
	type PendingApplication,
	type SettingsState,
	type AdFormState,
	type EnterpriseFormState,
	type TariffFormState,
	type MasterFormState,
	type SupportTicket,
} from './adminTypes';

type ToastFn = (msg: string, type?: 'success' | 'error' | 'info') => void;

const WEEKDAY_LABELS_UZ = ['Yak', 'Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan'];

function withTimeout<T>(promise: Promise<T>, ms = 12000): Promise<T> {
	return Promise.race([
		promise,
		new Promise<T>((_, reject) =>
			setTimeout(() => reject(new Error("So'rov vaqti tugadi")), ms)
		),
	]);
}

export function useAdminData(showToast: ToastFn) {
	const api = useApi();

	const [ss, dispatchSs] = useReducer(settingsReducer, initialSettings);
	const { premiumMode, adminCard, adminCardHolder, totalUsers, logotypePath } =
		ss;
	function sst(field: keyof SettingsState, value: unknown) {
		dispatchSs({ type: 'SET_SETTINGS', field, value });
	}

	const [af, dispatchAf] = useReducer(adFormReducer, initialAdForm);
	const {
		title: newAdTitle,
		discount: newAdDiscount,
		code: newAdCode,
		gradient: newAdGradient,
	} = af;
	function saf(field: keyof AdFormState, value: unknown) {
		dispatchAf({ type: 'SET_AD_FORM', field, value });
	}

	const [ef, dispatchEf] = useReducer(enterpriseFormReducer, initialEnterpriseForm);
	function sef(field: keyof EnterpriseFormState, value: unknown) {
		dispatchEf({ type: 'SET_ENTERPRISE_FORM', field, value });
	}
	function resetEnterpriseForm() {
		dispatchEf({ type: 'RESET_ENTERPRISE_FORM' });
	}

	const [tf, dispatchTf] = useReducer(tariffFormReducer, initialTariffForm);
	const {
		name: newTariffName,
		price: newTariffPrice,
		months: newTariffMonths,
		comment: newTariffComment,
		editingId: editingTariffId,
	} = tf;
	function stf(field: keyof TariffFormState, value: unknown) {
		dispatchTf({ type: 'SET_TARIFF_FORM', field, value });
	}

	const [mf, dispatchMf] = useReducer(masterFormReducer, initialMasterForm);
	const {
		modalOpen: addMasterModalOpen,
		name: newMasterName,
		category: newMasterCategory,
		phone: newMasterPhone,
		region: newMasterRegion,
		district: newMasterDistrict,
		experience: newMasterExperience,
		price: newMasterPrice,
		about: newMasterAbout,
		workHours: newMasterWorkHours,
		isVerified: newMasterIsVerified,
	} = mf;
	function smf(field: keyof MasterFormState, value: unknown) {
		dispatchMf({ type: 'SET_MASTER_FORM', field, value });
	}

	const [pendingPayments, setPendingPayments] = useState<Payment[]>([]);
	const [orders, setOrders] = useState<Order[]>([]);
	const [masters, setMasters] = useState<MasterProfile[]>([]);
	const [clients, setClients] = useState<ClientUser[]>([]);
	const [applications, setApplications] = useState<PendingApplication[]>([]);
	const [ads, setAds] = useState<Ad[]>([]);
	const [enterpriseOrders, setEnterpriseOrders] = useState<EnterpriseOrder[]>([]);
	const [tickets, setTickets] = useState<SupportTicket[]>([]);
	const [selectedTicketId, setSelectedTicketId] = useState<string>('');
	const [replyText, setReplyText] = useState('');
	const [tariffs, setTariffs] = useState<Tariff[]>([]);
	const [categories, setCategories] = useState<Category[]>([]);
	const [smsTemplates, setSmsTemplates] = useState<SmsTemplate[]>([]);
	const [errorLogs, setErrorLogs] = useState<ErrorLogEntry[]>([]);
	const [adminConversations, setAdminConversations] = useState<AdminConversation[]>([]);
	const [pushDevices, setPushDevices] = useState<{ totalActive: number; totalInactive: number; devices: PushDevice[] }>({
		totalActive: 0,
		totalInactive: 0,
		devices: [],
	});
	const [dataLoading, setDataLoading] = useState(true);

	// Video embed + category image editor state (persisted client-side only).
	const [videoUrl, setVideoUrl] = useState<string>(
		() => localStorage.getItem('Usta_admin_video') || ''
	);
	const [videoTitle, setVideoTitle] = useState<string>(
		() =>
			localStorage.getItem('Usta_admin_video_title') ||
			"Master Group ilovasidan foydalanish bo'yicha to'liq video qo'llanma"
	);
	useEffect(() => {
		localStorage.setItem('Usta_admin_video', videoUrl);
		localStorage.setItem('Usta_admin_video_title', videoTitle);
	}, [videoUrl, videoTitle]);

	// Load admin data from the DB on mount. Hides the loading skeleton after the
	// first batch (masters + settings) resolves so the UI is interactive quickly;
	// remaining data loads in the background and populates as it arrives.
	useEffect(() => {
		let cancelled = false;
		const criticalBatch = Promise.all([
			withTimeout(api.getMasters()).then((res) => {
				if (!cancelled) setMasters(res.data.map(dbMasterToProfile));
			}),
			withTimeout(api.getSettings()).then((s) => {
				if (cancelled) return;
				sst('premiumMode', s.premiumMode as 'active' | 'noactive');
				sst('adminCard', s.adminCard);
				sst('adminCardHolder', s.adminCardHolder);
				sst('totalUsers', s.totalUsers ?? 142778);
				sst('logotypePath', s.logotypePath ?? null);
			}),
		]);
		criticalBatch.finally(() => { if (!cancelled) setDataLoading(false); });

		Promise.allSettled([
			criticalBatch,
			withTimeout(api.getApplications()).then((rows) => {
				if (!cancelled) setApplications(rows.filter((a) => a.status === 'pending').map(dbApplicationToPending));
			}),
			withTimeout(api.getTariffs()).then((rows) => { if (!cancelled) setTariffs(rows); }),
			withTimeout(api.getPayments()).then((rows) => { if (!cancelled) setPendingPayments(rows); }),
			withTimeout(api.getOrders()).then((rows) => { if (!cancelled) setOrders(rows); }),
			withTimeout(api.getClients()).then((rows) => { if (!cancelled) setClients(rows.map(dbClientToLocal)); }),
			withTimeout(api.getAds()).then((rows) => { if (!cancelled) setAds(rows); }),
			withTimeout(api.getEnterpriseOrdersAdmin()).then((rows) => { if (!cancelled) setEnterpriseOrders(rows); }),
			withTimeout(api.getTickets()).then((rows) => { if (!cancelled) setTickets(rows.map(dbTicketToLocal)); }),
			withTimeout(api.getCategoriesAdmin()).then((rows) => { if (!cancelled) setCategories(rows); }),
			withTimeout(api.getSmsTemplates()).then((rows) => { if (!cancelled) setSmsTemplates(rows); }),
			withTimeout(api.getErrorLogs()).then((rows) => { if (!cancelled) setErrorLogs(rows); }),
			withTimeout(api.getConversationsAdmin()).then((rows) => { if (!cancelled) setAdminConversations(rows); }),
			withTimeout(api.getPushDevices()).then((res) => { if (!cancelled) setPushDevices(res); }),
		]).then((results) => {
			if (cancelled) return;
			if (results.some((r) => r.status === 'rejected')) {
				showToast(
					"Ba'zi ma'lumotlarni yuklab bo'lmadi. Sahifani qayta yuklab ko'ring.",
					'error'
				);
			}
		});
		return () => { cancelled = true; };
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Everything above loads once up front so the panel is usable immediately,
	// but an admin session can sit open for a while - re-pull just the active
	// tab's data on every switch so it doesn't go stale (new payments/orders/
	// messages arriving in the background otherwise wouldn't show up until a
	// full page reload).
	async function refetchTab(tab: AdminTab) {
		try {
			switch (tab) {
				case 'analytics':
					setMasters((await api.getMasters()).data.map(dbMasterToProfile));
					setOrders(await api.getOrders());
					break;
				case 'masters':
					setMasters((await api.getMasters()).data.map(dbMasterToProfile));
					break;
				case 'clients':
					setClients((await api.getClients()).map(dbClientToLocal));
					break;
				case 'orders':
					setOrders(await api.getOrders());
					break;
				case 'approvals':
					setApplications(
						(await api.getApplications())
							.filter((a) => a.status === 'pending')
							.map(dbApplicationToPending)
					);
					break;
				case 'ads':
					setAds(await api.getAds());
					break;
				case 'enterprise':
					setEnterpriseOrders(await api.getEnterpriseOrdersAdmin());
					break;
				case 'marketplace':
					setTariffs(await api.getTariffs());
					break;
				case 'payments':
					setPendingPayments(await api.getPayments());
					break;
				case 'categories':
					setCategories(await api.getCategoriesAdmin());
					break;
				case 'sms':
					setSmsTemplates(await api.getSmsTemplates());
					break;
				case 'errorlogs':
					setErrorLogs(await api.getErrorLogs());
					break;
				case 'conversations':
					setAdminConversations(await api.getConversationsAdmin());
					break;
				case 'notifications':
					setPushDevices(await api.getPushDevices());
					break;
				case 'support':
					setTickets((await api.getTickets()).map(dbTicketToLocal));
					break;
				case 'logo': {
					const s = await api.getSettings();
					sst('logotypePath', s.logotypePath ?? null);
					break;
				}
			}
		} catch {
			// Silent - the tab still shows whatever it had from the last
			// successful load, and the periodic full-batch load will retry.
		}
	}

	function errMsg(err: unknown) {
		return err instanceof Error ? err.message : 'Xatolik yuz berdi';
	}

	/* ───── Tariff CRUD ───── */
	const handleAddOrUpdateTariff = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!newTariffName.trim()) {
			showToast('Iltimos, tarif nomini kiriting!', 'error');
			return;
		}
		try {
			if (editingTariffId) {
				const updated = await api.updateTariff(editingTariffId, {
					name: newTariffName,
					price: newTariffPrice,
					months: newTariffMonths,
					comment: newTariffComment,
				});
				setTariffs((prev) =>
					prev.map((t) => (t.id === editingTariffId ? updated : t))
				);
				stf('editingId', null);
				showToast('Tarif muvaffaqiyatli tahrirlandi!', 'success');
			} else {
				const created = await api.createTariff({
					id: 't-' + Date.now(),
					name: newTariffName,
					price: newTariffPrice,
					months: newTariffMonths,
					comment: newTariffComment || null,
				} as Tariff);
				setTariffs((prev) => [...prev, created]);
				showToast("Yangi tarif muvaffaqiyatli qo'shildi!", 'success');
			}
		} catch (err) {
			showToast(errMsg(err), 'error');
			return;
		}
		stf('name', '');
		stf('price', 50000);
		stf('months', 1);
		stf('comment', '');
	};

	const handleEditTariff = (tariff: Tariff) => {
		stf('editingId', tariff.id);
		stf('name', tariff.name);
		stf('price', tariff.price);
		stf('months', tariff.months);
		stf('comment', tariff.comment || '');
	};

	const handleCancelEditTariff = () => {
		stf('editingId', null);
		stf('name', '');
		stf('price', 50000);
		stf('months', 1);
		stf('comment', '');
	};

	const handleDeleteTariff = async (tariffId: string) => {
		try {
			await api.deleteTariff(tariffId);
			setTariffs((prev) => prev.filter((t) => t.id !== tariffId));
			showToast("Tarif o'chirildi.", 'info');
		} catch (err) {
			showToast(errMsg(err), 'error');
		}
	};

	/* ───── Individual Master Premium Actions ───── */
	const handleExtendMasterPremium = async (masterId: number, days: number) => {
		const master = masters.find((m) => m.id === masterId);
		const base =
			master?.premiumUntil && new Date(master.premiumUntil) > new Date()
				? new Date(master.premiumUntil)
				: new Date();
		base.setDate(base.getDate() + days);
		try {
			const updated = await api.updateMaster(masterId, { premiumUntil: base.toISOString() });
			setMasters((prev) =>
				prev.map((m) => (m.id === masterId ? dbMasterToProfile(updated) : m))
			);
			showToast(`Usta premium muddati ${days} kunga uzaytirildi.`, 'success');
		} catch (err) {
			showToast(errMsg(err), 'error');
		}
	};

	const handleShortenMasterPremium = async (masterId: number, days: number) => {
		const master = masters.find((m) => m.id === masterId);
		if (!master?.premiumUntil) {
			showToast('Usta premium muddati faol emas!', 'error');
			return;
		}
		const newUntil = new Date(master.premiumUntil);
		newUntil.setDate(newUntil.getDate() - days);
		const isNowExpired = newUntil < new Date();
		try {
			const updated = await api.updateMaster(masterId, {
				premiumUntil: isNowExpired ? null : newUntil.toISOString(),
			});
			setMasters((prev) =>
				prev.map((m) => (m.id === masterId ? dbMasterToProfile(updated) : m))
			);
			showToast(
				isNowExpired
					? 'Premium muddati qisqartirildi va faolsizlantirildi.'
					: `Premium muddati ${days} kunga qisqartirildi.`,
				isNowExpired ? 'info' : 'success'
			);
		} catch (err) {
			showToast(errMsg(err), 'error');
		}
	};

	const handleCancelMasterPremium = async (masterId: number) => {
		const target = masters.find((m) => m.id === masterId);
		if (!target) return;
		try {
			const updated = await api.updateMaster(masterId, { premiumUntil: null });
			setMasters((prev) =>
				prev.map((m) => (m.id === masterId ? dbMasterToProfile(updated) : m))
			);
			showToast('Usta premium obunasi bekor qilindi.', 'info');
		} catch (err) {
			showToast(errMsg(err), 'error');
		}
	};

	/* ───── Premium Payment approvals ─────
	   api.reviewPayment already extends masters.premiumUntil server-side (see
	   api/payments.ts) using the tariff's months - this just also grants the
	   verified badge and reflects the result in local state. */
	const handleApprovePayment = async (paymentId: number) => {
		const payment = pendingPayments.find((p) => p.id === paymentId);
		const masterName =
			masters.find((m) => m.id === payment?.masterId)?.name || 'Usta';
		try {
			const updated = await api.reviewPayment(paymentId, 'approved');
			if (updated.masterId) {
				await api.updateMaster(updated.masterId, { verified: true });
			}
			setPendingPayments((prev) =>
				prev.map((p) => (p.id === paymentId ? updated : p))
			);
			const res = await api.getMasters();
			setMasters(res.data.map(dbMasterToProfile));
			showToast(
				`${masterName} to'lovi tasdiqlandi! Premium faollashtirildi.`,
				'success'
			);
		} catch (err) {
			showToast(errMsg(err), 'error');
		}
	};

	const handleDeclinePayment = async (paymentId: number) => {
		const payment = pendingPayments.find((p) => p.id === paymentId);
		const masterName =
			masters.find((m) => m.id === payment?.masterId)?.name || 'Usta';
		try {
			const updated = await api.reviewPayment(paymentId, 'rejected');
			setPendingPayments((prev) =>
				prev.map((p) => (p.id === paymentId ? updated : p))
			);
			showToast(`${masterName} to'lovi rad etildi.`, 'info');
		} catch (err) {
			showToast(errMsg(err), 'error');
		}
	};

	/* ───── Master Management ───── */
	const handleToggleMasterBlock = async (masterId: number) => {
		const target = masters.find((m) => m.id === masterId);
		if (!target) return;
		const nextStatus = target.status === 'active' ? 'blocked' : 'active';
		try {
			await api.updateMaster(masterId, { isActive: nextStatus === 'active' });
			setMasters((prev) =>
				prev.map((m) => (m.id === masterId ? { ...m, status: nextStatus } : m))
			);
			showToast(
				`${target.name} profili ${nextStatus === 'blocked' ? 'bloklandi' : 'faollashtirildi'}`,
				'info'
			);
		} catch (err) {
			showToast(errMsg(err), 'error');
		}
	};

	const handleDeleteMaster = async (masterId: number) => {
		const target = masters.find((m) => m.id === masterId);
		if (!target) return;
		try {
			await api.deleteMaster(masterId);
			setMasters((prev) => prev.filter((m) => m.id !== masterId));
			showToast("Usta platformadan butunlay o'chirildi", 'success');
		} catch (err) {
			showToast(errMsg(err), 'error');
		}
	};

	const handleToggleVerification = async (masterId: number) => {
		const target = masters.find((m) => m.id === masterId);
		if (!target) return;
		const nextVerified = !target.isVerified;
		try {
			await api.updateMaster(masterId, { verified: nextVerified });
			setMasters((prev) =>
				prev.map((m) =>
					m.id === masterId ? { ...m, isVerified: nextVerified } : m
				)
			);
			showToast(
				`${target.name} verifikatsiyasi ${nextVerified ? 'yoqildi' : "o'chirildi"}`,
				'success'
			);
		} catch (err) {
			showToast(errMsg(err), 'error');
		}
	};

	const handleDeleteReview = (masterId: number, reviewId: string) => {
		setMasters((prev) =>
			prev.map((m) =>
				m.id === masterId
					? { ...m, reviews: m.reviews.filter((r) => r.id !== reviewId) }
					: m
			)
		);
		showToast("Usta izohi o'chirildi (ma'lumotlar bazasida o'chirilmadi).", 'info');
	};

	/* ───── Client Management ───── */
	const handleToggleClientBlock = async (clientId: string) => {
		const target = clients.find((c) => c.id === clientId);
		if (!target) return;
		const nextBlocked = target.status === 'active';
		try {
			await api.setClientBlocked(clientId, nextBlocked);
			setClients((prev) =>
				prev.map((c) =>
					c.id === clientId
						? { ...c, status: nextBlocked ? 'blocked' : 'active' }
						: c
				)
			);
			showToast(
				`Mijoz ${target.name} ${nextBlocked ? 'bloklandi' : 'faollashtirildi'}`,
				'info'
			);
		} catch (err) {
			showToast(errMsg(err), 'error');
		}
	};

	const handleDeleteClient = async (clientId: string) => {
		const target = clients.find((c) => c.id === clientId);
		if (!target) return;
		try {
			await api.deleteClient(clientId);
			setClients((prev) => prev.filter((c) => c.id !== clientId));
			showToast("Mijoz platformadan butunlay o'chirildi", 'success');
		} catch (err) {
			showToast(errMsg(err), 'error');
		}
	};

	/* ───── Orders (admin oversight) ───── */
	const handleUpdateOrderStatus = async (orderId: string, status: Order['status']) => {
		try {
			const updated = await api.updateOrder(orderId, { status });
			setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
			showToast('Buyurtma holati yangilandi', 'info');
		} catch (err) {
			showToast(errMsg(err), 'error');
		}
	};

	const handleCancelOrder = async (orderId: string) => {
		// "Bekor qilish" (Cancel) - not delete. deleteOrder() soft-deletes the
		// row (is_deleted=True), which orders_view's GET excludes for both the
		// client and the assigned master - the order would silently vanish
		// from their history instead of showing as cancelled. Match what the
		// button says and what the local state update below already assumed.
		try {
			const updated = await api.updateOrder(orderId, { status: 'cancelled' });
			setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
			showToast('Buyurtma bekor qilindi', 'info');
		} catch (err) {
			showToast(errMsg(err), 'error');
		}
	};

	/* ───── Categories CRUD ───── */
	const handleCreateCategory = async (data: { id: string; name: string; color?: string; image?: string; sortOrder?: number }) => {
		try {
			const created = await api.createCategory(data);
			setCategories((prev) => [...prev, created]);
			showToast("Kategoriya qo'shildi", 'success');
		} catch (err) {
			showToast(errMsg(err), 'error');
		}
	};

	const handleUpdateCategory = async (id: string, data: Partial<Pick<Category, 'name' | 'color' | 'image' | 'sortOrder' | 'isActive'>>) => {
		try {
			const updated = await api.updateCategory(id, data);
			setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)));
		} catch (err) {
			showToast(errMsg(err), 'error');
		}
	};

	const handleDeleteCategory = async (id: string) => {
		try {
			await api.deleteCategory(id);
			setCategories((prev) => prev.filter((c) => c.id !== id));
			showToast("Kategoriya o'chirildi", 'info');
		} catch (err) {
			showToast(errMsg(err), 'error');
		}
	};

	/* ───── SMS templates ───── */
	const handleUpdateSmsTemplate = async (key: string, data: Partial<Pick<SmsTemplate, 'body' | 'isActive'>>) => {
		try {
			const updated = await api.updateSmsTemplate(key, data);
			setSmsTemplates((prev) => prev.map((t) => (t.key === key ? updated : t)));
			showToast('SMS shablon saqlandi', 'success');
		} catch (err) {
			showToast(errMsg(err), 'error');
		}
	};

	/* ───── Broadcast push ───── */
	const handleBroadcastPush = async (role: 'client' | 'master' | 'all', title: string, body: string) => {
		try {
			const res = await api.sendPush({ role }, title, body);
			showToast(`${res.targeted} foydalanuvchiga yuborildi, ${res.sent} tasiga push yetdi`, 'success');
			return res;
		} catch (err) {
			showToast(errMsg(err), 'error');
			throw err;
		}
	};

	/* ───── Partnership Application approvals ───── */
	const handleApproveApp = async (app: PendingApplication) => {
		try {
			// Server creates the `masters` row from the application data and returns
			// the updated application; refetch masters to pick up its real DB id.
			await api.reviewApplication(Number(app.id), 'approved');
			const res = await api.getMasters();
			setMasters(res.data.map(dbMasterToProfile));
			setApplications((prev) => prev.filter((a) => a.id !== app.id));
			showToast(
				`${app.name} arizasi tasdiqlandi va usta profili yaratildi!`,
				'success'
			);
		} catch (err) {
			showToast(errMsg(err), 'error');
		}
	};

	const handleDeclineApp = async (appId: string) => {
		try {
			await api.reviewApplication(Number(appId), 'declined');
			setApplications((prev) => prev.filter((a) => a.id !== appId));
			showToast('Ariza rad etildi.', 'info');
		} catch (err) {
			showToast(errMsg(err), 'error');
		}
	};

	const handleCreateMaster = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!newMasterName.trim()) {
			showToast('Iltimos, usta ismini kiriting', 'error');
			return;
		}
		if (!newMasterPhone.trim() || newMasterPhone === '+998 ') {
			showToast('Iltimos, telefon raqamini kiriting', 'error');
			return;
		}

		const selectedCatObj = CATEGORIES.find((c) => c.id === newMasterCategory);
		const categoryName = selectedCatObj ? selectedCatObj.name : newMasterCategory;

		const randomIdSeed = Math.floor(Math.random() * 50) + 10;
		const isEven = randomIdSeed % 2 === 0;
		const avatarUrl = isEven
			? `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300`
			: `https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300`;

		try {
			const created = await api.createMaster({
				categoryId: newMasterCategory,
				name: newMasterName,
				phone: newMasterPhone,
				avatarUrl,
				bio:
					newMasterAbout.trim() ||
					`${categoryName} bo'yicha professional xizmatlar ko'rsataman.`,
				experience: Number(newMasterExperience) || 3,
				price: Number(newMasterPrice) || 50000,
				region: newMasterRegion,
				district: newMasterDistrict,
				verified: newMasterIsVerified,
			});
			setMasters((prev) => [dbMasterToProfile(created), ...prev]);

			smf('name', '');
			smf('phone', '+998 ');
			smf('category', 'plumbing');
			smf('experience', '3');
			smf('price', '50000');
			smf('about', '');
			smf('workHours', '09:00 - 18:00');
			smf('isVerified', true);
			smf('modalOpen', false);

			showToast("Yangi usta muvaffaqiyatli qo'shildi!", 'success');
		} catch (err) {
			showToast(errMsg(err), 'error');
		}
	};

	/* ───── Ads/Promo management ───── */
	const handleAddAd = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!newAdTitle || !newAdDiscount || !newAdCode) {
			showToast("Barcha maydonlarni to'ldiring!", 'error');
			return;
		}
		try {
			const created = await api.createAd({
				title: newAdTitle,
				discount: newAdDiscount,
				code: newAdCode,
				bgGradient: newAdGradient,
			});
			setAds((prev) => [created, ...prev]);
			saf('title', '');
			saf('discount', '');
			saf('code', '');
			showToast('Yangi reklama kampaniyasi yaratildi!', 'success');
		} catch (err) {
			showToast(errMsg(err), 'error');
		}
	};

	const handleDeleteAd = async (adId: string) => {
		try {
			await api.deleteAd(adId);
			setAds((prev) => prev.filter((ad) => ad.id !== adId));
			showToast("Reklama o'chirib tashlandi.", 'success');
		} catch (err) {
			showToast(errMsg(err), 'error');
		}
	};

	/* ───── Enterprise (korxona) listings ───── */
	const handleSaveEnterpriseOrder = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!ef.companyName.trim() || !ef.title.trim() || !ef.description.trim() || !ef.phone.trim()) {
			showToast("Korxona nomi, sarlavha, ma'lumot va telefonni to'ldiring!", 'error');
			return;
		}
		const payload = {
			companyName: ef.companyName.trim(),
			title: ef.title.trim(),
			description: ef.description.trim(),
			image: ef.image.trim() || null,
			phone: ef.phone.trim(),
			categoryId: ef.categoryId || null,
			region: ef.region.trim(),
			district: ef.district.trim(),
		};
		try {
			if (ef.editingId) {
				const updated = await api.updateEnterpriseOrder(ef.editingId, payload);
				setEnterpriseOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
				showToast("E'lon yangilandi!", 'success');
			} else {
				const created = await api.createEnterpriseOrder(payload);
				setEnterpriseOrders((prev) => [created, ...prev]);
				showToast("Yangi korxona e'loni joylandi!", 'success');
			}
			resetEnterpriseForm();
		} catch (err) {
			showToast(errMsg(err), 'error');
		}
	};

	const handleEditEnterpriseOrder = (order: EnterpriseOrder) => {
		sef('companyName', order.companyName);
		sef('title', order.title);
		sef('description', order.description);
		sef('image', order.image || '');
		sef('phone', order.phone);
		sef('categoryId', order.categoryId || '');
		sef('region', order.region || '');
		sef('district', order.district || '');
		sef('editingId', order.id);
	};

	const handleCancelEditEnterpriseOrder = () => resetEnterpriseForm();

	const handleToggleEnterpriseOrder = async (order: EnterpriseOrder) => {
		try {
			const updated = await api.updateEnterpriseOrder(order.id, { isActive: !order.isActive });
			setEnterpriseOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
			showToast(updated.isActive ? "E'lon e'lon qilindi." : "E'lon yashirildi.", 'success');
		} catch (err) {
			showToast(errMsg(err), 'error');
		}
	};

	const handleDeleteEnterpriseOrder = async (id: string) => {
		try {
			await api.deleteEnterpriseOrder(id);
			setEnterpriseOrders((prev) => prev.filter((o) => o.id !== id));
			if (ef.editingId === id) resetEnterpriseForm();
			showToast("E'lon o'chirildi.", 'success');
		} catch (err) {
			showToast(errMsg(err), 'error');
		}
	};

	/* ───── Support tickets ───── */
	const handleSendReply = async () => {
		if (!replyText.trim() || !selectedTicketId) return;
		try {
			const updated = await api.replyTicket(selectedTicketId, replyText);
			setTickets((prev) =>
				prev.map((t) => (t.id === selectedTicketId ? dbTicketToLocal(updated) : t))
			);
			setReplyText('');
			showToast('Javob yuborildi!', 'success');
		} catch (err) {
			showToast(errMsg(err), 'error');
		}
	};

	const handleResolveTicket = async (ticketId: string) => {
		try {
			const updated = await api.resolveTicket(ticketId);
			setTickets((prev) =>
				prev.map((t) => (t.id === ticketId ? dbTicketToLocal(updated) : t))
			);
			showToast('Murojaat muvaffaqiyatli yopildi.', 'success');
		} catch (err) {
			showToast(errMsg(err), 'error');
		}
	};

	/* ───── Platform settings save ───── */
	const handleSavePlatformSettings = async () => {
		try {
			await api.updateSettings({
				totalUsers,
				...(logotypePath !== null ? { logotypePath } : {}),
			});
			if (logotypePath) {
				window.dispatchEvent(
					new CustomEvent('logo-updated', { detail: logotypePath })
				);
			}
			showToast('Platforma sozlamalari saqlandi!', 'success');
		} catch (err) {
			showToast(errMsg(err), 'error');
		}
	};

	const handleSetPremiumMode = async (mode: 'active' | 'noactive') => {
		const prev = premiumMode;
		sst('premiumMode', mode);
		try {
			await api.updateSettings({ premiumMode: mode });
			showToast(
				mode === 'active'
					? 'Premium majburiy qilib belgilandi!'
					: 'Premium tizimi bekor qilindi (Bepul)!',
				'success'
			);
		} catch (err) {
			sst('premiumMode', prev);
			showToast(errMsg(err), 'error');
		}
	};

	const handleSaveCardDetails = async () => {
		try {
			await api.updateSettings({ adminCard, adminCardHolder });
			showToast("Karta ma'lumotlari saqlandi!", 'success');
		} catch (err) {
			showToast(errMsg(err), 'error');
		}
	};

	// No revenue-over-time tracking exists yet, so this stays zeroed rather than faked.
	const earningsData = useMemo(
		() => [
			{ name: 'Yanvar', earnings: 0, premium: 0 },
			{ name: 'Fevral', earnings: 0, premium: 0 },
			{ name: 'Mart', earnings: 0, premium: 0 },
			{ name: 'Aprel', earnings: 0, premium: 0 },
			{ name: 'May', earnings: 0, premium: 0 },
			{ name: 'Iyun', earnings: 0, premium: 0 },
		],
		[]
	);

	// Real last-7-days registration counts, computed from masters.createdAt / clients.createdAt.
	const registrationsData = useMemo(() => {
		const today = new Date();
		return Array.from({ length: 7 }, (_, idx) => {
			const offset = 6 - idx;
			const dayStart = new Date(
				today.getFullYear(),
				today.getMonth(),
				today.getDate() - offset
			);
			const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
			return {
				name: WEEKDAY_LABELS_UZ[dayStart.getDay()],
				ustalar: masters.filter(
					(m) => m.createdAt >= dayStart && m.createdAt < dayEnd
				).length,
				mijozlar: clients.filter(
					(c) => c.createdAt >= dayStart && c.createdAt < dayEnd
				).length,
			};
		});
	}, [masters, clients]);

	return {
		dataLoading,
		refetchTab,
		masters,
		clients,
		orders,
		applications,
		ads,
		enterpriseOrders,
		tickets,
		tariffs,
		pendingPayments,
		categories,
		smsTemplates,
		errorLogs,
		adminConversations,
		pushDevices,
		selectedTicketId,
		setSelectedTicketId,
		replyText,
		setReplyText,
		earningsData,
		registrationsData,

		settings: { premiumMode, adminCard, adminCardHolder, totalUsers, logotypePath },
		sst,

		videoUrl,
		setVideoUrl,
		videoTitle,
		setVideoTitle,

		adForm: { newAdTitle, newAdDiscount, newAdCode, newAdGradient },
		saf,

		enterpriseForm: ef,
		sef,

		tariffForm: {
			newTariffName,
			newTariffPrice,
			newTariffMonths,
			newTariffComment,
			editingTariffId,
		},
		stf,

		masterForm: {
			addMasterModalOpen,
			newMasterName,
			newMasterCategory,
			newMasterPhone,
			newMasterRegion,
			newMasterDistrict,
			newMasterExperience,
			newMasterPrice,
			newMasterAbout,
			newMasterWorkHours,
			newMasterIsVerified,
		},
		smf,

		handlers: {
			handleAddOrUpdateTariff,
			handleEditTariff,
			handleCancelEditTariff,
			handleDeleteTariff,
			handleExtendMasterPremium,
			handleShortenMasterPremium,
			handleCancelMasterPremium,
			handleApprovePayment,
			handleDeclinePayment,
			handleToggleMasterBlock,
			handleDeleteMaster,
			handleToggleVerification,
			handleDeleteReview,
			handleToggleClientBlock,
			handleDeleteClient,
			handleUpdateOrderStatus,
			handleCancelOrder,
			handleCreateCategory,
			handleUpdateCategory,
			handleDeleteCategory,
			handleUpdateSmsTemplate,
			handleBroadcastPush,
			handleApproveApp,
			handleDeclineApp,
			handleCreateMaster,
			handleAddAd,
			handleDeleteAd,
			handleSaveEnterpriseOrder,
			handleEditEnterpriseOrder,
			handleCancelEditEnterpriseOrder,
			handleToggleEnterpriseOrder,
			handleDeleteEnterpriseOrder,
			handleSendReply,
			handleResolveTicket,
			handleSavePlatformSettings,
			handleSetPremiumMode,
			handleSaveCardDetails,
		},
	};
}

export type AdminData = ReturnType<typeof useAdminData>;
