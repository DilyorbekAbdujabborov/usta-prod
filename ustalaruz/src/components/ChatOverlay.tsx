import { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence, type Transition } from 'motion/react';
import {
	ChevronLeft, Phone, Trash2, Paperclip, Send, Check, CheckCheck, Clock,
	ChevronDown, X,
} from 'lucide-react';
import { uploadImageFile } from '../lib/uploadImage';
import { useMotionPreset } from '../lib/useMotionPreset';
import type { ChatMessage } from '../lib/api';

interface ChatPartner {
	id: number | string;
	name: string;
	avatar: string;
	phone: string;
}

interface ChatMessageExtended extends ChatMessage {
	_pending?: true;
}

interface Props {
	chatMaster: ChatPartner | null;
	activeChatMessages: ChatMessageExtended[];
	isMasterChatMode: boolean;
	// 0 means the partner has no unread messages from me right now, i.e. they've
	// seen everything I've sent so far - drives the sent-vs-read checkmark.
	partnerUnreadCount: number;
	onClose: () => void;
	// Resolves to false when the message never reached the server - the
	// composer restores the text instead of losing what the user typed.
	onSend: (text: string) => Promise<boolean> | void;
	onDelete: () => void;
}

const MAX_TEXTAREA_LINES = 5;

// "Bugun" / "Kecha" / "24-iyul" - a bare time ("14:32") is ambiguous once a
// conversation spans more than one day, which most job-coordination threads
// do (quote today, confirm tomorrow, follow up next week).
function formatDayLabel(date: Date): string {
	const now = new Date();
	const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
	const diffDays = Math.round((startOfDay(now) - startOfDay(date)) / 86400000);
	if (diffDays === 0) return 'Bugun';
	if (diffDays === 1) return 'Kecha';
	return date.toLocaleDateString('uz-UZ', {
		day: 'numeric',
		month: 'long',
		...(date.getFullYear() !== now.getFullYear() ? { year: 'numeric' } : {}),
	});
}

function formatTime(date: Date): string {
	return date.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
}

type RenderItem =
	| { kind: 'day'; key: string; label: string }
	| { kind: 'message'; key: string | number; msg: ChatMessageExtended; grouped: boolean };

// Groups consecutive same-sender messages sent within 3 minutes of each
// other (tighter vertical rhythm) and inserts a day divider whenever the
// calendar date changes - both read straight off the message list, no
// separate bookkeeping to keep in sync.
function buildRenderItems(messages: ChatMessageExtended[]): RenderItem[] {
	const items: RenderItem[] = [];
	let lastDayKey = '';
	let lastSender: string | null = null;
	let lastTime = 0;

	for (const msg of messages) {
		const d = new Date(msg.time);
		const dayKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
		if (dayKey !== lastDayKey) {
			items.push({ kind: 'day', key: `day-${dayKey}`, label: formatDayLabel(d) });
			lastDayKey = dayKey;
			lastSender = null;
		}
		const grouped = msg.sender === lastSender && d.getTime() - lastTime < 3 * 60 * 1000;
		items.push({ kind: 'message', key: msg.id ?? `pending-${msg.time}`, msg, grouped });
		lastSender = msg.sender;
		lastTime = d.getTime();
	}
	return items;
}

