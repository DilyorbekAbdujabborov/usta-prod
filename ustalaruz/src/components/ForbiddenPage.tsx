import { ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ErrorPage from './ErrorPage';

interface ForbiddenPageProps {
	message?: string;
}

export default function ForbiddenPage({
	message = "Bu bo'limni ko'rish uchun ruxsatingiz yo'q.",
}: ForbiddenPageProps) {
	const navigate = useNavigate();
	return (
		<ErrorPage
			code="403"
			icon={ShieldAlert}
			title="Ruxsat yo'q"
			message={message}
			actionLabel="Bosh sahifaga qaytish"
			onAction={() => navigate('/app')}
		/>
	);
}
