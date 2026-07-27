import { LogIn } from 'lucide-react';
import ErrorPage from './ErrorPage';

interface SessionExpiredPageProps {
	onContinue: () => void;
}

// Shown in place of the login form when the user is bounced to /login
// because their session actually expired mid-use (auth:expired event from
// lib/api.ts), instead of silently dropping them on an unexplained login
// screen with no idea why they were logged out.
export default function SessionExpiredPage({ onContinue }: SessionExpiredPageProps) {
	return (
		<ErrorPage
			code="401"
			icon={LogIn}
			title="Sessiya muddati tugadi"
			message="Xavfsizlik uchun tizimga kirish muddatingiz tugadi. Davom etish uchun qaytadan tizimga kiring."
			actionLabel="Tizimga kirish"
			onAction={onContinue}
		/>
	);
}
