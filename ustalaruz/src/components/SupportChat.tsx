import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, HelpCircle, CheckCheck, Send } from 'lucide-react';
import type { Ticket } from '../lib/api';

interface Props {
	open: boolean;
	myTicket: Ticket | null;
	onClose: () => void;
	onSend: (text: string) => void;
}

export default function SupportChat({ open, myTicket, onClose, onSend }: Props) {
	const [text, setText] = useState('');

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!text.trim()) return;
		onSend(text);
		setText('');
	};

	return (
		<AnimatePresence>
			{open && (
				<motion.div
					initial={{ x: '100%' }}
					animate={{ x: 0 }}
					exit={{ x: '100%' }}
					transition={{ type: 'spring', damping: 26, stiffness: 220 }}
					className="absolute inset-0 z-50 flex flex-col bg-surface"
				>
					<div className="p-3.5 bg-surface-card border-b border-border flex items-center gap-2 shadow-sm shrink-0">
						<button
							onClick={onClose}
							className="p-1.5 rounded-full text-text-secondary hover:bg-surface-tertiary cursor-pointer"
						>
							<ChevronLeft size={20} />
						</button>
						<div className="w-10 h-10 rounded-full bg-brand flex items-center justify-center shrink-0">
							<HelpCircle size={20} className="text-brand-text" />
						</div>
						<div className="text-left">
							<h4 className="text-xs font-black text-text-primary leading-tight">
								Master Group Qo'llab-quvvatlash
							</h4>
							<span className="text-[9px] text-brand font-bold block mt-0.5">
								{myTicket?.status === 'resolved'
									? 'Murojaat yopilgan'
									: 'Odatda tez javob beramiz'}
							</span>
						</div>
					</div>

					<div className="flex-1 p-4 overflow-y-auto no-scrollbar flex flex-col gap-3 pb-24 bg-surface">
						{!myTicket?.messages.length && (
							<div className="text-center py-12 px-4">
								<HelpCircle
									className="mx-auto text-text-muted mb-2"
									size={32}
								/>
								<p className="text-[11px] text-text-secondary font-bold">
									Savolingizni pastdan yozing, tez orada javob beramiz.
								</p>
							</div>
						)}
						{myTicket?.messages.map((msg, idx) => (
							<div
								key={idx}
								className={`max-w-[80%] p-2.5 rounded-2xl text-xs font-bold leading-relaxed relative flex flex-col gap-1 ${
									msg.sender === 'user'
										? 'bg-brand-light text-text-primary self-end rounded-tr-none shadow-sm border border-brand-light'
										: 'bg-surface-tertiary text-text-primary self-start rounded-tl-none shadow-sm border border-border'
								}`}
							>
								<p className="pr-12">{msg.text}</p>
								<div className="absolute bottom-1 right-2 flex items-center gap-0.5 opacity-60 text-[9px]">
									<span>
										{new Date(msg.createdAt).toLocaleTimeString('uz-UZ', {
											hour: '2-digit',
											minute: '2-digit',
										})}
									</span>
									{msg.sender === 'user' && (
										<CheckCheck size={11} className="text-text-secondary" />
									)}
								</div>
							</div>
						))}
					</div>

					<form
						onSubmit={handleSubmit}
						className="p-2.5 border-t border-border bg-surface-card flex items-center gap-2 shrink-0"
					>
						<input
							type="text"
							value={text}
							onChange={(e) => setText(e.target.value)}
							placeholder="Xabar yozing..."
							className="flex-1 bg-surface-input px-4 py-2.5 rounded-full text-xs font-bold outline-none border-none placeholder-text-muted text-text-primary"
						/>
						<button
							type="submit"
							disabled={!text.trim()}
							className="p-2.5 bg-brand text-white rounded-full cursor-pointer hover:bg-brand-hover transition-colors shadow-md disabled:opacity-50"
						>
							<Send size={14} className="translate-x-[0.5px]" />
						</button>
					</form>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
