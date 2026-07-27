import { useReducer } from 'react';
import type { Payment, Tariff } from '../lib/api';

/* ───── Partnership / Master Profile State ───── */

export interface PartnershipState {
	modalOpen: boolean;
	status: 'not_applied' | 'pending' | 'approved' | 'declined';
	category: string;
	name: string;
	phone: string;
	experience: number;
	price: number;
	passport: string;
	bio: string;
	agreed: boolean;
	step: number;
	region: string;
	district: string;
	firstName: string;
	lastName: string;
	specialty: string;
	extraPhone: string;
	telegram: string;
	services: string;
	priceComment: string;
	avatar: string;
	workStart: string;
	workEnd: string;
	restDays: string;
	workHours: string;
	isActive: boolean;
	monthlyEarnings: number;
	profileEditTab: 'personal' | 'work' | 'schedule';
}

const initialPartnership: PartnershipState = {
	modalOpen: false,
	status: 'not_applied',
	category: 'plumbing',
	name: '',
	phone: '',
	experience: 5,
	price: 50000,
	passport: '',
	bio: '',
	agreed: false,
	step: 1,
	region: 'Toshkent shahri',
	district: 'Chilonzor',
	firstName: '',
	lastName: '',
	specialty: '',
	extraPhone: '',
	telegram: '',
	services: '',
	priceComment: '',
	avatar: '',
	workStart: '09:00',
	workEnd: '18:00',
	restDays: 'Yakshanba',
	workHours: '09:00 - 18:00',
	isActive: true,
	monthlyEarnings: 0,
	profileEditTab: 'personal',
};

export type PartnershipAction = {
	type: 'SET_PARTNERSHIP';
	field: keyof PartnershipState;
	value: unknown;
};

function partnershipReducer(
	state: PartnershipState,
	action: PartnershipAction
): PartnershipState {
	if (action.type === 'SET_PARTNERSHIP') {
		return { ...state, [action.field]: action.value };
	}
	return state;
}

export function usePartnershipState() {
	return useReducer(partnershipReducer, initialPartnership);
}

/* ───── Workspace State ───── */

export interface WorkspaceState {
	name: string;
	phone: string;
	avatar: string;
	hours: string;
	offDays: string[];
	active: boolean;
	region: string;
	district: string;
	loadedPhone: string;
	monthlyEarnings: number;
}

const initialWorkspace: WorkspaceState = {
	name: '',
	phone: '',
	avatar: '',
	hours: '09:00 - 18:00',
	offDays: [],
	active: true,
	region: '',
	district: '',
	loadedPhone: '',
	monthlyEarnings: 0,
};

export type WorkspaceAction = {
	type: 'SET_WORKSPACE';
	field: keyof WorkspaceState;
	value: unknown;
};

function workspaceReducer(
	state: WorkspaceState,
	action: WorkspaceAction
): WorkspaceState {
	if (action.type === 'SET_WORKSPACE') {
		return { ...state, [action.field]: action.value };
	}
	return state;
}

export function useWorkspaceState() {
	return useReducer(workspaceReducer, initialWorkspace);
}

/* ───── Payment / Platform State ───── */

export interface PaymentState {
	premiumMode: 'active' | 'noactive';
	adminCard: string;
	adminCardHolder: string;
	pendingPayments: Payment[];
	tariffs: Tariff[];
	premiumTimeLeft: string;
	paymentPackage: string;
	paymentReceipt: string;
	paymentProofImage: string;
	submittingPayment: boolean;
}

const initialPayment: PaymentState = {
	premiumMode: 'active',
	adminCard: '8600 4923 1122 3344',
	adminCardHolder: 'Master Group MCHJ',
	pendingPayments: [],
	tariffs: [],
	premiumTimeLeft: '',
	paymentPackage: '',
	paymentReceipt: '',
	paymentProofImage: '',
	submittingPayment: false,
};

export type PaymentAction = {
	type: 'SET_PAYMENT';
	field: keyof PaymentState;
	value: unknown;
};

function paymentReducer(
	state: PaymentState,
	action: PaymentAction
): PaymentState {
	if (action.type === 'SET_PAYMENT') {
		return { ...state, [action.field]: action.value };
	}
	return state;
}

export function usePaymentState() {
	return useReducer(paymentReducer, initialPayment);
}

/* ───── Edit Profile State ───── */

export interface EditProfileState {
	modalOpen: boolean;
	name: string;
	phone: string;
	currentPassword: string;
	newPassword: string;
	saving: boolean;
}

const initialEditProfile: EditProfileState = {
	modalOpen: false,
	name: '',
	phone: '',
	currentPassword: '',
	newPassword: '',
	saving: false,
};

export type EditProfileAction = {
	type: 'SET_EDIT_PROFILE';
	field: keyof EditProfileState;
	value: unknown;
};

function editProfileReducer(
	state: EditProfileState,
	action: EditProfileAction
): EditProfileState {
	if (action.type === 'SET_EDIT_PROFILE') {
		return { ...state, [action.field]: action.value };
	}
	return state;
}

export function useEditProfileState() {
	return useReducer(editProfileReducer, initialEditProfile);
}
