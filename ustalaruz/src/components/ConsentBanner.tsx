import { Cookie } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { setConsent, useConsent } from '../lib/consent';

// Shown once on first entry, on every route (landing included) - the
// analytics tag is not loaded at all until this is answered, so it has to
// come before anything else that wants the bottom of the screen (see
// NotificationBanner, which stays hidden while this is open).
export default function ConsentBanner() {
	const choice = useConsent();

	return (
		<AnimatePresence>
			{choice === null && (
				<motion.div
					initial={{ opacity: 0, y: 24 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: 24 }}
					transition={{ duration: 0.25 }}
					role="dialog"
					aria-label="Cookie va analitika roziligi"
					className="fixed bottom-4 left-4 right-4 z-[60] max-w-md mx-auto"
				>
					<div className="bg-white dark:bg-surface-card border border-border rounded-2xl shadow-xl p-4">
						<div className="flex items-start gap-3">
							<div className="w-9 h-9 rounded-full bg-brand/10 text-brand flex items-center justify-center shrink-0 mt-0.5">
								<Cookie size={16} />
							</div>
							<div className="flex-1 min-w-0">
								<h4 className="text-xs font-black text-text-primary">
									Cookie va analitika
								</h4>
								<p className="text-[10px] text-text-secondary font-bold mt-1 leading-relaxed">
									Ishlash uchun zarur cookie fayllar doim yoqiladi. Xizmatni
									yaxshilash uchun Google Analytics orqali anonim statistika
									yig'ishga ruxsat berasizmi?{' '}
									<Link
										to="/privacy"
										className="text-brand underline underline-offset-2"
									>
										Maxfiylik siyosati
									</Link>
								</p>
							</div>
						</div>
						<div className="flex items-center gap-2 mt-3">
							<button
								onClick={() => setConsent('granted')}
								className="flex-1 px-3 py-2 bg-brand hover:bg-brand-hover text-white text-[10px] font-black rounded-lg transition-all cursor-pointer active:scale-95"
							>
								Ruxsat berish
							</button>
							<button
								onClick={() => setConsent('denied')}
								className="flex-1 px-3 py-2 border border-border text-text-secondary hover:text-text-primary text-[10px] font-black rounded-lg transition-all cursor-pointer active:scale-95"
							>
								Faqat zarurlari
							</button>
						</div>
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
