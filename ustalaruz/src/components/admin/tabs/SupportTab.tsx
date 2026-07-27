import { Send, Check } from 'lucide-react';
import { Card, cx } from '../AdminUI';
import type { AdminData } from '../useAdminData';

export default function SupportTab({ data }: { data: AdminData }) {
	const { tickets, selectedTicketId, setSelectedTicketId, replyText, setReplyText, handlers } = data;

	const ticket = tickets.find((t) => t.id === selectedTicketId);

	return (
		<div className="flex flex-col gap-6">
			<Card className="p-5 flex justify-between items-center flex-wrap gap-3">
				<div>
					<h3 className="text-sm font-black text-text-primary">
						Mijozlar va Ustalar bilan muloqot tizimi
					</h3>
					<p className="text-[11px] text-text-muted font-bold mt-0.5">
						Yordam so'ragan platforma a'zolariga xizmat ko'rsatish paneli
					</p>
				</div>
				<span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-black uppercase rounded-full tracking-wide">
					● Tizim onlayn
				</span>
			</Card>

			<Card className="grid grid-cols-1 lg:grid-cols-3 h-[500px] overflow-hidden">
				{/* Ticket list */}
				<div className="lg:col-span-1 border-r border-border overflow-y-auto">
					<div className="p-4 bg-surface-secondary font-black text-[11px] text-text-muted uppercase tracking-wider border-b border-border">
						Ochiq suhbatlar ({tickets.filter((t) => t.status === 'open').length})
					</div>

					<div className="flex flex-col">
						{tickets.map((t) => (
							<button
								key={t.id}
								onClick={() => setSelectedTicketId(t.id)}
								className={cx(
									'p-4 text-left border-b border-border/60 flex flex-col gap-1 transition-all cursor-pointer',
									selectedTicketId === t.id
										? 'bg-emerald-50/40 dark:bg-emerald-500/10 text-text-primary border-l-4 border-l-[#0E5A3C]'
										: 'hover:bg-surface-secondary/50 text-text-secondary'
								)}
							>
								<div className="flex justify-between items-center">
									<h4 className="text-xs font-black truncate">{t.userName}</h4>
									<span
										className={cx(
											'text-[11px] px-1.5 py-0.5 rounded font-black shrink-0 ml-2',
											t.userRole === 'Usta'
												? 'bg-[#0E5A3C]/10 text-[#0E5A3C] dark:text-emerald-400'
												: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
										)}
									>
										{t.userRole}
									</span>
								</div>
								<p className="text-[11px] font-bold text-text-muted truncate mt-1">
									{t.lastMessage}
								</p>
								<span className="text-[11px] text-text-muted font-bold text-right block mt-1">
									{t.updatedAt}
								</span>
							</button>
						))}

						{tickets.length === 0 && (
							<p className="p-4 text-[11px] font-bold text-text-muted text-center">
								Hozircha murojaatlar yo'q.
							</p>
						)}
					</div>
				</div>

				{/* Chat panel */}
				<div className="lg:col-span-2 flex flex-col justify-between bg-surface-secondary/20">
					{!ticket ? (
						<div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
							<p className="text-xs text-text-muted font-bold">
								Muloqotni boshlash uchun chapdan suhbatni tanlang.
							</p>
						</div>
					) : (
						<>
							<div className="p-4 bg-surface-card border-b border-border flex justify-between items-center shrink-0">
								<div>
									<h4 className="text-xs font-black text-text-primary">
										{ticket.userName} ({ticket.userRole})
									</h4>
									<span className="text-[11px] text-text-muted font-bold block mt-0.5">
										Suhbat ID: {ticket.id}
									</span>
								</div>

								<button
									onClick={() => handlers.handleResolveTicket(ticket.id)}
									className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-black transition-all cursor-pointer flex items-center gap-1"
								>
									<Check size={11} />
									Murojaatni yopish
								</button>
							</div>

							<div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3.5 no-scrollbar">
								{ticket.messages.map((msg, idx) => (
									<div
										key={idx}
										className={cx(
											'max-w-[75%] rounded-2xl p-3.5 text-xs font-semibold relative',
											msg.sender === 'admin'
												? 'bg-brand text-white self-end rounded-tr-none'
												: 'bg-surface-card text-text-secondary border border-border self-start rounded-tl-none'
										)}
									>
										<p>{msg.text}</p>
										<span
											className={cx(
												'text-[11px] font-bold block mt-1 text-right',
												msg.sender === 'admin' ? 'text-white/60' : 'text-text-muted'
											)}
										>
											{msg.time}
										</span>
									</div>
								))}
							</div>

							<div className="p-3 bg-surface-card border-t border-border flex gap-2 shrink-0">
								<input
									type="text"
									value={replyText}
									onChange={(e) => setReplyText(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === 'Enter') handlers.handleSendReply();
									}}
									placeholder="Mijozga javob yozing..."
									className="flex-1 p-2.5 border border-border rounded-xl text-xs outline-none focus:border-[#0E5A3C] transition-all font-semibold bg-surface-input text-text-primary"
								/>
								<button
									onClick={handlers.handleSendReply}
									className="p-2.5 bg-brand hover:bg-brand-hover text-white rounded-xl transition-all cursor-pointer flex items-center justify-center"
								>
									<Send size={15} />
								</button>
							</div>
						</>
					)}
				</div>
			</Card>
		</div>
	);
}
