import { CheckCircle2, Phone } from 'lucide-react';
import { Card, EmptyState, PrimaryButton, DangerButton } from '../AdminUI';
import type { AdminData } from '../useAdminData';

export default function ApprovalsTab({ data }: { data: AdminData }) {
	const { applications, handlers } = data;

	return (
		<div className="flex flex-col gap-6">
			<Card className="p-5">
				<h3 className="text-sm font-black text-text-primary">
					Biz bilan hamkorlik (Usta bo'lish) arizalari
				</h3>
				<p className="text-[11px] text-text-muted font-bold mt-0.5">
					Mijozlar tomonidan yuborilgan usta bo'lish arizalari ro'yxati
				</p>
			</Card>

			{applications.length === 0 ? (
				<Card className="p-12">
					<EmptyState
						icon={CheckCircle2}
						title="Hozircha yangi arizalar yo'q!"
						subtitle="Barcha hamkorlik arizalari ko'rib chiqilgan."
					/>
				</Card>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					{applications.map((app) => (
						<Card key={app.id} className="p-5 flex flex-col gap-3">
							<div className="flex justify-between items-start gap-4">
								<div className="flex gap-3">
									{app.avatar ? (
										<img
											loading="lazy"
											src={app.avatar}
											alt={app.name}
											className="w-10 h-10 rounded-xl object-cover shadow-sm shrink-0"
										/>
									) : (
										<div className="w-10 h-10 rounded-xl bg-surface-tertiary font-bold text-text-secondary flex items-center justify-center text-xs shrink-0">
											{app.name.split(' ').map((n) => n[0]).join('')}
										</div>
									)}
									<div>
										<span className="text-[11px] bg-[#0E5A3C]/5 dark:bg-emerald-500/10 text-[#0E5A3C] dark:text-emerald-400 font-black px-2 py-0.5 rounded-md uppercase tracking-wider block w-max">
											{app.category} sohasi ustasi
										</span>
										<h4 className="text-xs font-black text-text-primary mt-1.5">{app.name}</h4>
										<span className="text-[11px] font-mono text-text-primary font-black mt-1 flex items-center gap-1">
											<Phone size={10} className="text-brand" /> {app.phone}
										</span>
									</div>
								</div>
								<span className="text-[11px] text-text-muted font-semibold">
									{app.submittedAt}
								</span>
							</div>

							<div className="bg-surface-secondary p-3 rounded-2xl border border-border/50 text-[11px] font-bold">
								<div className="flex justify-between">
									<span className="text-text-muted">Viloyat / Shahar:</span>
									<span className="text-text-secondary">{app.region}</span>
								</div>
								<div className="flex justify-between mt-1">
									<span className="text-text-muted">Tuman:</span>
									<span className="text-text-secondary">{app.district}</span>
								</div>
							</div>

							<div className="flex gap-2.5 mt-2">
								<PrimaryButton onClick={() => handlers.handleApproveApp(app)} className="flex-1">
									<CheckCircle2 size={12} />
									Tasdiqlash (Usta qilish)
								</PrimaryButton>
								<DangerButton onClick={() => handlers.handleDeclineApp(app.id)} className="px-4">
									Rad etish
								</DangerButton>
							</div>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}
