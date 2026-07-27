import { useState } from 'react';
import { Upload, RotateCcw } from 'lucide-react';
import { CATEGORIES } from '../../../lib/categories';
import { Card, PrimaryButton, DangerButton } from '../AdminUI';

interface LogoTabProps {
	customLogoUrl: string | null;
	fileInputRef: React.RefObject<HTMLInputElement | null>;
	handleResetLogo: () => void;
	showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export default function LogoTab({
	customLogoUrl,
	fileInputRef,
	handleResetLogo,
	showToast,
}: LogoTabProps) {
	const [categoryImages, setCategoryImages] = useState<Record<string, string>>(() => {
		const initial: Record<string, string> = {};
		CATEGORIES.forEach((c) => {
			initial[c.id] = localStorage.getItem(`Usta_category_image_${c.id}`) || c.image || '';
		});
		return initial;
	});

	return (
		<div className="flex flex-col gap-6">
			<Card className="p-5">
				<h3 className="text-sm font-black text-text-primary">
					Platforma Logotipi va Vizual Dizayn
				</h3>
				<p className="text-[11px] text-text-muted font-bold mt-0.5">
					Ilova sarlavhalari va veb-saytning asosiy logotipini moslashtirish
				</p>
			</Card>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<Card className="p-3.5 sm:p-4 flex flex-col gap-3 sm:gap-4">
					<div>
						<h4 className="text-xs font-black uppercase text-text-primary">
							Yangi Logotip yuklash
						</h4>
						<p className="text-[11px] text-text-muted font-bold mt-0.5">
							PNG, JPG yoki SVG formatidagi rasmlar ruxsat etiladi (Max: 5MB)
						</p>
					</div>

					<div className="flex flex-col items-center gap-4 bg-surface-secondary/50 p-6 border rounded-2xl border-border">
						<span className="text-[11px] uppercase font-black text-text-muted">
							Logotip yuklanishi joriy holat
						</span>

						<div className="w-24 h-24 rounded-2xl bg-surface-card border border-border flex items-center justify-center overflow-hidden shadow-sm">
							<img
								loading="lazy"
								src={customLogoUrl || '/icon-512x512.png'}
								alt="Joriy logotip"
								className="w-full h-full object-cover"
							/>
						</div>

						<div className="flex gap-2 w-full">
							<PrimaryButton
								onClick={() => fileInputRef.current?.click()}
								className="flex-1 bg-brand hover:bg-slate-800"
							>
								<Upload size={12} />
								Kompuyterdan yuklash
							</PrimaryButton>

							{customLogoUrl && (
								<DangerButton onClick={handleResetLogo} className="px-3">
									<RotateCcw size={12} />
									O'chirish
								</DangerButton>
							)}
						</div>

						<input
							type="file"
							accept="image/*"
							onChange={(e) => {
								const file = e.target.files?.[0];
								if (!file) return;
								if (file.size > 5 * 1024 * 1024) {
									showToast(
										'Rasm hajmi juda katta! 5MB dan kichik rasm yuklang.',
										'error'
									);
									return;
								}
								const reader = new FileReader();
								reader.onload = () => {
									localStorage.setItem('custom_usta_logo', reader.result as string);
									window.dispatchEvent(
										new CustomEvent('logo-updated', { detail: reader.result })
									);
									showToast("Logotip muvaffaqiyatli o'zgartirildi!", 'success');
								};
								reader.readAsDataURL(file);
								e.target.value = '';
							}}
							className="hidden"
						/>
					</div>
				</Card>

				<Card className="p-3.5 sm:p-4 flex flex-col gap-3 sm:gap-4 text-xs font-semibold leading-relaxed text-text-secondary">
					<h4 className="text-xs font-black uppercase text-text-primary">
						Dizayn qoidalari
					</h4>
					<p>
						Bizning brend xavfsizligi va vizual butunlikni ta'minlash maqsadida quyidagi
						qoidalarga rioya qilishingizni tavsiya etamiz:
					</p>
					<ul className="list-disc pl-5 flex flex-col gap-2 mt-1">
						<li>
							Logotip to'rtburchak (1:1) shaklda bo'lishi, burchaklari yumaloqlanganida
							chiroyli chiqishi lozim.
						</li>
						<li>
							Sarf-xarajat tushishining oldini olish uchun logotip orqa foni shaffof
							(transparent) bo'lgani afzal.
						</li>
						<li>
							Agar logotip yuklansa, u ham veb-saytning tepasidagi joriy logotipga, ham usta
							mobil ilovasining start sahifasidagi ko'rinishiga bir vaqtda ta'sir qiladi.
						</li>
					</ul>
				</Card>
			</div>

			{/* Category images */}
			<Card className="p-6 flex flex-col gap-4">
				<div>
					<h3 className="text-sm font-black text-text-primary">
						Toifalar Rasmlarini Boshqarish
					</h3>
					<p className="text-[11px] text-text-muted font-bold mt-0.5">
						Xizmat turlari uchun rasmlarni tahrirlash yoki yangi rasmlar yuklash (Konditsioner,
						Santexnik, Elektrik, va b.)
					</p>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-2">
					{CATEGORIES.filter((c) => c.id !== 'all').map((category) => {
						const currentImg = categoryImages[category.id] || '';

					const bumpCache = () => localStorage.setItem('Usta_cache_version', String(Date.now()));

					const handleSave = (url: string) => {
						if (url.trim()) {
							localStorage.setItem(`Usta_category_image_${category.id}`, url.trim());
							setCategoryImages((prev) => ({ ...prev, [category.id]: url.trim() }));
							showToast(
								`${category.name} toifasi rasmi muvaffaqiyatli saqlandi!`,
								'success'
							);
						} else {
							localStorage.removeItem(`Usta_category_image_${category.id}`);
							setCategoryImages((prev) => ({
								...prev,
								[category.id]: category.image || '',
							}));
							showToast(`${category.name} toifasi rasmi o'chirildi!`, 'info');
						}
						bumpCache();
						window.dispatchEvent(new Event('storage'));
					};

					const handleReset = () => {
						localStorage.removeItem(`Usta_category_image_${category.id}`);
						setCategoryImages((prev) => ({ ...prev, [category.id]: category.image || '' }));
						showToast(
							`${category.name} toifasi rasmi dastlabki holatga qaytarildi!`,
							'info'
						);
						bumpCache();
						window.dispatchEvent(new Event('storage'));
					};

						return (
							<div
								key={category.id}
								className="p-3.5 border rounded-2xl border-border bg-surface-secondary/50 flex flex-col gap-3"
							>
								<div className="flex items-center gap-3">
									<div className="w-12 h-12 rounded-xl overflow-hidden bg-surface-card border border-border shadow-sm flex items-center justify-center shrink-0">
										{currentImg ? (
											<img
												loading="lazy"
												src={currentImg}
												className="w-full h-full object-cover"
												alt={category.name}
												referrerPolicy="no-referrer"
											/>
										) : (
											<div className="p-2 bg-surface-tertiary text-text-muted rounded-lg">
												<span className="text-xs font-black">{category.name[0]}</span>
											</div>
										)}
									</div>
									<div className="min-w-0 flex-1">
										<h4 className="text-[11px] font-black text-text-primary truncate">
											{category.name}
										</h4>
										<span className="text-[11px] font-black text-text-muted uppercase tracking-wider block mt-0.5">
											ID: {category.id}
										</span>
									</div>
								</div>

								<div className="flex flex-col gap-2">
									<input
										type="text"
										placeholder="Rasm uchun URL havola (Masalan, Unsplash)..."
										value={currentImg}
										onChange={(e) => {
											const val = e.target.value;
											setCategoryImages((prev) => ({ ...prev, [category.id]: val }));
										}}
										className="w-full text-[11px] font-bold px-2.5 py-1.5 rounded-xl border border-border outline-none focus:border-brand bg-surface-input text-text-primary"
									/>
									<div className="flex gap-2">
										<button
											onClick={() => handleSave(currentImg)}
											className="flex-1 py-1.5 bg-brand hover:bg-slate-800 text-white text-[11px] font-black rounded-lg transition-all cursor-pointer shadow-sm active:scale-95 text-center"
										>
											Saqlash
										</button>
										<button
											onClick={handleReset}
											className="px-2.5 py-1.5 border border-red-100 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 text-[11px] font-black rounded-lg transition-all cursor-pointer"
										>
											Qayta tiklash
										</button>
									</div>
								</div>
							</div>
						);
					})}
				</div>
			</Card>
		</div>
	);
}
