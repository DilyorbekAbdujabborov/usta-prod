import { motion, AnimatePresence } from 'motion/react';
import { X, UserPlus, Check } from 'lucide-react';
import { CATEGORIES } from '../../lib/categories';
import { REGION_DATA } from '../../lib/regions';
import { inputClass, FieldLabel } from './AdminUI';
import type { AdminData } from './useAdminData';

export default function AddMasterModal({ data }: { data: AdminData }) {
	const { masterForm, smf, handlers } = data;
	const {
		addMasterModalOpen,
		newMasterName,
		newMasterCategory,
		newMasterPhone,
		newMasterRegion,
		newMasterDistrict,
		newMasterExperience,
		newMasterPrice,
		newMasterAbout,
		newMasterWorkHours,
		newMasterIsVerified,
	} = masterForm;

	return (
		<AnimatePresence>
			{addMasterModalOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
					<div className="absolute inset-0" onClick={() => smf('modalOpen', false)} />

					<motion.div
						initial={{ opacity: 0, scale: 0.95, y: 20 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.95, y: 20 }}
						className="w-full max-w-lg bg-surface-card rounded-xl p-6 shadow-2xl relative z-10 text-left border border-border flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
					>
						<div className="flex justify-between items-center pb-2 border-b border-dashed border-border text-text-primary">
							<h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
								<UserPlus size={16} className="text-[#0E5A3C] dark:text-emerald-400" />
								Yangi Usta Qo'shish (Admin)
							</h3>
							<button
								onClick={() => smf('modalOpen', false)}
								className="p-1 rounded-lg text-text-muted hover:bg-surface-tertiary cursor-pointer flex items-center justify-center"
							>
								<X size={16} />
							</button>
						</div>

						<form onSubmit={handlers.handleCreateMaster} className="flex flex-col gap-4">
							<div className="flex flex-col gap-1">
								<FieldLabel>Usta Ism-Familiyasi *</FieldLabel>
								<input
									type="text"
									required
									value={newMasterName}
									onChange={(e) => smf('name', e.target.value)}
									placeholder="Masalan: Javlonbek Akramov"
									className={inputClass}
								/>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div className="flex flex-col gap-1">
									<FieldLabel>Telefon raqami *</FieldLabel>
									<input
										type="text"
										required
										value={newMasterPhone}
										onChange={(e) => smf('phone', e.target.value)}
										placeholder="+998 90 123-45-67"
										className={inputClass}
									/>
								</div>

								<div className="flex flex-col gap-1">
									<FieldLabel>Kasbi / Toifasi</FieldLabel>
									<select
										value={newMasterCategory}
										onChange={(e) => smf('category', e.target.value)}
										className={inputClass + ' cursor-pointer'}
									>
										{CATEGORIES.filter((c) => c.id !== 'all').map((cat) => (
											<option key={cat.id} value={cat.id}>
												{cat.name}
											</option>
										))}
									</select>
								</div>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div className="flex flex-col gap-1">
									<FieldLabel>Viloyat / Hudud</FieldLabel>
									<select
										value={newMasterRegion}
										onChange={(e) => {
											const reg = e.target.value;
											smf('region', reg);
											smf('district', REGION_DATA[reg]?.[0] || '');
										}}
										className={inputClass + ' cursor-pointer'}
									>
										{Object.keys(REGION_DATA).map((reg) => (
											<option key={reg} value={reg}>
												{reg}
											</option>
										))}
									</select>
								</div>

								<div className="flex flex-col gap-1">
									<FieldLabel>Tuman / Shahar</FieldLabel>
									<select
										value={newMasterDistrict}
										onChange={(e) => smf('district', e.target.value)}
										className={inputClass + ' cursor-pointer'}
									>
										{(REGION_DATA[newMasterRegion] || []).map((dist) => (
											<option key={dist} value={dist}>
												{dist}
											</option>
										))}
									</select>
								</div>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
								<div className="flex flex-col gap-1">
									<FieldLabel>Tajribasi (yil)</FieldLabel>
									<input
										type="number"
										min="1"
										max="40"
										value={newMasterExperience}
										onChange={(e) => smf('experience', e.target.value)}
										className={inputClass}
									/>
								</div>

								<div className="flex flex-col gap-1">
									<FieldLabel>Boshlang'ich narx (so'm)</FieldLabel>
									<input
										type="number"
										step="5000"
										min="0"
										value={newMasterPrice}
										onChange={(e) => smf('price', e.target.value)}
										className={inputClass}
									/>
								</div>

								<div className="flex flex-col gap-1">
									<FieldLabel>Ish vaqti</FieldLabel>
									<input
										type="text"
										value={newMasterWorkHours}
										onChange={(e) => smf('workHours', e.target.value)}
										placeholder="09:00 - 18:00"
										className={inputClass}
									/>
								</div>
							</div>

							<div className="flex flex-col gap-1">
								<FieldLabel>Usta haqida batafsil (Tarjimai hol)</FieldLabel>
								<textarea
									value={newMasterAbout}
									onChange={(e) => smf('about', e.target.value)}
									placeholder="Ushbu usta haqida mijozlar ko'radigan qo'shimcha ma'lumotlar, ko'nikmalar, kafolatlar..."
									rows={3}
									className={inputClass + ' resize-none'}
								/>
							</div>

							<label
								htmlFor="isVerifiedAdmin"
								className="flex items-center gap-3 p-3 bg-surface-secondary rounded-2xl border border-border cursor-pointer select-none"
							>
								<input
									type="checkbox"
									id="isVerifiedAdmin"
									checked={newMasterIsVerified}
									onChange={(e) => smf('isVerified', e.target.checked)}
									className="sr-only"
								/>
								<span
									className={
										newMasterIsVerified
											? 'w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors bg-[#0E5A3C] border-[#0E5A3C]'
											: 'w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors bg-surface-card border-border-secondary'
									}
								>
									{newMasterIsVerified && <Check size={13} className="text-white" strokeWidth={3} />}
								</span>
								<span className="text-xs font-black text-text-secondary">
									Tasdiqlangan usta maqomini berish (Ko'k tasdiqlash belgisi)
								</span>
							</label>

							<button
								type="submit"
								className="w-full py-3.5 bg-[#0E5A3C] hover:bg-[#0a452d] text-white text-xs font-black rounded-2xl cursor-pointer flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-950/15"
							>
								<UserPlus size={16} />
								Usta Profilini Yaratish
							</button>
						</form>
					</motion.div>
				</div>
			)}
		</AnimatePresence>
	);
}
