import { useState } from 'react';
import { Plus, MessageSquare, Phone, Briefcase, Trash2, Bell } from 'lucide-react';
import { Card, SectionHeader, SearchInput, Badge, DangerButton } from '../AdminUI';
import SendPushModal from '../SendPushModal';
import type { AdminData } from '../useAdminData';

export default function MastersTab({ data }: { data: AdminData }) {
	const { masters, smf, handlers } = data;
	const [searchQuery, setSearchQuery] = useState('');
	const [pushTarget, setPushTarget] = useState<{ id: string | number; name: string } | null>(null);

	const filtered = masters.filter((m) =>
		m.name.toLowerCase().includes(searchQuery.toLowerCase())
	);

	return (
		<div className="flex flex-col gap-6">
			<SectionHeader
				title="Usta Mutaxassislar Boshqaruvi"
				subtitle="Ro'yxatdan o'tgan barcha ustalar, ularning izohlari va reytinglarini tekshirish hamda moderatsiya qilish"
				right={
					<>
						<SearchInput
							value={searchQuery}
							onChange={setSearchQuery}
							placeholder="Ustalar ismini qidirish..."
							className="w-64"
						/>
						<button
							onClick={() => smf('modalOpen', true)}
							className="bg-[#0E5A3C] hover:bg-[#0a452d] text-white text-xs font-black px-4.5 py-2.5 rounded-xl cursor-pointer flex items-center gap-1.5 transition-all shadow-md shadow-emerald-950/10 shrink-0"
						>
							<Plus size={14} />
							Yangi Usta Qo'shish
						</button>
					</>
				}
			/>

			<div className="flex flex-col gap-4">
				{filtered.map((master) => (
					<Card key={master.id} className="p-3.5 sm:p-4 flex flex-col gap-3 sm:gap-4">
						<div className="flex justify-between items-start gap-4 flex-wrap">
							<div className="flex items-center gap-3">
								{master.avatar ? (
									<img
										loading="lazy"
										src={master.avatar}
										alt={master.name}
										className="w-12 h-12 rounded-2xl object-cover shadow-sm shrink-0"
									/>
								) : (
									<div className="w-12 h-12 rounded-2xl bg-surface-tertiary text-text-primary font-black flex items-center justify-center text-sm shadow-sm shrink-0">
										{master.name.split(' ').map((n) => n[0]).join('')}
									</div>
								)}
								<div>
									<div className="flex items-center gap-2 flex-wrap">
										<h4 className="text-xs font-black text-text-primary">{master.name}</h4>
										<Badge variant={master.status === 'active' ? 'success' : 'danger'}>
											{master.status === 'active' ? 'Faol' : 'Bloklangan'}
										</Badge>
										{master.isVerified && (
											<span className="bg-blue-500 text-white text-[11px] px-1.5 py-0.5 rounded font-black flex items-center gap-0.5">
												✓ Tasdiqlangan
											</span>
										)}
									</div>
									<div className="flex items-center gap-3 text-[11px] text-text-muted font-bold mt-1 flex-wrap">
										<span className="text-[#0E5A3C] dark:text-emerald-400 uppercase">
											{master.category}
										</span>
										<span>•</span>
										<span className="flex items-center gap-0.5 text-text-primary font-black">
											<Phone size={10} className="text-brand" /> {master.phone}
										</span>
										<span>•</span>
										<span className="flex items-center gap-0.5">
											<MessageSquare size={10} className="text-text-muted" /> {master.reviews.length} sharh
										</span>
										<span>•</span>
										<span className="flex items-center gap-0.5">
											<Briefcase size={10} className="text-text-muted" /> {master.completedJobs} ish
										</span>
									</div>
								</div>
							</div>

							<div className="flex gap-2">
								<button
									onClick={() => setPushTarget({ id: master.userId, name: master.name })}
									className="px-3 py-2 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl text-[11px] font-black transition-all cursor-pointer flex items-center gap-1"
									title="Bildirishnoma yuborish"
								>
									<Bell size={12} />
								</button>

								<button
									onClick={() => handlers.handleToggleVerification(master.id)}
									className="px-3 py-2 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl text-[11px] font-black transition-all cursor-pointer"
								>
									{master.isVerified ? 'Verifikatsiyani bekor qilish' : 'Verifikatsiya berish'}
								</button>

								<button
									onClick={() => handlers.handleToggleMasterBlock(master.id)}
									className={
										master.status === 'active'
											? 'px-3 py-2 rounded-xl text-[11px] font-black transition-all cursor-pointer bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20'
											: 'px-3 py-2 rounded-xl text-[11px] font-black transition-all cursor-pointer bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
									}
								>
									{master.status === 'active' ? 'Bloklash' : 'Faollashtirish'}
								</button>

								<DangerButton onClick={() => handlers.handleDeleteMaster(master.id)}>
									O'chirish
								</DangerButton>
							</div>
						</div>

						{/* Reviews moderation */}
						<div className="bg-surface-secondary p-4 rounded-2xl border border-border mt-1">
							<h5 className="text-[11px] uppercase tracking-wide font-black text-text-muted mb-3 flex items-center gap-1.5">
								<MessageSquare size={12} className="text-[#0E5A3C] dark:text-emerald-400" />
								Mijozlar tomonidan qoldirilgan izohlar va sharhlar ({master.reviews.length} ta)
							</h5>

							{master.reviews.length === 0 ? (
								<p className="text-[11px] text-text-muted font-semibold italic">
									Ushbu usta uchun hali izohlar qoldirilmagan.
								</p>
							) : (
								<div className="flex flex-col gap-2.5">
									{master.reviews.map((review) => (
										<div
											key={review.id}
											className="bg-surface-card p-3 rounded-xl border border-border flex justify-between items-start gap-3"
										>
											<div className="text-xs">
												<div className="flex items-center gap-2 flex-wrap">
													<span className="font-extrabold text-text-secondary">
														{review.author}
													</span>
													<span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1 py-0.5 rounded">
														✓ Sifatli xizmat
													</span>
													<span className="text-[11px] text-text-muted font-bold">
														{review.date}
													</span>
												</div>
												<p className="text-[11px] text-text-secondary font-semibold mt-1 italic">
													"{review.text}"
												</p>
											</div>

											<button
												onClick={() => handlers.handleDeleteReview(master.id, review.id)}
												className="p-1 text-text-muted hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 cursor-pointer"
												title="Izohni o'chirish"
											>
												<Trash2 size={13} />
											</button>
										</div>
									))}
								</div>
							)}
						</div>
					</Card>
				))}

				{filtered.length === 0 && (
					<Card className="p-10 text-center text-xs font-bold text-text-muted">
						Hech qanday usta topilmadi.
					</Card>
				)}
			</div>

			{pushTarget && (
				<SendPushModal
					userId={pushTarget.id}
					userName={pushTarget.name}
					onClose={() => setPushTarget(null)}
				/>
			)}
		</div>
	);
}
