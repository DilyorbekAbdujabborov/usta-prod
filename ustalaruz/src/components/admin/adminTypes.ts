import { CATEGORIES } from '../../lib/categories';
import type {
	Master as DbMaster,
	Application as DbApplication,
	Client as DbClient,
	Ticket as DbTicket,
} from '../../lib/api';

/* ───── Local panel-shape interfaces ───── */

export interface ClientUser {
	id: string;
	name: string;
	phone: string;
	registeredAt: string;
	createdAt: Date;
	status: 'active' | 'blocked';
	completedOrdersCount: number;
}

export interface MasterProfile {
	id: number;
	userId: number;
	name: string;
	category: string;
	rating: number;
	completedJobs: number;
	experience: number;
	price?: number;
	startPrice?: number;
	about?: string;
	passport?: string;
	workHours?: string;
	phone: string;
	status: 'active' | 'blocked';
	isVerified: boolean;
	reviews: {
		id: string;
		author: string;
		rating: number;
		text: string;
		date: string;
	}[];
	region?: string;
	district?: string;
	avatar?: string;
	premiumUntil?: Date | string | null;
	createdAt: Date;
}

export interface PendingApplication {
	id: string;
	name: string;
	phone: string;
	category: string;
	region: string;
	district: string;
	submittedAt: string;
	avatar?: string;
	experience?: number;
	price?: number;
	about?: string;
	passport?: string;
	workHours?: string;
}

export interface SupportTicket {
	id: string;
	userName: string;
	userRole: 'Usta' | 'Mijoz';
	lastMessage: string;
	updatedAt: string;
	status: 'open' | 'resolved';
	messages: { sender: 'user' | 'admin'; text: string; time: string }[];
}

/* ───── DB row -> local panel shape adapters ─────
   categoryId/isActive/verified etc. map onto the pre-existing
   MasterProfile/PendingApplication fields the UI reads. */

export function dbMasterToProfile(m: DbMaster): MasterProfile {
	const cat = CATEGORIES.find((c) => c.id === m.categoryId);
	return {
		id: m.id,
		userId: m.userId,
		name: m.name,
		category: cat ? cat.name : m.categoryId,
		rating: m.rating,
		completedJobs: m.completedJobs,
		experience: m.experience,
		price: m.price,
		startPrice: m.price,
		about: m.bio ?? undefined,
		phone: m.phone,
		status: m.isActive ? 'active' : 'blocked',
		isVerified: m.verified,
		reviews: [],
		region: m.region,
		district: m.district,
		avatar: m.avatarUrl ?? undefined,
		premiumUntil: m.premiumUntil,
		createdAt: new Date(m.createdAt),
	};
}

export function dbClientToLocal(c: DbClient): ClientUser {
	return {
		id: c.id,
		name: c.name,
		phone: c.phone,
		registeredAt: new Date(c.createdAt).toLocaleDateString('uz-UZ'),
		createdAt: new Date(c.createdAt),
		status: c.isBlocked ? 'blocked' : 'active',
		completedOrdersCount: c.completedOrdersCount,
	};
}

export function dbTicketToLocal(t: DbTicket): SupportTicket {
	const last = t.messages[t.messages.length - 1];
	return {
		id: String(t.id),
		userName: t.userName,
		userRole: t.userRole as 'Usta' | 'Mijoz',
		lastMessage: last ? last.text : '',
		updatedAt: new Date(t.updatedAt).toLocaleString('uz-UZ'),
		status: t.status,
		messages: t.messages.map((m) => ({
			sender: m.sender,
			text: m.text,
			time: new Date(m.createdAt).toLocaleTimeString('uz-UZ', {
				hour: '2-digit',
				minute: '2-digit',
			}),
		})),
	};
}

export function dbApplicationToPending(a: DbApplication): PendingApplication {
	const cat = CATEGORIES.find((c) => c.id === a.categoryId);
	return {
		id: String(a.id),
		name: `${a.firstName} ${a.lastName}`.trim(),
		phone: a.phone,
		category: cat ? cat.name : (a.categoryId ?? ''),
		region: a.region,
		district: a.district,
		submittedAt: new Date(a.createdAt).toLocaleDateString('uz-UZ'),
		avatar: a.avatarUrl ?? undefined,
		experience: a.experience,
		price: a.price,
		about: a.bio ?? undefined,
	};
}

