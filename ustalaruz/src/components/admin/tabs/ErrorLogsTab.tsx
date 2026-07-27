import { useState } from 'react';
import { Bug, Search } from 'lucide-react';
import { Card, SectionHeader, SearchInput, Badge, GradientPageHeader, EmptyState } from '../AdminUI';
import type { AdminData } from '../useAdminData';

const LEVEL_BADGE: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
	error: 'danger',
	warning: 'warning',
	info: 'info',
};

export default function ErrorLogsTab({ data }: { data: AdminData }) {
	const { errorLogs } = data;
	const [searchQuery, setSearchQuery] = useState('');

	const filtered = errorLogs.filter((e) => {
		if (!searchQuery) return true;
		const q = searchQuery.toLowerCase();
		return e.message?.toLowerCase().includes(q) || e.source?.toLowerCase().includes(q) || e.url?.toLowerCase().includes(q);
	});

	return (
		<div className="flex flex-col gap-6 text-left">
			<GradientPageHeader
				icon={Bug}
				title="Frontend Xato Loglari"
				subtitle="Foydalanuvchilar brauzerida yuzaga kelgan JavaScript xatolari (so'nggi 100 tasi)"
				badge="🐛 Xato loglari"
				tone="slate"
			/>

			<Card className="p-5">
				<div className="flex justify-between items-center mb-4 flex-wrap gap-2">
					<SectionHeader title="Loglar" subtitle={`Jami ${errorLogs.length} ta`} />
					<SearchInput
						value={searchQuery}
						onChange={setSearchQuery}
						placeholder="Xabar, manba yoki url bo'yicha qidirish..."
						className="w-72"
					/>
				</div>

				{filtered.length === 0 ? (
					<EmptyState icon={Search} title="Xato topilmadi" subtitle="Bu ajoyib xabar!" />
				) : (
					<div className="overflow-x-auto">
						<table className="w-full text-left border-collapse min-w-[800px]">
							<thead>
								<tr className="bg-surface-secondary border-b border-border text-[11px] uppercase font-black text-text-muted tracking-wider">
									<th className="py-3 px-5">Daraja</th>
									<th className="py-3 px-5">Xabar</th>
									<th className="py-3 px-5">Manba</th>
									<th className="py-3 px-5">URL</th>
									<th className="py-3 px-5">Vaqt</th>
								</tr>
							</thead>
							<tbody>
								{filtered.map((log) => (
									<tr key={log.id} className="border-b border-border/60 text-xs hover:bg-surface-secondary/50 transition-colors">
										<td className="py-3.5 px-5">
											<Badge variant={LEVEL_BADGE[log.level] ?? 'neutral'}>{log.level}</Badge>
										</td>
										<td className="py-3.5 px-5 font-bold text-text-primary max-w-[320px] truncate" title={log.message}>
											{log.message}
										</td>
										<td className="py-3.5 px-5 text-text-muted font-semibold">{log.source}</td>
										<td className="py-3.5 px-5 text-text-muted font-mono text-[11px] max-w-[220px] truncate" title={log.url}>
											{log.url}
										</td>
										<td className="py-3.5 px-5 text-text-muted font-semibold whitespace-nowrap">
											{new Date(log.createdAt).toLocaleString('uz-UZ')}
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
