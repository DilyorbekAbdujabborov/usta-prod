import { useState } from 'react';
import { MessagesSquare, Phone, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, SectionHeader, SearchInput, Badge, GradientPageHeader, EmptyState } from '../AdminUI';
import type { AdminData } from '../useAdminData';

export default function ConversationsTab({ data }: { data: AdminData }) {
	const { adminConversations } = data;
	const [searchQuery, setSearchQuery] = useState('');
	const [expandedId, setExpandedId] = useState<number | null>(null);

	const filtered = adminConversations.filter((c) => {
		if (!searchQuery) return true;
		const q = searchQuery.toLowerCase();
		return (
			c.client.name.toLowerCase().includes(q) ||
			c.master.name.toLowerCase().includes(q) ||
			c.client.phone.includes(q) ||
			c.master.phone.includes(q)
		);
	});

	return (
		<div className="flex flex-col gap-6 text-left">
			<GradientPageHeader
				icon={MessagesSquare}
				title="Suhbatlar Moderatsiyasi"
				subtitle="Mijoz va usta o'rtasidagi barcha yozishmalarni ko'rish (faqat kuzatish uchun)"
				badge="💬 Suhbatlar"
				tone="slate"
			/>

			<Card className="p-5">
				<div className="flex justify-between items-center mb-4 flex-wrap gap-2">
					<SectionHeader title="Barcha suhbatlar" subtitle={`Jami ${adminConversations.length} ta`} />
					<SearchInput
						value={searchQuery}
						onChange={setSearchQuery}
						placeholder="Mijoz yoki usta bo'yicha qidirish..."
						className="w-72"
					/>
				</div>

				{filtered.length === 0 ? (
					<EmptyState icon={MessagesSquare} title="Suhbat topilmadi" />
				) : (
					<div className="flex flex-col gap-2">
						{filtered.map((conv) => {
							const isOpen = expandedId === conv.id;
							return (
								<div key={conv.id} className="border border-border rounded-xl overflow-hidden">
									<button
										onClick={() => setExpandedId(isOpen ? null : conv.id)}
										className="w-full flex items-center justify-between gap-3 p-3.5 text-xs hover:bg-surface-secondary/50 transition-colors cursor-pointer"
									>
										<div className="flex items-center gap-4 flex-wrap text-left">
											<span className="font-black text-text-primary">{conv.client.name}</span>
											<span className="text-text-muted">↔</span>
											<span className="font-black text-brand">{conv.master.name}</span>
											<span className="flex items-center gap-1 text-text-muted font-semibold">
												<Phone size={10} /> {conv.client.phone}
											</span>
										</div>
										<div className="flex items-center gap-3 shrink-0">
											{(conv.clientUnreadCount + conv.masterUnreadCount) > 0 && <Badge variant="warning">{conv.clientUnreadCount + conv.masterUnreadCount} o'qilmagan</Badge>}
											<span className="text-text-muted font-semibold">{conv.messages.length} xabar</span>
											{isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
										</div>
									</button>
									{isOpen && (
										<div className="border-t border-border p-3.5 bg-surface-secondary/40 flex flex-col gap-2 max-h-80 overflow-y-auto">
											{conv.messages.length === 0 ? (
												<span className="text-[11px] text-text-muted italic">Xabarlar yo'q</span>
											) : (
												conv.messages.map((m, idx) => (
													<div
														key={idx}
														className={`max-w-[75%] px-3 py-2 rounded-xl text-xs font-medium ${
															m.sender === 'client'
																? 'self-start bg-surface-card border border-border text-text-primary'
																: 'self-end bg-brand text-white'
														}`}
													>
														<div className="text-[9px] uppercase font-black opacity-70 mb-0.5">
															{m.sender === 'client' ? conv.client.name : conv.master.name}
														</div>
														{m.text}
														<div className="text-[9px] opacity-60 mt-1">{new Date(m.time).toLocaleString('uz-UZ')}</div>
													</div>
												))
											)}
										</div>
									)}
								</div>
							);
						})}
					</div>
				)}
			</Card>
		</div>
	);
}
