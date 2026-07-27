import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Bell } from 'lucide-react';
import { inputClass, FieldLabel } from './AdminUI';
import { useApi } from '../../lib/api';

export default function SendPushModal({
	userId,
	userName,
	onClose,
}: {
	userId: string | number;
	userName: string;
	onClose: () => void;
}) {
	const api = useApi();
	const [title, setTitle] = useState('');
	const [body, setBody] = useState('');
	const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
	const [message, setMessage] = useState('');

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setStatus('sending');
		try {
			const res = await api.sendPush({ userId }, title, body);
			setStatus('sent');
			setMessage(
				res.sent
					? 'Xabar muvaffaqiyatli yuborildi.'
					: "Bildirishnomalar ro'yxatiga qo'shildi, lekin push yetkazilmadi (foydalanuvchida faol obuna yo'q)."
			);
		} catch (err) {
			setStatus('error');
			setMessage(err instanceof Error ? err.message : 'Xatolik yuz berdi');
		}
	};

	return (
		<AnimatePresence>
			<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
				<div className="absolute inset-0" onClick={onClose} />
				<motion.div
					initial={{ opacity: 0, scale: 0.95, y: 20 }}
					animate={{ opacity: 1, scale: 1, y: 0 }}
					exit={{ opacity: 0, scale: 0.95, y: 20 }}
					className="w-full max-w-md bg-surface-card rounded-xl p-6 shadow-2xl relative z-10 text-left border border-border flex flex-col gap-4"
				>
					<div className="flex justify-between items-center pb-2 border-b border-dashed border-border text-text-primary">
						<h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
							<Bell size={16} className="text-brand" />
							{userName}ga xabar yuborish
						</h3>
						<button
							onClick={onClose}
							className="p-1 rounded-lg text-text-muted hover:bg-surface-tertiary cursor-pointer"
						>
							<X size={16} />
						</button>
					</div>

					{status === 'sent' ? (
						<div className="flex flex-col gap-2 py-4 text-center">
							<p className="text-sm font-bold text-text-primary">{message}</p>
							<button
								onClick={onClose}
								className="mt-2 text-xs font-black text-brand hover:underline cursor-pointer"
							>
								Yopish
							</button>
						</div>
					) : (
						<form onSubmit={handleSubmit} className="flex flex-col gap-4">
							<div className="flex flex-col gap-1">
								<FieldLabel>Sarlavha</FieldLabel>
								<input
									className={inputClass}
									value={title}
									onChange={(e) => setTitle(e.target.value)}
									required
									maxLength={100}
									placeholder="Masalan: Shartnoma tasdiqlandi"
								/>
							</div>
							<div className="flex flex-col gap-1">
								<FieldLabel>Matn</FieldLabel>
								<textarea
									className={inputClass}
									value={body}
									onChange={(e) => setBody(e.target.value)}
									required
									rows={3}
									maxLength={500}
								/>
							</div>
							{status === 'error' && <p className="text-xs font-bold text-red-500">{message}</p>}
							<button
								type="submit"
								disabled={status === 'sending'}
								className="bg-brand hover:opacity-90 text-white text-xs font-black px-4 py-2.5 rounded-xl cursor-pointer flex items-center justify-center gap-1.5 transition-all disabled:opacity-60"
							>
								<Send size={14} />
								{status === 'sending' ? 'Yuborilmoqda...' : 'Yuborish'}
							</button>
						</form>
					)}
				</motion.div>
			</div>
		</AnimatePresence>
	);
}
