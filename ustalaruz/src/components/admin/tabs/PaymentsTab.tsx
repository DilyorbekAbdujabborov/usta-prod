import { useState } from 'react';
import {
	DollarSign,
	Clock,
	Sparkles,
	AlertTriangle,
	CheckCircle2,
	Search,
	Upload,
	Phone,
	Wrench,
	Trash2,
} from 'lucide-react';
import { Card, StatCard, SearchInput, EmptyState, Badge, PrimaryButton, DangerButton, GradientPageHeader } from '../AdminUI';
import type { AdminData } from '../useAdminData';

export default function PaymentsTab({ data }: { data: AdminData }) {
	const { pendingPayments, masters, tariffs, handlers } = data;
	const [paymentSearch, setPaymentSearch] = useState('');

	const totalRevenue = pendingPayments
		.filter((p) => p.status === 'approved')
		.reduce((sum, p) => sum + (p.amount ?? 150000), 0);
	const pendingCount = pendingPayments.filter((p) => p.status === 'pending').length;
	const declinedCount = pendingPayments.filter((p) => p.status === 'rejected').length;
	const activePremiumCount = masters.filter(
		(m) => m.premiumUntil && new Date(m.premiumUntil).getTime() > Date.now()
	).length;

	const filteredPayments = pendingPayments.filter((p) => {
		if (!paymentSearch) return true;
		const query = paymentSearch.toLowerCase();
		const payMaster = masters.find((m) => m.id === p.masterId);
		const tariff = tariffs.find((t) => t.id === p.packageId);
		return (
			payMaster?.name?.toLowerCase().includes(query) ||
			payMaster?.phone?.toLowerCase().includes(query) ||
			p.receiptText?.toLowerCase().includes(query) ||
			(tariff?.name || p.packageId)?.toLowerCase().includes(query)
		);
	});

	return (
		<div className="flex flex-col gap-6 text-left">
			<GradientPageHeader
				icon={DollarSign}
				title="Premium To'lovlar va Tranzaksiyalar Nazorati"
				subtitle="Ustalar tomonidan yuborilgan premium tarif to'lovlarini tasdiqlash, rad etish va to'liq to'lovlar tarixini nazorat qilish."
				badge="👑 Premium Nazorati"
				tone="emerald"
			/>

			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				<StatCard
					icon={Sparkles}
					label="Jami Tushum"
					value={`${totalRevenue.toLocaleString()} UZS`}
					sub="Tasdiqlangan to'lovlar hisobi"
					accent="emerald"
				/>
				<StatCard
					icon={Clock}
					label="Kutilayotganlar"
					value={`${pendingCount} ta`}
					sub="Tasdiqlash kutilmoqda"
					accent="amber"
				/>
				<StatCard
					icon={Sparkles}
					label="Faol Premium Ustalar"
					value={`${activePremiumCount} ta`}
					sub="Obunasi faol ustalar"
					accent="blue"
				/>
				<StatCard
					icon={AlertTriangle}
					label="Rad etilganlar"
					value={`${declinedCount} ta`}
					sub="Bekor qilingan to'lovlar"
					accent="rose"
				/>
			</div>

			{/* Pending approvals */}
			<Card className="p-5">
				<div className="flex justify-between items-center mb-4 flex-wrap gap-2">
					<div>
						<h4 className="text-xs font-black text-text-primary uppercase tracking-wider flex items-center gap-1.5">
							<Clock size={14} className="text-amber-500 animate-pulse" />
							Yangi Kelgan To'lov Arizalari
						</h4>
						<p className="text-[11px] text-text-muted font-bold mt-0.5">
							Tasdiqlashni kutayotgan faol premium to'lov arizalari
						</p>
					</div>
					<Badge variant="warning">{pendingCount} kutilmoqda</Badge>
				</div>

				{pendingCount === 0 ? (
					<EmptyState
						icon={CheckCircle2}
						title="Yangi to'lov arizalari yo'q!"
						subtitle="Ustalar tomonidan yuborilgan barcha arizalar ko'rib chiqilgan."
					/>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{pendingPayments
							.filter((p) => p.status === 'pending')
							.map((payment) => {
								const payMaster = masters.find((m) => m.id === payment.masterId);
								const tariff = tariffs.find((t) => t.id === payment.packageId);
								return (
									<div
										key={payment.id}
										className="bg-surface-secondary/50 p-4 rounded-2xl border border-border shadow-sm flex flex-col justify-between gap-3 hover:border-border-secondary transition-all"
									>
										<div>
											<div className="flex justify-between items-start gap-3">
												<div>
													<span className="text-[11px] bg-amber-500 text-slate-950 font-black px-1.5 py-0.5 rounded uppercase tracking-wider block w-max">
														{tariff?.name || payment.packageId} Premium
													</span>
													<h4 className="text-xs font-black text-text-primary mt-1.5">
														{payMaster?.name || "Noma'lum usta"}
													</h4>
													<span className="text-[11px] font-mono text-text-muted font-bold mt-0.5 flex items-center gap-1">
														<Phone size={10} /> {payMaster?.phone || ''}
													</span>
												</div>
												<span className="text-[11px] text-text-muted font-semibold">
													{new Date(payment.createdAt).toLocaleDateString()}
												</span>
											</div>

											<div className="bg-surface-card p-3 rounded-xl border border-border text-[11px] font-bold mt-3 flex flex-col gap-1.5">
												<div className="flex justify-between">
													<span className="text-text-muted">Summa:</span>
													<span className="text-[#0E5A3C] dark:text-emerald-400 font-extrabold">
														{payment.amount.toLocaleString()} UZS
													</span>
												</div>
												{payment.receiptText && (
													<div className="flex justify-between">
														<span className="text-text-muted">Tranzaksiya №:</span>
														<span className="text-text-secondary font-mono">
															{payment.receiptText}
														</span>
													</div>
												)}
												{payment.proofImageUrl && (
													<div className="mt-1 flex flex-col gap-1 border-t border-border pt-1.5">
														<span className="text-text-muted block mb-1">
															To'lov cheki / kvitansiya:
														</span>
														<img
															loading="lazy"
															src={payment.proofImageUrl}
															alt="To'lov cheki"
															className="w-full max-h-36 object-contain rounded-lg border border-border bg-surface-card"
														/>
													</div>
												)}
											</div>
										</div>

										<div className="flex gap-2 mt-2">
											<PrimaryButton
												onClick={() => handlers.handleApprovePayment(payment.id)}
												className="flex-1"
											>
												<CheckCircle2 size={12} />
												Tasdiqlash
											</PrimaryButton>
											<DangerButton onClick={() => handlers.handleDeclinePayment(payment.id)} className="px-3">
												Rad etish
											</DangerButton>
										</div>
									</div>
								);
							})}
					</div>
				)}
			</Card>

			{/* Payments history */}
			<Card className="p-3.5 sm:p-4 flex flex-col gap-3 sm:gap-4">
				<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
					<div>
						<h4 className="text-xs font-black text-text-primary flex items-center gap-1.5 uppercase tracking-wide">
							<DollarSign size={16} className="text-emerald-600" />
							To'lovlar Tarixi & Tranzaksiya Jurnali
						</h4>
						<p className="text-[11px] text-text-muted font-bold mt-0.5">
							Ustalar tomonidan qilingan barcha kvitansiya arizalari tarixi
						</p>
					</div>
					<SearchInput
						value={paymentSearch}
						onChange={setPaymentSearch}
						placeholder="Usta ismi yoki raqam bo'yicha izlash..."
						className="w-full sm:w-64 shrink-0"
					/>
				</div>

				{filteredPayments.length === 0 ? (
					<EmptyState
						icon={Search}
						title="Mos keluvchi to'lov topilmadi!"
						subtitle="Izlash mezonini o'zgartirib ko'ring yoki barcha to'lovlarni ko'rish uchun tozalang."
					/>
				) : (
					<div className="overflow-x-auto rounded-2xl border border-border">
						<table className="w-full text-left border-collapse min-w-[750px]">
							<thead>
								<tr className="bg-surface-secondary border-b border-border text-[11px] uppercase font-black text-text-muted tracking-wider">
									<th className="py-2.5 px-4">Usta ismi & Tel</th>
									<th className="py-2.5 px-4">Tarif paketi</th>
									<th className="py-2.5 px-4">To'lov summasi</th>
									<th className="py-2.5 px-4">Kvitansiya / Chek</th>
									<th className="py-2.5 px-4">Sana</th>
									<th className="py-2.5 px-4">Holat</th>
									<th className="py-2.5 px-4 text-right">Harakatlar</th>
								</tr>
							</thead>
							<tbody>
								{filteredPayments.map((p) => {
									const payMaster = masters.find((m) => m.id === p.masterId);
									const tariff = tariffs.find((t) => t.id === p.packageId);
									return (
										<tr
											key={p.id}
											className="border-b border-border/60 text-[11px] hover:bg-surface-secondary/40 transition-colors"
										>
											<td className="py-3 px-4">
												<div className="font-extrabold text-text-secondary">
													{payMaster?.name || "Noma'lum usta"}
												</div>
												<div className="text-[11px] text-text-muted font-mono font-bold mt-0.5">
													{payMaster?.phone || ''}
												</div>
											</td>
											<td className="py-3 px-4">
												<span className="font-bold text-text-secondary uppercase text-[11px]">
													{tariff?.name || p.packageId}
												</span>
											</td>
											<td className="py-3 px-4 font-black font-mono text-text-primary">
												{p.amount.toLocaleString()} UZS
											</td>
											<td className="py-3 px-4">
												<div className="flex flex-col gap-1">
													{p.receiptText && (
														<span className="text-[11px] font-mono font-black bg-surface-tertiary text-text-secondary px-1.5 py-0.5 rounded w-max">
															№ {p.receiptText}
														</span>
													)}
													{p.proofImageUrl && (
														<a
															href={p.proofImageUrl}
															target="_blank"
															rel="noreferrer"
															className="text-[11px] text-[#0E5A3C] dark:text-emerald-400 font-black hover:underline text-left cursor-pointer flex items-center gap-1"
														>
															<Upload size={8} /> Chek rasmini ochish
														</a>
													)}
												</div>
											</td>
											<td className="py-3 px-4 text-text-muted font-bold">
												{new Date(p.createdAt).toLocaleDateString()}
											</td>
											<td className="py-3 px-4">
												<Badge
													variant={
														p.status === 'pending'
															? 'warning'
															: p.status === 'approved'
																? 'success'
																: 'danger'
													}
													className={p.status === 'pending' ? 'animate-pulse' : ''}
												>
													{p.status === 'pending'
														? 'Kutilmoqda'
														: p.status === 'approved'
															? 'Tasdiqlangan ✓'
															: 'Rad etilgan ✗'}
												</Badge>
											</td>
											<td className="py-3 px-4 text-right">
												{p.status === 'pending' ? (
													<div className="flex gap-1.5 justify-end">
														<button
															onClick={() => handlers.handleDeclinePayment(p.id)}
															className="px-2 py-1 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 rounded-lg text-[11px] font-black transition-colors cursor-pointer"
														>
															Rad etish
														</button>
														<button
															onClick={() => handlers.handleApprovePayment(p.id)}
															className="px-2.5 py-1 bg-[#0E5A3C] hover:bg-emerald-700 text-white rounded-lg text-[11px] font-black transition-colors shadow-sm cursor-pointer"
														>
															Tasdiqlash
														</button>
													</div>
												) : (
													<span className="text-[11px] text-text-muted/60 font-bold uppercase">
														Yopilgan
													</span>
												)}
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				)}
			</Card>

			{/* Master premium control */}
			<Card className="p-3.5 sm:p-4 flex flex-col gap-3 sm:gap-4">
				<div>
					<h4 className="text-xs font-black text-text-primary flex items-center gap-1.5 uppercase tracking-wide">
						<Wrench size={15} className="text-indigo-600 dark:text-indigo-400" />
						Ustalar Premium Muddatini Nazorat Qilish
					</h4>
					<p className="text-[11px] text-text-muted font-bold mt-0.5">
						Platformadagi faol ustalar ro'yxati va ularning premium holatlarini qo'lda boshqarish
						(muddati uzaytirish, qisqartirish, obunani o'chirish).
					</p>
				</div>

				<div className="overflow-x-auto rounded-2xl border border-border">
					<table className="w-full text-left border-collapse min-w-[700px]">
						<thead>
							<tr className="bg-surface-secondary border-b border-border text-[11px] uppercase font-black text-text-muted tracking-wider">
								<th className="py-2.5 px-4">Usta ismi</th>
								<th className="py-2.5 px-4">Sohasi va Hudud</th>
								<th className="py-2.5 px-4">Telefon</th>
								<th className="py-2.5 px-4">Premium Holati</th>
								<th className="py-2.5 px-4">Tugash Sanasi</th>
								<th className="py-2.5 px-4 text-right">Tezkor premium amallari</th>
							</tr>
						</thead>
						<tbody>
							{masters.map((m) => {
								const premiumUntilStr = m.premiumUntil;
								let isPremiumActive = false;
								let daysLeft = 0;
								if (premiumUntilStr) {
									const diff = new Date(premiumUntilStr).getTime() - new Date().getTime();
									if (diff > 0) {
										daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
										isPremiumActive = true;
									}
								}

								return (
									<tr
										key={m.id}
										className="border-b border-border/60 text-[11px] hover:bg-surface-secondary/40 transition-colors"
									>
										<td className="py-3.5 px-4 font-extrabold text-text-primary flex items-center gap-2">
											{m.avatar ? (
												<img
													loading="lazy"
													src={m.avatar}
													alt={m.name}
													className="w-6 h-6 rounded-full object-cover shadow-sm shrink-0"
												/>
											) : (
												<div className="w-6 h-6 rounded-full bg-surface-tertiary font-black text-[11px] flex items-center justify-center shrink-0">
													{m.name.slice(0, 2).toUpperCase()}
												</div>
											)}
											<span>{m.name}</span>
										</td>
										<td className="py-3.5 px-4">
											<div className="font-bold text-text-secondary">{m.category}</div>
											<div className="text-[11px] text-text-muted font-bold mt-0.5">
												{m.district}, {m.region}
											</div>
										</td>
										<td className="py-3.5 px-4 font-mono font-black text-text-primary">{m.phone}</td>
										<td className="py-3.5 px-4">
											{isPremiumActive ? (
												<span className="px-2 py-0.5 text-[11px] font-black uppercase rounded-md bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30">
													👑 FAOL ({daysLeft} kun qoldi)
												</span>
											) : (
												<span className="px-2 py-0.5 text-[11px] font-black uppercase rounded-md bg-surface-tertiary text-text-muted">
													Faol emas
												</span>
											)}
										</td>
										<td className="py-3.5 px-4 text-text-muted font-mono font-bold">
											{premiumUntilStr && isPremiumActive
												? new Date(premiumUntilStr).toLocaleDateString()
												: 'Kutilmoqda'}
										</td>
										<td className="py-3.5 px-4 text-right">
											<div className="flex gap-1.5 justify-end items-center">
												<button
													onClick={() => handlers.handleExtendMasterPremium(m.id, 30)}
													className="px-2 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 rounded-lg text-[11px] font-black transition-all cursor-pointer"
													title="+30 kun qo'shish"
												>
													+30 Kun
												</button>
												<button
													onClick={() => handlers.handleExtendMasterPremium(m.id, 365)}
													className="px-2 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 rounded-lg text-[11px] font-black transition-all cursor-pointer"
													title="+365 kun qo'shish"
												>
													+1 Yil
												</button>

												{isPremiumActive && (
													<>
														<button
															onClick={() => handlers.handleShortenMasterPremium(m.id, 10)}
															className="px-2 py-1 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/20 rounded-lg text-[11px] font-black transition-all cursor-pointer"
															title="10 kun kamaytirish"
														>
															-10 K
														</button>
														<button
															onClick={() => handlers.handleCancelMasterPremium(m.id)}
															className="p-1 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
															title="Premium butunlay o'chirish"
														>
															<Trash2 size={13} />
														</button>
													</>
												)}
											</div>
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			</Card>
		</div>
	);
}