export default function ChatOverlay({
	chatMaster,
	activeChatMessages,
	isMasterChatMode,
	partnerUnreadCount,
	onClose,
	onSend,
	onDelete,
}: Props) {
	const [text, setText] = useState('');
	const [sending, setSending] = useState(false);
	const [uploading, setUploading] = useState(false);
	const [uploadError, setUploadError] = useState('');
	const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
	const [showJumpToLatest, setShowJumpToLatest] = useState(false);
	const scrollRef = useRef<HTMLDivElement>(null);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const nearBottomRef = useRef(true);
	const motionPreset = useMotionPreset();
	const tween = motionPreset.tween as Transition;

	const renderItems = useMemo(() => buildRenderItems(activeChatMessages), [activeChatMessages]);

	const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
		messagesEndRef.current?.scrollIntoView({ behavior });
	};

	// Land at the bottom instantly when a conversation is opened; on new
	// messages after that, only auto-follow if the user was already near the
	// bottom - someone scrolled up reading history shouldn't get yanked back
	// down every time a message arrives.
	useEffect(() => {
		if (!chatMaster) return;
		nearBottomRef.current = true;
		setShowJumpToLatest(false);
		const t = setTimeout(() => scrollToBottom('auto'), 50);
		return () => clearTimeout(t);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [chatMaster?.id]);

	useEffect(() => {
		if (nearBottomRef.current) {
			scrollToBottom();
		} else {
			setShowJumpToLatest(true);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [activeChatMessages.length]);

	const handleScroll = () => {
		const el = scrollRef.current;
		if (!el) return;
		const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
		const atBottom = distanceFromBottom < 80;
		nearBottomRef.current = atBottom;
		if (atBottom) setShowJumpToLatest(false);
	};

	// Auto-grow the composer up to MAX_TEXTAREA_LINES, then scroll internally -
	// job details/addresses regularly run longer than one line.
	useEffect(() => {
		const el = textareaRef.current;
		if (!el) return;
		el.style.height = 'auto';
		const lineHeight = 18;
		const maxHeight = lineHeight * MAX_TEXTAREA_LINES;
		el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
	}, [text]);

	const handleSubmit = async (e?: React.FormEvent) => {
		e?.preventDefault();
		if (!text.trim() || sending) return;
		const outgoing = text;
		setSending(true);
		setText('');
		nearBottomRef.current = true;
		const ok = await onSend(outgoing);
		// `undefined` means the caller doesn't report delivery - treat it as
		// sent, same as before. Only an explicit false puts the text back.
		if (ok === false) setText((current) => (current ? current : outgoing));
		setSending(false);
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSubmit();
		}
	};

	// The upload runs before anything shows up in the thread, so without an
	// explicit uploading/failed state picking a photo looked like nothing had
	// happened at all (the old code only console.debug'd the failure).
	const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file || !chatMaster) return;
		e.target.value = '';
		setUploadError('');
		setUploading(true);
		try {
			const url = await uploadImageFile(file, 'chat');
			nearBottomRef.current = true;
			await onSend(`🖼 ${url}`);
		} catch (err) {
			console.debug('[Chat] Image upload failed:', err);
			setUploadError('Rasm yuklanmadi. Qaytadan urinib ko’ring.');
		} finally {
			setUploading(false);
		}
	};

	return (
		<AnimatePresence>
			{chatMaster && (
				<motion.div
					initial={{ x: '100%' }}
					animate={{ x: 0 }}
					exit={{ x: '100%' }}
					transition={tween}
					className="absolute inset-0 z-50 flex flex-col bg-surface"
				>
					<div className="p-3.5 bg-surface-card border-b border-border flex items-center justify-between shrink-0">
						<div className="flex items-center gap-2 min-w-0">
							<button
								onClick={onClose}
								aria-label="Orqaga"
								className="p-1.5 rounded-full text-text-secondary hover:bg-surface-tertiary cursor-pointer shrink-0"
							>
								<ChevronLeft size={20} />
							</button>
							<img
								loading="lazy"
								src={chatMaster.avatar}
								alt=""
								className="w-10 h-10 rounded-full object-cover avatar-face shrink-0"
							/>
							<div className="text-left min-w-0">
								<h4 className="text-sm font-bold text-text-primary leading-tight truncate">
									{chatMaster.name}
								</h4>
								<span className="text-[11px] text-text-secondary font-medium block mt-0.5">
									{chatMaster.phone}
								</span>
							</div>
						</div>

						<div className="flex items-center gap-1 shrink-0">
							<a
								href={`tel:${chatMaster.phone.replace(/\s+/g, '')}`}
								aria-label="Qo'ng'iroq qilish"
								title="Qo'ng'iroq qilish"
								className="p-2.5 hover:bg-surface-tertiary text-brand rounded-full cursor-pointer transition-colors"
							>
								<Phone size={16} />
							</a>
							<button
								onClick={onDelete}
								aria-label="Suhbatni o'chirish"
								title="Suhbatni o'chirish"
								className="p-2.5 hover:bg-danger-bg text-danger rounded-full cursor-pointer transition-colors"
							>
								<Trash2 size={16} />
							</button>
						</div>
					</div>

					<div className="relative flex-1 min-h-0">
						<div
							ref={scrollRef}
							onScroll={handleScroll}
							className="absolute inset-0 p-4 overflow-y-auto no-scrollbar flex flex-col bg-surface"
						>
							{renderItems.length === 0 ? (
								<div className="flex-1 flex flex-col items-center justify-center text-center gap-2 px-6">
									<div className="w-12 h-12 rounded-full bg-surface-tertiary flex items-center justify-center text-text-muted">
										<Send size={18} />
									</div>
									<p className="text-sm font-bold text-text-primary">
										Suhbat hali boshlanmagan
									</p>
									<p className="text-xs text-text-secondary font-medium max-w-[240px] leading-relaxed">
										{chatMaster.name} bilan ish tafsilotlarini muhokama qilish uchun birinchi xabarni yozing.
									</p>
								</div>
							) : (
								renderItems.map((item) => {
									if (item.kind === 'day') {
										return (
											<div key={item.key} className="flex justify-center my-3 first:mt-0">
												<span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary bg-surface-tertiary px-2.5 py-1 rounded-full">
													{item.label}
												</span>
											</div>
										);
									}
									const { msg, grouped } = item;
									const isMe = isMasterChatMode
										? msg.sender === 'master'
										: msg.sender === 'client';
									const isImage = msg.text.startsWith('🖼 ');
									const imageUrl = isImage ? msg.text.slice(2) : null;
									// Stacking "rounded-tr-md" and "rounded-tr-none" together relies
									// on Tailwind's generated CSS order, not className string order -
									// pick exactly one corner class instead of layering conflicting ones.
									const cornerClass = isMe
										? (grouped ? 'rounded-tr-md' : 'rounded-tr-none')
										: (grouped ? 'rounded-tl-md' : 'rounded-tl-none');
									return (
										<div
											key={item.key}
											className={`max-w-[80%] text-[13px] font-medium leading-relaxed flex flex-col gap-1 ${
												isMe ? 'self-end items-end' : 'self-start items-start'
											} ${grouped ? 'mt-1' : 'mt-3'}`}
										>
											<div
												className={`px-3 py-2 rounded-2xl ${cornerClass} ${
													isMe
														? 'bg-brand text-white'
														: 'bg-surface-tertiary text-text-primary'
												}`}
											>
												{isImage && imageUrl ? (
													<button
														type="button"
														onClick={() => setLightboxUrl(imageUrl)}
														className="block cursor-zoom-in"
														aria-label="Rasmni to'liq ko'rish"
													>
														<img
															src={imageUrl}
															alt="Yuborilgan rasm"
															className="max-w-full rounded-lg"
															loading="lazy"
														/>
													</button>
												) : (
													<p className="whitespace-pre-wrap break-words">{msg.text}</p>
												)}
											</div>
											<div className="flex items-center gap-1 px-1 text-[10px] text-text-secondary font-medium">
												<span>{formatTime(new Date(msg.time))}</span>
												{isMe && !msg._pending && (
													partnerUnreadCount === 0
														? <CheckCheck size={11} className="text-brand" />
														: <Check size={11} />
												)}
												{isMe && msg._pending && (
													<Clock size={11} className="text-amber-500 animate-pulse" />
												)}
											</div>
										</div>
									);
								})
							)}
							<div ref={messagesEndRef} />
						</div>

						<AnimatePresence>
							{showJumpToLatest && (
								<motion.button
									initial={{ opacity: 0, y: 8 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: 8 }}
									transition={tween}
									onClick={() => {
										nearBottomRef.current = true;
										scrollToBottom();
										setShowJumpToLatest(false);
									}}
									aria-label="Yangi xabarlarga o'tish"
									className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-surface-card border border-border shadow-sm text-text-primary text-[11px] font-bold px-3 py-1.5 rounded-full cursor-pointer"
								>
									<ChevronDown size={12} />
									Yangi xabar
								</motion.button>
							)}
						</AnimatePresence>
					</div>

					<form
						onSubmit={handleSubmit}
						className="p-2.5 border-t border-border bg-surface-card flex flex-col gap-1.5 shrink-0"
					>
						{(uploading || uploadError) && (
							<p
								className={`text-[11px] font-bold px-2 flex items-center gap-1.5 ${
									uploadError ? 'text-danger' : 'text-text-secondary'
								}`}
								role={uploadError ? 'alert' : undefined}
							>
								{uploading && (
									<span className="w-3 h-3 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
								)}
								{uploadError || 'Rasm yuklanmoqda...'}
							</p>
						)}
						<div className="flex items-end gap-2">
						<button
							type="button"
							disabled={uploading}
							onClick={() =>
								document.getElementById('chat-image-input-overlay')?.click()
							}
							aria-label="Rasm biriktirish"
							title="Rasm biriktirish"
							className="p-2.5 text-text-muted hover:text-text-secondary hover:bg-surface-tertiary rounded-full cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-default"
						>
							<Paperclip size={18} />
						</button>
						<input
							type="file"
							id="chat-image-input-overlay"
							accept="image/*"
							onChange={handleImageUpload}
							className="hidden"
						/>
						<textarea
							ref={textareaRef}
							rows={1}
							value={text}
							onChange={(e) => setText(e.target.value)}
							onKeyDown={handleKeyDown}
							placeholder="Xabar yozing..."
							className="flex-1 bg-surface-input px-4 py-2.5 rounded-2xl text-[13px] font-medium outline-none border border-border focus:border-brand transition-colors placeholder-text-muted text-text-primary resize-none no-scrollbar leading-[18px]"
						/>
						<button
							type="submit"
							disabled={!text.trim() || sending}
							aria-label="Yuborish"
							className="p-2.5 bg-brand text-white rounded-full cursor-pointer hover:bg-brand-hover transition-colors disabled:opacity-50 shrink-0"
						>
							<Send size={14} className="translate-x-[0.5px]" />
						</button>
						</div>
					</form>
				</motion.div>
			)}

			{lightboxUrl && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={tween}
					onClick={() => setLightboxUrl(null)}
					className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
				>
					<button
						onClick={() => setLightboxUrl(null)}
						aria-label="Yopish"
						className="absolute top-4 right-4 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer"
					>
						<X size={20} />
					</button>
					<img
						src={lightboxUrl}
						alt="Rasm - to'liq ko'rinish"
						onClick={(e) => e.stopPropagation()}
						className="max-w-full max-h-full rounded-lg object-contain"
					/>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
