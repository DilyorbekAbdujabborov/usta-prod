import { WifiOff } from 'lucide-react';
import { useEffect, useState } from 'react';

// Non-blocking - cached tabs still work offline via the service worker, so
// this only informs rather than taking over the screen like the other
// error pages do.
export default function OfflineBanner() {
	const [isOffline, setIsOffline] = useState(
		typeof navigator !== 'undefined' && !navigator.onLine
	);

	useEffect(() => {
		const goOffline = () => setIsOffline(true);
		const goOnline = () => setIsOffline(false);
		window.addEventListener('offline', goOffline);
		window.addEventListener('online', goOnline);
		return () => {
			window.removeEventListener('offline', goOffline);
			window.removeEventListener('online', goOnline);
		};
	}, []);

	if (!isOffline) return null;

	return (
		<div className="fixed top-0 inset-x-0 z-[60] h-8 bg-amber-500 text-white text-xs font-bold px-4 flex items-center justify-center gap-2 shadow-md">
			<WifiOff size={14} className="shrink-0" />
			<span className="truncate">Internet aloqasi yo'q — ba'zi ma'lumotlar yangilanmasligi mumkin</span>
		</div>
	);
}
