import { AlertTriangle } from 'lucide-react';

// Shown when the app's own API is unreachable while the device otherwise has
// a network connection (OfflineBanner already covers the fully-offline
// case) - a CORS misconfig, a down backend, or a broken deploy all look the
// same to the user without this: requests just silently fail one by one.
export default function BackendStatusMarquee() {
	if (typeof navigator !== 'undefined' && !navigator.onLine) return null;

	const message =
		"Serverga ulanib bo'lmadi — internet aloqangiz bor, lekin Master Group serverlari javob bermayapti. Bir necha soniyada avtomatik qayta urinilmoqda…";

	return (
		<div className="fixed top-0 inset-x-0 z-[70] h-8 bg-red-600 text-white text-xs font-bold overflow-hidden flex items-center gap-2 shadow-md">
			<AlertTriangle size={14} className="shrink-0 ml-3" />
			<div className="marquee-track flex-1 overflow-hidden">
				<div className="marquee-content">
					<span>{message}</span>
					<span aria-hidden="true">{message}</span>
				</div>
			</div>
		</div>
	);
}
