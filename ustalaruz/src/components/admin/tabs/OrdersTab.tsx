import { useState } from 'react';
import { ClipboardList, Clock, CheckCircle2, XCircle, Wrench } from 'lucide-react';
import { Card, SectionHeader, SearchInput, Badge, StatCard, GradientPageHeader, EmptyState } from '../AdminUI';
import type { AdminData } from '../useAdminData';

const STATUS_LABEL: Record<string, string> = {
	pending: 'Kutilmoqda',
	active: 'Jarayonda',
	postponed: 'Kechiktirilgan',
	delayed: 'Muddatli',
	completed: 'Bajarilgan',
	cancelled: 'Bekor qilingan',
};

const STATUS_BADGE: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
	pending: 'warning',
	active: 'info',
	postponed: 'warning',
	delayed: 'warning',
	completed: 'success',
	cancelled: 'danger',
};

export default function OrdersTab({ data }: { data: AdminData }) {
	const { orders, masters, handlers } = data;
	const [searchQuery, setSearchQuery] = useState('');

	const filtered = orders.filter((o) => {
		if (!searchQuery) return true;
		const q = searchQuery.toLowerCase();
		return (
			o.title?.toLowerCase().includes(q) ||
			o.clientName?.toLowerCase().includes(q) ||
			o.clientPhone?.toLowerCase().includes(q)
		);
	});

	const activeCount = orders.filter((o) => o.status === 'pending' || o.status === 'active').length;
	const completedCount = orders.filter((o) => o.status === 'completed').length;
	const cancelledCount = orders.filter((o) => o.status === 'cancelled').length;

	return (
		<div className="flex flex-col gap-6 text-left">
			<GradientPageHeader
				icon={ClipboardList}
				title="Buyurtmalar Nazorati"
				subtitle="Platformadagi barcha buyurtmalarni ko'rish, holatini o'zgartirish va bekor qilish"
				badge="📦 Buyurtmalar"
				tone="slate"
			/>

			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				<StatCard icon={ClipboardList} label="Jami buyurtmalar" value={`${orders.length} ta`} accent="blue" />
				<StatCard icon={Clock} label="Faol" value={`${activeCount} ta`} sub="Kutilmoqda / jarayonda" accent="amber" />
				<StatCard icon={CheckCircle2} label="Bajarilgan" value={`${completedCount} ta`} accent="emerald" />
				<StatCard icon={XCircle} label="Bekor qilingan" value={`${cancelledCount} ta`} accent="rose" />
			</div>

			<Card className="overflow-hidden">
				<div className="p-5 pb-0">
					<SectionHeader
						title="Barcha buyurtmalar"
						subtitle="Sarlavha yoki mijoz bo'yicha qidirish"
						right={
							<SearchInput
								value={searchQuery}
								onChange={setSearchQuery}
								placeholder="Buyurtma yoki mijozni qidirish..."
								className="w-64"
							/>
						}
					/>
				</div>

				{filtered.length === 0 ? (
					<EmptyState icon={ClipboardList} title="Buyurtma topilmadi" />
				) : (
					<div className="overflow-x-auto mt-2">
						<table className="w-full text-left border-collapse min-w-[900px]">
							<thead>
								<tr className="bg-surface-secondary border-b border-border text-[11px] uppercase font-black text-text-muted tracking-wider">
									<th className="py-3 px-5">Sarlavha</th>
									<th className="py-3 px-5">Mijoz</th>
									<th className="py-3 px-5">Usta</th>
									<th className="py-3 px-5">Hudud</th>
									<th className="py-3 px-5">Byudjet</th>
									<th className="py-3 px-5">Holat</th>
									<th className="py-3 px-5">Sana</th>
									<th className="py-3 px-5 text-right">Harakatlar</th>
								</tr>
							</thead>
							<tbody>
								{filtered.map((order) => {
									const master = masters.find((m) => m.id === order.masterId);
									return (
										<tr
											key={order.id}
											className="border-b border-border/60 text-xs hover:bg-surface-secondary/50 transition-colors"
										>
											<td className="py-3.5 px-5 font-black text-text-secondary max-w-[220px] truncate">
												{order.title}
											</td>
											<td className="py-3.5 px-5">
												<div className="font-bold text-text-primary">{order.clientName}</div>
												<div className="text-text-muted font-mono text-[11px]">{order.clientPhone}</div>
											</td>
											<td className="py-3.5 px-5 text-text-secondary font-semibold">
												{master ? (
													<span className="flex items-center gap-1">
														<Wrench size={11} className="text-brand" /> {master.name}
													</span>
												) : (
													<span className="text-text-muted italic">Biriktirilmagan</span>
												)}
											</td>
											<td className="py-3.5 px-5 text-text-muted font-semibold">
												{order.region}, {order.district}
											</td>
											<td className="py-3.5 px-5 font-black text-text-primary">
												{Number(order.budget || 0).toLocaleString()} so'm
											</td>
											<td className="py-3.5 px-5">
												<Badge variant={STATUS_BADGE[order.status] ?? 'neutral'}>
													{STATUS_LABEL[order.status] ?? order.status}
												</Badge>
											</td>
											<td className="py-3.5 px-5 text-text-muted font-semibold whitespace-nowrap">
												{new Date(order.createdAt).toLocaleDateString('uz-UZ')}
											</td>
											<td className="py-3.5 px-5">
												<div className="flex items-center gap-2 justify-end">
													<select
														value={order.status}
														onChange={(e) =>
															handlers.handleUpdateOrderStatus(order.id, e.target.value as typeof order.status)
														}
														className="bg-surface-secondary border border-border rounded-lg text-[11px] font-bold px-2 py-1.5 outline-none focus:border-brand cursor-pointer"
													>
														{Object.entries(STATUS_LABEL).map(([value, label]) => (
															<option key={value} value={value}>
																{label}
															</option>
														))}
													</select>
													{order.status !== 'cancelled' && (
														<button
															onClick={() => handlers.handleCancelOrder(order.id)}
															className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors cursor-pointer"
															title="Bekor qilish"
														>
															<XCircle size={14} />
														</button>
													)}
												</div>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				)}
			</Card>
		</div>
	);
}
