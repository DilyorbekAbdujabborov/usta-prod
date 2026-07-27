import { useState } from 'react';
import { BellRing, Send, Smartphone, Users, Wrench, Globe } from 'lucide-react';
import { Card, SectionHeader, StatCard, GradientPageHeader, inputClass, FieldLabel } from '../AdminUI';
import type { AdminData } from '../useAdminData';

type Role = 'client' | 'master' | 'all';

export default function NotificationsTab({ data }: { data: AdminData }) {
	const { pushDevices, handlers } = data;
	const [role, setRole] = useState<Role>('all');
	const [title, setTitle] = useState('');
	const [body, setBody] = useState('');
	const [sending, setSending] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setSending(true);
		try {
			await handlers.handleBroadcastPush(role, title, body);
			setTitle('');
			setBody('');
		} catch {
			// toast already shown by the handler
		} finally {
			setSending(false);
		}
	};

	const roleOptions: { value: Role; label: string; icon: typeof Users }[] = [
		{ value: 'all', label: 'Barchaga', icon: Globe },
		{ value: 'client', label: 'Faqat mijozlarga', icon: Users },
		{ value: 'master', label: 'Faqat ustalarga', icon: Wrench },
	];

	return (
		<div className="flex flex-col gap-6 text-left">
			<GradientPageHeader
				icon={BellRing}
				title="Ommaviy Bildirishnomalar"
				subtitle="Tanlangan guruhga push xabar yuborish va obunalar holatini kuzatish"
				badge="📣 Broadcast"
				tone="slate"
			/>

			<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<StatCard icon={Smartphone} label="Faol obunalar" value={`${pushDevices.totalActive} ta`} accent="emerald" />
				<StatCard icon={Smartphone} label="O'lik obunalar" value={`${pushDevices.totalInactive} ta`} sub="Eskirgan/qayta obuna bo'lishi kerak" accent="rose" />
			</div>

			<Card className="p-5">
				<SectionHeader title="Ommaviy xabar yuborish" subtitle="Push va /api/notifications ro'yxatiga birga qo'shiladi" />
				<form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
					<div className="flex gap-2 flex-wrap">
						{roleOptions.map((opt) => {
							const Icon = opt.icon;
							const active = role === opt.value;
							return (
								<button
									key={opt.value}
									type="button"
									onClick={() => setRole(opt.value)}
									className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer border ${
										active
											? 'bg-brand text-white border-brand'
											: 'bg-surface-secondary text-text-secondary border-border hover:bg-surface-tertiary'
									}`}
								>
									<Icon size={13} /> {opt.label}
								</button>
							);
						})}
					</div>
					<div className="flex flex-col gap-1">
						<FieldLabel>Sarlavha</FieldLabel>
						<input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={100} />
					</div>
					<div className="flex flex-col gap-1">
						<FieldLabel>Matn</FieldLabel>
						<textarea className={inputClass} value={body} onChange={(e) => setBody(e.target.value)} required rows={3} maxLength={500} />
					</div>
					<button
						type="submit"
						disabled={sending}
						className="self-start bg-brand hover:opacity-90 text-white text-xs font-black px-4 py-2.5 rounded-xl cursor-pointer flex items-center justify-center gap-1.5 transition-all disabled:opacity-60"
					>
						<Send size={14} /> {sending ? 'Yuborilmoqda...' : 'Yuborish'}
					</button>
				</form>
			</Card>

			<Card className="p-5">
				<SectionHeader title="Push obunalar" subtitle={`So'nggi ${pushDevices.devices.length} ta yozuv`} />
				{pushDevices.devices.length === 0 ? (
					<p className="text-xs text-text-muted font-bold mt-3">Hali obunalar yo'q.</p>
				) : (
					<div className="overflow-x-auto mt-3">
						<table className="w-full text-left border-collapse min-w-[600px]">
							<thead>
								<tr className="bg-surface-secondary border-b border-border text-[11px] uppercase font-black text-text-muted tracking-wider">
									<th className="py-3 px-5">Foydalanuvchi</th>
									<th className="py-3 px-5">Brauzer</th>
									<th className="py-3 px-5">Holat</th>
									<th className="py-3 px-5">Sana</th>
								</tr>
							</thead>
							<tbody>
								{pushDevices.devices.map((d) => (
									<tr key={d.id} className="border-b border-border/60 text-xs hover:bg-surface-secondary/50 transition-colors">
										<td className="py-3 px-5">
											<div className="font-bold text-text-primary">{d.userName}</div>
											<div className="text-text-muted font-mono text-[11px]">{d.userPhone}</div>
										</td>
										<td className="py-3 px-5 text-text-muted font-semibold">{d.browser || '—'}</td>
										<td className="py-3 px-5">
											<span className={`text-[11px] font-black px-2 py-0.5 rounded-full ${d.active ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400' : 'bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-400'}`}>
												{d.active ? 'Faol' : "O'lik"}
											</span>
										</td>
										<td className="py-3 px-5 text-text-muted font-semibold whitespace-nowrap">
											{d.dateCreated ? new Date(d.dateCreated).toLocaleDateString('uz-UZ') : '—'}
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
