import type { LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ErrorPageProps {
	code: string;
	icon: LucideIcon;
	title: string;
	message: string;
	actionLabel?: string;
	onAction?: () => void;
	secondaryLabel?: string;
	onSecondary?: () => void;
}

// Shared full-area error state (404 / 403 / 401 / 500) - keeps the visual
// language (card, brand accent, rounded action button) consistent with
// AuthView/PrivacyPolicy instead of each error case
// improvising its own layout.
export default function ErrorPage({
	code,
	icon: Icon,
	title,
	message,
	actionLabel = 'Bosh sahifaga qaytish',
	onAction,
	secondaryLabel,
	onSecondary,
}: ErrorPageProps) {
	const navigate = useNavigate();

	return (
		<div className="w-full max-w-md mx-auto bg-white dark:bg-surface border border-slate-100 dark:border-border rounded-xl p-6 sm:p-10 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.06)] flex flex-col items-center text-center gap-4">
			<div className="w-16 h-16 rounded-2xl bg-brand/10 text-brand flex items-center justify-center">
				<Icon size={28} />
			</div>
			<span className="text-xs font-black uppercase tracking-widest text-text-muted">
				Xatolik {code}
			</span>
			<h1 className="text-xl sm:text-2xl font-extrabold text-text-primary">
				{title}
			</h1>
			<p className="text-sm text-text-secondary leading-relaxed">{message}</p>
			<div className="flex flex-col sm:flex-row items-center gap-2.5 mt-2 w-full">
				<button
					onClick={onAction ?? (() => navigate('/'))}
					className="w-full sm:w-auto bg-brand hover:bg-brand-hover text-white py-2.5 px-6 rounded-xl font-bold text-sm shadow-sm shadow-brand/15 active:scale-[0.98] transition-all cursor-pointer"
				>
					{actionLabel}
				</button>
				{secondaryLabel && (
					<button
						onClick={onSecondary}
						className="w-full sm:w-auto bg-surface-secondary border border-border text-text-primary py-2.5 px-6 rounded-xl font-bold text-sm active:scale-[0.98] transition-all cursor-pointer"
					>
						{secondaryLabel}
					</button>
				)}
			</div>
		</div>
	);
}
