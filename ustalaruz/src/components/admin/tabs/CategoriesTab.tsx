import { useState } from 'react';
import { Layers, Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { Card, SectionHeader, Badge, PrimaryButton, GradientPageHeader, EmptyState, inputClass, FieldLabel } from '../AdminUI';
import type { AdminData } from '../useAdminData';

export default function CategoriesTab({ data }: { data: AdminData }) {
	const { categories, handlers } = data;
	const [formOpen, setFormOpen] = useState(false);
	const [id, setId] = useState('');
	const [name, setName] = useState('');
	const [color, setColor] = useState('');
	const [image, setImage] = useState('');

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!id.trim() || !name.trim()) return;
		await handlers.handleCreateCategory({ id: id.trim(), name: name.trim(), color: color.trim(), image: image.trim() });
		setId('');
		setName('');
		setColor('');
		setImage('');
		setFormOpen(false);
	};

	return (
		<div className="flex flex-col gap-6 text-left">
			<GradientPageHeader
				icon={Layers}
				title="Kategoriyalar Boshqaruvi"
				subtitle="Platformadagi xizmat kategoriyalarini qo'shish, tahrirlash va faollik holatini boshqarish"
				badge="🗂️ Kategoriyalar"
				tone="slate"
			/>

			<Card className="p-5">
				<div className="flex justify-between items-center mb-4 flex-wrap gap-2">
					<SectionHeader title="Barcha kategoriyalar" subtitle={`Jami ${categories.length} ta`} />
					<PrimaryButton onClick={() => setFormOpen((v) => !v)}>
						<Plus size={14} /> Yangi kategoriya
					</PrimaryButton>
				</div>

				{formOpen && (
					<form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-5 p-4 bg-surface-secondary rounded-xl border border-border">
						<div className="flex flex-col gap-1">
							<FieldLabel>ID (slug)</FieldLabel>
							<input className={inputClass} value={id} onChange={(e) => setId(e.target.value)} placeholder="masalan: santexnik" required />
						</div>
						<div className="flex flex-col gap-1">
							<FieldLabel>Nomi</FieldLabel>
							<input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required />
						</div>
						<div className="flex flex-col gap-1">
							<FieldLabel>Rang (ixtiyoriy)</FieldLabel>
							<input className={inputClass} value={color} onChange={(e) => setColor(e.target.value)} placeholder="#3B82F6" />
						</div>
						<div className="flex flex-col gap-1">
							<FieldLabel>Rasm URL (ixtiyoriy)</FieldLabel>
							<input className={inputClass} value={image} onChange={(e) => setImage(e.target.value)} />
						</div>
						<div className="sm:col-span-4">
							<PrimaryButton type="submit">Saqlash</PrimaryButton>
						</div>
					</form>
				)}

				{categories.length === 0 ? (
					<EmptyState icon={Layers} title="Kategoriya topilmadi" />
				) : (
					<div className="overflow-x-auto">
						<table className="w-full text-left border-collapse min-w-[640px]">
							<thead>
								<tr className="bg-surface-secondary border-b border-border text-[11px] uppercase font-black text-text-muted tracking-wider">
									<th className="py-3 px-5">Nomi</th>
									<th className="py-3 px-5">ID</th>
									<th className="py-3 px-5">Tartib</th>
									<th className="py-3 px-5">Holat</th>
									<th className="py-3 px-5 text-right">Harakatlar</th>
								</tr>
							</thead>
							<tbody>
								{categories.map((cat) => (
									<tr key={cat.id} className="border-b border-border/60 text-xs hover:bg-surface-secondary/50 transition-colors">
										<td className="py-3.5 px-5 font-black text-text-secondary flex items-center gap-2">
											{cat.color && <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />}
											{cat.name}
										</td>
										<td className="py-3.5 px-5 font-mono text-text-muted">{cat.id}</td>
										<td className="py-3.5 px-5 text-text-muted font-semibold">
											<input
												type="number"
												defaultValue={cat.sortOrder}
												onBlur={(e) => {
													const v = Number(e.target.value);
													if (v !== cat.sortOrder) handlers.handleUpdateCategory(cat.id, { sortOrder: v });
												}}
												className="w-16 bg-surface-secondary border border-border rounded-lg px-2 py-1 text-xs outline-none focus:border-brand"
											/>
										</td>
										<td className="py-3.5 px-5">
											<Badge variant={cat.isActive ? 'success' : 'neutral'}>{cat.isActive ? 'Faol' : 'Nofaol'}</Badge>
										</td>
										<td className="py-3.5 px-5">
											<div className="flex items-center gap-2 justify-end">
												<button
													onClick={() => handlers.handleUpdateCategory(cat.id, { isActive: !cat.isActive })}
													className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors cursor-pointer"
													title={cat.isActive ? 'Nofaollashtirish' : 'Faollashtirish'}
												>
													{cat.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
												</button>
												<button
													onClick={() => handlers.handleDeleteCategory(cat.id)}
													className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors cursor-pointer"
													title="O'chirish"
												>
													<Trash2 size={14} />
												</button>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</Card>
		</div>
	);
}
