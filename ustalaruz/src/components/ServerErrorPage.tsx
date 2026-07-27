import { ServerCrash } from 'lucide-react';
import ErrorPage from './ErrorPage';

interface ServerErrorPageProps {
	onRetry?: () => void;
}

export default function ServerErrorPage({ onRetry }: ServerErrorPageProps) {
	return (
		<ErrorPage
			code="500"
			icon={ServerCrash}
			title="Nimadir xato ketdi"
			message="Kutilmagan xatolik yuz berdi. Sahifani qayta yuklab ko'ring, muammo davom etsa birozdan so'ng qaytadan urinib ko'ring."
			actionLabel="Sahifani qayta yuklash"
			onAction={onRetry ?? (() => window.location.reload())}
		/>
	);
}
