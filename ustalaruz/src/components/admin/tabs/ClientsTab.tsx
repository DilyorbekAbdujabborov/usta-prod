import { useState } from 'react';
import { Lock, Unlock, Trash2, Bell } from 'lucide-react';
import { Card, SectionHeader, SearchInput, Badge } from '../AdminUI';
import SendPushModal from '../SendPushModal';
import type { AdminData } from '../useAdminData';

export default function ClientsTab({ data }: { data: AdminData }) {
	const { clients, handlers } = data;
	const [searchQuery, setSearchQuery] = useState('');
	const [pushTarget, setPushTarget] = useState<{ id: string | number; name: string } | null>(null);

	const filtered = clients.filter((c) =>
		c.name.toLowerCase().includes(searchQuery.toLowerCase())
	);

	return (
		<div className="flex flex-col gap-6">
			<SectionHeader
				title="Mijozlar (Foydalanuvchilar) Boshqaruvi"
				subtitle="Ro'yxatdan o'tgan barcha mijozlar, ularni bloklash yoki butunlay o'chirish"
				right={
					<SearchInput
						value={searchQuery}
						onChange={setSearchQuery}
						placeholder="Mijozlar ismini qidirish..."
						className="w-64"
					/>
				}
			/>

			<Card className="overflow-hidden">
				<div className="overflow-x-auto">
					<table className="w-full text-left border-collapse min-w-[640px]">
						<thead>
							<tr className="bg-surface-secondary border-b border-border text-[11px] uppercase font-black text-text-muted tracking-wider">
								<th className="py-3 px-5">Mijoz ismi</th>
								<th className="py-3 px-5">Telefon raqami</th>
								<th className="py-3 px-5">Ro'yxatdan o'tgan</th>
								<th className="py-3 px-5">Buyurtmalar</th>
								<th className="py-3 px-5">Holat</th>
								<th className="py-3 px-5 text-right">Harakatlar</th>
							</tr>
						</thead>
						<tbody>
							{filtered.map((client) => (
								<tr
									key={client.id}
									className="border-b border-border/60 text-xs hover:bg-surface-secondary/50 transition-colors"
								>
									<td className="py-3.5 px-5 font-black text-text-secondary">{client.name}</td>
									<td className="py-3.5 px-5 font-mono text-text-primary font-black">
										{client.phone}
									</td>
									<td className="py-3.5 px-5 text-text-muted font-semibold">
										{client.registeredAt}
									</td>
									<td className="py-3.5 px-5 font-bold text-text-secondary">
										{client.completedOrdersCount} ta
									</td>
									<td className="py-3.5 px-5">
										<Badge variant={client.status === 'active' ? 'success' : 'danger'}>
											{client.status === 'active' ? 'Faol' : 'Bloklangan'}
										</Badge>
									</td>
									<td className="py-3.5 px-5 text-right">
										<div className="flex gap-2 justify-end">
											<button
												onClick={() => setPushTarget({ id: client.id, name: client.name })}
												className="p-1.5 rounded-lg transition-colors cursor-pointer bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20"
												title="Bildirishnoma yuborish"
											>
												<Bell size={14} />
											</button>
											<button
												onClick={() => handlers.handleToggleClientBlock(client.id)}
												className={
													client.status === 'active'
														? 'p-1.5 rounded-lg transition-colors cursor-pointer bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/20'
														: 'p-1.5 rounded-lg transition-colors cursor-pointer bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20'
												}
												title={client.status === 'active' ? 'Bloklash' : 'Faollashtirish'}
											>
												{client.status === 'active' ? <Lock size={14} /> : <Unlock size={14} />}
											</button>
											<button
												onClick={() => handlers.handleDeleteClient(client.id)}
												className="p-1.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 rounded-lg transition-colors cursor-pointer"
												title="Mijozni o'chirish"
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

				{filtered.length === 0 && (
					<div className="p-10 text-center text-xs font-bold text-text-muted">
						Hech qanday mijoz topilmadi.
					</div>
				)}
			</Card>

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