/* ───── Settings State ───── */
export interface SettingsState {
	premiumMode: 'active' | 'noactive';
	adminCard: string;
	adminCardHolder: string;
	totalUsers: number;
	logotypePath: string | null;
}
export const initialSettings: SettingsState = {
	premiumMode: 'active',
	adminCard: '8600 4923 1122 3344',
	adminCardHolder: 'Master Group MCHJ',
	totalUsers: 142778,
	logotypePath: null,
};
export type SettingsAction = {
	type: 'SET_SETTINGS';
	field: keyof SettingsState;
	value: unknown;
};
export function settingsReducer(
	state: SettingsState,
	action: SettingsAction
): SettingsState {
	if (action.type === 'SET_SETTINGS')
		return { ...state, [action.field]: action.value };
	return state;
}

/* ───── Ad Form State ───── */
export interface AdFormState {
	title: string;
	discount: string;
	code: string;
	gradient: string;
}
export const initialAdForm: AdFormState = {
	title: '',
	discount: '',
	code: '',
	gradient: 'from-indigo-600 to-purple-700',
};
export type AdFormAction = {
	type: 'SET_AD_FORM';
	field: keyof AdFormState;
	value: unknown;
};
export function adFormReducer(
	state: AdFormState,
	action: AdFormAction
): AdFormState {
	if (action.type === 'SET_AD_FORM')
		return { ...state, [action.field]: action.value };
	return state;
}

/* ───── Enterprise Listing Form State ───── */
export interface EnterpriseFormState {
	companyName: string;
	title: string;
	description: string;
	image: string;
	phone: string;
	categoryId: string;
	region: string;
	district: string;
	editingId: string | null;
}
export const initialEnterpriseForm: EnterpriseFormState = {
	companyName: '',
	title: '',
	description: '',
	image: '',
	phone: '',
	categoryId: '',
	region: '',
	district: '',
	editingId: null,
};
export type EnterpriseFormAction = {
	type: 'SET_ENTERPRISE_FORM';
	field: keyof EnterpriseFormState;
	value: unknown;
} | { type: 'RESET_ENTERPRISE_FORM' };
export function enterpriseFormReducer(
	state: EnterpriseFormState,
	action: EnterpriseFormAction
): EnterpriseFormState {
	if (action.type === 'RESET_ENTERPRISE_FORM') return initialEnterpriseForm;
	if (action.type === 'SET_ENTERPRISE_FORM')
		return { ...state, [action.field]: action.value };
	return state;
}

/* ───── Tariff Form State ───── */
export interface TariffFormState {
	name: string;
	price: number;
	months: number;
	comment: string;
	editingId: string | null;
}
export const initialTariffForm: TariffFormState = {
	name: '',
	price: 50000,
	months: 1,
	comment: '',
	editingId: null,
};
export type TariffFormAction = {
	type: 'SET_TARIFF_FORM';
	field: keyof TariffFormState;
	value: unknown;
};
export function tariffFormReducer(
	state: TariffFormState,
	action: TariffFormAction
): TariffFormState {
	if (action.type === 'SET_TARIFF_FORM')
		return { ...state, [action.field]: action.value };
	return state;
}

/* ───── Master Form State ───── */
export interface MasterFormState {
	modalOpen: boolean;
	name: string;
	category: string;
	phone: string;
	region: string;
	district: string;
	experience: string;
	price: string;
	about: string;
	workHours: string;
	isVerified: boolean;
}
export const initialMasterForm: MasterFormState = {
	modalOpen: false,
	name: '',
	category: 'plumbing',
	phone: '+998 ',
	region: 'Toshkent shahri',
	district: 'Chilonzor',
	experience: '3',
	price: '50000',
	about: '',
	workHours: '09:00 - 18:00',
	isVerified: true,
};
export type MasterFormAction = {
	type: 'SET_MASTER_FORM';
	field: keyof MasterFormState;
	value: unknown;
};
export function masterFormReducer(
	state: MasterFormState,
	action: MasterFormAction
): MasterFormState {
	if (action.type === 'SET_MASTER_FORM')
		return { ...state, [action.field]: action.value };
	return state;
}

export type AdminTab =
	| 'analytics'
	| 'masters'
	| 'clients'
	| 'orders'
	| 'approvals'
	| 'ads'
	| 'enterprise'
	| 'marketplace'
	| 'support'
	| 'logo'
	| 'payments'
	| 'categories'
	| 'sms'
	| 'errorlogs'
	| 'conversations'
	| 'notifications';
