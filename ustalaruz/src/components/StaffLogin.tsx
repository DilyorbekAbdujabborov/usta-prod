import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Lock, Phone, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import InputField from './InputField';
import { useAuthSession } from '../auth/AuthProvider';

// Password sign-in, kept off the normal /login flow on purpose: everyone else
// signs in with an SMS code, and an administrator locked out because a message
// did not arrive has no other way in. Nothing links here - you type the URL.
//
// This is not an authorisation boundary. /auth/login authenticates whoever the
// credentials belong to, staff or not; the admin dashboard does its own role
// check on the profile that comes back. The only thing this route decides is
// where to send you afterwards.
export default function StaffLogin({
	onSuccess,
	onError,
}: {
	onSuccess?: (message: string) => void;
	onError?: (message: string) => void;
}) {
	const { loginWithPassword } = useAuthSession();
	const navigate = useNavigate();

	const [phone, setPhone] = useState('');
	const [password, setPassword] = useState('');
	const [formError, setFormError] = useState('');
	const [isLoading, setIsLoading] = useState(false);

	// Same shape the phone-first flow sends: digits only, one leading plus.
	const normalizedPhone = useMemo(() => '+' + phone.replace(/\D/g, ''), [phone]);
	const isPhoneComplete = phone.replace(/\D/g, '').length === 12;

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (isLoading) return;

		if (!isPhoneComplete) {
			setFormError("Telefon raqamini to'liq kiriting");
			return;
		}
		if (!password) {
			setFormError('Parolni kiriting');
			return;
		}

		setFormError('');
		setIsLoading(true);
		try {
			const user = await loginWithPassword(normalizedPhone, password);
			onSuccess?.('Tizimga kirdingiz.');
			// Admins land where they were going; anyone else gets the normal app,
			// since /admin would only bounce them back out.
			navigate(user.isAdmin || user.role === 'admin' ? '/admin' : '/app');
		} catch (err) {
			// Covers wrong credentials (401), the per-phone lockout and the IP
			// throttle (429) - the server's message is more specific than
			// anything worth inventing here.
			const message = err instanceof Error ? err.message : "Kirishda xatolik yuz berdi";
			setFormError(message);
			onError?.(message);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.22 }}
			className="w-full"
		>
			<div className="flex flex-col items-center text-center mb-6">
				<div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center mb-3">
					<ShieldCheck className="w-6 h-6 text-brand" aria-hidden="true" />
				</div>
				<h1 className="text-lg font-bold text-text-primary">Xodimlar uchun kirish</h1>
				<p className="text-sm text-text-secondary mt-1">
					Telefon raqami va parol bilan
				</p>
			</div>

			<form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
				<InputField
					id="staff-phone"
					label="Telefon raqami"
					type="tel"
					value={phone}
					onChange={(val) => {
						setPhone(val);
						if (formError) setFormError('');
					}}
					icon={Phone}
					autoComplete="username"
					autoFocus
				/>

				<InputField
					id="staff-password"
					label="Parol"
					type="password"
					value={password}
					onChange={(val) => {
						setPassword(val);
						if (formError) setFormError('');
					}}
					error={formError}
					icon={Lock}
					autoComplete="current-password"
				/>

				<button
					type="submit"
					disabled={isLoading}
					className="w-full bg-brand hover:bg-brand-hover text-white py-3.5 px-4 rounded-xl font-semibold text-[15px] shadow-md shadow-brand/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:pointer-events-none"
				>
					{isLoading ? 'Tekshirilmoqda...' : 'Kirish'}
				</button>
			</form>

			<button
				type="button"
				onClick={() => navigate('/login')}
				className="w-full mt-4 text-sm text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
			>
				SMS kod bilan kirish
			</button>
		</motion.div>
	);
}
