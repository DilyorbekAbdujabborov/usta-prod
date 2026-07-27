import { useState, useEffect } from 'react';
import {
	ResponsiveContainer,
	AreaChart,
	Area,
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
} from 'recharts';
import { Wrench, Users, MessageSquare, DollarSign, TrendingUp, Settings, Check } from 'lucide-react';
import { Card, StatCard, PrimaryButton, FieldLabel } from '../AdminUI';
import type { AdminData } from '../useAdminData';
import { useApi } from '@/lib/api';

export default function AnalyticsTab({ data }: { data: AdminData }) {
	const { masters, clients, tickets, pendingPayments, earningsData, registrationsData, settings, sst, handlers } =
		data;
	const api = useApi();

	const [analytics, setAnalytics] = useState<{ name: string; earnings: number; premium: number }[]>([]);
	const [analyticsLoading, setAnalyticsLoading] = useState(true);

	useEffect(() => {
		let cancelled = false;
		api.getAnalytics()
			.then((res) => {
				if (!cancelled) setAnalytics(res);
			})
			.catch(() => {
				if (!cancelled) setAnalytics(earningsData);
			})
			.finally(() => {
				if (!cancelled) setAnalyticsLoading(false);
			});
		return () => { cancelled = true; };
	}, [api, earningsData]);

	const activeMastersCount = masters.filter((m) => m.status === 'active').length;
	const blockedMastersCount = masters.filter((m) => m.status === 'blocked').length;
	const activeClientsCount = clients.filter((c) => c.status === 'active').length;
	const blockedClientsCount = clients.filter((c) => c.status === 'blocked').length;

	const premiumRevenue = pendingPayments
		.filter((p) => p.status === 'approved')
		.reduce((sum, p) => sum + (p.amount || 0), 0);

	const chartData = analytics.length > 0 ? analytics : earningsData;
	const hasEarnings = chartData.some((d) => d.earnings > 0 || d.premium > 0);

	return (
		<div className="flex flex-col gap-6">
			{/* KPI metrics row */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				<StatCard
					icon={Wrench}
					label="Jami Ustalar"
					value={masters.length}
					sub={`${activeMastersCount} faol / ${blockedMastersCount} bloklangan`}
					accent="emerald"
				/>
				<StatCard
					icon={Users}
					label="Mijozlar"
					value={clients.length}
					sub={`${activeClientsCount} faol / ${blockedClientsCount} bloklangan`}
					accent="blue"
				/>
				<StatCard
					icon={MessageSquare}
					label="Qo'llab-quvvatlash"
					value={tickets.filter((t) => t.status === 'open').length}
					sub={`${tickets.length} ta jami murojaat`}
					accent="indigo"
				/>
				<StatCard
					icon={DollarSign}
					label="Premium Tushum"
					value={`${premiumRevenue.toLocaleString()} UZS`}
					sub="Joriy tasdiqlangan premium tushum"
					accent="amber"
				/>
			</div>

			{/* Charts */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
				<Card className="p-3.5 sm:p-4 flex flex-col gap-3 sm:gap-4">
					<div className="flex justify-between items-center">
						<div>
							<h4 className="text-xs font-black uppercase text-text-primary">
								Oylik daromad dinamikasi
							</h4>
							<span className="text-[11px] text-text-muted font-bold mt-0.5 block">
								Premium va xizmatlar umumiy summasi
							</span>
						</div>
						{hasEarnings && (
							<span className="text-[11px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-xl">
								+28% o'sish
							</span>
						)}
					</div>

					<div className="h-64 w-full">
						{analyticsLoading ? (
							<div className="h-full w-full flex items-center justify-center">
								<div className="w-6 h-6 border-2 border-border border-t-brand rounded-full animate-spin" />
							</div>
						) : !hasEarnings ? (
							<div className="h-full w-full flex flex-col items-center justify-center gap-2 text-center border border-dashed border-border rounded-2xl">
								<TrendingUp size={28} className="text-text-muted" />
								<p className="text-xs font-bold text-text-muted">
									Daromad statistikasi hali mavjud emas
								</p>
								<p className="text-[11px] text-text-muted max-w-xs">
									To'lovlar tasdiqlangach, oylik dinamika shu yerda ko'rinadi.
								</p>
							</div>
						) : (
							<ResponsiveContainer width="100%" height="100%">
								<AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
									<defs>
										<linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
											<stop offset="5%" stopColor="#0e5a3c" stopOpacity={0.4} />
											<stop offset="95%" stopColor="#0e5a3c" stopOpacity={0} />
										</linearGradient>
										<linearGradient id="colorPremium" x1="0" y1="0" x2="0" y2="1">
											<stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
											<stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
										</linearGradient>
									</defs>
									<CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
									<XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
									<YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
									<Tooltip />
									<Legend wrapperStyle={{ fontSize: 10, fontWeight: 'bold' }} />
									<Area
										type="monotone"
										dataKey="earnings"
										name="Umumiy tushum"
										stroke="#0e5a3c"
										strokeWidth={2.5}
										fillOpacity={1}
										fill="url(#colorIncome)"
									/>
									<Area
										type="monotone"
										dataKey="premium"
										name="Premium sotuvlar"
										stroke="#3b82f6"
										strokeWidth={2.5}
										fillOpacity={1}
										fill="url(#colorPremium)"
									/>
								</AreaChart>
							</ResponsiveContainer>
						)}
					</div>
				</Card>

				<Card className="p-3.5 sm:p-4 flex flex-col gap-3 sm:gap-4">
					<div className="flex justify-between items-center">
						<div>
							<h4 className="text-xs font-black uppercase text-text-primary">
								Haftalik Ro'yxatdan o'tishlar
							</h4>
							<span className="text-[11px] text-text-muted font-bold mt-0.5 block">
								Yangi foydalanuvchilar soni
							</span>
						</div>
						<span className="text-[11px] font-bold text-blue-500 bg-blue-50 dark:bg-blue-500/10 px-2.5 py-1 rounded-xl">
							Haftalik
						</span>
					</div>

					<div className="h-64 w-full">
						<ResponsiveContainer width="100%" height="100%">
							<BarChart data={registrationsData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
								<CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
								<XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
								<YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
								<Tooltip />
								<Legend wrapperStyle={{ fontSize: 10, fontWeight: 'bold' }} />
								<Bar dataKey="mijozlar" name="Yangi mijozlar" fill="#3b82f6" radius={[4, 4, 0, 0]} />
								<Bar dataKey="ustalar" name="Yangi ustalar" fill="#10b981" radius={[4, 4, 0, 0]} />
							</BarChart>
						</ResponsiveContainer>
					</div>
				</Card>
			</div>

			{/* Platform settings */}
			<Card className="p-3.5 sm:p-4 flex flex-col gap-3 sm:gap-4">
				<div>
					<h4 className="text-xs font-black text-text-primary uppercase tracking-wider flex items-center gap-1.5">
						<Settings size={14} className="text-sky-500" />
						Platforma Sozlamalari
					</h4>
					<p className="text-[11px] text-text-muted font-bold mt-0.5">
						Saytning bosh sahifasida ko'rinadigan umumiy ma'lumotlar.
					</p>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div className="flex flex-col gap-1.5">
						<FieldLabel>Foydalanuvchilar soni</FieldLabel>
						<div className="flex items-center gap-1.5 bg-surface-secondary border border-border rounded-xl px-3 py-2">
							<input
								type="number"
								value={settings.totalUsers}
								onChange={(e) => sst('totalUsers', Number(e.target.value))}
								className="w-full bg-transparent text-xs font-black outline-none text-text-primary"
								placeholder="142778"
							/>
						</div>
						<p className="text-[11px] text-text-muted font-bold">
							Sayt headerida "ta faol foydalanuvchilar" deb ko'rinadi.
						</p>
					</div>

					<div className="flex flex-col gap-1.5">
						<FieldLabel>Logotip URL</FieldLabel>
						<div className="flex items-center gap-1.5 bg-surface-secondary border border-border rounded-xl px-3 py-2">
							<input
								type="text"
								value={settings.logotypePath ?? ''}
								onChange={(e) => sst('logotypePath', e.target.value)}
								className="w-full bg-transparent text-xs font-black outline-none text-text-primary"
								placeholder="https://example.com/logo.png"
							/>
						</div>
						<p className="text-[11px] text-text-muted font-bold">
							Platforma logotipi uchun URL manzil.
						</p>
					</div>
				</div>

				<div className="flex justify-end mt-1">
					<PrimaryButton onClick={handlers.handleSavePlatformSettings} className="bg-sky-600 hover:bg-sky-700">
						<Check size={14} />
						Sozlamalarni Saqlash
					</PrimaryButton>
				</div>
			</Card>

			<Card className="p-3.5 sm:p-4">
				<h4 className="text-xs font-black uppercase text-text-primary">
					Platformadagi so'nggi harakatlar
				</h4>
				<p className="text-[11px] text-text-muted font-bold mt-2">
					Real vaqt rejimidagi kuzatuv tez orada qo'shiladi.
				</p>
			</Card>
		</div>
	);
}
