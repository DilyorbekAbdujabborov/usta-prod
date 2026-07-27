import React from 'react';
import { Search, X, type LucideIcon } from 'lucide-react';

export function cx(...parts: Array<string | false | null | undefined>) {
	return parts.filter(Boolean).join(' ');
}

/* ───── Layout primitives ───── */

export function Card({
	children,
	className = '',
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<div
			className={cx(
				'bg-surface-card border border-border rounded-xl shadow-sm',
				className
			)}
		>
			{children}
		</div>
	);
}

export function SectionHeader({
	title,
	subtitle,
	right,
}: {
	title: string;
	subtitle?: string;
	right?: React.ReactNode;
}) {
	return (
		<div className="flex justify-between items-center flex-wrap gap-3 bg-surface-card p-4 rounded-2xl border border-border shadow-sm">
			<div>
				<h3 className="text-sm font-black text-text-primary">{title}</h3>
				{subtitle && (
					<p className="text-[11px] text-text-muted font-bold mt-0.5">
						{subtitle}
					</p>
				)}
			</div>
			{right && <div className="flex items-center gap-3 flex-wrap">{right}</div>}
		</div>
	);
}

const GRADIENT_HEADER_STYLES: Record<'slate' | 'emerald', string> = {
	slate:
		'bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 border-slate-700/30',
	emerald:
		'bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 border-emerald-500/20',
};

export function GradientPageHeader({
	icon: Icon,
	title,
	subtitle,
	badge,
	tone = 'slate',
}: {
	icon: LucideIcon;
	title: string;
	subtitle: string;
	badge?: string;
	tone?: 'slate' | 'emerald';
}) {
	return (
		<div
			className={cx(
				'p-6 rounded-xl border text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-lg',
				GRADIENT_HEADER_STYLES[tone]
			)}
		>
			<div>
				<div className="flex items-center gap-2">
					<Icon size={18} className="text-amber-400 animate-pulse" />
					<h3 className="text-base font-black tracking-wider uppercase">
						{title}
					</h3>
				</div>
				<p className="text-[11px] text-slate-300 font-medium mt-1">{subtitle}</p>
			</div>
			{badge && (
				<div className="flex gap-2 shrink-0">
					<span className="bg-amber-500 text-slate-950 text-[11px] font-black uppercase px-2.5 py-1 rounded-xl shadow-md">
						{badge}
					</span>
				</div>
			)}
		</div>
	);
}

/* ───── Stat / KPI card ───── */

const STAT_ACCENTS = {
	emerald: 'bg-emerald-50 text-[#0E5A3C] dark:bg-emerald-500/10 dark:text-emerald-400',
	blue: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
	indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400',
	amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
	rose: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400',
} as const;

export function StatCard({
	icon: Icon,
	label,
	value,
	sub,
	accent = 'emerald',
}: {
	icon: LucideIcon;
	label: string;
	value: React.ReactNode;
	sub?: React.ReactNode;
	accent?: keyof typeof STAT_ACCENTS;
}) {
	return (
		<Card className="p-3 flex items-center gap-3">
			<div className={cx('p-3 rounded-2xl shrink-0', STAT_ACCENTS[accent])}>
				<Icon size={22} />
			</div>
			<div className="min-w-0">
				<span className="text-[11px] text-text-muted uppercase font-black">
					{label}
				</span>
				<h3 className="text-xl font-black font-mono leading-none mt-1 text-text-primary truncate">
					{value}
				</h3>
				{sub && (
					<span className="text-[11px] font-bold text-text-muted block mt-1">
						{sub}
					</span>
				)}
			</div>
		</Card>
	);
}

/* ───── Badge ───── */

const BADGE_VARIANTS = {
	success:
		'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400',
	warning:
		'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400',
	danger: 'bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-400',
	info: 'bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-400',
	neutral: 'bg-surface-tertiary text-text-muted',
} as const;

export function Badge({
	children,
	variant = 'neutral',
	className = '',
}: {
	children: React.ReactNode;
	variant?: keyof typeof BADGE_VARIANTS;
	className?: string;
}) {
	return (
		<span
			className={cx(
				'text-[11px] px-2 py-0.5 font-black uppercase rounded-full inline-flex items-center gap-1',
				BADGE_VARIANTS[variant],
				className
			)}
		>
			{children}
		</span>
	);
}

/* ───── Search input ───── */

export function SearchInput({
	value,
	onChange,
	placeholder,
	className = '',
}: {
	value: string;
	onChange: (v: string) => void;
	placeholder?: string;
	className?: string;
}) {
	return (
		<div className={cx('relative', className)}>
			<Search
				size={14}
				className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
			/>
			<input
				type="text"
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={placeholder}
				className="pl-9 pr-8 py-2.5 w-full bg-surface-secondary border border-border rounded-xl text-xs outline-none focus:border-brand transition-all font-semibold text-text-primary placeholder:text-text-muted"
			/>
			{value && (
				<button
					onClick={() => onChange('')}
					className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary cursor-pointer"
				>
					<X size={13} />
				</button>
			)}
		</div>
	);
}

/* ───── Empty state ───── */

export function EmptyState({
	icon: Icon,
	title,
	subtitle,
}: {
	icon: LucideIcon;
	title: string;
	subtitle?: string;
}) {
	return (
		<div className="p-10 text-center border border-dashed border-border rounded-2xl bg-surface-secondary/50">
			<Icon size={26} className="text-text-muted mx-auto mb-2" />
			<h5 className="text-xs font-black text-text-primary">{title}</h5>
			{subtitle && (
				<p className="text-[11px] text-text-muted font-bold mt-0.5">{subtitle}</p>
			)}
		</div>
	);
}

/* ───── Buttons ───── */

export function PrimaryButton({
	children,
	className = '',
	...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
	return (
		<button
			{...rest}
			className={cx(
				'py-2.5 px-4 bg-[#0E5A3C] hover:bg-[#0a452d] text-white text-xs font-black rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
				className
			)}
		>
			{children}
		</button>
	);
}

export function GhostButton({
	children,
	className = '',
	...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
	return (
		<button
			{...rest}
			className={cx(
				'py-2 px-3 bg-surface-tertiary hover:bg-border text-text-secondary rounded-xl text-[11px] font-black transition-all cursor-pointer',
				className
			)}
		>
			{children}
		</button>
	);
}

export function DangerButton({
	children,
	className = '',
	...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
	return (
		<button
			{...rest}
			className={cx(
				'py-2 px-3 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 rounded-xl text-[11px] font-black transition-all cursor-pointer',
				className
			)}
		>
			{children}
		</button>
	);
}

/* ───── Form field bits ───── */

export function FieldLabel({ children }: { children: React.ReactNode }) {
	return (
		<label className="text-[11px] font-black uppercase text-text-muted">
			{children}
		</label>
	);
}

export const inputClass =
	'p-2.5 border border-border rounded-xl text-xs outline-none focus:border-[#0E5A3C] transition-all font-semibold bg-surface-input text-text-primary placeholder:text-text-muted w-full';
