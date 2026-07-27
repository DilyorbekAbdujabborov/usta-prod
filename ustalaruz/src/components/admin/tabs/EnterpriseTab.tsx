import { useState } from 'react';
import { Building2, Plus, Trash2, Pencil, Eye, EyeOff, Phone, MapPin, Image as ImageIcon, X } from 'lucide-react';
import {
	Card,
	SectionHeader,
	GradientPageHeader,
	EmptyState,
	Badge,
	PrimaryButton,
	GhostButton,
	FieldLabel,
	inputClass,
} from '../AdminUI';
import { REGION_DATA } from '../../../lib/regions';
import { uploadImageFile } from '../../../lib/uploadImage';
import type { AdminData } from '../useAdminData';

export default function EnterpriseTab({ data }: { data: AdminData }) {
	const { enterpriseOrders, categories, enterpriseForm: ef, sef, handlers } = data;
	const [uploading, setUploading] = useState(false);
	const [uploadError, setUploadError] = useState('');

	const districts = ef.region ? REGION_DATA[ef.region] || [] : [];

	const handlePickImage = async (file: File | undefined) => {
		if (!file) return;
		if (file.size > 5 * 1024 * 1024) {
			setUploadError('Rasm hajmi 5MB dan oshmasligi kerak.');
			return;
		}
		setUploadError('');
		setUploading(true);
		try {
			sef('image', await uploadImageFile(file, 'avatars'));
		} catch (err) {
			setUploadError(err instanceof Error ? err.message : 'Rasmni yuklashda xatolik.');
		} finally {
			setUploading(false);
		}
	};

	return (
		<div className="flex flex-col gap-6 text-left">
			<GradientPageHeader
				icon={Building2}
				title="Korxona E'lonlari"
				subtitle="Qurilish korxonalari bergan buyurtmalar — ilovaning qidiruv bo'limida 'Korxona buyurtmalari' toggle ostida chiqadi"
				badge="🏗️ E'lonlar"
				tone="slate"
			/>

			<div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
				<Card className="p-5 flex flex-col gap-4">
					<SectionHeader
						title={ef.editingId ? "E'lonni tahrirlash" : "Yangi e'lon qo'shish"}
						subtitle="Usta e'londagi telefon raqami orqali korxona bilan bevosita bog'lanadi"
					/>

					<form onSubmit={handlers.handleSaveEnterpriseOrder} className="flex flex-col gap-3">
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
							<div className="flex flex-col gap-1">
								<FieldLabel>Korxona nomi *</FieldLabel>
								<input
									type="text"
									value={ef.companyName}
									onChange={(e) => sef('companyName', e.target.value)}
									placeholder="Masalan: Toshkent Qurilish MCHJ"
									className={inputClass}
								/>
							</div>
							<div className="flex flex-col gap-1">
								<FieldLabel>Bog'lanish telefoni *</FieldLabel>
								<input
									type="text"
									value={ef.phone}
									onChange={(e) => sef('phone', e.target.value)}
									placeholder="+998 90 123-45-67"
									className={inputClass}
								/>
							</div>
						</div>

						<div className="flex flex-col gap-1">
							<FieldLabel>Sarlavha *</FieldLabel>
							<input
								type="text"
								value={ef.title}
								onChange={(e) => sef('title', e.target.value)}
								placeholder="Masalan: 12 qavatli turar-joy uchun 5 ta payvandchi kerak"
								className={inputClass}
							/>
						</div>

						<div className="flex flex-col gap-1">
							<FieldLabel>Batafsil ma'lumot *</FieldLabel>
							<textarea
								value={ef.description}
								onChange={(e) => sef('description', e.target.value)}
								rows={5}
								placeholder="Ish hajmi, muddat, to'lov shartlari, talablar..."
								className={inputClass + ' resize-y min-h-[110px]'}
							/>
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
							<div className="flex flex-col gap-1">
								<FieldLabel>Kategoriya</FieldLabel>
								<select
									value={ef.categoryId}
									onChange={(e) => sef('categoryId', e.target.value)}
									className={inputClass + ' cursor-pointer'}
								>
									<option value="">Barcha toifalar</option>
									{categories.map((c) => (
										<option key={c.id} value={c.id}>
											{c.name}
										</option>
									))}
								</select>
							</div>
							<div className="flex flex-col gap-1">
								<FieldLabel>Viloyat</FieldLabel>
								<select
									value={ef.region}
									onChange={(e) => {
										sef('region', e.target.value);
										sef('district', '');
									}}
									className={inputClass + ' cursor-pointer'}
								>
									<option value="">Barcha viloyatlar</option>
									{Object.keys(REGION_DATA).map((r) => (
										<option key={r} value={r}>
											{r}
										</option>
									))}
								</select>
							</div>
							<div className="flex flex-col gap-1">
								<FieldLabel>Tuman</FieldLabel>
								<select
									value={ef.district}
									onChange={(e) => sef('district', e.target.value)}
									disabled={!ef.region}
									className={inputClass + ' cursor-pointer disabled:opacity-50'}
								>
									<option value="">Barcha tumanlar</option>
									{districts.map((d: string) => (
										<option key={d} value={d}>
											{d}
										</option>
									))}
								</select>
							</div>
						</div>

						<div className="flex flex-col gap-1.5">
							<FieldLabel>E'lon rasmi</FieldLabel>
							<div className="flex items-start gap-3">
								<div className="w-24 h-24 rounded-xl overflow-hidden border border-border bg-surface-secondary flex items-center justify-center shrink-0">
									{ef.image ? (
										<img src={ef.image} alt="E'lon rasmi" className="w-full h-full object-cover" />
									) : (
										<ImageIcon size={20} className="text-text-muted" />
									)}
								</div>
								<div className="flex-1 flex flex-col gap-2">
									<label className="py-2 px-3 rounded-xl border border-border bg-surface-secondary text-[11px] font-black text-text-primary text-center cursor-pointer hover:bg-surface-tertiary transition-colors">
										{uploading ? 'Yuklanmoqda...' : 'Galeriyadan rasm yuklash'}
										<input
											type="file"
											accept="image/*"
											className="hidden"
											disabled={uploading}
											onChange={(e) => {
												const file = e.target.files?.[0];
												e.target.value = '';
												handlePickImage(file);
											}}
										/>
									</label>
									<input
										type="text"
										value={ef.image}
										onChange={(e) => sef('image', e.target.value)}
										placeholder="yoki rasm havolasini kiriting (https://...)"
										className={inputClass}
									/>
									{ef.image && (
										<button
											type="button"
											onClick={() => sef('image', '')}
											className="self-start text-[11px] font-black text-rose-500 hover:underline cursor-pointer flex items-center gap-1"
										>
											<X size={11} /> Rasmni olib tashlash
										</button>
									)}
									{uploadError && (
										<p className="text-[11px] font-bold text-rose-500">{uploadError}</p>
									)}
								</div>
							</div>
						</div>

						<div className="flex gap-2 mt-1">
							<PrimaryButton type="submit" className="flex-1">
								<Plus size={14} />
								{ef.editingId ? "O'zgarishlarni saqlash" : "E'lonni joylash"}
							</PrimaryButton>
							{ef.editingId && (
								<GhostButton type="button" onClick={handlers.handleCancelEditEnterpriseOrder}>
									Bekor qilish
								</GhostButton>
							)}
						</div>
					</form>
				</Card>

				<Card className="p-5 flex flex-col gap-4">
					<SectionHeader
						title="Joylangan e'lonlar"
						subtitle={`Jami ${enterpriseOrders.length} ta`}
					/>

					{enterpriseOrders.length === 0 ? (
						<EmptyState
							icon={Building2}
							title="Hozircha e'lon yo'q"
							subtitle="Chapdagi shakl orqali birinchi korxona buyurtmasini joylang"
						/>
					) : (
						<div className="flex flex-col gap-3 max-h-[640px] overflow-y-auto pr-1 no-scrollbar">
							{enterpriseOrders.map((order) => (
								<div
									key={order.id}
									className="rounded-2xl border border-border bg-surface-secondary/50 overflow-hidden"
								>
									{order.image && (
										<img
											src={order.image}
											alt={order.title}
											className="w-full h-28 object-cover"
											referrerPolicy="no-referrer"
										/>
									)}
									<div className="p-3.5 flex flex-col gap-2">
										<div className="flex items-start justify-between gap-2">
											<div className="min-w-0">
												<h5 className="text-xs font-black text-text-primary truncate">
													{order.title}
												</h5>
												<span className="text-[11px] font-bold text-text-muted flex items-center gap-1 mt-0.5">
													<Building2 size={11} /> {order.companyName}
												</span>
											</div>
											<Badge
												variant={order.isActive ? 'success' : 'neutral'}
												className="shrink-0"
											>
												{order.isActive ? "E'lon qilingan" : 'Yashirilgan'}
											</Badge>
										</div>

										<p className="text-[11px] font-medium text-text-muted leading-relaxed line-clamp-3 whitespace-pre-line">
											{order.description}
										</p>

										<div className="flex flex-wrap items-center gap-2 text-[11px] font-bold text-text-muted">
											<span className="flex items-center gap-1 text-text-primary">
												<Phone size={11} /> {order.phone}
											</span>
											{order.categoryName && <span>• {order.categoryName}</span>}
											{(order.region || order.district) && (
												<span className="flex items-center gap-1">
													<MapPin size={11} />
													{[order.region, order.district].filter(Boolean).join(', ')}
												</span>
											)}
										</div>

										<div className="flex gap-2 mt-1">
											<GhostButton
												className="flex-1 flex items-center justify-center gap-1"
												onClick={() => handlers.handleEditEnterpriseOrder(order)}
											>
												<Pencil size={12} /> Tahrirlash
											</GhostButton>
											<GhostButton
												className="flex items-center justify-center gap-1"
												onClick={() => handlers.handleToggleEnterpriseOrder(order)}
											>
												{order.isActive ? <EyeOff size={12} /> : <Eye size={12} />}
												{order.isActive ? 'Yashirish' : "E'lon qilish"}
											</GhostButton>
											<button
												onClick={() => handlers.handleDeleteEnterpriseOrder(order.id)}
												className="p-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer shrink-0"
												title="E'lonni o'chirish"
											>
												<Trash2 size={13} />
											</button>
										</div>
									</div>
								</div>
							))}
						</div>
					)}
				</Card>
			</div>
		</div>
	);
}
