import { Plus, Trash2 } from 'lucide-react';
import { Card, FieldLabel, inputClass, PrimaryButton } from '../AdminUI';
import type { AdminData } from '../useAdminData';

const GRADIENT_OPTIONS = [
	{ value: 'from-teal-600 to-emerald-700', label: "Yashil-ko'k va Zumrad (Santexnika / Klining)" },
	{ value: 'from-blue-600 to-[#0E5A3C]', label: "Ko'k va To'q Yashil (Sifatli xizmatlar)" },
	{ value: 'from-indigo-600 to-purple-700', label: 'Indigo va Binafsha (IT va boshqalar)' },
	{ value: 'from-orange-500 to-rose-600', label: "To'q sariq va Pushti (Yorqin ta'riflar)" },
	{ value: 'from-slate-800 to-slate-950', label: 'Tun qorasi (Eksklyuziv taklif)' },
];

export default function AdsTab({ data }: { data: AdminData }) {
	const { ads, adForm, saf, handlers } = data;
	const { newAdTitle, newAdDiscount, newAdCode, newAdGradient } = adForm;

	return (
		<div className="flex flex-col gap-6">
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
				<Card className="p-3.5 sm:p-4 flex flex-col gap-3 sm:gap-4">
					<div>
						<h3 className="text-xs font-black uppercase text-text-primary">
							Yangi Reklama Banneri Qo'shish
						</h3>
						<p className="text-[11px] text-text-muted font-bold mt-0.5">
							Ilova bosh sahifasida ko'rinadigan promo aksiyalarni tahrirlash
						</p>
					</div>

					<form onSubmit={handlers.handleAddAd} className="flex flex-col gap-3">
						<div className="flex flex-col gap-1">
							<FieldLabel>Reklama sarlavhasi</FieldLabel>
							<input
								type="text"
								value={newAdTitle}
								onChange={(e) => saf('title', e.target.value)}
								placeholder="Masalan: Kuzgi klining 15% chegirma bilan"
								className={inputClass}
							/>
						</div>

						<div className="grid grid-cols-2 gap-3">
							<div className="flex flex-col gap-1">
								<FieldLabel>Chegirma matni</FieldLabel>
								<input
									type="text"
									value={newAdDiscount}
									onChange={(e) => saf('discount', e.target.value)}
									placeholder="Masalan: 15% CHEGIRMA"
									className={inputClass}
								/>
							</div>
							<div className="flex flex-col gap-1">
								<FieldLabel>Promo-kod</FieldLabel>
								<input
									type="text"
									value={newAdCode}
									onChange={(e) => saf('code', e.target.value)}
									placeholder="Masalan: AUTUMN15"
									className={inputClass + ' uppercase'}
								/>
							</div>
						</div>

						<div className="flex flex-col gap-1">
							<FieldLabel>Gradient rang (Tailwind sinfi)</FieldLabel>
							<select
								value={newAdGradient}
								onChange={(e) => saf('gradient', e.target.value)}
								className={inputClass + ' cursor-pointer'}
							>
								{GRADIENT_OPTIONS.map((opt) => (
									<option key={opt.value} value={opt.value}>
										{opt.label}
									</option>
								))}
							</select>
						</div>

						<PrimaryButton type="submit" className="w-full mt-1.5 bg-brand hover:bg-slate-800">
							<Plus size={14} />
							Yangi Reklama Kampaniyasini Joylash
						</PrimaryButton>
					</form>
				</Card>

				<Card className="p-3.5 sm:p-4 flex flex-col gap-3 sm:gap-4">
					<div>
						<h3 className="text-xs font-black uppercase text-text-primary">
							Faol Reklama Bannerlari ({ads.length})
						</h3>
						<p className="text-[11px] text-text-muted font-bold mt-0.5">
							Mijozlar bosh sahifasida aylanadigan faol takliflar
						</p>
					</div>

					<div className="flex flex-col gap-3 overflow-y-auto max-h-[340px] pr-1 no-scrollbar">
						{ads.map((ad) => (
							<div
								key={ad.id}
								className={`p-4 rounded-2xl text-white relative overflow-hidden bg-gradient-to-r ${ad.bgGradient}`}
							>
								<div className="flex justify-between items-start gap-3 relative z-10">
									<div>
										<span className="text-[11px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
											{ad.discount}
										</span>
										<h4 className="text-xs font-black mt-1.5 leading-tight">{ad.title}</h4>
										<span className="text-[11px] font-mono font-bold mt-2 block bg-white/10 px-2 py-1 rounded w-max">
											Promo-kod: {ad.code}
										</span>
									</div>

									<button
										onClick={() => handlers.handleDeleteAd(ad.id)}
										className="p-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors cursor-pointer shrink-0"
										title="Reklamani o'chirish"
									>
										<Trash2 size={13} />
									</button>
								</div>

								<div className="absolute right-3 bottom-1.5 text-xs text-white/10 font-black tracking-widest font-mono select-none">
									AD CLICKED: {ad.clicks}
								</div>
							</div>
						))}

						{ads.length === 0 && (
							<div className="p-8 text-center text-[11px] font-bold text-text-muted">
								Hozircha faol reklama yo'q.
							</div>
						)}
					</div>
				</Card>
			</div>
		</div>
	);
}
