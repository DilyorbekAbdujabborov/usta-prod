import { Sparkles, DollarSign, Plus, Check, Trash2, Pencil } from 'lucide-react';
import { Card, GradientPageHeader, FieldLabel, inputClass, PrimaryButton, cx } from '../AdminUI';
import type { AdminData } from '../useAdminData';

export default function MarketplaceTab({ data }: { data: AdminData }) {
	const { tariffs, settings, sst, tariffForm, stf, handlers } = data;
	const { premiumMode, adminCard, adminCardHolder } = settings;
	const { newTariffName, newTariffPrice, newTariffMonths, newTariffComment, editingTariffId } = tariffForm;

	return (
		<div className="flex flex-col gap-6 text-left">
			<GradientPageHeader
				icon={Sparkles}
				title="Premium va Tariflar Boshqaruv Markazi"
				subtitle="Platforma daromadi va ustalar premium obunalarini to'liq nazorat qilish, tariflar yaratish va to'lovlarni tasdiqlash."
				badge="👑 Premium Desk"
			/>

			{/* System controls */}
			<Card className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
				<div className="text-left">
					<h4 className="text-xs font-black text-text-primary flex items-center gap-1.5 uppercase tracking-wide">
						<Sparkles size={16} className="text-amber-500 animate-pulse" />
						Premium Cheklov Tizimi (Faollashtirish)
					</h4>
					<p className="text-[11px] text-text-muted font-bold mt-1 leading-relaxed max-w-xl">
						<span className="text-amber-600 dark:text-amber-400 font-extrabold">FAOL</span> rejimda
						premium muddati tugagan usta profiliga kirganda to'lov arizasi chiqadi va ishlay
						olmaydilar.{' '}
						<span className="text-emerald-600 dark:text-emerald-400 font-extrabold">FAOL EMAS</span>{' '}
						rejimida esa cheklovlar butunlay o'chiriladi va barcha ustalar cheksiz bepul xizmatdan
						foydalana olishadi.
					</p>
				</div>

				<div className="flex gap-2 w-full sm:w-auto shrink-0">
					<button
						onClick={() => handlers.handleSetPremiumMode('active')}
						className={cx(
							'flex-1 sm:flex-initial px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer',
							premiumMode === 'active'
								? 'bg-amber-500 text-slate-950 border border-amber-600 shadow-md'
								: 'bg-surface-tertiary text-text-secondary hover:bg-border border border-border'
						)}
					>
						★ FAOL (Majburiy)
					</button>
					<button
						onClick={() => handlers.handleSetPremiumMode('noactive')}
						className={cx(
							'flex-1 sm:flex-initial px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer',
							premiumMode === 'noactive'
								? 'bg-emerald-600 text-white border border-emerald-700 shadow-md'
								: 'bg-surface-tertiary text-text-secondary hover:bg-border border border-border'
						)}
					>
						✓ FAOL EMAS (Cheksiz bepul)
					</button>
				</div>
			</Card>

			{/* Card details */}
			<Card className="p-5 flex flex-col gap-4">
				<div>
					<h4 className="text-xs font-black text-text-primary flex items-center gap-1.5 uppercase tracking-wider">
						<DollarSign size={14} className="text-emerald-500" />
						Karta Ma'lumotlarini Sozlash
					</h4>
					<p className="text-[11px] text-text-muted font-bold mt-0.5">
						Ustalar premium arizasini topshirayotganda ekranda ko'rinadigan sizning karta
						raqamingiz va egasi.
					</p>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div className="flex flex-col gap-1.5">
						<FieldLabel>Karta raqami</FieldLabel>
						<div className="flex items-center gap-1.5 bg-surface-secondary border border-border rounded-xl px-3 py-2">
							<input
								type="text"
								value={adminCard}
								onChange={(e) => sst('adminCard', e.target.value)}
								className="w-full bg-transparent text-xs font-black font-mono outline-none text-text-primary"
								placeholder="8600 0000 0000 0000"
							/>
						</div>
					</div>

					<div className="flex flex-col gap-1.5">
						<FieldLabel>Karta egasi ismi (F.I.SH)</FieldLabel>
						<div className="flex items-center gap-1.5 bg-surface-secondary border border-border rounded-xl px-3 py-2">
							<input
								type="text"
								value={adminCardHolder}
								onChange={(e) => sst('adminCardHolder', e.target.value)}
								className="w-full bg-transparent text-xs font-black outline-none text-text-primary"
								placeholder="ISM FAMILIYA"
							/>
						</div>
					</div>
				</div>

				<div className="flex justify-end mt-1">
					<PrimaryButton onClick={handlers.handleSaveCardDetails} className="bg-emerald-600 hover:bg-emerald-700">
						<Check size={14} />
						Kartani Saqlash
					</PrimaryButton>
				</div>
			</Card>

			{/* Tariffs builder */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
				<Card className="p-5 flex flex-col gap-4">
					<div>
						<h4 className="text-xs font-black text-text-primary uppercase tracking-wider flex items-center gap-1.5">
							<Plus size={15} className="text-emerald-500" />
							{editingTariffId ? 'Tarifni Tahrirlash' : "Yangi Tarif Qo'shish"}
						</h4>
						<p className="text-[11px] text-text-muted font-bold mt-0.5">
							Sotuvga chiqariladigan yangi premium paket ma'lumotlarini to'ldiring.
						</p>
					</div>

					<form onSubmit={handlers.handleAddOrUpdateTariff} className="flex flex-col gap-3.5">
						<div className="flex flex-col gap-1">
							<FieldLabel>Tarif nomi</FieldLabel>
							<input
								type="text"
								value={newTariffName}
								onChange={(e) => stf('name', e.target.value)}
								placeholder="Masalan: 1 oylik, 3 oylik premium"
								className={inputClass}
								required
							/>
						</div>

						<div className="grid grid-cols-2 gap-2">
							<div className="flex flex-col gap-1">
								<FieldLabel>Narxi (UZS)</FieldLabel>
								<input
									type="number"
									value={newTariffPrice}
									onChange={(e) => stf('price', Math.max(0, parseInt(e.target.value) || 0))}
									className={inputClass + ' font-mono'}
									required
								/>
							</div>
							<div className="flex flex-col gap-1">
								<FieldLabel>Muddati (oylarda)</FieldLabel>
								<input
									type="number"
									value={newTariffMonths}
									step="0.25"
									onChange={(e) => stf('months', Math.max(0.1, parseFloat(e.target.value) || 0.1))}
									className={inputClass + ' font-mono'}
									required
								/>
							</div>
						</div>

						<div className="flex flex-col gap-1">
							<FieldLabel>Tarif tavsifi (izoh)</FieldLabel>
							<textarea
								value={newTariffComment}
								onChange={(e) => stf('comment', e.target.value)}
								placeholder="Ushbu tarif haqida qisqacha ma'lumot yozing..."
								className={inputClass + ' h-16 resize-none'}
							/>
						</div>

						<div className="flex gap-1.5 mt-2">
							{editingTariffId && (
								<button
									type="button"
									onClick={handlers.handleCancelEditTariff}
									className="flex-1 py-2.5 bg-surface-tertiary hover:bg-border text-text-secondary font-bold text-xs rounded-xl transition-all cursor-pointer text-center"
								>
									Bekor qilish
								</button>
							)}
							<PrimaryButton type="submit" className="flex-[2]">
								<Check size={14} />
								{editingTariffId ? 'Tarifni Yangilash' : 'Tarifni Saqlash'}
							</PrimaryButton>
						</div>
					</form>
				</Card>

				<Card className="p-5 lg:col-span-2 flex flex-col gap-4">
					<div>
						<h4 className="text-xs font-black text-text-primary uppercase tracking-wider">
							Amaldagi Tarif Rejalari ({tariffs.length})
						</h4>
						<p className="text-[11px] text-text-muted font-bold mt-0.5">
							Ustalar to'lov qilayotganda ekranda paydo bo'ladigan tarif kartalari ro'yxati.
						</p>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-1 no-scrollbar">
						{tariffs.map((tariff) => (
							<div
								key={tariff.id}
								className="p-4 rounded-2xl border border-border bg-surface-secondary/50 flex flex-col justify-between gap-3 shadow-sm hover:border-border-secondary transition-all"
							>
								<div>
									<div className="flex justify-between items-center">
										<span className="text-[11px] uppercase font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-md">
											{tariff.months} oylik muddat
										</span>
										<div className="flex gap-1.5">
											<button
												onClick={() => handlers.handleEditTariff(tariff)}
												className="p-1 text-text-muted hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors cursor-pointer"
												title="Tahrirlash"
											>
												<Pencil size={12} />
											</button>
											<button
												onClick={() => handlers.handleDeleteTariff(tariff.id)}
												className="p-1 text-text-muted hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
												title="O'chirish"
											>
												<Trash2 size={12} />
											</button>
										</div>
									</div>

									<h5 className="text-xs font-black text-text-primary mt-2">{tariff.name}</h5>
									<p className="text-[11px] text-text-muted font-bold leading-relaxed mt-1 truncate">
										{tariff.comment || 'Tavsif berilmagan.'}
									</p>
								</div>

								<div className="border-t border-border/80 pt-2.5 flex justify-between items-baseline">
									<span className="text-[11px] text-text-muted font-bold">Usta narxi:</span>
									<span className="text-xs font-extrabold font-mono text-text-primary">
										{tariff.price.toLocaleString()} UZS
									</span>
								</div>
							</div>
						))}

						{tariffs.length === 0 && (
							<div className="col-span-full p-8 text-center text-[11px] font-bold text-text-muted">
								Hozircha tarif rejalari yo'q.
							</div>
						)}
					</div>
				</Card>
			</div>
		</div>
	);
}
